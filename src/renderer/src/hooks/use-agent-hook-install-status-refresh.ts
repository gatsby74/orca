import { useEffect } from 'react'
import { useAppStore } from '@/store'

// Why: hooks are installed at startup and can be removed at any time by anything
// that edits the agent's settings file — Orca is not notified. Nothing watches
// those files today, so the sidebar re-reads them: on mount, whenever the window
// regains focus (covers a removal that happened while Orca was in the
// background), and on a slow timer while visible (covers a removal that happens
// with Orca focused, which is exactly how the reported bug was hit).
const REFRESH_INTERVAL_MS = 30_000

export function useAgentHookInstallStatusRefresh(): void {
  const setAgentHookInstallStatuses = useAppStore((s) => s.setAgentHookInstallStatuses)

  useEffect(() => {
    let cancelled = false

    const refresh = async (): Promise<void> => {
      const read = window.api?.agentHooks?.installStatuses
      if (!read) {
        return
      }
      try {
        const statuses = await read()
        if (!cancelled) {
          setAgentHookInstallStatuses(statuses)
        }
      } catch {
        // Why: a failed read is not evidence hooks are missing; keep the last
        // snapshot rather than degrading every dot to unverifiable on a blip.
      }
    }

    void refresh()

    const onFocusOrVisible = (): void => {
      if (document.visibilityState === 'visible') {
        void refresh()
      }
    }
    window.addEventListener('focus', onFocusOrVisible)
    document.addEventListener('visibilitychange', onFocusOrVisible)

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        void refresh()
      }
    }, REFRESH_INTERVAL_MS)

    return () => {
      cancelled = true
      window.removeEventListener('focus', onFocusOrVisible)
      document.removeEventListener('visibilitychange', onFocusOrVisible)
      clearInterval(interval)
    }
  }, [setAgentHookInstallStatuses])
}
