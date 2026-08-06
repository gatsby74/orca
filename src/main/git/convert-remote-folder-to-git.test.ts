import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { IFilesystemProvider } from '../providers/types'
import { getRemoteHostPlatform } from '../ssh/ssh-remote-platform'
import {
  convertRemoteFolderToGit,
  writeGitignoreExclusiveRemote
} from './convert-remote-folder-to-git'

const HOST = getRemoteHostPlatform('linux-x64')
const FOLDER = '/home/user/project'
const GIT_METADATA = `${FOLDER}/.git`

function missingPathError(): NodeJS.ErrnoException {
  return Object.assign(new Error('missing'), { code: 'ENOENT' })
}

function makeFilesystem(existingPaths: Set<string>): IFilesystemProvider {
  return {
    lstat: vi.fn(async (path: string) => {
      if (!existingPaths.has(path)) {
        throw missingPathError()
      }
      return { size: 0, type: 'directory', mtime: 0 }
    }),
    stat: vi.fn(async (path: string) => {
      if (!existingPaths.has(path)) {
        throw missingPathError()
      }
      return { size: 0, type: 'directory', mtime: 0 }
    }),
    writeFile: vi.fn(async (path: string) => {
      existingPaths.add(path)
    }),
    renameNoClobber: vi.fn(async (from: string, to: string) => {
      if (existingPaths.has(to)) {
        throw Object.assign(new Error('exists'), { code: 'EEXIST' })
      }
      existingPaths.delete(from)
      existingPaths.add(to)
    }),
    deletePath: vi.fn(async (path: string) => {
      existingPaths.delete(path)
    })
  } as unknown as IFilesystemProvider
}

describe('convertRemoteFolderToGit cleanup ownership', () => {
  let existingPaths: Set<string>
  let fsProvider: IFilesystemProvider
  let exec: (
    args: string[],
    cwd: string,
    options?: { signal?: AbortSignal; timeoutMs?: number }
  ) => Promise<{ stdout: string; stderr: string }>

  beforeEach(() => {
    existingPaths = new Set([FOLDER])
    fsProvider = makeFilesystem(existingPaths)
    exec = vi.fn(async (args: string[]) => {
      if (args[0] === 'init') {
        existingPaths.add(GIT_METADATA)
      }
      if (args[0] === 'commit') {
        throw new Error('commit failed')
      }
      return { stdout: '', stderr: '' }
    })
  })

  async function convert() {
    return convertRemoteFolderToGit({
      connectionId: 'ssh-1',
      path: FOLDER,
      host: HOST,
      fsProvider,
      gitProvider: {
        exec,
        isGitRepoAsync: vi.fn().mockResolvedValue({ isRepo: false, rootPath: null })
      }
    })
  }

  it('preserves repository metadata that existed before conversion', async () => {
    existingPaths.add(GIT_METADATA)

    await expect(convert()).resolves.toMatchObject({
      ok: false,
      error: expect.stringContaining('commit failed')
    })

    expect(existingPaths.has(GIT_METADATA)).toBe(true)
  })

  it('removes repository metadata created by a failed conversion', async () => {
    await expect(convert()).resolves.toMatchObject({
      ok: false,
      error: expect.stringContaining('commit failed')
    })

    expect(existingPaths.has(GIT_METADATA)).toBe(false)
    expect(fsProvider.deletePath).toHaveBeenCalledWith(GIT_METADATA, true)
  })
})

describe('writeGitignoreExclusiveRemote', () => {
  it('respects a .gitignore that appears before the final rename', async () => {
    const existingPaths = new Set<string>()
    const fsProvider = makeFilesystem(existingPaths)
    const tmpPath = `${FOLDER}/.orca-gitignore.tmp`
    const gitignorePath = `${FOLDER}/.gitignore`
    existingPaths.add(gitignorePath)

    await expect(
      writeGitignoreExclusiveRemote(fsProvider, tmpPath, gitignorePath, '*.log\n')
    ).resolves.toBeUndefined()

    expect(fsProvider.deletePath).toHaveBeenCalledWith(tmpPath, false)
    expect(existingPaths.has(gitignorePath)).toBe(true)
  })
})
