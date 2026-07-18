import { describe, expect, it, vi } from 'vitest'
import { getDefaultSettings } from '../shared/constants'
import { createPortableSettingsBundle } from '../shared/portable-settings'
import { createPortableSettingsRuntimeService } from './portable-settings-service'

describe('portable settings runtime service', () => {
  it('applies only selected categories and remaps imported shortcuts', () => {
    let settings = getDefaultSettings('/home/test')
    const updateSettings = vi.fn((updates) => {
      settings = { ...settings, ...updates }
      return settings
    })
    let targetOverrides = {}
    const keybindings = {
      getSnapshot: vi.fn(() => ({
        platform: 'linux' as const,
        overrides: targetOverrides,
        path: '/home/test/.orca/keybindings.json',
        exists: true,
        commonOverrides: {},
        platformOverrides: {},
        diagnostics: []
      })),
      replaceOverrides: vi.fn((overrides) => {
        targetOverrides = overrides
        return { ...keybindings.getSnapshot(), overrides }
      })
    }
    const onKeybindingsChanged = vi.fn()
    const service = createPortableSettingsRuntimeService(
      { getSettings: () => settings, updateSettings } as never,
      keybindings,
      { onKeybindingsChanged }
    )
    const source = createPortableSettingsBundle(
      {
        ...getDefaultSettings('/home/test'),
        theme: 'dark',
        editorAutoSave: !settings.editorAutoSave,
        defaultTuiAgent: 'codex'
      },
      { platform: 'darwin', overrides: { 'app.settings': ['Cmd+Comma'] } }
    )

    const result = service.apply({ categories: ['appearance', 'input'], bundle: source })

    expect(settings.theme).toBe('dark')
    expect(settings.editorAutoSave).toBe(source.categories.input.editorAutoSave)
    expect(settings.defaultTuiAgent).toBe(getDefaultSettings('/home/test').defaultTuiAgent)
    expect(keybindings.replaceOverrides).toHaveBeenCalledWith({
      'app.settings': ['Ctrl+Comma']
    })
    expect(onKeybindingsChanged).toHaveBeenCalledOnce()
    expect(result.appliedCategories).toEqual(['appearance', 'input'])
  })

  it('sanitizes terminal theme colors received over RPC', () => {
    const settings = getDefaultSettings('/home/test')
    const updateSettings = vi.fn()
    const service = createPortableSettingsRuntimeService(
      { getSettings: () => settings, updateSettings } as never,
      {
        getSnapshot: () => ({
          platform: 'linux',
          overrides: {},
          path: '/home/test/.orca/keybindings.json',
          exists: false,
          commonOverrides: {},
          platformOverrides: {},
          diagnostics: []
        }),
        replaceOverrides: vi.fn()
      }
    )
    const source = createPortableSettingsBundle(
      {
        ...settings,
        terminalColorOverrides: { foreground: 'not-a-color', background: '#abc' },
        terminalCustomThemes: [
          {
            id: 'manual:unsafe',
            name: 'Unsafe',
            source: 'manual',
            mode: 'dark',
            terminal: {
              foreground: '#ffffff',
              background: 'not-a-color',
              black: '#000000'
            },
            importedAt: new Date(0).toISOString()
          }
        ]
      },
      { platform: 'linux', overrides: {} }
    )

    service.apply({ categories: ['appearance'], bundle: source })

    expect(updateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        terminalColorOverrides: { background: '#aabbcc' },
        terminalCustomThemes: []
      }),
      { notifyListeners: true }
    )
  })

  it('never accepts sensitive or unknown settings in an apply request', () => {
    const settings = getDefaultSettings('/home/test')
    const service = createPortableSettingsRuntimeService(
      {
        getSettings: () => settings,
        updateSettings: vi.fn()
      } as never,
      {
        getSnapshot: () => ({
          platform: 'linux',
          overrides: {},
          path: '/home/test/.orca/keybindings.json',
          exists: false,
          commonOverrides: {},
          platformOverrides: {},
          diagnostics: []
        }),
        replaceOverrides: vi.fn()
      }
    )
    const source = createPortableSettingsBundle(settings, {
      platform: 'linux',
      overrides: {}
    })

    expect(() =>
      service.apply({
        categories: ['appearance'],
        bundle: {
          ...source,
          categories: {
            ...source.categories,
            appearance: {
              ...source.categories.appearance,
              opencodeSessionCookie: 'secret'
            }
          }
        }
      } as never)
    ).toThrow()
  })
})
