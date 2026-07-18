// Why: the opencode.ai page is rendered with React Server Components. The
// embedded JS uses a wire format where object references look like:
//   key:$R[28]={field:value,...}
// rather than plain `key:{field:value,...}`. A single key (e.g. monthlyUsage)
// can appear multiple times — once with real data and once as `null` inside a
// different component's props. We must find the occurrence that is an object
// with both usagePercent and resetInSec, not the null one.

/**
 * Finds the brace-balanced object block assigned to `key` anywhere in `text`.
 * Skips React Flight assignment tokens (e.g. `$R[N]=`) between the colon and
 * the opening brace. Returns the first block that contains `usagePercent` AND
 * `resetInSec` as direct numeric properties (not nested), so that placeholder
 * `null` occurrences and billing-context duplicates are ignored.
 */
function extractUsageBlock(text: string, key: string): string | null {
  // Match every occurrence of `key:` (with optional $R[N]= assignment)
  // Why: React Flight wire format embeds object references between the colon
  // and the literal brace, so we skip over any `$R[N]=` tokens to reach `{`.
  const keyRegex = new RegExp(`\\b${key}\\b\\s*:`, 'g')
  let keyMatch: RegExpExecArray | null

  while ((keyMatch = keyRegex.exec(text)) !== null) {
    // Scan forward from after the colon to find the opening `{`,
    // allowing for the `$R[N]=` token or plain whitespace in between.
    // We only scan a short window so we don't accidentally land on the
    // next occurrence of the key.
    const searchStart = keyMatch.index + keyMatch[0].length
    const searchWindow = text.slice(searchStart, searchStart + 30)
    const braceOffset = searchWindow.indexOf('{')
    if (braceOffset === -1) {
      // This occurrence has no object (e.g. `monthlyUsage:null`) — skip.
      continue
    }

    const openBrace = searchStart + braceOffset
    // Extract the balanced block
    // Why: this brace-depth parser does not skip string literals. React Flight's
    // current format does not emit raw { } inside strings, but this is a scraper
    // against HTML we don't control — treat as fragile.
    let depth = 0
    let block: string | null = null
    for (let i = openBrace; i < text.length; i++) {
      if (text[i] === '{') {
        depth++
      } else if (text[i] === '}') {
        depth--
        if (depth === 0) {
          block = text.slice(openBrace, i + 1)
          break
        }
      }
    }

    if (!block) {
      continue
    }

    // Verify this block has both required numeric fields as direct properties
    // (depth 1 within the block). This rejects billing/plan objects that share
    // the key name but lack usage data.
    if (
      hasDirectNumericField(block, 'usagePercent') &&
      hasDirectNumericField(block, 'resetInSec')
    ) {
      return block
    }
  }

  return null
}

/**
 * Returns true if `fieldName` exists as a direct (depth-1) numeric property
 * of the object string `objText`.
 */
function hasDirectNumericField(objText: string, fieldName: string): boolean {
  return extractTopLevelNumber(objText, fieldName) !== null
}

/**
 * Extracts a numeric field at depth 1 of `objText` — ignores the same field
 * inside nested sub-objects.
 * Why: without depth tracking, a regex matches the first occurrence regardless
 * of nesting, returning wrong values when a sub-object contains the same name.
 */
function extractTopLevelNumber(objText: string, fieldName: string): number | null {
  const fieldRegex = new RegExp(`\\b${fieldName}\\b\\s*:\\s*(-?[0-9]+(?:\\.[0-9]+)?)`)
  // Why: this brace-depth parser does not skip string literals. React Flight's
  // current format does not emit raw { } inside strings, but this is a scraper
  // against HTML we don't control — treat as fragile.
  let depth = 0

  for (let i = 0; i < objText.length; i++) {
    const ch = objText[i]
    if (ch === '{') {
      depth++
      continue
    }
    if (ch === '}') {
      depth--
      continue
    }

    // Only match at depth 1 (direct property of the root object).
    if (depth === 1) {
      const slice = objText.slice(i, i + fieldName.length + 30)
      const m = fieldRegex.exec(slice)
      if (m && m.index === 0) {
        const n = Number.parseFloat(m[1])
        return Number.isFinite(n) ? n : null
      }
    }
  }
  return null
}

type ParsedSubscription = {
  rollingUsagePercent: number
  weeklyUsagePercent: number
  monthlyUsagePercent: number | null
  rollingResetInSec: number
  weeklyResetInSec: number
  monthlyResetInSec: number | null
}

// The billing server serializes the Zen (pay-as-you-go) balance in units of
// 1e-8 USD (e.g. 2_375_000_000 → $23.75), so scale it back to dollars.
const ZEN_BILLING_SCALE = 100_000_000

// Explicit balance fields the page may expose already in whole USD (not scaled).
// More specific keys are listed first so `\b` boundaries never mis-match a
// longer name (e.g. `currentBalance` inside `currentBalanceUsd`).
const EXPLICIT_ZEN_BALANCE_KEYS = [
  'zenCurrentBalance',
  'zenBalance',
  'currentBalanceUsd',
  'currentBalanceUSD',
  'currentBalance',
  'balanceUsd',
  'balanceUSD',
  'usdBalance'
]

/**
 * Extract the Zen pay-as-you-go balance (in USD) from the opencode.ai workspace
 * page. The page embeds billing context in the same React Flight payload as the
 * usage data, so this reuses the already-fetched text — no extra request.
 * Returns null when no balance is present (billing disabled or not on the page).
 */
export function parseZenBalanceUsd(text: string): number | null {
  if (!text || text.length > 10_000_000) {
    return null
  }
  // 1. Billing object: {customerID:"cus_...",balance:$R[N]=NNNN,...}, scaled 1e8.
  const scaled = parseScaledBillingBalance(text)
  if (scaled !== null) {
    return scaled
  }
  // 2. Explicit USD balance keys (already major units, may be quoted with commas).
  const explicit = parseExplicitZenBalance(text)
  if (explicit !== null) {
    return explicit
  }
  // 3. Human-readable "current balance $X" copy as a last resort.
  return parseDollarBalanceText(text)
}

function parseScaledBillingBalance(text: string): number | null {
  // Require a real customerID so `customerID:null` / billing-disabled payloads
  // (which still carry a `balance:0`) don't register as a live balance.
  const customerRegex = /(?:"customerID"|customerID)\s*:\s*(?:\$R\[\d+\]\s*=\s*)?"[^"]+"/
  if (!customerRegex.test(text)) {
    return null
  }
  const balanceRegex = /(?:"balance"|balance)\s*:\s*(?:\$R\[\d+\]\s*=\s*)?(-?[0-9]+(?:\.[0-9]+)?)/
  const match = balanceRegex.exec(text)
  if (!match) {
    return null
  }
  const raw = Number.parseFloat(match[1])
  return Number.isFinite(raw) ? raw / ZEN_BILLING_SCALE : null
}

function parseExplicitZenBalance(text: string): number | null {
  for (const key of EXPLICIT_ZEN_BALANCE_KEYS) {
    // Key may be quoted (JSON) or bare (JS object); value may be a bare number
    // or a quoted string with thousands separators.
    const regex = new RegExp(
      `(?:"${key}"|\\b${key}\\b)\\s*:\\s*(?:\\$R\\[\\d+\\]\\s*=\\s*)?"?([0-9][0-9,]*(?:\\.[0-9]+)?)"?`
    )
    const match = regex.exec(text)
    if (match) {
      const value = Number.parseFloat(match[1].replace(/,/g, ''))
      if (Number.isFinite(value)) {
        return value
      }
    }
  }
  return null
}

function parseDollarBalanceText(text: string): number | null {
  const patterns = [
    /(?:current\s+balance|zen\s+balance|現在の残高)[^$]{0,80}\$\s*([0-9][0-9,]*(?:\.[0-9]+)?)/i,
    /(?:balance|残高)[\s\S]{0,120}?\$\s*([0-9][0-9,]*(?:\.[0-9]+)?)/i
  ]
  for (const pattern of patterns) {
    const match = pattern.exec(text)
    if (match) {
      const value = Number.parseFloat(match[1].replace(/,/g, ''))
      if (Number.isFinite(value)) {
        return value
      }
    }
  }
  return null
}

export function parseSubscriptionFromPageText(text: string): ParsedSubscription | null {
  // Why: OpenCode usage is scraped from HTML-embedded JS (React Flight wire
  // format). Defensive size check prevents runaway parsing on unexpected payloads.
  if (!text || text.length > 10_000_000) {
    return null
  }

  // Find the first occurrence of each usage key that has both usagePercent and
  // resetInSec as direct numeric fields. This skips null occurrences and
  // billing-context duplicates that use the same key name without usage data.
  const rollingBlock = extractUsageBlock(text, 'rollingUsage')
  const weeklyBlock = extractUsageBlock(text, 'weeklyUsage')
  const monthlyBlock = extractUsageBlock(text, 'monthlyUsage')

  const rollingPercent =
    rollingBlock !== null ? extractTopLevelNumber(rollingBlock, 'usagePercent') : null
  const rollingReset =
    rollingBlock !== null ? extractTopLevelNumber(rollingBlock, 'resetInSec') : null
  const weeklyPercent =
    weeklyBlock !== null ? extractTopLevelNumber(weeklyBlock, 'usagePercent') : null
  const weeklyReset = weeklyBlock !== null ? extractTopLevelNumber(weeklyBlock, 'resetInSec') : null

  if (
    rollingPercent === null ||
    rollingReset === null ||
    weeklyPercent === null ||
    weeklyReset === null
  ) {
    return null
  }

  const monthlyPercent =
    monthlyBlock !== null ? extractTopLevelNumber(monthlyBlock, 'usagePercent') : null
  const monthlyReset =
    monthlyBlock !== null ? extractTopLevelNumber(monthlyBlock, 'resetInSec') : null

  return {
    rollingUsagePercent: Math.min(100, Math.max(0, rollingPercent)),
    weeklyUsagePercent: Math.min(100, Math.max(0, weeklyPercent)),
    monthlyUsagePercent:
      monthlyPercent !== null ? Math.min(100, Math.max(0, monthlyPercent)) : null,
    rollingResetInSec: rollingReset,
    weeklyResetInSec: weeklyReset,
    monthlyResetInSec: monthlyReset
  }
}
