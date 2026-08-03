// @vitest-environment happy-dom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { RUNTIME_PROTOCOL_VERSION } from '../../../../shared/protocol-version'
import type { Project, ProjectHostSetup, Repo } from '../../../../shared/types'
import { useAppStore } from '../../store'
import { RepositoryHostSetupsSection } from './RepositoryHostSetupsSection'

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  useAppStore.setState(useAppStore.getInitialState(), true)
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  useAppStore.setState(useAppStore.getInitialState(), true)
})

describe('RepositoryHostSetupsSection runtime window availability', () => {
  it('asks users to open Orca when a reachable host has no workspace window', () => {
    const repo: Repo = {
      id: 'remote-repo',
      displayName: 'Orca',
      path: '/srv/orca',
      badgeColor: '#737373',
      addedAt: 100,
      kind: 'git',
      executionHostId: 'runtime:hub'
    }
    const project: Project = {
      id: 'github:stablyai/orca',
      displayName: 'Orca',
      badgeColor: '#737373',
      sourceRepoIds: [repo.id],
      createdAt: 100,
      updatedAt: 100
    }
    const setup: ProjectHostSetup = {
      id: 'hub-local-setup',
      projectId: project.id,
      repoId: repo.id,
      hostId: 'runtime:hub',
      executionHostId: 'local',
      runtimeOwnerEnvironmentId: 'hub',
      path: repo.path,
      displayName: repo.displayName,
      kind: 'git',
      setupState: 'ready',
      setupMethod: 'legacy-repo',
      createdAt: 100,
      updatedAt: 100
    }
    useAppStore.setState({
      repos: [repo],
      projects: [project],
      projectHostSetups: [setup],
      runtimeStatusByEnvironmentId: new Map([
        [
          'hub',
          {
            checkedAt: 1,
            status: {
              runtimeId: 'runtime-hub',
              rendererGraphEpoch: 1,
              graphStatus: 'unavailable',
              authoritativeWindowId: null,
              desktopWindowStatus: 'openable',
              liveTabCount: 0,
              liveLeafCount: 0,
              runtimeProtocolVersion: RUNTIME_PROTOCOL_VERSION,
              minCompatibleRuntimeClientVersion: 1,
              capabilities: []
            }
          }
        ]
      ])
    })

    act(() => {
      root.render(
        <RepositoryHostSetupsSection repo={repo} forceVisible searchQuery="" searchEntries={[]} />
      )
    })

    expect(container.textContent).toContain('Open Orca')
    expect(container.textContent).toContain(
      'Orca is connected, but its workspace window is closed. Open Orca on this host to use terminals.'
    )
    expect(container.textContent).not.toContain('Ready')
  })
})
