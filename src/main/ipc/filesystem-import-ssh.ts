import { constants } from 'node:fs'
import { lstat, open, readdir, realpath } from 'node:fs/promises'
import { basename, join, posix, resolve } from 'node:path'
import { authorizeExternalPath, isENOENT } from './filesystem-auth'
import { getSshConnectionManager } from './ssh'
import { requireSshFilesystemProvider } from '../providers/ssh-filesystem-dispatch'
import type { IFilesystemProvider } from '../providers/types'
import type { ImportItemResult } from './filesystem-mutations'

const UPLOAD_CHUNK_SIZE = 512 * 1024

// Why: the SSH import path uses SshFilesystemProvider instead of direct SFTP so
// system-SSH transports (ProxyCommand/ProxyJump/FIDO2) get the same workflows.
export async function importExternalPathsSsh(
  sourcePaths: string[],
  destDir: string,
  connectionId: string,
  options?: { ensureDir?: boolean }
): Promise<{ results: ImportItemResult[] }> {
  if (sourcePaths.length === 0) {
    return { results: [] }
  }

  const connManager = getSshConnectionManager()
  const conn = connManager?.getConnection(connectionId)
  if (!conn) {
    throw new Error(`No SSH connection for "${connectionId}"`)
  }

  const state = conn.getState()
  if (state.status !== 'connected') {
    if (state.status === 'reconnecting') {
      throw new Error('SSH connection is reconnecting — please try again in a moment')
    }
    throw new Error('SSH connection is not active — please reconnect and try again')
  }

  const provider = requireSshFilesystemProvider(connectionId)

  if (options?.ensureDir) {
    // Why: terminal-drop staging needs `${worktree}/.orca/drops` to exist
    // before the first upload. .orca/ is reserved as Orca-owned remote state;
    // see docs/terminal-drop-ssh.md.
    await ensureDropStagingDir(provider, destDir)
  }

  const results: ImportItemResult[] = []
  const reservedNames = new Set<string>()

  for (const sourcePath of sourcePaths) {
    const result = await importOneSourceSsh(provider, sourcePath, destDir, reservedNames)
    results.push(result)
    if (result.status === 'imported') {
      // Why: destPath is a remote POSIX path (e.g. /home/user/foo/bar.txt).
      // Node's basename() uses the OS separator, which on Windows would
      // return the entire string instead of just the filename.
      reservedNames.add(posix.basename(result.destPath))
    }
  }

  return { results }
}

async function importOneSourceSsh(
  provider: IFilesystemProvider,
  sourcePath: string,
  destDir: string,
  reservedNames: Set<string>
): Promise<ImportItemResult> {
  const resolvedSource = resolve(sourcePath)

  authorizeExternalPath(resolvedSource)

  let sourceStat: Awaited<ReturnType<typeof lstat>>
  try {
    sourceStat = await lstat(resolvedSource)
  } catch (error) {
    if (isENOENT(error)) {
      return { sourcePath, status: 'skipped', reason: 'missing' }
    }
    if (
      error instanceof Error &&
      'code' in error &&
      ((error as NodeJS.ErrnoException).code === 'EACCES' ||
        (error as NodeJS.ErrnoException).code === 'EPERM')
    ) {
      return { sourcePath, status: 'skipped', reason: 'permission-denied' }
    }
    return {
      sourcePath,
      status: 'failed',
      reason: error instanceof Error ? error.message : String(error)
    }
  }

  if (sourceStat.isSymbolicLink()) {
    return { sourcePath, status: 'skipped', reason: 'symlink' }
  }

  if (!sourceStat.isFile() && !sourceStat.isDirectory()) {
    return { sourcePath, status: 'skipped', reason: 'unsupported' }
  }

  const isDir = sourceStat.isDirectory()

  if (isDir) {
    const hasSymlink = await preScanForSymlinks(resolvedSource)
    if (hasSymlink) {
      return { sourcePath, status: 'skipped', reason: 'symlink' }
    }
  }

  const originalName = basename(resolvedSource)

  let createdDestDir: string | null = null
  let createdDestFile: string | null = null
  try {
    const finalName = await deconflictName(provider, destDir, originalName, reservedNames)
    const destPath = `${destDir}/${finalName}`
    const renamed = finalName !== originalName

    if (isDir) {
      await provider.createDirNoClobber(destPath)
      createdDestDir = destPath
      await uploadDirectoryViaProvider(
        provider,
        resolvedSource,
        destPath,
        await realpath(resolvedSource)
      )
    } else {
      createdDestFile = destPath
      await uploadFileViaProvider(provider, resolvedSource, destPath)
    }

    return {
      sourcePath,
      status: 'imported',
      destPath,
      kind: isDir ? 'directory' : 'file',
      renamed
    }
  } catch (error) {
    if (createdDestDir) {
      // Why: local directory imports roll back partial output; SSH imports
      // should not leave the no-clobber root after a nested upload failure.
      await provider.deletePath(createdDestDir, true).catch(() => {})
    }
    if (createdDestFile) {
      // Why: failed chunked uploads can leave a truncated remote file behind.
      await provider.deletePath(createdDestFile).catch(() => {})
    }
    return {
      sourcePath,
      status: 'failed',
      reason: error instanceof Error ? error.message : String(error)
    }
  }
}

async function deconflictName(
  provider: IFilesystemProvider,
  destDir: string,
  originalName: string,
  reservedNames: Set<string>
): Promise<string> {
  if (
    !(await remotePathExists(provider, `${destDir}/${originalName}`)) &&
    !reservedNames.has(originalName)
  ) {
    return originalName
  }

  const dotIndex = originalName.lastIndexOf('.')
  const hasMeaningfulExt = dotIndex > 0
  const stem = hasMeaningfulExt ? originalName.slice(0, dotIndex) : originalName
  const ext = hasMeaningfulExt ? originalName.slice(dotIndex) : ''

  let candidate = `${stem} copy${ext}`
  if (
    !(await remotePathExists(provider, `${destDir}/${candidate}`)) &&
    !reservedNames.has(candidate)
  ) {
    return candidate
  }

  let counter = 2
  while (counter < 10000) {
    candidate = `${stem} copy ${counter}${ext}`
    if (
      !(await remotePathExists(provider, `${destDir}/${candidate}`)) &&
      !reservedNames.has(candidate)
    ) {
      return candidate
    }
    counter += 1
  }

  throw new Error(
    `Could not generate a unique name for '${originalName}' after ${counter} attempts`
  )
}

async function ensureDropStagingDir(provider: IFilesystemProvider, destDir: string): Promise<void> {
  const parent = posix.dirname(destDir)
  await provider.createDir(parent)
  const gitignorePath = `${parent}/.gitignore`
  if (!(await remotePathExists(provider, gitignorePath))) {
    await provider.writeFile(gitignorePath, '*\n!.gitignore\n')
  }
  await provider.createDir(destDir)
}

async function uploadDirectoryViaProvider(
  provider: IFilesystemProvider,
  localDir: string,
  remoteDir: string,
  rootRealPath: string
): Promise<void> {
  await assertLocalUploadPathInsideRoot(rootRealPath, localDir)
  const entries = await readdir(localDir, { withFileTypes: true })
  for (const entry of entries) {
    const localPath = join(localDir, entry.name)
    const remotePath = `${remoteDir}/${entry.name}`
    await assertLocalUploadPathInsideRoot(rootRealPath, localPath)
    const statResult = await lstat(localPath)

    // Why: skip symlinks and special files even after the up-front pre-scan;
    // this closes the TOCTOU gap if one is created during upload.
    if (statResult.isSymbolicLink() || (!statResult.isFile() && !statResult.isDirectory())) {
      continue
    }

    if (statResult.isDirectory()) {
      await provider.createDirNoClobber(remotePath)
      await uploadDirectoryViaProvider(provider, localPath, remotePath, rootRealPath)
      continue
    }
    await uploadFileViaProvider(provider, localPath, remotePath)
  }
}

async function uploadFileViaProvider(
  provider: IFilesystemProvider,
  localPath: string,
  remotePath: string
): Promise<void> {
  const statResult = await lstat(localPath)
  if (statResult.isSymbolicLink() || !statResult.isFile()) {
    throw new Error(`Unsupported upload source: ${localPath}`)
  }

  const handle = await open(localPath, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0))
  try {
    const openedStat = await handle.stat()
    if (
      !openedStat.isFile() ||
      openedStat.size !== statResult.size ||
      (statResult.ino !== 0 && openedStat.ino !== 0 && openedStat.ino !== statResult.ino) ||
      (statResult.dev !== 0 && openedStat.dev !== 0 && openedStat.dev !== statResult.dev)
    ) {
      throw new Error(`File changed during upload: ${localPath}`)
    }

    if (openedStat.size === 0) {
      await provider.writeFileBase64Chunk(remotePath, '', false)
      return
    }

    const stream = handle.createReadStream({ highWaterMark: UPLOAD_CHUNK_SIZE })
    let append = false
    try {
      for await (const chunk of stream) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
        await provider.writeFileBase64Chunk(remotePath, buffer.toString('base64'), append)
        append = true
      }
    } finally {
      stream.destroy()
    }
  } finally {
    await handle.close()
  }
}

async function remotePathExists(
  provider: IFilesystemProvider,
  remotePath: string
): Promise<boolean> {
  try {
    await provider.stat(remotePath)
    return true
  } catch (error) {
    if (isRemoteMissingError(error)) {
      return false
    }
    throw error
  }
}

function isRemoteMissingError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }
  const code = (error as NodeJS.ErrnoException).code
  return code === 'ENOENT' || /ENOENT|no such file|not found/i.test(error.message)
}

async function preScanForSymlinks(dirPath: string): Promise<boolean> {
  const entries = await readdir(dirPath, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.isSymbolicLink()) {
      return true
    }
    if (entry.isDirectory()) {
      const childPath = join(dirPath, entry.name)
      if (await preScanForSymlinks(childPath)) {
        return true
      }
    }
  }
  return false
}

async function assertLocalUploadPathInsideRoot(
  rootRealPath: string,
  candidatePath: string
): Promise<void> {
  const candidateRealPath = await realpath(candidatePath)
  const root = rootRealPath.replace(/[\\/]+$/g, '')
  const candidate = candidateRealPath.replace(/[\\/]+$/g, '')
  const rootComparable = process.platform === 'win32' ? root.toLowerCase() : root
  const candidateComparable = process.platform === 'win32' ? candidate.toLowerCase() : candidate
  if (candidateComparable === rootComparable) {
    return
  }
  const boundary = process.platform === 'win32' ? '\\' : '/'
  if (!candidateComparable.startsWith(`${rootComparable}${boundary}`)) {
    throw new Error(`Upload source escapes selected directory: ${candidatePath}`)
  }
}
