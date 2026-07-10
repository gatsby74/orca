import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { TerminalTabLeadingIcon } from './TerminalTabLeadingIcon'
import type { TerminalTabAgentActivityState } from './terminal-tab-agent-activity'

/** Render one activity state through the production leading-icon component. */
function renderActivity(state: TerminalTabAgentActivityState): string {
  return renderToStaticMarkup(
    <TerminalTabLeadingIcon
      agent="codex"
      agentActivityState={state}
      shell={undefined}
      showUnreadActivity={false}
      isActive={false}
    />
  )
}

describe('TerminalTabLeadingIcon', () => {
  it('shows a working spinner beside the provider icon', () => {
    const markup = renderActivity('working')

    expect(markup).toContain('data-testid="tab-agent-activity-indicator"')
    expect(markup).toContain('data-agent-activity-state="working"')
    expect(markup).toContain('aria-label="Working"')
    expect(markup).toContain('[animation:spin_1s_steps(12,end)_infinite]')
    expect(markup).toContain('data-agent-icon="codex"')
  })

  it('shows completion as an emerald check', () => {
    const markup = renderActivity('done')

    expect(markup).toContain('data-agent-activity-state="done"')
    expect(markup).toContain('lucide-circle-check')
    expect(markup).toContain('text-emerald-500')
    expect(markup).toContain('data-agent-icon="codex"')
  })

  it('shows waiting and blocked states as amber needs-attention dots', () => {
    expect(renderActivity('waiting')).toContain('bg-amber-500')
    expect(renderActivity('blocked')).toContain('bg-amber-500')
    expect(renderActivity('waiting')).not.toContain('bg-red-500')
  })

  it('shows an interrupted state as a red dot', () => {
    const markup = renderActivity('interrupted')

    expect(markup).toContain('data-agent-activity-state="interrupted"')
    expect(markup).toContain('bg-red-500')
    expect(markup).not.toContain('bg-amber-500')
  })

  it('keeps the unread bell in the icon slot after an unvisited completion', () => {
    const markup = renderToStaticMarkup(
      <TerminalTabLeadingIcon
        agent="codex"
        agentActivityState="done"
        shell={undefined}
        showUnreadActivity={true}
        isActive={false}
      />
    )

    expect(markup).toContain('data-testid="tab-activity-bell"')
    expect(markup).toContain('aria-label="Unread agent completion"')
    expect(markup).toContain('data-agent-icon="codex"')
    expect(markup).not.toContain('data-testid="tab-agent-activity-indicator"')
  })
})
