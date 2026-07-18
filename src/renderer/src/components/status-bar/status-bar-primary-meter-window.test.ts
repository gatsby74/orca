import { describe, expect, it } from 'vitest'
import type { ProviderRateLimits, RateLimitWindow } from '../../../../shared/rate-limit-types'
import { getPrimaryUsageMeterWindow } from './status-bar-primary-meter-window'

function window(usedPercent: number): RateLimitWindow {
  return {
    usedPercent,
    windowMinutes: 10_080,
    resetsAt: null,
    resetDescription: null
  }
}

function limits(
  overrides: Partial<
    Pick<ProviderRateLimits, 'session' | 'weekly' | 'fableWeekly' | 'monthly'>
  > = {}
): Pick<ProviderRateLimits, 'session' | 'weekly' | 'fableWeekly' | 'monthly'> {
  return {
    session: null,
    weekly: null,
    fableWeekly: null,
    monthly: null,
    ...overrides
  }
}

describe('getPrimaryUsageMeterWindow', () => {
  it('prefers the session window when present', () => {
    const session = window(10)
    expect(
      getPrimaryUsageMeterWindow(
        limits({
          session,
          weekly: window(40),
          fableWeekly: window(50),
          monthly: window(60)
        })
      )
    ).toBe(session)
  })

  it('falls back to weekly for Grok-style providers with no session window', () => {
    const weekly = window(27)
    expect(getPrimaryUsageMeterWindow(limits({ weekly }))).toBe(weekly)
  })

  it('falls back through fable weekly then monthly', () => {
    const fableWeekly = window(33)
    expect(getPrimaryUsageMeterWindow(limits({ fableWeekly, monthly: window(70) }))).toBe(
      fableWeekly
    )
    const monthly = window(70)
    expect(getPrimaryUsageMeterWindow(limits({ monthly }))).toBe(monthly)
  })

  it('returns null when no usage windows are available', () => {
    expect(getPrimaryUsageMeterWindow(limits())).toBeNull()
  })
})
