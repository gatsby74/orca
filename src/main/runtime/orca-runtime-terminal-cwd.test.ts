import { describe, expect, it, vi } from 'vitest'
import { OrcaRuntimeService } from './orca-runtime'

vi.mock('electron', () => ({
  BrowserWindow: { fromId: vi.fn(() => null) },
  webContents: { fromId: vi.fn(() => null) },
  ipcMain: {
    on: vi.fn(),
    removeListener: vi.fn()
  },
  app: { getPath: vi.fn(() => '/tmp') }
}))

function stubLaunchScope(runtime: OrcaRuntimeService, path = '/repo/app'): void {
  const internals = runtime as unknown as {
    resolveTerminalWorkspaceLaunchScope: (selector: string) => Promise<{
      id: string
      path: string
      connectionId: string | null
      repo: null
      folderWorkspace: null
    }>
  }
  vi.spyOn(internals, 'resolveTerminalWorkspaceLaunchScope').mockResolvedValue({
    id: 'wt-1',
    path,
    connectionId: null,
    repo: null,
    folderWorkspace: null
  })
}

describe('OrcaRuntimeService terminal startup cwd', () => {
  it('spawns terminals inside the requested worktree subdirectory', async () => {
    const runtime = new OrcaRuntimeService()
    stubLaunchScope(runtime)
    const spawn = vi.fn().mockResolvedValue({ id: 'pty-1' })
    runtime.setPtyController({
      spawn,
      write: () => true,
      kill: () => true,
      getForegroundProcess: async () => null
    })

    await runtime.createTerminal('id:wt-1', { cwd: '/repo/app/packages/web' })

    expect(spawn).toHaveBeenCalledWith(
      expect.objectContaining({
        cwd: '/repo/app/packages/web',
        worktreeId: 'wt-1'
      })
    )
  })

  it('rejects requested terminal cwd values outside the selected worktree', async () => {
    const runtime = new OrcaRuntimeService()
    stubLaunchScope(runtime)
    const spawn = vi.fn().mockResolvedValue({ id: 'pty-1' })
    runtime.setPtyController({
      spawn,
      write: () => true,
      kill: () => true,
      getForegroundProcess: async () => null
    })

    await expect(runtime.createTerminal('id:wt-1', { cwd: '/repo/app-other' })).rejects.toThrow(
      'Terminal cwd must be inside the selected worktree.'
    )
    expect(spawn).not.toHaveBeenCalled()
  })
})
