import type { AgentHookInstallState, AgentHookTarget } from '../../../shared/agent-hook-types'
import { isManagedAgentHookTarget } from '../../../shared/managed-agent-hook-targets'
import { isWslUncPath } from '../../../shared/wsl-paths'
import type { TuiAgent } from '../../../shared/tui-agent'

/**
 * Install states that leave Orca unable to receive status from an agent.
 *
 * Why `skipped` is absent: it means the user disabled hooks (or the CLI is not
 * installed) — a deliberate opt-out, not a malfunction, and nagging about it on
 * every worktree dot would be noise. `partial` counts because a missing Stop
 * hook strands the dot mid-turn exactly like a missing install.
 */
const UNREPORTABLE_HOOK_INSTALL_STATES: ReadonlySet<AgentHookInstallState> = new Set([
  'not_installed',
  'partial',
  'error'
])

export type AgentHookInstallStateByTarget = Partial<Record<AgentHookTarget, AgentHookInstallState>>

export type WorktreeAgentObservabilityInput = {
  /** `launchAgent` of every tab in this worktree that currently has a live PTY. */
  liveAgents: readonly (TuiAgent | null | undefined)[]
  installStateByTarget: AgentHookInstallStateByTarget
  /** Null for local repos, an SSH target id for remote ones, undefined before the repo hydrates. */
  connectionId: string | null | undefined
  worktreePath: string | null | undefined
  /** True when a pane in this worktree has a *fresh* hook-reported row (working/permission/done). */
  hasLiveHookEvidence: boolean
}

/**
 * Whether the local `~/.claude/settings.json`-style config answers for the host
 * that actually runs this worktree's agents.
 *
 * Why: SSH panes run their agent — and their managed hooks — on the remote host,
 * and WSL panes inside the distro via the hook relay. Reading the local install
 * state would be answering for the wrong machine, so we decline to judge rather
 * than assert something we cannot observe (docs/reference/ssh-execution-boundary.md).
 */
export function localHookConfigOwnsWorktree(
  connectionId: string | null | undefined,
  worktreePath: string | null | undefined
): boolean {
  if (connectionId !== null) {
    // Why: `undefined` is an unhydrated repo, not a local one — same decline.
    return false
  }
  return !(worktreePath && isWslUncPath(worktreePath))
}

/**
 * Hook-target agents running live in this worktree whose managed hooks are not
 * installed, so nothing they do can reach Orca.
 *
 * Agents outside `AGENT_HOOK_TARGETS` (opencode, pi, aider, …) never had hooks;
 * their status legitimately comes from the title heuristic and they are ignored.
 */
export function getUnreportableLiveHookAgents(
  input: WorktreeAgentObservabilityInput
): AgentHookTarget[] {
  if (!localHookConfigOwnsWorktree(input.connectionId, input.worktreePath)) {
    return []
  }
  const seen = new Set<AgentHookTarget>()
  for (const agent of input.liveAgents) {
    if (!isManagedAgentHookTarget(agent) || seen.has(agent)) {
      continue
    }
    const state = input.installStateByTarget[agent]
    if (state !== undefined && UNREPORTABLE_HOOK_INSTALL_STATES.has(state)) {
      seen.add(agent)
    }
  }
  return [...seen]
}

/**
 * True when this worktree runs an agent Orca cannot observe, so neither "done"
 * nor "active" is an honest answer for its dot.
 *
 * Live hook evidence vetoes the verdict: if a pane is reporting right now, the
 * pipeline demonstrably works and a stale install read must not override it.
 */
export function isWorktreeAgentStatusUnverifiable(input: WorktreeAgentObservabilityInput): boolean {
  if (input.hasLiveHookEvidence) {
    return false
  }
  return getUnreportableLiveHookAgents(input).length > 0
}
