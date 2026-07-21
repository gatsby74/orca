import type { SourceControlActionId } from '../../../../shared/source-control-ai-actions'

export function getRepositoryLocalCommandsSectionId(repoId: string): string {
  return `repo-${repoId}-local-commands`
}

export function getRepositoryDisplayNameSectionId(repoId: string): string {
  return `repo-display-name-${repoId}`
}

export function getRepositoryIconSectionId(repoId: string): string {
  return `repo-${repoId}-icon`
}

export function getRepositorySourceControlAiSectionId(repoId: string): string {
  return `repo-${repoId}-source-control-ai`
}

export function getRepositorySourceControlAiActionRecipeSectionId(
  repoId: string,
  actionId: SourceControlActionId
): string {
  return `repo-${repoId}-source-control-ai-${actionId}`
}
