import type { RepoIcon } from './repo-icon'

const HOST_LABEL_MAX_LENGTH = 48
const TRAILING_MAIN_PATTERN = /(?:^|[-_\s/])main$/i

export type LocalhostWorktreeLabelInput = {
  projectName: string
  worktreeName: string
  worktreePath?: string | null
  repoId?: string | null
  worktreeId?: string | null
}

export type LocalhostWorktreeLabelRoute = {
  targetUrl: string
  projectName: string
  worktreeName: string
  worktreePath?: string | null
  repoId?: string | null
  worktreeId?: string | null
  repoIcon?: RepoIcon | null
  badgeColor?: string | null
}

export type LocalhostWorktreeLabelResult = {
  url: string
  label: string
}

export function slugifyLocalhostWorktreeLabel(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, HOST_LABEL_MAX_LENGTH)
    .replace(/-+$/g, '')
  return normalized || 'workspace'
}

export function getLocalhostWorktreeHostLabel(input: LocalhostWorktreeLabelInput): string {
  const projectSlug = slugifyLocalhostWorktreeLabel(input.projectName)
  const shortWorktreeName = getLocalhostWorktreeShortName(input.worktreePath ?? input.worktreeName)
  const worktreeSlug = slugifyLocalhostWorktreeLabel(shortWorktreeName)
  if (worktreeSlug === 'main' || TRAILING_MAIN_PATTERN.test(input.worktreeName)) {
    return slugifyLocalhostWorktreeLabel(`${projectSlug}-main`)
  }
  return worktreeSlug
}

function getLocalhostWorktreeShortName(worktreeName: string): string {
  return (
    worktreeName
      .split(/[\\/]/)
      .map((part) => part.trim())
      .filter(Boolean)
      .at(-1) ?? worktreeName
  )
}

export function getLocalhostWorktreeRouteKey(route: LocalhostWorktreeLabelRoute): string {
  if (route.worktreeId) {
    return `worktree:${route.worktreeId}`
  }
  if (route.repoId) {
    return `repo:${route.repoId}:${route.worktreeName}`
  }
  return `${route.projectName}:${route.worktreeName}:${route.targetUrl}`
}
