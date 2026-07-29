import { describe, expect, it, vi } from 'vitest'
import type { AppState } from '@/store/types'
import { planMobileTerminalTabMount } from './mobile-terminal-tab-mount'

type PlannerState = Pick<
  AppState,
  'tabsByWorktree' | 'terminalLayoutsByTabId' | 'ptyIdsByTabId' | 'pendingStartupByTabId'
>

/** An awake workspace: every tab holds a live PTY, so a mount attaches rather than spawns. */
function state(tabCount = 1): PlannerState {
  return {
    tabsByWorktree: {
      wt: Array.from({ length: tabCount }, (_, index) => ({
        id: `tab-${index}`,
        ptyId: `wt@@${index}`
      }))
    } as unknown as AppState['tabsByWorktree'],
    terminalLayoutsByTabId: {},
    ptyIdsByTabId: Object.fromEntries(
      Array.from({ length: tabCount }, (_, index) => [`tab-${index}`, [`wt@@${index}`]])
    ),
    pendingStartupByTabId: {}
  }
}

/** A slept workspace: sleep kills the PTYs but keeps `tab.ptyId` as a wake hint. */
function sleptState(tabCount = 1): PlannerState {
  return { ...state(tabCount), ptyIdsByTabId: {} }
}

describe('planMobileTerminalTabMount', () => {
  it('keeps real-tab requests targeted to exactly one tab', () => {
    expect(planMobileTerminalTabMount(state(), { worktreeId: 'wt', tabId: 'tab-0' })).toEqual({
      worktreeId: 'wt',
      tabIds: ['tab-0']
    })
  })

  it('resolves synthetic handles to exactly one owning tab at workspace scale', () => {
    expect(planMobileTerminalTabMount(state(200), { worktreeId: 'wt', ptyId: 'wt@@173' })).toEqual({
      worktreeId: 'wt',
      tabIds: ['tab-173']
    })
  })

  it('does not mount the whole worktree when a stale pty id has no owner', () => {
    expect(
      planMobileTerminalTabMount(state(200), { worktreeId: 'wt', ptyId: 'wt@@missing' })
    ).toBeNull()
  })

  it('does not mount either tab when stale persistence has duplicate pty ownership', () => {
    const s = state(200)
    s.terminalLayoutsByTabId['tab-199'] = {
      root: null,
      activeLeafId: null,
      expandedLeafId: null,
      ptyIdsByLeafId: { leaf: 'wt@@173' }
    }

    expect(planMobileTerminalTabMount(s, { worktreeId: 'wt', ptyId: 'wt@@173' })).toBeNull()
  })

  it('does not mount a hidden worktree for a stale direct tab id', () => {
    const isTabMounted = vi.fn()

    expect(
      planMobileTerminalTabMount(
        state(200),
        { worktreeId: 'wt', tabId: 'tab-missing' },
        { isTabMounted }
      )
    ).toBeNull()
    expect(isTabMounted).not.toHaveBeenCalled()
  })

  it('does not revive a slept workspace for a real-tab subscribe (#10205)', () => {
    // Why: sleep keeps tab.ptyId as a wake hint, so the handle still resolves;
    // mounting it would spawn a PTY and un-sleep the workspace on the desktop.
    expect(
      planMobileTerminalTabMount(sleptState(), { worktreeId: 'wt', tabId: 'tab-0' })
    ).toBeNull()
  })

  it('does not revive a slept workspace for a synthetic pty handle (#10205)', () => {
    expect(
      planMobileTerminalTabMount(sleptState(200), { worktreeId: 'wt', ptyId: 'wt@@173' })
    ).toBeNull()
  })

  it('fails closed before consulting mount state for a slept workspace', () => {
    const isTabMounted = vi.fn()

    expect(
      planMobileTerminalTabMount(
        sleptState(),
        { worktreeId: 'wt', tabId: 'tab-0' },
        { isTabMounted }
      )
    ).toBeNull()
    expect(isTabMounted).not.toHaveBeenCalled()
  })

  it('still mounts when another tab in the workspace is live', () => {
    // Why: a never-mounted tab in an awake workspace is the case this path exists
    // for — only a fully cold workspace must fail closed.
    const s = sleptState(2)
    s.ptyIdsByTabId = { 'tab-1': ['wt@@1'] }

    expect(planMobileTerminalTabMount(s, { worktreeId: 'wt', tabId: 'tab-0' })).toEqual({
      worktreeId: 'wt',
      tabIds: ['tab-0']
    })
  })

  it('still mounts a freshly created mobile tab whose PTY has not spawned yet', () => {
    // Why: terminal.create -> subscribe races the spawn; the queued startup proves
    // a PTY is coming, so this is an attach-in-waiting, not a resurrection.
    const s = sleptState()
    s.pendingStartupByTabId = { 'tab-0': {} } as unknown as AppState['pendingStartupByTabId']

    expect(planMobileTerminalTabMount(s, { worktreeId: 'wt', tabId: 'tab-0' })).toEqual({
      worktreeId: 'wt',
      tabIds: ['tab-0']
    })
  })

  it('still mounts a tab whose activation spawn is pending', () => {
    const s = sleptState()
    s.tabsByWorktree = {
      wt: [{ id: 'tab-0', ptyId: 'wt@@0', pendingActivationSpawn: true }]
    } as unknown as AppState['tabsByWorktree']

    expect(planMobileTerminalTabMount(s, { worktreeId: 'wt', tabId: 'tab-0' })).toEqual({
      worktreeId: 'wt',
      tabIds: ['tab-0']
    })
  })

  it('does not schedule hidden layout work for an already-mounted tab', () => {
    const isTabMounted = vi.fn().mockReturnValue(true)

    expect(
      planMobileTerminalTabMount(
        state(200),
        { worktreeId: 'wt', ptyId: 'wt@@173' },
        { isTabMounted }
      )
    ).toBeNull()
    expect(isTabMounted).toHaveBeenCalledTimes(1)
    expect(isTabMounted).toHaveBeenCalledWith('tab-173')
  })
})
