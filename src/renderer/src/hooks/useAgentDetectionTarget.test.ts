import { describe, expect, it } from 'vitest'
import {
  AGENT_DETECTION_LOCAL_TARGET_KEY,
  agentDetectionTargetFromKey,
  getAgentDetectionTargetKeyFromState,
  type AgentDetectionTargetState
} from './useAgentDetectionTarget'

function buildState(overrides: {
  repos: readonly { id: string; connectionId?: string | null; executionHostId?: string | null }[]
  worktreesByRepo?: Record<
    string,
    readonly { id: string; repoId: string; hostId?: string | null }[]
  >
  activeRuntimeEnvironmentId?: string | null
}): AgentDetectionTargetState {
  return {
    folderWorkspaces: [],
    projectGroups: [],
    repos: overrides.repos.map((repo) => ({
      connectionId: null,
      executionHostId: null,
      ...repo
    })),
    worktreesByRepo: overrides.worktreesByRepo ?? {},
    settings: { activeRuntimeEnvironmentId: overrides.activeRuntimeEnvironmentId ?? null }
  } as unknown as AgentDetectionTargetState
}

const LOCAL_STATE = buildState({
  repos: [{ id: 'repo-1' }],
  worktreesByRepo: { 'repo-1': [{ id: 'repo-1::wt-1', repoId: 'repo-1' }] }
})

describe('getAgentDetectionTargetKeyFromState', () => {
  it('returns undefined while the owning repo has not hydrated', () => {
    expect(getAgentDetectionTargetKeyFromState(LOCAL_STATE, 'missing-repo::wt-1')).toBeUndefined()
  })

  it('targets the local host for a local repo', () => {
    expect(getAgentDetectionTargetKeyFromState(LOCAL_STATE, 'repo-1::wt-1')).toBe(
      AGENT_DETECTION_LOCAL_TARGET_KEY
    )
  })

  it('targets the SSH host for a repo with a connection', () => {
    const state = buildState({
      repos: [{ id: 'repo-1', connectionId: 'conn-1' }],
      worktreesByRepo: { 'repo-1': [{ id: 'repo-1::wt-1', repoId: 'repo-1' }] }
    })

    expect(getAgentDetectionTargetKeyFromState(state, 'repo-1::wt-1')).toBe('ssh:conn-1')
  })

  it('targets the runtime environment that owns the repo', () => {
    const state = buildState({
      repos: [{ id: 'repo-1', executionHostId: 'runtime:env-1' }],
      worktreesByRepo: { 'repo-1': [{ id: 'repo-1::wt-1', repoId: 'repo-1' }] }
    })

    expect(getAgentDetectionTargetKeyFromState(state, 'repo-1::wt-1')).toBe('runtime:env-1')
  })

  it('lets a worktree-level runtime host override the repo owner', () => {
    const state = buildState({
      repos: [{ id: 'repo-1' }],
      worktreesByRepo: {
        'repo-1': [{ id: 'repo-1::wt-1', repoId: 'repo-1', hostId: 'runtime:env-wt' }]
      }
    })

    expect(getAgentDetectionTargetKeyFromState(state, 'repo-1::wt-1')).toBe('runtime:env-wt')
  })

  it('falls back to the focused runtime environment for unowned repos', () => {
    const state = buildState({
      repos: [{ id: 'repo-1' }],
      worktreesByRepo: { 'repo-1': [{ id: 'repo-1::wt-1', repoId: 'repo-1' }] },
      activeRuntimeEnvironmentId: 'env-active'
    })

    expect(getAgentDetectionTargetKeyFromState(state, 'repo-1::wt-1')).toBe('runtime:env-active')
  })

  it('prefers the SSH connection over a runtime owner', () => {
    const state = buildState({
      repos: [{ id: 'repo-1', connectionId: 'conn-1', executionHostId: 'runtime:env-1' }],
      worktreesByRepo: { 'repo-1': [{ id: 'repo-1::wt-1', repoId: 'repo-1' }] }
    })

    expect(getAgentDetectionTargetKeyFromState(state, 'repo-1::wt-1')).toBe('ssh:conn-1')
  })
})

describe('agentDetectionTargetFromKey', () => {
  it('parses each target kind', () => {
    expect(agentDetectionTargetFromKey(undefined)).toBeUndefined()
    expect(agentDetectionTargetFromKey(AGENT_DETECTION_LOCAL_TARGET_KEY)).toEqual({
      kind: 'local'
    })
    expect(agentDetectionTargetFromKey('ssh:conn-1')).toEqual({
      kind: 'ssh',
      connectionId: 'conn-1'
    })
    expect(agentDetectionTargetFromKey('runtime:env-1')).toEqual({
      kind: 'runtime',
      environmentId: 'env-1'
    })
  })

  it('treats unknown keys as local', () => {
    expect(agentDetectionTargetFromKey('unexpected')).toEqual({ kind: 'local' })
  })
})
