import { createReadStream } from 'fs'
import { readdir, stat } from 'fs/promises'
import { createInterface } from 'readline'
import { extname, join } from 'path'
import { isPathInsideOrEqual } from '../../shared/cross-platform-path'
import type { AiVaultScanIssue } from '../../shared/ai-vault-types'
import { walkSessionFiles } from './session-scanner-discovery'
import type { FileWithMtime } from './session-scanner-types'
import { errorMessage, extractString, parseJsonObject } from './session-scanner-values'

// Reading a few lines of one transcript per project dir is enough to learn that
// dir's cwd; cap both so a giant or cwd-less transcript can't stall the scan.
const REPRESENTATIVE_CWD_LINE_LIMIT = 200
const REPRESENTATIVE_FILE_LIMIT = 3
const CLAUDE_EXTENSIONS = new Set(['.jsonl'])

/**
 * Fully include the transcripts of Claude project directories whose cwd falls
 * inside the active workspace/project paths.
 *
 * Why: Claude organizes `~/.claude/projects/<cwd-encoded>/` one directory per
 * cwd. The global scan is recency-capped, so a project the user hasn't touched
 * recently can drop off the list entirely even though `claude --resume` still
 * finds it. For scoped panel views we resolve each project dir's cwd cheaply and
 * bypass the cap for the ones that belong to the active scope.
 */
export async function discoverInScopeClaudeFiles(args: {
  rootDirs: readonly string[]
  scopePaths: readonly string[]
  issues: AiVaultScanIssue[]
}): Promise<FileWithMtime[]> {
  if (args.scopePaths.length === 0) {
    return []
  }
  const collected = new Map<string, FileWithMtime>()
  for (const rootDir of args.rootDirs) {
    for (const projectDir of await listProjectDirs(rootDir)) {
      const cwd = await readProjectDirCwd(projectDir)
      if (!cwd || !args.scopePaths.some((scopePath) => isPathInsideOrEqual(scopePath, cwd))) {
        continue
      }
      await collectClaudeFiles(projectDir, args.issues, collected)
    }
  }
  return [...collected.values()]
}

async function listProjectDirs(rootDir: string): Promise<string[]> {
  let entries
  try {
    entries = await readdir(rootDir, { withFileTypes: true })
  } catch {
    return []
  }
  return entries.filter((entry) => entry.isDirectory()).map((entry) => join(rootDir, entry.name))
}

async function readProjectDirCwd(projectDir: string): Promise<string | null> {
  const files = await newestClaudeFilesInDir(projectDir)
  for (const file of files.slice(0, REPRESENTATIVE_FILE_LIMIT)) {
    const cwd = await readFirstCwd(file)
    if (cwd) {
      return cwd
    }
  }
  return null
}

async function newestClaudeFilesInDir(projectDir: string): Promise<string[]> {
  let entries
  try {
    entries = await readdir(projectDir, { withFileTypes: true })
  } catch {
    return []
  }
  const stats = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && CLAUDE_EXTENSIONS.has(extname(entry.name).toLowerCase()))
      .map(async (entry) => {
        const path = join(projectDir, entry.name)
        try {
          return { path, mtimeMs: (await stat(path)).mtimeMs }
        } catch {
          return null
        }
      })
  )
  return stats
    .filter((value): value is { path: string; mtimeMs: number } => value !== null)
    .sort((left, right) => right.mtimeMs - left.mtimeMs)
    .map((value) => value.path)
}

async function readFirstCwd(filePath: string): Promise<string | null> {
  const input = createReadStream(filePath, { encoding: 'utf-8' })
  const lines = createInterface({ input, crlfDelay: Infinity })
  let read = 0
  try {
    for await (const line of lines) {
      if (read++ >= REPRESENTATIVE_CWD_LINE_LIMIT) {
        break
      }
      const cwd = extractString(parseJsonObject(line)?.cwd)
      if (cwd) {
        return cwd
      }
    }
  } catch {
    return null
  } finally {
    // readline.close() leaves the underlying stream open; destroy it so the early
    // break/catch paths don't leak a file descriptor (this runs per project dir).
    lines.close()
    input.destroy()
  }
  return null
}

async function collectClaudeFiles(
  projectDir: string,
  issues: AiVaultScanIssue[],
  collected: Map<string, FileWithMtime>
): Promise<void> {
  const paths = await walkSessionFiles(projectDir, 'claude', issues, {
    extensions: CLAUDE_EXTENSIONS
  })
  for (const path of paths) {
    if (collected.has(path)) {
      continue
    }
    try {
      const fileStat = await stat(path)
      collected.set(path, {
        path,
        mtimeMs: fileStat.mtimeMs,
        modifiedAt: fileStat.mtime.toISOString()
      })
    } catch (err) {
      issues.push({ agent: 'claude', path, message: errorMessage(err) })
    }
  }
}
