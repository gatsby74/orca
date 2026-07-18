import { useMemo } from 'react'
import { useAppStore } from '@/store'
import {
  getConnectionIdFromState,
  type ConnectionOwnerState
} from '@/lib/connection-owner-resolution'
import {
  getRuntimeEnvironmentIdForWorktree,
  type WorktreeRuntimeOwnerState
} from '@/lib/worktree-runtime-owner'
import type { AgentDetectionTarget } from './useDetectedAgents'

export const AGENT_DETECTION_LOCAL_TARGET_KEY = 'local'

export type AgentDetectionTargetState = ConnectionOwnerState & WorktreeRuntimeOwnerState

/**
 * Single resolver for the host that agent detection must probe for a worktree.
 *
 * Why: every agent-launch surface (tab-bar dropdown, searchable create entry,
 * send menus) must agree on local vs. SSH vs. runtime — a second hand-rolled
 * resolver once fell back to local for runtime-hosted worktrees, surfacing
 * agents that only exist on the client machine.
 *
 * Returns a string key (not the target object) so retained Zustand selectors
 * keep a stable primitive reference; parse with agentDetectionTargetFromKey.
 * Undefined means the owning repo has not hydrated yet — callers must not
 * treat that as local.
 */
export function getAgentDetectionTargetKeyFromState(
  state: AgentDetectionTargetState,
  worktreeId: string | null
): string | undefined {
  const connectionId = getConnectionIdFromState(state, worktreeId)
  if (connectionId === undefined) {
    return undefined
  }
  const normalizedConnectionId = connectionId?.trim()
  if (normalizedConnectionId) {
    return `ssh:${normalizedConnectionId}`
  }
  const runtimeEnvironmentId = getRuntimeEnvironmentIdForWorktree(state, worktreeId)?.trim()
  if (runtimeEnvironmentId) {
    return `runtime:${runtimeEnvironmentId}`
  }
  return AGENT_DETECTION_LOCAL_TARGET_KEY
}

export function agentDetectionTargetFromKey(
  key: string | undefined
): AgentDetectionTarget | undefined {
  if (key === undefined) {
    return undefined
  }
  if (key === AGENT_DETECTION_LOCAL_TARGET_KEY) {
    return { kind: 'local' }
  }
  if (key.startsWith('ssh:')) {
    return { kind: 'ssh', connectionId: key.slice('ssh:'.length) }
  }
  if (key.startsWith('runtime:')) {
    return { kind: 'runtime', environmentId: key.slice('runtime:'.length) }
  }
  return { kind: 'local' }
}

/**
 * Resolve the agent-detection host for a worktree. Undefined while the owning
 * repo is not hydrated (loading — do not flash local agents); otherwise the
 * SSH connection, runtime environment, or local host that owns the worktree.
 */
export function useAgentDetectionTarget(
  worktreeId: string | null
): AgentDetectionTarget | undefined {
  const targetKey = useAppStore((s) => getAgentDetectionTargetKeyFromState(s, worktreeId))
  return useMemo(() => agentDetectionTargetFromKey(targetKey), [targetKey])
}
