import { ipcMain } from 'electron'
import type {
  LocalhostWorktreeLabelResult,
  LocalhostWorktreeLabelRoute
} from '../../shared/localhost-worktree-labels'
import { sanitizeRepoIcon } from '../../shared/repo-icon'
import { localhostWorktreeLabelProxy } from '../localhost-worktree-label-proxy'

export function registerLocalhostWorktreeLabelHandlers(): void {
  ipcMain.handle(
    'localhostWorktreeLabels:register',
    async (_event, rawArgs: unknown): Promise<LocalhostWorktreeLabelResult> => {
      return localhostWorktreeLabelProxy.registerRoute(parseRegisterArgs(rawArgs))
    }
  )
}

function parseRegisterArgs(value: unknown): LocalhostWorktreeLabelRoute {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid localhost label route.')
  }
  const candidate = value as Record<string, unknown>
  const targetUrl = readRequiredString(candidate.targetUrl, 'targetUrl')
  const projectName = readRequiredString(candidate.projectName, 'projectName')
  const worktreeName = readRequiredString(candidate.worktreeName, 'worktreeName')
  const repoIcon = sanitizeRepoIcon(candidate.repoIcon)
  return {
    targetUrl,
    projectName,
    worktreeName,
    repoId: readOptionalString(candidate.repoId),
    worktreeId: readOptionalString(candidate.worktreeId),
    repoIcon: repoIcon === undefined ? undefined : repoIcon,
    badgeColor: readOptionalString(candidate.badgeColor)
  }
}

function readRequiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Invalid localhost label ${field}.`)
  }
  return value.trim()
}

function readOptionalString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}
