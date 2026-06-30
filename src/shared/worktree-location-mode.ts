import type { GlobalSettings } from './global-settings-types'
import type { Repo } from './repo-types'

export type WorktreeLocationMode = 'sibling' | 'nested'

export const DEFAULT_WORKTREE_LOCATION_MODE: WorktreeLocationMode = 'sibling'

export function resolveWorktreeLocationMode(
  repo: Pick<Repo, 'worktreeLocationMode'>,
  settings: Partial<Pick<GlobalSettings, 'defaultWorktreeLocationMode'>>
): WorktreeLocationMode {
  return (
    repo.worktreeLocationMode ??
    settings.defaultWorktreeLocationMode ??
    DEFAULT_WORKTREE_LOCATION_MODE
  )
}

export function isNestedWorktreeLocation(
  repo: Pick<Repo, 'worktreeLocationMode'>,
  settings: Partial<Pick<GlobalSettings, 'defaultWorktreeLocationMode'>>
): boolean {
  return resolveWorktreeLocationMode(repo, settings) === 'nested'
}
