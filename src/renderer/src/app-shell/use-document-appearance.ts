import { useEffect } from 'react'
import type { GlobalSettings } from '../../../shared/global-settings-types'
import { buildAppFontFamily } from '@/lib/app-font-family'
import { applyDocumentTheme, resolveDocumentTheme } from '../lib/document-theme'
import { applyTabGroupSplitDividerAppearance } from '../lib/tab-group-split-divider-appearance'
import { scheduleRuntimeGraphSync } from '../runtime/sync-runtime-graph'
import { useAppStore } from '../store'

function applyWorkspaceSplitDivider(settings: GlobalSettings): void {
  applyTabGroupSplitDividerAppearance(
    document.documentElement,
    settings,
    resolveDocumentTheme(settings.theme)
  )
}

/** Applies the settings-driven theme and app font to the document root. */
export function useDocumentAppearance(): void {
  const settings = useAppStore((s) => s.settings)

  useEffect(() => {
    if (!settings) {
      return
    }

    if (settings.theme === 'dark') {
      applyDocumentTheme('dark')
      applyWorkspaceSplitDivider(settings)
      return undefined
    } else if (settings.theme === 'light') {
      applyDocumentTheme('light')
      applyWorkspaceSplitDivider(settings)
      return undefined
    }
    // system
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    applyDocumentTheme('system')
    applyWorkspaceSplitDivider(settings)
    const handler = (): void => {
      applyDocumentTheme('system')
      applyWorkspaceSplitDivider(settings)
      // System theme changes don't mutate the store, so mobile terminal colors need an explicit graph republish.
      scheduleRuntimeGraphSync()
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [settings])

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--app-font-family',
      buildAppFontFamily(settings?.appFontFamily)
    )
  }, [settings?.appFontFamily])
}
