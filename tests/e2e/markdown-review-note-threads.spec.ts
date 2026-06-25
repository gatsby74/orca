import path from 'path'
import { test, expect } from './helpers/orca-app'
import { waitForSessionReady, waitForActiveWorktree } from './helpers/store'
import {
  cleanupMarkdownFixture,
  createMarkdownFixture,
  getActiveWorktreeContext,
  openMarkdownFixture,
  waitForRichMarkdownEditor
} from './helpers/markdown-ordered-list-exit'

const FIXTURE = [
  '# Review demo',
  '',
  'This intro paragraph gets an open note with a reply thread.',
  '',
  '## Section',
  '',
  'Body content keeps the two notes vertically separated.',
  '',
  '- one',
  '- two',
  '- three',
  '',
  'More prose so the resolved note lands lower in the document and the',
  'two review cards do not overlap in the rail.',
  '',
  '## History',
  '',
  'This line gets a resolved note that stays as dimmed history.',
  ''
].join('\n')

test.describe('Markdown review note threads', () => {
  test.beforeEach(async ({ orcaPage }) => {
    await waitForSessionReady(orcaPage)
    await waitForActiveWorktree(orcaPage)
  })

  test('renders resolve toggle, reply thread, and dimmed resolved note', async ({
    orcaPage
  }, testInfo) => {
    const context = await getActiveWorktreeContext(orcaPage)
    let fixturePath: string | null = null
    try {
      fixturePath = await createMarkdownFixture(
        context,
        'review-threads',
        testInfo.workerIndex,
        FIXTURE
      )
      await openMarkdownFixture(orcaPage, context, fixturePath)
      await waitForRichMarkdownEditor(orcaPage)

      const relativePath = path.relative(context.rootPath, fixturePath).split(path.sep).join('/')

      // Seed two markdown notes, a reply thread on the first, and resolve the second.
      await orcaPage.evaluate(
        async ({ worktreeId, relativePath }) => {
          const store = window.__store
          if (!store) {
            throw new Error('window.__store is not available')
          }
          const api = store.getState()
          const open = await api.addDiffComment({
            worktreeId,
            filePath: relativePath,
            source: 'markdown',
            lineNumber: 3,
            body: 'Can we tighten this intro?',
            side: 'modified'
          })
          if (open) {
            await store.getState().addDiffCommentReply(worktreeId, open.id, {
              body: 'Reworded it — better?',
              authorRole: 'agent'
            })
            await store
              .getState()
              .addDiffCommentReply(worktreeId, open.id, {
                body: 'Yes, ship it',
                authorRole: 'user'
              })
          }
          const resolved = await store.getState().addDiffComment({
            worktreeId,
            filePath: relativePath,
            source: 'markdown',
            lineNumber: 19,
            body: 'Confirmed history line.',
            side: 'modified'
          })
          if (resolved) {
            await store.getState().resolveDiffComment(worktreeId, resolved.id, true)
          }
        },
        { worktreeId: context.worktreeId, relativePath }
      )

      // Open the review rail so the note layer mounts.
      const railToggle = orcaPage.locator('.rich-markdown-review-rail-toggle').first()
      await expect(railToggle, 'review rail toggle did not appear').toBeVisible({ timeout: 15_000 })
      await railToggle.click()

      const cards = orcaPage.locator('.rich-markdown-review-note-card')
      await expect(cards.first(), 'review note cards did not render').toBeVisible({
        timeout: 15_000
      })
      await expect(cards).toHaveCount(2)

      // The new affordances exist: resolve/reopen control + a reply input.
      await expect(orcaPage.getByTitle('Resolve note').first()).toBeVisible()
      await expect(orcaPage.getByTitle('Reopen note').first()).toBeVisible()
      await expect(orcaPage.locator('.rich-markdown-review-reply-input').first()).toBeVisible()
      await expect(orcaPage.locator('.rich-markdown-review-reply-body').first()).toHaveText(
        'Reworded it — better?'
      )
      await expect(orcaPage.locator('.rich-markdown-review-note-card.is-resolved')).toHaveCount(1)

      await orcaPage.screenshot({
        path: testInfo.outputPath('markdown-review-note-threads.png'),
        fullPage: false
      })
      await testInfo.attach('markdown-review-note-threads', {
        path: testInfo.outputPath('markdown-review-note-threads.png'),
        contentType: 'image/png'
      })
    } finally {
      await cleanupMarkdownFixture(fixturePath)
    }
  })
})
