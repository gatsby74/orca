import { getRepositorySourceControlAiSectionId } from '@/components/settings/repository-settings-targets'
import type { AppState } from '@/store'
import { getRepoExecutionHostId } from '../../../../shared/execution-host'
import type { Repo } from '../../../../shared/types'

export function openSourceControlAiSettingsTarget({
  activeRepo,
  openSettingsTarget,
  openSettingsPage
}: {
  activeRepo: Repo | null
  openSettingsTarget: AppState['openSettingsTarget']
  openSettingsPage: AppState['openSettingsPage']
}): void {
  if (activeRepo) {
    openSettingsTarget({
      pane: 'repo',
      repoId: activeRepo.id,
      repoHostId: getRepoExecutionHostId(activeRepo),
      sectionId: getRepositorySourceControlAiSectionId(activeRepo.id)
    })
  } else {
    openSettingsTarget({
      pane: 'git',
      repoId: null,
      sectionId: 'source-control-ai-settings'
    })
  }
  openSettingsPage()
}
