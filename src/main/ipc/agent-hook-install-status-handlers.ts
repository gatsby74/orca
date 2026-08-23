import { ipcMain } from 'electron'
import type { AgentHookInstallStatus, AgentHookTarget } from '../../shared/agent-hook-types'
import { getManagedAgentHookStatuses } from '../agent-hooks/managed-agent-hook-controls'
import { ampHookService } from '../amp/hook-service'
import { antigravityHookService } from '../antigravity/hook-service'
import { claudeHookService } from '../claude/hook-service'
import { codexHookService } from '../codex/hook-service'
import { commandCodeHookService } from '../command-code/hook-service'
import { copilotHookService } from '../copilot/hook-service'
import { cursorHookService } from '../cursor/hook-service'
import { devinHookService } from '../devin/hook-service'
import { droidHookService } from '../droid/hook-service'
import { geminiHookService } from '../gemini/hook-service'
import { grokHookService } from '../grok/hook-service'
import { hermesHookService } from '../hermes/hook-service'
import { kimiHookService } from '../kimi/hook-service'
import { openClaudeHookService } from '../openclaude/hook-service'

type HookStatusReader = { getStatus: () => AgentHookInstallStatus }

/** IPC channel suffix → the service that answers it. */
const PER_AGENT_STATUS_CHANNELS: readonly [string, AgentHookTarget, HookStatusReader][] = [
  ['claudeStatus', 'claude', claudeHookService],
  ['openClaudeStatus', 'openclaude', openClaudeHookService],
  ['codexStatus', 'codex', codexHookService],
  ['geminiStatus', 'gemini', geminiHookService],
  ['antigravityStatus', 'antigravity', antigravityHookService],
  ['ampStatus', 'amp', ampHookService],
  ['cursorStatus', 'cursor', cursorHookService],
  ['droidStatus', 'droid', droidHookService],
  ['commandCodeStatus', 'command-code', commandCodeHookService],
  ['grokStatus', 'grok', grokHookService],
  ['copilotStatus', 'copilot', copilotHookService],
  ['hermesStatus', 'hermes', hermesHookService],
  ['devinStatus', 'devin', devinHookService],
  ['kimiStatus', 'kimi', kimiHookService]
]

const AGGREGATE_CHANNEL = 'agentHooks:installStatuses'

// Why: errors from getStatus() (fs permission denied, homedir resolution
// failure, etc.) must be reported inline via state:'error' so the sidebar can
// render a coherent per-agent error row. Letting the exception propagate out
// of the IPC handler surfaces as an unhandled renderer-side rejection, which
// defeats the AgentHookInstallStatus contract the UI relies on.
function errorStatus(agent: AgentHookTarget, err: unknown): AgentHookInstallStatus {
  return {
    agent,
    state: 'error',
    configPath: '',
    managedHooksPresent: false,
    detail: err instanceof Error ? err.message : String(err)
  }
}

export function removeAgentHookInstallStatusHandlers(): void {
  ipcMain.removeHandler(AGGREGATE_CHANNEL)
  for (const [channel] of PER_AGENT_STATUS_CHANNELS) {
    ipcMain.removeHandler(`agentHooks:${channel}`)
  }
}

export function registerAgentHookInstallStatusHandlers(): void {
  // Why: the per-agent channels answer one target each, which the sidebar cannot
  // use — a worktree dot needs every managed target in one consistent read, and
  // 14 sequential round-trips per refresh would be worse than one. Each reader
  // already traps its own error into state:'error', so a single unreadable
  // config degrades that agent, not the whole snapshot.
  ipcMain.handle(AGGREGATE_CHANNEL, (): AgentHookInstallStatus[] => {
    try {
      return getManagedAgentHookStatuses()
    } catch (err) {
      console.warn('[agent-hooks] installStatuses failed:', err)
      return []
    }
  })

  for (const [channel, agent, service] of PER_AGENT_STATUS_CHANNELS) {
    ipcMain.handle(`agentHooks:${channel}`, (): AgentHookInstallStatus => {
      try {
        return service.getStatus()
      } catch (err) {
        return errorStatus(agent, err)
      }
    })
  }
}
