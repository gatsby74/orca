import type { RemoteRuntimeSharedConnectionDiagnostics } from '../../../shared/remote-runtime-shared-control-types'
import type { RuntimeStatus } from '../../../shared/runtime-types'

type HostStatus = 'connected' | 'disconnected' | 'connecting'

export type RuntimeHostConnectionState =
  | 'connected'
  | 'needs-window'
  | 'checking'
  | 'reconnecting'
  | 'disconnected'

export function runtimeHostNeedsWorkspaceWindow(
  status?: {
    graphStatus?: RuntimeStatus['graphStatus']
    desktopWindowStatus?: RuntimeStatus['desktopWindowStatus']
  } | null
): boolean {
  // Why: a reachable main process cannot serve interactive workspaces without its renderer graph.
  return status?.graphStatus !== 'ready' && status?.desktopWindowStatus === 'openable'
}

export function runtimeHostConnectionState({
  hasStatus,
  online,
  graphStatus,
  desktopWindowStatus,
  remoteControl
}: {
  hasStatus: boolean
  online: boolean
  graphStatus?: RuntimeStatus['graphStatus']
  desktopWindowStatus?: RuntimeStatus['desktopWindowStatus']
  remoteControl?: RemoteRuntimeSharedConnectionDiagnostics | null
}): RuntimeHostConnectionState {
  if (!hasStatus) {
    return 'checking'
  }
  if (remoteControl?.state === 'reconnecting') {
    return 'reconnecting'
  }
  if (!online) {
    return 'disconnected'
  }
  if (remoteControl?.state === 'closed' && remoteControl.lastError) {
    return 'disconnected'
  }
  if (runtimeHostNeedsWorkspaceWindow({ graphStatus, desktopWindowStatus })) {
    return 'needs-window'
  }
  // Why: "connected" means attached/reachable, not "is the active default host".
  return 'connected'
}

export function runtimeStatusForOverall(state: RuntimeHostConnectionState): HostStatus {
  switch (state) {
    case 'connected':
    case 'needs-window':
      return 'connected'
    case 'checking':
    case 'reconnecting':
      return 'connecting'
    case 'disconnected':
      return 'disconnected'
  }
}

export function isConnectedRuntimeHostState(state: RuntimeHostConnectionState): boolean {
  return state === 'connected' || state === 'needs-window'
}
