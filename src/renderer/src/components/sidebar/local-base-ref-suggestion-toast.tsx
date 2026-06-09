import { toast } from 'sonner'
import type { AppState } from '@/store/types'
import type { LocalBaseRefUpdateSuggestion } from '../../../../shared/types'
import { Button } from '../ui/button'
import {
  KEEP_LOCAL_MAIN_UP_TO_DATE_SECTION_ID,
  KEEP_LOCAL_MAIN_UP_TO_DATE_TITLE
} from '../settings/keep-local-main-up-to-date-setting'

type SuggestionToastDeps = {
  updateSettings: AppState['updateSettings']
  getSettings: () => AppState['settings']
  openSettingsPage: AppState['openSettingsPage']
  openSettingsTarget: AppState['openSettingsTarget']
}

function toastId(suggestion: LocalBaseRefUpdateSuggestion): string {
  return `local-base-ref-update-suggestion:${suggestion.baseRef}:${suggestion.localBranch}`
}

// Why: sonner crams its built-in `action`/`cancel` buttons into the same
// center-aligned flex row as the title + multi-line description, which pinches
// the actions into a squished column. Rendering the body as a custom node lets
// the buttons sit in a full-width footer below the text while still reusing
// sonner's native frame (warning icon, title, close X, swipe-to-dismiss).
function SuggestionToastBody({
  suggestion,
  deps
}: {
  suggestion: LocalBaseRefUpdateSuggestion
  deps: SuggestionToastDeps
}): React.JSX.Element {
  const { updateSettings, getSettings, openSettingsPage, openSettingsTarget } = deps
  const commitNoun = suggestion.behind === 1 ? 'commit' : 'commits'

  const turnOn = (): void => {
    void Promise.resolve(updateSettings({ refreshLocalBaseRefOnWorktreeCreate: true }))
      .then(() => {
        if (getSettings()?.refreshLocalBaseRefOnWorktreeCreate !== true) {
          throw new Error('settings_not_persisted')
        }
        toast.dismiss(toastId(suggestion))
        toast.success(`Keeping local ${suggestion.localBranch} up to date`)
      })
      .catch(() => {
        toast.error(`Could not turn on ${KEEP_LOCAL_MAIN_UP_TO_DATE_TITLE}`, {
          description: 'Open Settings and try again.'
        })
      })
  }

  const openSetting = (): void => {
    openSettingsPage()
    openSettingsTarget({
      pane: 'git',
      repoId: null,
      sectionId: KEEP_LOCAL_MAIN_UP_TO_DATE_SECTION_ID
    })
    toast.dismiss(toastId(suggestion))
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-popover-foreground/80">
        Your new worktree is current, but local {suggestion.localBranch} is {suggestion.behind}{' '}
        {commitNoun} behind, so AI diffs may compare to stale history. Let Orca keep it up to date
        automatically. Manage in{' '}
        <button
          type="button"
          onClick={openSetting}
          className="cursor-pointer font-medium text-popover-foreground underline underline-offset-2 hover:text-primary"
        >
          Settings › {KEEP_LOCAL_MAIN_UP_TO_DATE_TITLE}
        </button>
        .
      </p>
      <div className="flex justify-end">
        {/* No explicit Dismiss: the toast is persistent and sonner's close (X)
            already backs the user out and persists the decline. */}
        <Button size="sm" onClick={turnOn}>
          Keep {suggestion.localBranch} up to date
        </Button>
      </div>
    </div>
  )
}

export function showLocalBaseRefUpdateSuggestionToast(
  suggestion: LocalBaseRefUpdateSuggestion | undefined,
  deps: SuggestionToastDeps
): void {
  if (!suggestion) {
    return
  }

  // Why (matches the sticky "Session restore failed" toast): stay on screen until
  // the user acts, so a ~4s auto-expire can't bury this one-time, opt-in nudge.
  toast.warning(`Local ${suggestion.localBranch} is behind ${suggestion.baseRef}`, {
    id: toastId(suggestion),
    description: <SuggestionToastBody suggestion={suggestion} deps={deps} />,
    duration: Infinity,
    dismissible: true,
    // Fires for the close (X) button and swipe; the in-body buttons handle their
    // own dismissal since they are not sonner's native action/cancel controls.
    onDismiss: () => {
      if (deps.getSettings()?.refreshLocalBaseRefOnWorktreeCreate === true) {
        return
      }
      void Promise.resolve(deps.updateSettings({ localBaseRefSuggestionDismissed: true })).catch(
        () => {}
      )
    }
  })
}
