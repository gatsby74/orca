import { detectAgentStatusFromTitle, isExplicitAgentStatusFresh } from '@/lib/agent-status'
import { resolveRuntimePaneTitleLeafId } from '@/lib/runtime-pane-title-leaf-id'
import { tabHasLivePty } from '@/lib/tab-has-live-pty'
import {
  AGENT_STATUS_STALE_AFTER_MS,
  type AgentStatusEntry
} from '../../../../shared/agent-status-types'
import { parsePaneKey } from '../../../../shared/stable-pane-id'
import type { TerminalLayoutSnapshot } from '../../../../shared/types'

export type TerminalTabAgentActivityState =
  | 'working'
  | 'blocked'
  | 'waiting'
  | 'done'
  | 'interrupted'

type TerminalTabAgentActivityInput = {
  tabId: string
  tabTitle: string
  agentStatusByPaneKey?: Record<string, AgentStatusEntry>
  runtimePaneTitlesByTabId?: Record<string, Record<number, string>>
  ptyIdsByTabId?: Record<string, string[]>
  terminalLayout?: TerminalLayoutSnapshot
  now?: number
}

const ACTIVITY_STATE_PRIORITY: readonly TerminalTabAgentActivityState[] = [
  'blocked',
  'waiting',
  'working',
  'done',
  'interrupted'
]

/** Add only title states that require an ongoing tab-bar affordance. */
function addTitleActivityState(states: Set<TerminalTabAgentActivityState>, title: string): void {
  const titleStatus = detectAgentStatusFromTitle(title)
  if (titleStatus === 'working') {
    states.add('working')
  } else if (titleStatus === 'permission') {
    states.add('waiting')
  }
}

/**
 * Resolve the strongest current agent state represented by a terminal tab.
 * Fresh hook state is authoritative per pane; hookless panes fall back to the
 * same live-title detection used by Orca's sidebar and smart worktree sort.
 */
export function resolveTerminalTabAgentActivityState({
  tabId,
  tabTitle,
  agentStatusByPaneKey,
  runtimePaneTitlesByTabId,
  ptyIdsByTabId,
  terminalLayout,
  now = Date.now()
}: TerminalTabAgentActivityInput): TerminalTabAgentActivityState | null {
  const states = new Set<TerminalTabAgentActivityState>()
  const hookCoveredLeafIds = new Set<string>()

  for (const [paneKey, entry] of Object.entries(agentStatusByPaneKey ?? {})) {
    const parsedPaneKey = parsePaneKey(entry.paneKey || paneKey)
    if (parsedPaneKey?.tabId !== tabId) {
      continue
    }
    if (!isExplicitAgentStatusFresh(entry, now, AGENT_STATUS_STALE_AFTER_MS)) {
      continue
    }

    hookCoveredLeafIds.add(parsedPaneKey.leafId)
    states.add(entry.state === 'done' && entry.interrupted ? 'interrupted' : entry.state)
  }

  // Why: preserved pane titles survive hibernation, so title heuristics must
  // never paint a sleeping tab as active without a live PTY.
  if (tabHasLivePty(ptyIdsByTabId ?? {}, tabId)) {
    const paneTitles = runtimePaneTitlesByTabId?.[tabId]
    if (paneTitles && Object.keys(paneTitles).length > 0) {
      for (const [runtimePaneId, title] of Object.entries(paneTitles)) {
        const leafId = resolveRuntimePaneTitleLeafId(terminalLayout, runtimePaneId)
        if (leafId !== null && hookCoveredLeafIds.has(leafId)) {
          continue
        }
        addTitleActivityState(states, title)
      }
    } else if (hookCoveredLeafIds.size === 0) {
      // Why: restored tabs may expose only their legacy tab title until their
      // terminal surface mounts and publishes pane-level titles.
      addTitleActivityState(states, tabTitle)
    }
  }

  for (const state of ACTIVITY_STATE_PRIORITY) {
    if (states.has(state)) {
      return state
    }
  }
  return null
}

/** Return whether the current state represents active work or a pending user response. */
export function isTerminalTabAgentActive(state: TerminalTabAgentActivityState | null): boolean {
  return state === 'working' || state === 'blocked' || state === 'waiting'
}

/** Match pane-level unread completion markers to their owning terminal tab. */
export function hasUnreadAgentCompletionForTerminalTab(
  unreadAgentCompletionPanes: Record<string, true> | undefined,
  tabId: string
): boolean {
  for (const paneKey of Object.keys(unreadAgentCompletionPanes ?? {})) {
    if (parsePaneKey(paneKey)?.tabId === tabId) {
      return true
    }
  }
  return false
}
