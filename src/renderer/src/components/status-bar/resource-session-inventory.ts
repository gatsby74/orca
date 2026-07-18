import type { DaemonSession } from './resource-usage-merge-types'

/** Last-known daemon terminal inventory for the Resource Manager badge. */
export type DaemonSessionInventory = {
  sessions: DaemonSession[]
  count: number
}

export const EMPTY_DAEMON_SESSION_INVENTORY: DaemonSessionInventory = {
  sessions: [],
  count: 0
}

export function inventoryFromSessions(sessions: readonly DaemonSession[]): DaemonSessionInventory {
  return {
    sessions: sessions.slice(),
    count: sessions.length
  }
}

export function removeSessionsFromInventory(
  inventory: DaemonSessionInventory,
  sessionIds: ReadonlySet<string>
): DaemonSessionInventory {
  if (sessionIds.size === 0 || inventory.sessions.length === 0) {
    return inventory
  }
  const sessions = inventory.sessions.filter((session) => !sessionIds.has(session.id))
  if (sessions.length === inventory.sessions.length) {
    return inventory
  }
  return {
    sessions,
    count: sessions.length
  }
}

export function removeSessionFromInventory(
  inventory: DaemonSessionInventory,
  sessionId: string
): DaemonSessionInventory {
  return removeSessionsFromInventory(inventory, new Set([sessionId]))
}

/**
 * True when a live mounted PTY id is missing from the cached daemon inventory.
 * Used to re-seed the closed badge after a new terminal spawns without polling.
 */
export function inventoryHasUnknownLivePty(
  inventory: DaemonSessionInventory,
  livePtyIdsByTabId: Record<string, readonly string[]>
): boolean {
  if (Object.keys(livePtyIdsByTabId).length === 0) {
    return false
  }
  const known = new Set(inventory.sessions.map((session) => session.id))
  for (const ptyIds of Object.values(livePtyIdsByTabId)) {
    for (const ptyId of ptyIds) {
      if (ptyId && !known.has(ptyId)) {
        return true
      }
    }
  }
  return false
}
