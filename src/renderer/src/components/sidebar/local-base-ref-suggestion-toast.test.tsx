// @vitest-environment happy-dom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'
import type { AppState } from '@/store/types'
import type { LocalBaseRefUpdateSuggestion } from '../../../../shared/types'
import { showLocalBaseRefUpdateSuggestionToast } from './local-base-ref-suggestion-toast'

vi.mock('sonner', () => ({
  toast: {
    warning: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    dismiss: vi.fn()
  }
}))

const SUGGESTION: LocalBaseRefUpdateSuggestion = {
  baseRef: 'origin/main',
  localBranch: 'main',
  behind: 2
}
const TOAST_ID = 'local-base-ref-update-suggestion:origin/main:main'

const mountedRoots: Root[] = []

function makeDeps(overrides: Partial<{ enabled: boolean }> = {}) {
  let enabled = overrides.enabled ?? false
  const updateSettings = vi.fn(async (updates: Record<string, unknown>) => {
    if (typeof updates.refreshLocalBaseRefOnWorktreeCreate === 'boolean') {
      enabled = updates.refreshLocalBaseRefOnWorktreeCreate
    }
  })
  return {
    updateSettings: updateSettings as unknown as AppState['updateSettings'],
    getSettings: () => ({ refreshLocalBaseRefOnWorktreeCreate: enabled }) as AppState['settings'],
    openSettingsPage: vi.fn() as AppState['openSettingsPage'],
    openSettingsTarget: vi.fn() as AppState['openSettingsTarget']
  }
}

// Render the ReactNode passed to toast.warning as the toast description so we can
// click its in-body buttons the same way the real toast surface would.
function renderToastBody(): HTMLElement {
  const description = vi.mocked(toast.warning).mock.calls.at(-1)?.[1]
    ?.description as React.ReactElement
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  mountedRoots.push(root)
  act(() => {
    root.render(description)
  })
  return container
}

function clickButton(container: HTMLElement, label: string): void {
  const button = [...container.querySelectorAll('button')].find(
    (el) => el.textContent?.trim() === label
  )
  if (!button) {
    throw new Error(`button "${label}" not found`)
  }
  act(() => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })
}

afterEach(() => {
  mountedRoots.splice(0).forEach((root) => act(() => root.unmount()))
  document.body.innerHTML = ''
  vi.clearAllMocks()
})

describe('showLocalBaseRefUpdateSuggestionToast', () => {
  it('does nothing without a suggestion', () => {
    showLocalBaseRefUpdateSuggestionToast(undefined, makeDeps())
    expect(toast.warning).not.toHaveBeenCalled()
  })

  it('turns on the setting and confirms from the Keep main up to date button', async () => {
    const deps = makeDeps()
    showLocalBaseRefUpdateSuggestionToast(SUGGESTION, deps)
    const body = renderToastBody()

    clickButton(body, 'Keep main up to date')
    await act(async () => {
      await Promise.resolve()
    })

    expect(deps.updateSettings).toHaveBeenCalledWith({
      refreshLocalBaseRefOnWorktreeCreate: true
    })
    expect(toast.dismiss).toHaveBeenCalledWith(TOAST_ID)
    expect(toast.success).toHaveBeenCalledWith('Keeping local main up to date')
  })

  it('reports failure when enabling cannot persist the setting', async () => {
    const deps = makeDeps()
    // updateSettings resolves but the flag never flips → treated as a failure.
    deps.updateSettings = vi.fn().mockResolvedValue(undefined) as AppState['updateSettings']
    showLocalBaseRefUpdateSuggestionToast(SUGGESTION, deps)
    const body = renderToastBody()

    clickButton(body, 'Keep main up to date')
    await act(async () => {
      await Promise.resolve()
    })

    expect(toast.dismiss).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledWith('Could not turn on Keep Local Main Up to Date', {
      description: 'Open Settings and try again.'
    })
  })

  it('deep-links to the Git setting and closes the toast from the Settings link', () => {
    const deps = makeDeps()
    showLocalBaseRefUpdateSuggestionToast(SUGGESTION, deps)
    const body = renderToastBody()

    clickButton(body, 'Settings › Keep Local Main Up to Date')

    expect(deps.openSettingsPage).toHaveBeenCalled()
    expect(deps.openSettingsTarget).toHaveBeenCalledWith({
      pane: 'git',
      repoId: null,
      sectionId: 'git-keep-local-main-up-to-date'
    })
    expect(toast.dismiss).toHaveBeenCalledWith(TOAST_ID)
  })
})
