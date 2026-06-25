import { useState } from 'react'
import { CornerDownLeft } from 'lucide-react'
import type { DiffCommentReply } from '../../../../shared/types'
import { translate } from '@/i18n/i18n'

type RichMarkdownReviewNoteThreadProps = {
  replies: readonly DiffCommentReply[]
  onAddReply: (body: string) => Promise<void>
  onContentResize: () => void
}

export function RichMarkdownReviewNoteThread({
  replies,
  onAddReply,
  onContentResize
}: RichMarkdownReviewNoteThreadProps): React.JSX.Element {
  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const trimmed = draft.trim()

  const submit = async (): Promise<void> => {
    if (!trimmed || submitting) {
      return
    }
    setSubmitting(true)
    try {
      await onAddReply(trimmed)
      setDraft('')
      // Why: a sent reply shrinks the input back to one row, so re-measure the
      // Monaco view zone height the same way the edit textarea does.
      onContentResize()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rich-markdown-review-thread">
      {replies.length > 0 ? (
        <ul className="rich-markdown-review-reply-list">
          {replies.map((reply) => (
            <li
              key={reply.id}
              className={`rich-markdown-review-reply rich-markdown-review-reply--${reply.authorRole}`}
            >
              <span className="rich-markdown-review-reply-author">
                {reply.authorRole === 'agent'
                  ? translate(
                      'auto.components.editor.RichMarkdownReviewNoteThread.2bf33695c2',
                      'Agent'
                    )
                  : translate(
                      'auto.components.editor.RichMarkdownReviewNoteThread.88270bb163',
                      'You'
                    )}
              </span>
              <span className="rich-markdown-review-reply-body">{reply.body}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="rich-markdown-review-reply-compose">
        <input
          type="text"
          className="rich-markdown-review-reply-input"
          value={draft}
          placeholder={translate(
            'auto.components.editor.RichMarkdownReviewNoteThread.665b0d63d1',
            'Reply…'
          )}
          onMouseDown={(event) => event.stopPropagation()}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.nativeEvent.isComposing && !event.shiftKey) {
              event.preventDefault()
              void submit()
            }
          }}
        />
        <button
          type="button"
          className="rich-markdown-review-note-action"
          disabled={!trimmed || submitting}
          title={translate(
            'auto.components.editor.RichMarkdownReviewNoteThread.4994dba39d',
            'Send reply'
          )}
          aria-label={translate(
            'auto.components.editor.RichMarkdownReviewNoteThread.4994dba39d',
            'Send reply'
          )}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={() => void submit()}
        >
          <CornerDownLeft className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
