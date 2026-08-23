import {
  getExecutionHostLabel,
  parseExecutionHostId,
  type ExecutionHostId
} from '../../../shared/execution-host'
import type { PublicKnownRuntimeEnvironment } from '../../../shared/runtime-environments'

export type ExecutionHostNameSources = {
  runtimeEnvironments: readonly Pick<PublicKnownRuntimeEnvironment, 'id' | 'name'>[]
  sshTargetLabels: ReadonlyMap<string, string>
}

export const EMPTY_EXECUTION_HOST_NAME_SOURCES: ExecutionHostNameSources = {
  runtimeEnvironments: [],
  sshTargetLabels: new Map()
}

/**
 * The name a user recognises for a host. `getExecutionHostLabel` alone falls back
 * to the raw target/environment id, which surfaces a bare UUID for paired
 * servers, so the saved names are resolved here first.
 */
export function getExecutionHostDisplayLabel(
  hostId: ExecutionHostId,
  sources: ExecutionHostNameSources
): string {
  const parsed = parseExecutionHostId(hostId)
  if (parsed?.kind === 'ssh') {
    return sources.sshTargetLabels.get(parsed.targetId)?.trim() || parsed.targetId
  }
  if (parsed?.kind === 'runtime') {
    const named = sources.runtimeEnvironments.find(
      (environment) => environment.id === parsed.environmentId
    )
    return named?.name.trim() || getExecutionHostLabel(hostId)
  }
  return getExecutionHostLabel(hostId)
}
