import { app, ipcMain } from 'electron'
import type { MemorySnapshot } from '../../shared/process-stats-types'
import type { Store } from '../persistence'
import { collectMemorySnapshot } from '../memory/collector'
import { parseRemoteMemorySnapshot } from '../memory/remote-memory-snapshot'
import { parseExecutionHostId } from '../../shared/execution-host'
import { callRuntimeEnvironment } from './runtime-environment-transport-routing'

export type MemorySnapshotRequest = { executionHostId?: string | null }

/**
 * Remote runtimes already collect their own snapshot; this proxies to the one
 * the caller asked for. Failures reject rather than degrading to a local or
 * empty snapshot: an unreachable host is unverifiable, not idle, and the panel
 * must say so instead of drawing a remote machine as 0%.
 */
async function collectRuntimeSnapshot(environmentId: string): Promise<MemorySnapshot> {
  const response = await callRuntimeEnvironment(
    app.getPath('userData'),
    environmentId,
    'diagnostics.memory',
    null
  )
  if (!response.ok) {
    throw new Error(response.error.message || response.error.code || 'runtime_unavailable')
  }
  const snapshot = parseRemoteMemorySnapshot(response.result)
  if (!snapshot) {
    throw new Error('runtime_snapshot_unsupported')
  }
  return snapshot
}

export function registerMemoryHandlers(store: Store): void {
  ipcMain.handle(
    'memory:getSnapshot',
    (_event, request?: MemorySnapshotRequest): Promise<MemorySnapshot> => {
      const host = parseExecutionHostId(request?.executionHostId)
      if (host?.kind === 'runtime') {
        return collectRuntimeSnapshot(host.environmentId)
      }
      // Why: SSH hosts run PTYs outside any Orca process, so there is nothing to
      // ask; the renderer never offers them, and a stale id must not silently
      // answer with local numbers under a remote label.
      if (host?.kind === 'ssh') {
        return Promise.reject(new Error('resource_host_unsupported'))
      }
      return collectMemorySnapshot(store)
    }
  )
}
