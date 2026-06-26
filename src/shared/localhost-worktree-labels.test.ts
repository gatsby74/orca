import { describe, expect, it } from 'vitest'
import {
  getLocalhostWorktreeHostLabel,
  slugifyLocalhostWorktreeLabel
} from './localhost-worktree-labels'

describe('localhost worktree labels', () => {
  it('uses project-main for the primary worktree', () => {
    expect(
      getLocalhostWorktreeHostLabel({
        projectName: 'Snap Studio',
        worktreeName: 'main'
      })
    ).toBe('snap-studio-main')
  })

  it('keeps non-main worktree labels short', () => {
    expect(
      getLocalhostWorktreeHostLabel({
        projectName: 'Snap Studio',
        worktreeName: 'analytics'
      })
    ).toBe('analytics')
  })

  it('uses the worktree folder name over branch owner prefixes for non-main labels', () => {
    expect(
      getLocalhostWorktreeHostLabel({
        projectName: 'Snap Studio',
        worktreeName: 'gatsby74/table-summary',
        worktreePath: '/Users/example/orca/workspaces/snapstudio/ui-auth'
      })
    ).toBe('ui-auth')
  })

  it('normalizes labels for localhost hostnames', () => {
    expect(slugifyLocalhostWorktreeLabel(' Drive DB Mismatch! ')).toBe('drive-db-mismatch')
  })
})
