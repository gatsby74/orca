import { isPathInsideOrEqual, resolveRuntimePath } from './cross-platform-path'

export function resolveTerminalStartupCwd(
  worktreePath: string,
  requestedCwd?: string | null
): string | undefined {
  if (!requestedCwd || requestedCwd.trim().length === 0) {
    return undefined
  }
  const resolvedCwd = resolveRuntimePath(worktreePath, requestedCwd)
  if (!isPathInsideOrEqual(worktreePath, resolvedCwd)) {
    // Why: remote/session clients can request terminal cwd; never let that
    // become a shell outside the selected workspace.
    throw new Error('Terminal cwd must be inside the selected worktree.')
  }
  return resolvedCwd
}
