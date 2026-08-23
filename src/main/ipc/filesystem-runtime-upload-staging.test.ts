import { mkdtemp, mkdir, rm, symlink, truncate, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./filesystem-auth', () => ({ authorizeExternalPath: () => {} }))

const { stageOneSourceForRuntimeUpload } = await import('./filesystem-runtime-upload-staging')

let workDir: string

beforeEach(async () => {
  workDir = await mkdtemp(join(tmpdir(), 'orca-upload-staging-'))
})

afterEach(async () => {
  await rm(workDir, { force: true, recursive: true })
})

describe('stageOneSourceForRuntimeUpload', () => {
  it('records size instead of file contents so staging never holds the body', async () => {
    const filePath = join(workDir, 'note.txt')
    await writeFile(filePath, 'hello world')

    const staged = await stageOneSourceForRuntimeUpload(filePath)

    expect(staged).toMatchObject({
      status: 'staged',
      kind: 'file',
      name: 'note.txt',
      entries: [{ relativePath: '', kind: 'file', byteLength: 11 }]
    })
    expect(JSON.stringify(staged)).not.toContain('contentBase64')
  })

  it('stages a file far larger than the former 25 MB cap', async () => {
    const filePath = join(workDir, 'big.bin')
    await writeFile(filePath, '')
    await truncate(filePath, 64 * 1024 * 1024)

    await expect(stageOneSourceForRuntimeUpload(filePath)).resolves.toMatchObject({
      status: 'staged',
      entries: [{ kind: 'file', byteLength: 64 * 1024 * 1024 }]
    })
  })

  it('names the limit and the actual size when a file is over the ceiling', async () => {
    const filePath = join(workDir, 'huge.bin')
    await writeFile(filePath, '')
    // Sparse: the ceiling is checked from stat(), so no real bytes are written.
    await truncate(filePath, 3 * 1024 * 1024 * 1024)

    const staged = await stageOneSourceForRuntimeUpload(filePath)

    expect(staged).toMatchObject({ status: 'failed' })
    expect(staged.status === 'failed' && staged.reason).toContain('3 GB')
    expect(staged.status === 'failed' && staged.reason).toContain('2 GB')
  })

  // symlink() needs privileges or Developer Mode on Windows.
  it('renders a size just over the ceiling as larger than the ceiling', async () => {
    const filePath = join(workDir, 'edge.bin')
    await writeFile(filePath, '')
    await truncate(filePath, 2 * 1024 * 1024 * 1024 + 1)

    const staged = await stageOneSourceForRuntimeUpload(filePath)

    expect(staged).toMatchObject({ status: 'failed' })
    // "is 2 GB, over the 2 GB limit" reads like a broken check.
    expect(staged.status === 'failed' && staged.reason).toContain('2.1 GB')
  })

  it.skipIf(process.platform === 'win32')('keeps rejecting symlinked sources', async () => {
    const targetPath = join(workDir, 'target.txt')
    await writeFile(targetPath, 'data')
    const linkPath = join(workDir, 'link.txt')
    await symlink(targetPath, linkPath)

    await expect(stageOneSourceForRuntimeUpload(linkPath)).resolves.toMatchObject({
      status: 'skipped',
      reason: 'symlink'
    })
  })

  it('stages directory trees as metadata for every entry', async () => {
    const rootPath = join(workDir, 'assets')
    await mkdir(join(rootPath, 'nested'), { recursive: true })
    await writeFile(join(rootPath, 'a.txt'), 'aa')
    await writeFile(join(rootPath, 'nested', 'b.txt'), 'bbb')

    const staged = await stageOneSourceForRuntimeUpload(rootPath)

    expect(staged.status).toBe('staged')
    const entries = staged.status === 'staged' ? staged.entries : []
    expect(entries).toEqual(
      expect.arrayContaining([
        { relativePath: '', kind: 'directory' },
        { relativePath: 'a.txt', kind: 'file', byteLength: 2 },
        { relativePath: 'nested', kind: 'directory' },
        { relativePath: 'nested/b.txt', kind: 'file', byteLength: 3 }
      ])
    )
  })
})
