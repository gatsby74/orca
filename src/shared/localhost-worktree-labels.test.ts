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

  it('normalizes labels for localhost hostnames', () => {
    expect(slugifyLocalhostWorktreeLabel(' Drive DB Mismatch! ')).toBe('drive-db-mismatch')
  })
})
