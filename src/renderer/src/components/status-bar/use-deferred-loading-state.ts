import { useEffect, useState } from 'react'

/**
 * Holds a loading affordance back until the wait is long enough to be worth
 * showing. A host that answers quickly never flashes a placeholder at all;
 * only a genuinely slow one gets feedback.
 *
 * See docs/STYLEGUIDE.md — "Don't pick worst-case feedback for everyone".
 */
export const LOADING_AFFORDANCE_DELAY_MS = 200

export function useDeferredLoadingState(
  pending: boolean,
  delayMs: number = LOADING_AFFORDANCE_DELAY_MS
): boolean {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!pending) {
      setVisible(false)
      return
    }
    const timer = window.setTimeout(() => setVisible(true), delayMs)
    return () => {
      window.clearTimeout(timer)
    }
  }, [pending, delayMs])

  return pending && visible
}
