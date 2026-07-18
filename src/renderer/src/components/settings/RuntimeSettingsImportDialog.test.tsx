// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getDefaultSettings } from '../../../../shared/constants'
import { createPortableSettingsBundle } from '../../../../shared/portable-settings'
import { RuntimeSettingsImportDialog } from './RuntimeSettingsImportDialog'

const mocks = vi.hoisted(() => ({
  callRuntimeRpc: vi.fn(),
  toastSuccess: vi.fn()
}))

vi.mock('@/runtime/runtime-rpc-client', () => ({
  callRuntimeRpc: mocks.callRuntimeRpc
}))
vi.mock('@/i18n/i18n', () => ({
  translate: (_key: string, fallback: string, values?: Record<string, string | number>): string =>
    Object.entries(values ?? {}).reduce(
      (text, [key, value]) => text.replace(`{{${key}}}`, String(value)),
      fallback
    )
}))
vi.mock('sonner', () => ({
  toast: { success: mocks.toastSuccess }
}))

describe('RuntimeSettingsImportDialog', () => {
  afterEach(() => {
    document.body.replaceChildren()
    vi.restoreAllMocks()
  })

  it('previews safe category differences and applies only the selection', async () => {
    const remoteBundle = createPortableSettingsBundle(getDefaultSettings('/home/remote'), {
      platform: 'linux',
      overrides: {}
    })
    mocks.callRuntimeRpc
      .mockResolvedValueOnce({ bundle: remoteBundle })
      .mockResolvedValueOnce({ bundle: remoteBundle, appliedCategories: ['appearance'] })
    Object.defineProperty(window, 'api', {
      configurable: true,
      value: {
        keybindings: {
          get: vi.fn().mockResolvedValue({
            platform: 'linux',
            overrides: {},
            path: '/home/local/.orca/keybindings.json',
            exists: true,
            commonOverrides: {},
            platformOverrides: {},
            diagnostics: []
          })
        }
      }
    })
    const onClose = vi.fn()
    const container = document.createElement('div')
    document.body.append(container)
    const root = createRoot(container)

    await act(async () => {
      root.render(
        <RuntimeSettingsImportDialog
          environmentId="server-1"
          environmentName="Build server"
          settings={{ ...getDefaultSettings('/home/local'), theme: 'dark' }}
          onClose={onClose}
        />
      )
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(document.body.textContent).toContain('Import settings to Build server')
    expect(document.body.textContent).toContain('Accounts, credentials, secrets')
    expect(document.body.textContent).toContain('1 change')
    const importButton = Array.from(document.body.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Import selected')
    )
    expect(importButton).toBeTruthy()

    await act(async () => {
      importButton?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(mocks.callRuntimeRpc).toHaveBeenLastCalledWith(
      { kind: 'environment', environmentId: 'server-1' },
      'settings.portable.apply',
      {
        categories: ['appearance'],
        bundle: expect.objectContaining({ version: 1 })
      },
      { timeoutMs: 15_000 }
    )
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Imported settings to Build server.')
    expect(onClose).toHaveBeenCalledOnce()
    root.unmount()
  })
})
