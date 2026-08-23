import { describe, expect, it } from 'vitest'
import {
  selectWorktreeHooksUnverifiable,
  type WorktreeHookObservabilityState
} from './worktree-hook-observability'
import type { TerminalTab } from '../../../../shared/terminal-tab-types'
import type { TuiAgent } from '../../../../shared/tui-agent'

const REPO_ID = 'repo-1'
const WORKTREE_ID = `${REPO_ID}::/home/user/repo/wt-1`

const NO_EVIDENCE = {
  hasPermission: false,
  hasLiveWorking: false,
  hasLiveDone: false
}

function makeTab(id: string, launchAgent?: TuiAgent): TerminalTab {
  return { id, title: 'bash', launchAgent } as TerminalTab
}

function makeState(
  overrides: Partial<WorktreeHookObservabilityState> = {}
): WorktreeHookObservabilityState {
  return {
    agentHookInstallStateByTarget: { claude: 'not_installed' },
    tabsByWorktree: { [WORKTREE_ID]: [makeTab('tab-1', 'claude')] },
    ptyIdsByTabId: { 'tab-1': ['pty-1'] },
    worktreesByRepo: {
      [REPO_ID]: [{ id: WORKTREE_ID, path: '/home/user/repo/wt-1' }]
    },
    repos: [{ id: REPO_ID, path: '/home/user/repo', connectionId: null }],
    projectGroups: [],
    folderWorkspaces: [],
    ...overrides
  } as unknown as WorktreeHookObservabilityState
}

describe('selectWorktreeHooksUnverifiable', () => {
  it('flags a live Claude pane whose managed hooks were removed', () => {
    expect(selectWorktreeHooksUnverifiable(makeState(), WORKTREE_ID, NO_EVIDENCE)).toBe(true)
  })

  it('does not flag when the hooks are installed', () => {
    const state = makeState({
      agentHookInstallStateByTarget: { claude: 'installed' }
    })

    expect(selectWorktreeHooksUnverifiable(state, WORKTREE_ID, NO_EVIDENCE)).toBe(false)
  })

  it('does not flag before the install snapshot has been read', () => {
    const state = makeState({ agentHookInstallStateByTarget: {} })

    expect(selectWorktreeHooksUnverifiable(state, WORKTREE_ID, NO_EVIDENCE)).toBe(false)
  })

  it('does not flag a tab whose pty is dead — a slept worktree claims nothing', () => {
    const state = makeState({ ptyIdsByTabId: { 'tab-1': [] } })

    expect(selectWorktreeHooksUnverifiable(state, WORKTREE_ID, NO_EVIDENCE)).toBe(false)
  })

  it('does not flag an agent that never had managed hooks', () => {
    const state = makeState({
      tabsByWorktree: { [WORKTREE_ID]: [makeTab('tab-1', 'opencode')] }
    })

    expect(selectWorktreeHooksUnverifiable(state, WORKTREE_ID, NO_EVIDENCE)).toBe(false)
  })

  it('is vetoed by a pane that is reporting right now', () => {
    expect(
      selectWorktreeHooksUnverifiable(makeState(), WORKTREE_ID, {
        ...NO_EVIDENCE,
        hasLiveWorking: true
      })
    ).toBe(false)
  })

  it('declines to judge an SSH worktree from the local hook config', () => {
    const state = makeState({
      repos: [{ id: REPO_ID, path: '/home/user/repo', connectionId: 'ssh-1' }]
    } as unknown as Partial<WorktreeHookObservabilityState>)

    expect(selectWorktreeHooksUnverifiable(state, WORKTREE_ID, NO_EVIDENCE)).toBe(false)
  })

  it('declines to judge a WSL worktree — hooks live inside the distro', () => {
    const state = makeState({
      worktreesByRepo: {
        [REPO_ID]: [{ id: WORKTREE_ID, path: '\\\\wsl$\\Ubuntu\\home\\user\\repo' }]
      }
    } as unknown as Partial<WorktreeHookObservabilityState>)

    expect(selectWorktreeHooksUnverifiable(state, WORKTREE_ID, NO_EVIDENCE)).toBe(false)
  })

  it('flags when only one of several live agents is blind', () => {
    const state = makeState({
      tabsByWorktree: {
        [WORKTREE_ID]: [makeTab('tab-1', 'codex'), makeTab('tab-2', 'claude')]
      },
      ptyIdsByTabId: { 'tab-1': ['pty-1'], 'tab-2': ['pty-2'] },
      agentHookInstallStateByTarget: {
        codex: 'installed',
        claude: 'not_installed'
      }
    })

    expect(selectWorktreeHooksUnverifiable(state, WORKTREE_ID, NO_EVIDENCE)).toBe(true)
  })

  it('returns false for a worktree with no tabs', () => {
    const state = makeState({ tabsByWorktree: {} })

    expect(selectWorktreeHooksUnverifiable(state, WORKTREE_ID, NO_EVIDENCE)).toBe(false)
  })
})
