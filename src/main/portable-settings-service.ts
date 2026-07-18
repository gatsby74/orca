import type { Store } from './persistence'
import type { KeybindingService } from './keybindings/keybinding-service'
import {
  createPortableSettingsBundle,
  PortableSettingsApplyRequestSchema,
  remapPortableKeybindingOverrides,
  type PortableSettingsApplyRequest,
  type PortableSettingsBundle,
  type PortableSettingsCategory
} from '../shared/portable-settings'
import {
  normalizeTerminalColorOverrides,
  normalizeTerminalCustomThemes
} from '../shared/terminal-custom-themes'
import type { GlobalSettings } from '../shared/types'

export type PortableSettingsRuntimeService = {
  getBundle: () => PortableSettingsBundle
  apply: (request: PortableSettingsApplyRequest) => {
    bundle: PortableSettingsBundle
    appliedCategories: PortableSettingsCategory[]
  }
}

export function createPortableSettingsRuntimeService(
  store: Pick<Store, 'getSettings' | 'updateSettings'>,
  keybindings: Pick<KeybindingService, 'getSnapshot' | 'replaceOverrides'>,
  options: {
    onKeybindingsChanged?: (snapshot: ReturnType<KeybindingService['getSnapshot']>) => void
  } = {}
): PortableSettingsRuntimeService {
  const getBundle = (): PortableSettingsBundle =>
    createPortableSettingsBundle(store.getSettings(), keybindings.getSnapshot())

  return {
    getBundle,
    apply: (input) => {
      const request = PortableSettingsApplyRequestSchema.parse(input)
      const categories = Array.from(new Set(request.categories))
      const updates: Partial<GlobalSettings> = {}

      if (categories.includes('appearance')) {
        const { terminalColorOverrides, terminalCustomThemes, ...appearanceSettings } =
          request.bundle.categories.appearance
        Object.assign(updates, appearanceSettings)
        updates.terminalColorOverrides = terminalColorOverrides
          ? normalizeTerminalColorOverrides(terminalColorOverrides)
          : undefined
        // Linked clients are trusted for settings intent, but theme payloads still cross an RPC boundary.
        updates.terminalCustomThemes = normalizeTerminalCustomThemes(terminalCustomThemes)
      }
      if (categories.includes('input')) {
        const { keybindings: importedKeybindings, ...inputSettings } =
          request.bundle.categories.input
        Object.assign(updates, inputSettings)
        const targetPlatform = keybindings.getSnapshot().platform
        const keybindingSnapshot = keybindings.replaceOverrides(
          remapPortableKeybindingOverrides(
            importedKeybindings.overrides,
            importedKeybindings.sourcePlatform,
            targetPlatform
          )
        )
        options.onKeybindingsChanged?.(keybindingSnapshot)
      }
      if (categories.includes('workflow')) {
        Object.assign(updates, request.bundle.categories.workflow)
      }

      if (Object.keys(updates).length > 0) {
        store.updateSettings(updates, { notifyListeners: true })
      }
      return { bundle: getBundle(), appliedCategories: categories }
    }
  }
}
