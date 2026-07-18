import type { ProviderRateLimits, RateLimitWindow } from '../../../../shared/rate-limit-types'

/**
 * Window used for the single compact meter next to a provider icon.
 *
 * Why: Claude/Codex report a session window first; Grok and similar providers
 * only report weekly (or monthly) credits. The status bar still needs one
 * meter whenever any window is available — matching the details modal bars.
 */
export function getPrimaryUsageMeterWindow(
  p: Pick<ProviderRateLimits, 'session' | 'weekly' | 'fableWeekly' | 'monthly'>
): RateLimitWindow | null {
  return p.session ?? p.weekly ?? p.fableWeekly ?? p.monthly ?? null
}
