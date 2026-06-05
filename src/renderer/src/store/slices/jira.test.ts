import { beforeEach, describe, expect, it, vi } from 'vitest'
import { create } from 'zustand'
import type { AppState } from '../types'
import type { JiraIssue } from '../../../../shared/types'
import { credentialDecryptionMessage } from '../../../../shared/integration-credential-errors'
import { createJiraSlice } from './jira'

const jiraGetIssue = vi.fn()
const jiraListIssues = vi.fn()
const jiraSearchIssues = vi.fn()

vi.mock('@/runtime/runtime-jira-client', () => ({
  jiraConnect: vi.fn(),
  jiraDisconnect: vi.fn(),
  jiraGetIssue: (...args: unknown[]) => jiraGetIssue(...args),
  jiraListIssues: (...args: unknown[]) => jiraListIssues(...args),
  jiraSearchIssues: (...args: unknown[]) => jiraSearchIssues(...args),
  jiraSelectSite: vi.fn(),
  jiraStatus: vi.fn(),
  jiraTestConnection: vi.fn()
}))

function createTestStore() {
  return create<AppState>()(
    (...a) =>
      ({
        settings: null,
        ...createJiraSlice(...a)
      }) as AppState
  )
}

function issue(key: string): JiraIssue {
  return {
    id: key,
    key,
    title: key,
    url: `https://example.atlassian.net/browse/${key}`,
    siteId: 'site-1',
    siteName: 'Example Jira',
    project: { id: '10000', key: 'ALP', name: 'Alpha', siteId: 'site-1' },
    issueType: { id: '10001', name: 'Bug' },
    status: { id: '1', name: 'Todo', categoryKey: 'new', categoryName: 'To Do' },
    labels: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  }
}

describe('createJiraSlice credential errors', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('serves fresh Jira cache without reading credentials', async () => {
    const store = createTestStore()
    store.setState({
      jiraStatus: { connected: true, viewer: null, selectedSiteId: 'site-1' },
      jiraSearchCache: {
        'site-1::list::assigned::30': { data: [issue('ALP-1')], fetchedAt: Date.now() }
      }
    })

    await expect(store.getState().listJiraIssues('assigned', 30)).resolves.toMatchObject([
      { key: 'ALP-1' }
    ])

    expect(jiraListIssues).not.toHaveBeenCalled()
  })

  it('rejects Jira decrypt errors on cache miss instead of returning an empty list', async () => {
    const store = createTestStore()
    const error = new Error(credentialDecryptionMessage('Jira'))
    store.setState({
      jiraStatus: { connected: true, viewer: null, selectedSiteId: 'site-1' }
    })
    jiraSearchIssues.mockRejectedValueOnce(error)

    await expect(store.getState().searchJiraIssues('project = ALP', 30)).rejects.toThrow(
      error.message
    )
  })

  it('rejects Jira decrypt errors on stale detail refresh instead of returning null', async () => {
    const store = createTestStore()
    const error = new Error(credentialDecryptionMessage('Jira'))
    store.setState({
      jiraStatus: { connected: true, viewer: null, selectedSiteId: 'site-1' },
      jiraIssueCache: {
        'site-1::ALP-1': { data: issue('ALP-1'), fetchedAt: 1 }
      }
    })
    jiraGetIssue.mockRejectedValueOnce(error)

    await expect(store.getState().fetchJiraIssue('ALP-1', 'site-1')).rejects.toThrow(error.message)
  })
})
