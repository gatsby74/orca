import type { LocalhostWorktreeLabelRoute } from '../../../shared/localhost-worktree-labels'
import type { GlobalSettings, Project, Repo } from '../../../shared/types'
import type { WorkspacePort } from '../../../shared/workspace-ports'
import { browserUrlForPort } from './workspace-port-urls'

export function localhostWorktreeLabelRouteForPort({
  port,
  repo,
  project,
  settings
}: {
  port: WorkspacePort
  repo: Repo | null | undefined
  project?: Project | null
  settings: Pick<GlobalSettings, 'localhostWorktreeLabelsEnabled'> | null | undefined
}): LocalhostWorktreeLabelRoute | null {
  if (settings?.localhostWorktreeLabelsEnabled === false || port.kind !== 'workspace' || !repo) {
    return null
  }
  const projectSource = project ?? repo
  return {
    targetUrl: browserUrlForPort(port),
    projectName: projectSource.displayName,
    worktreeName: port.owner.displayName,
    repoId: repo.id,
    worktreeId: port.owner.worktreeId,
    repoIcon: projectSource.repoIcon ?? repo.repoIcon ?? null,
    badgeColor: projectSource.badgeColor ?? repo.badgeColor
  }
}
