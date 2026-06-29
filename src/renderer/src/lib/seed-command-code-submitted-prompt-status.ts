import { useAppStore } from '@/store'
import { makePaneKey } from '../../../shared/stable-pane-id'

// Why: Command Code has no prompt-submit hook, so when Orca submits a generated
// prompt after readiness we seed a "working" status at delivery time; real hooks
// still own refinement/completion.
export function seedCommandCodeSubmittedPromptStatus(tabId: string, prompt: string): void {
  const state = useAppStore.getState()
  const leafId = state.terminalLayoutsByTabId[tabId]?.activeLeafId
  if (!leafId) {
    return
  }
  try {
    state.setAgentStatus(makePaneKey(tabId, leafId), {
      state: 'working',
      prompt,
      agentType: 'command-code'
    })
  } catch {
    // Best-effort UI seed. Real hooks still own refinement/completion.
  }
}
