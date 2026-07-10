import { describe, expect, it } from 'vitest'
import type { AgentStatusEntry } from '../../../../shared/agent-status-types'
import type { TerminalLayoutSnapshot } from '../../../../shared/types'
import {
  hasUnreadAgentCompletionForTerminalTab,
  resolveTerminalTabAgentActivityState
} from './terminal-tab-agent-activity'

const TAB_ID = 'tab-1'
const FIRST_LEAF_ID = '11111111-1111-4111-8111-111111111111'
const SECOND_LEAF_ID = '22222222-2222-4222-8222-222222222222'
const NOW = 10_000

/** Build a canonical pane-status fixture for one tab leaf. */
function entry(
  leafId: string,
  state: AgentStatusEntry['state'],
  overrides: Partial<AgentStatusEntry> = {}
): AgentStatusEntry {
  const paneKey = `${TAB_ID}:${leafId}`
  return {
    paneKey,
    state,
    prompt: '',
    updatedAt: NOW,
    stateStartedAt: NOW,
    stateHistory: [],
    agentType: 'codex',
    ...overrides
  }
}

/** Build the two-pane layout used to verify per-leaf status authority. */
function splitLayout(): TerminalLayoutSnapshot {
  return {
    root: {
      type: 'split',
      direction: 'horizontal',
      ratio: 0.5,
      first: { type: 'leaf', leafId: FIRST_LEAF_ID },
      second: { type: 'leaf', leafId: SECOND_LEAF_ID }
    },
    activeLeafId: FIRST_LEAF_ID,
    expandedLeafId: null,
    ptyIdsByLeafId: {
      [FIRST_LEAF_ID]: 'pty-1',
      [SECOND_LEAF_ID]: 'pty-2'
    }
  }
}

describe('hasUnreadAgentCompletionForTerminalTab', () => {
  it('matches unread completion panes to their owning tab', () => {
    expect(
      hasUnreadAgentCompletionForTerminalTab(
        {
          [`${TAB_ID}:${FIRST_LEAF_ID}`]: true,
          [`tab-2:${SECOND_LEAF_ID}`]: true
        },
        TAB_ID
      )
    ).toBe(true)
    expect(
      hasUnreadAgentCompletionForTerminalTab(
        { [`tab-2:${SECOND_LEAF_ID}`]: true, malformed: true },
        TAB_ID
      )
    ).toBe(false)
  })
})

describe('resolveTerminalTabAgentActivityState', () => {
  it('shows a fresh hook-reported working state', () => {
    const working = entry(FIRST_LEAF_ID, 'working')

    expect(
      resolveTerminalTabAgentActivityState({
        tabId: TAB_ID,
        tabTitle: 'Codex',
        agentStatusByPaneKey: { [working.paneKey]: working },
        now: NOW
      })
    ).toBe('working')
  })

  it('lets a needs-input pane outrank a working sibling', () => {
    const working = entry(FIRST_LEAF_ID, 'working')
    const waiting = entry(SECOND_LEAF_ID, 'waiting')

    expect(
      resolveTerminalTabAgentActivityState({
        tabId: TAB_ID,
        tabTitle: 'Codex',
        agentStatusByPaneKey: {
          [working.paneKey]: working,
          [waiting.paneKey]: waiting
        },
        now: NOW
      })
    ).toBe('waiting')
  })

  it('distinguishes completed and interrupted turns', () => {
    const done = entry(FIRST_LEAF_ID, 'done')
    const interrupted = entry(FIRST_LEAF_ID, 'done', { interrupted: true })

    expect(
      resolveTerminalTabAgentActivityState({
        tabId: TAB_ID,
        tabTitle: 'Codex',
        agentStatusByPaneKey: { [done.paneKey]: done },
        now: NOW
      })
    ).toBe('done')
    expect(
      resolveTerminalTabAgentActivityState({
        tabId: TAB_ID,
        tabTitle: 'Codex',
        agentStatusByPaneKey: { [interrupted.paneKey]: interrupted },
        now: NOW
      })
    ).toBe('interrupted')
  })

  it('falls back to a live working title when hook status is stale', () => {
    const stale = entry(FIRST_LEAF_ID, 'done', { updatedAt: 0 })

    expect(
      resolveTerminalTabAgentActivityState({
        tabId: TAB_ID,
        tabTitle: 'Codex working',
        agentStatusByPaneKey: { [stale.paneKey]: stale },
        ptyIdsByTabId: { [TAB_ID]: ['pty-1'] },
        now: 31 * 60 * 1000
      })
    ).toBe('working')
  })

  it('does not treat preserved titles from a sleeping tab as activity', () => {
    expect(
      resolveTerminalTabAgentActivityState({
        tabId: TAB_ID,
        tabTitle: 'Codex working',
        runtimePaneTitlesByTabId: { [TAB_ID]: { 1: 'Codex working' } },
        ptyIdsByTabId: { [TAB_ID]: [] },
        now: NOW
      })
    ).toBeNull()
  })

  it('keeps hook authority per pane while detecting a working sibling by title', () => {
    const done = entry(FIRST_LEAF_ID, 'done')

    expect(
      resolveTerminalTabAgentActivityState({
        tabId: TAB_ID,
        tabTitle: 'Codex',
        agentStatusByPaneKey: { [done.paneKey]: done },
        runtimePaneTitlesByTabId: {
          [TAB_ID]: {
            1: 'Codex working',
            2: 'Claude Code working'
          }
        },
        ptyIdsByTabId: { [TAB_ID]: ['pty-1', 'pty-2'] },
        terminalLayout: splitLayout(),
        now: NOW
      })
    ).toBe('working')
  })
})
