import type { Repo } from '../../../../shared/repo-types'
import type { Worktree } from '../../../../shared/worktree/types'
import type { WorktreeGroupBy } from './worktree-list/grouping/row-types'

export function getEmptyProjectPlaceholderRepoIds(args: {
  groupBy: WorktreeGroupBy
  repos: readonly Repo[]
  worktreesByRepo: Readonly<Record<string, readonly Worktree[] | undefined>>
  visibleWorktrees: readonly Worktree[]
  filterRepoIds: readonly string[]
  /** Startup's all-host worktree scan has settled (or bailed out). */
  startupWorktreeRefreshCompleted: boolean
}): Set<string> {
  if (args.groupBy !== 'repo') {
    return new Set()
  }

  const filterSet = args.filterRepoIds.length > 0 ? new Set(args.filterRepoIds) : null
  const visibleRepoIds = new Set(args.visibleWorktrees.map((worktree) => worktree.repoId))
  const placeholderRepoIds = new Set<string>()
  for (const repo of args.repos) {
    if (filterSet && !filterSet.has(repo.id)) {
      continue
    }
    const worktrees = args.worktreesByRepo[repo.id]
    // Why: `undefined` is "not scanned yet", `[]` is "scanned, genuinely empty".
    // Reading the first as empty paints every repo as a project header at launch,
    // then walks the whole list back as scans land, twice (#16247). Once startup
    // settles, fall back to the optimistic read so a repo whose scan failed —
    // disconnected SSH, a throwing provider — still keeps a reachable header.
    if (worktrees === undefined && !args.startupWorktreeRefreshCompleted) {
      continue
    }
    const hasNoWorktrees = (worktrees?.length ?? 0) === 0
    // Why: workspace filters hide cards, but must not rewrite the visible
    // membership of a persisted Project Group. #8865
    const isFilteredProjectGroupMember = repo.projectGroupId != null && !visibleRepoIds.has(repo.id)
    if (hasNoWorktrees || isFilteredProjectGroupMember) {
      placeholderRepoIds.add(repo.id)
    }
  }
  return placeholderRepoIds
}
