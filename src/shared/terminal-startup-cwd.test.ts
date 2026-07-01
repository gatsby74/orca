import { describe, expect, it } from 'vitest'
import { resolveTerminalStartupCwd } from './terminal-startup-cwd'

describe('resolveTerminalStartupCwd', () => {
  it('accepts absolute child paths inside the worktree', () => {
    expect(resolveTerminalStartupCwd('/repo/app', '/repo/app/packages/web')).toBe(
      '/repo/app/packages/web'
    )
  })

  it('resolves relative paths against the worktree', () => {
    expect(resolveTerminalStartupCwd('/repo/app', 'packages/web')).toBe('/repo/app/packages/web')
  })

  it('rejects sibling paths outside the worktree', () => {
    expect(() => resolveTerminalStartupCwd('/repo/app', '/repo/app-other')).toThrow(
      'Terminal cwd must be inside the selected worktree.'
    )
  })

  it('rejects parent traversal outside the worktree', () => {
    expect(() => resolveTerminalStartupCwd('/repo/app', '../other')).toThrow(
      'Terminal cwd must be inside the selected worktree.'
    )
  })

  it('handles Windows path containment without case drift', () => {
    expect(resolveTerminalStartupCwd('C:\\Repo\\App', 'packages\\web')).toBe(
      'C:/Repo/App/packages/web'
    )
    expect(() => resolveTerminalStartupCwd('C:\\Repo\\App', 'C:\\Repo\\AppOther')).toThrow(
      'Terminal cwd must be inside the selected worktree.'
    )
  })
})
