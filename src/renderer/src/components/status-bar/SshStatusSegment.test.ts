import { describe, expect, it, vi } from 'vitest'
import { connectRuntimeHostForNavigation } from './SshStatusSegment'
import {
  isConnectedRuntimeHostState,
  runtimeHostConnectionState,
  runtimeStatusForOverall
} from '@/runtime/runtime-host-connection-state'

describe('SshStatusSegment host status helpers', () => {
  it('counts connected remote servers as connected hosts', () => {
    // Why: "connected" = attached/reachable (active-agnostic), matching Settings.
    // There is no separate "available" state — a reachable host is just Connected.
    expect(runtimeStatusForOverall('connected')).toBe('connected')
    expect(isConnectedRuntimeHostState('connected')).toBe(true)
  })

  it('keeps reachable servers connected while identifying a closed workspace window', () => {
    const state = runtimeHostConnectionState({
      hasStatus: true,
      online: true,
      graphStatus: 'unavailable',
      desktopWindowStatus: 'openable'
    })

    expect(state).toBe('needs-window')
    expect(runtimeStatusForOverall(state)).toBe('connected')
    expect(isConnectedRuntimeHostState(state)).toBe(true)
  })

  it('does not hide a closed connection behind stale workspace-window diagnostics', () => {
    const state = runtimeHostConnectionState({
      hasStatus: true,
      online: true,
      graphStatus: 'unavailable',
      desktopWindowStatus: 'openable',
      remoteControl: {
        state: 'closed',
        pendingRequestCount: 0,
        subscriptionCount: 0,
        reconnectAttempt: 0,
        lastConnectedAt: null,
        lastClose: null,
        lastError: 'Connection closed'
      }
    })

    expect(state).toBe('disconnected')
  })

  it('keeps reconnecting and disconnected remote servers out of the connected count', () => {
    expect(runtimeStatusForOverall('reconnecting')).toBe('connecting')
    expect(runtimeStatusForOverall('disconnected')).toBe('disconnected')
    expect(isConnectedRuntimeHostState('reconnecting')).toBe(false)
    expect(isConnectedRuntimeHostState('disconnected')).toBe(false)
  })
})

describe('connectRuntimeHostForNavigation', () => {
  it('loads the transient host catalog without writing Active Server', async () => {
    const refreshStatus = vi.fn().mockResolvedValue(true)
    const fetchRepos = vi.fn().mockResolvedValue([{ id: 'repo-a' }, { id: 'repo-b' }])
    const fetchWorktrees = vi.fn().mockResolvedValue(undefined)
    const fetchLineage = vi.fn().mockResolvedValue(undefined)

    await expect(
      connectRuntimeHostForNavigation({
        environmentId: 'windows-2',
        refreshStatus,
        fetchRepos,
        fetchWorktrees,
        fetchLineage
      })
    ).resolves.toBe(true)

    expect(fetchRepos).toHaveBeenCalledWith('windows-2')
    expect(fetchWorktrees).toHaveBeenCalledTimes(2)
    expect(fetchLineage).toHaveBeenCalledOnce()
  })

  it('does not load a catalog when the server is unreachable', async () => {
    const fetchRepos = vi.fn()
    await expect(
      connectRuntimeHostForNavigation({
        environmentId: 'windows-2',
        refreshStatus: vi.fn().mockResolvedValue(false),
        fetchRepos,
        fetchWorktrees: vi.fn(),
        fetchLineage: vi.fn()
      })
    ).resolves.toBe(false)
    expect(fetchRepos).not.toHaveBeenCalled()
  })
})
