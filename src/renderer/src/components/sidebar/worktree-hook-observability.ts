import type { AppState } from '@/store/types'
import { getConnectionIdFromState } from '@/lib/connection-owner-resolution'
import { getIndexedWorktreeById } from '@/store/worktree-repo-index'
import { isWorktreeAgentStatusUnverifiable } from '@/lib/agent-status-observability'
import { tabHasLivePty } from '@/lib/tab-has-live-pty'
import type { TuiAgent } from '../../../../shared/tui-agent'

export type WorktreeHookObservabilityState = Pick<
  AppState,
  | 'agentHookInstallStateByTarget'
  | 'folderWorkspaces'
  | 'projectGroups'
  | 'ptyIdsByTabId'
  | 'repos'
  | 'tabsByWorktree'
  | 'worktreesByRepo'
>

type HookEvidence = {
  hasPermission: boolean
  hasLiveWorking: boolean
  hasLiveDone: boolean
}

/**
 * Whether this worktree's dot would be reporting a state nobody observed.
 *
 * Retained `done` rows are deliberately *not* counted as evidence: they can be a
 * snapshot from before the hooks were removed, which is exactly the stale signal
 * that made the bug look like a finished agent.
 */
export function selectWorktreeHooksUnverifiable(
  state: WorktreeHookObservabilityState,
  worktreeId: string,
  evidence: HookEvidence
): boolean {
  const liveAgents: (TuiAgent | undefined)[] = []
  for (const tab of state.tabsByWorktree[worktreeId] ?? []) {
    if (tabHasLivePty(state.ptyIdsByTabId, tab.id)) {
      liveAgents.push(tab.launchAgent)
    }
  }
  if (liveAgents.length === 0) {
    return false
  }
  return isWorktreeAgentStatusUnverifiable({
    liveAgents,
    installStateByTarget: state.agentHookInstallStateByTarget,
    connectionId: getConnectionIdFromState(state, worktreeId),
    worktreePath: getIndexedWorktreeById(state.worktreesByRepo, worktreeId)?.path,
    hasLiveHookEvidence: evidence.hasPermission || evidence.hasLiveWorking || evidence.hasLiveDone
  })
}
