import { describe, expect, it } from 'vitest'
import { parseZenBalanceUsd } from './opencode-go-page-scraper'

describe('parseZenBalanceUsd', () => {
  it('parses a scaled balance from a React Flight billing object', () => {
    // Balance is serialized in 1e-8 USD units alongside a real customerID.
    const text = '($R=>$R[0]=$R[1]={customerID:"cus_test",balance:$R[2]=2375000000,reload:!1})'
    expect(parseZenBalanceUsd(text)).toBe(23.75)
  })

  it('ignores balances when billing is disabled (null customerID)', () => {
    const text = '$R[0]={customerID:null,balance:0,reload:!1}'
    expect(parseZenBalanceUsd(text)).toBeNull()
  })

  it('ignores unrelated balance metadata with no customerID or amount', () => {
    const text = '$R[0]={balanceEnabled:!0,balanceUpdatedAt:1800000000}'
    expect(parseZenBalanceUsd(text)).toBeNull()
  })

  it('parses an explicit whole-USD balance key with thousands separators', () => {
    const text = '{"balanceEnabled":true,"zenBalance":"1,042.75"}'
    expect(parseZenBalanceUsd(text)).toBe(1042.75)
  })

  it('does not treat balance metadata as the amount', () => {
    const text = '{"balanceUpdatedAt":1800000000,"balanceRefreshInterval":60,"zenBalance":"42.50"}'
    expect(parseZenBalanceUsd(text)).toBe(42.5)
  })

  it('parses a human-readable balance string as a last resort', () => {
    const text = '<html><body><h2>Current balance $1,234.56</h2></body></html>'
    expect(parseZenBalanceUsd(text)).toBe(1234.56)
  })

  it('returns null when no balance is present', () => {
    expect(parseZenBalanceUsd('<html><body>no billing here</body></html>')).toBeNull()
  })

  it('guards against oversized payloads', () => {
    expect(parseZenBalanceUsd('x'.repeat(10_000_001))).toBeNull()
  })
})
