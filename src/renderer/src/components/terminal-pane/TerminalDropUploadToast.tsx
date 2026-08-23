import { useState, useSyncExternalStore } from 'react'
import { ChevronDownIcon, ChevronUpIcon, FileIcon, UploadIcon, XIcon } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { translate } from '@/i18n/i18n'
import {
  getRuntimeUploadSession,
  subscribeToRuntimeUploadSessions,
  summarizeRuntimeUploadSession,
  type RuntimeUploadRow
} from '@/runtime/runtime-upload-session-state'
import { formatTransferredOfTotal, toPercent } from './terminal-drop-upload-progress'

type Props = {
  sessionId: string
  onCancel: (uploadId: string) => void
}

export function TerminalDropUploadToast({ sessionId, onCancel }: Props): React.JSX.Element | null {
  const session = useSyncExternalStore(subscribeToRuntimeUploadSessions, () =>
    getRuntimeUploadSession(sessionId)
  )
  const [collapsed, setCollapsed] = useState(false)

  // createElement at the call site still yields a valid element, so rendering
  // nothing here is safe once the session has ended.
  if (!session) {
    return null
  }
  const summary = summarizeRuntimeUploadSession(session)
  const heading = translate(
    'auto.components.terminal.pane.terminal.drop.upload.heading',
    'Uploading {{value0}} file{{value1}}',
    { value0: session.rows.length, value1: session.rows.length === 1 ? '' : 's' }
  )

  return (
    <div className="w-full overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
      <div className="flex items-center gap-3 px-3 py-2.5">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border">
          <UploadIcon className="size-3.5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm">{heading}</span>
        {/* Fixed width so the row never reflows as the number gains digits. */}
        <span className="w-9 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
          {summary.percent}%
        </span>
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-expanded={!collapsed}
          aria-label={
            collapsed
              ? translate('auto.components.terminal.pane.terminal.drop.upload.expand', 'Show files')
              : translate(
                  'auto.components.terminal.pane.terminal.drop.upload.collapse',
                  'Hide files'
                )
          }
          className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {collapsed ? (
            <ChevronDownIcon className="size-4" />
          ) : (
            <ChevronUpIcon className="size-4" />
          )}
        </button>
      </div>
      {!collapsed && (
        <ul className="border-t border-border">
          {session.rows.map((row) => (
            <UploadRowItem key={row.uploadId} row={row} onCancel={onCancel} />
          ))}
        </ul>
      )}
    </div>
  )
}

function UploadRowItem({
  row,
  onCancel
}: {
  row: RuntimeUploadRow
  onCancel: (uploadId: string) => void
}): React.JSX.Element {
  const percent = toPercent(row.sentBytes, row.totalBytes)
  const inactive = row.status !== 'uploading'

  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      <FileIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={cn('truncate text-[13px]', inactive && 'text-muted-foreground')}>
          {row.name}
        </span>
        <span className="truncate text-xs text-muted-foreground tabular-nums">
          {rowSubLabel(row)}
        </span>
      </span>
      <Progress
        value={percent}
        aria-label={row.name}
        className={cn('h-1.5 w-24 shrink-0', inactive && 'opacity-40')}
      />
      <span className="w-9 shrink-0 text-right text-[13px] tabular-nums text-muted-foreground">
        {percent}%
      </span>
      {/* Cancel is a back-out, not a destructive action: ghost, no color. */}
      <button
        type="button"
        disabled={inactive}
        onClick={() => onCancel(row.uploadId)}
        aria-label={translate(
          'auto.components.terminal.pane.terminal.drop.upload.cancel',
          'Cancel upload'
        )}
        className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-0"
      >
        <XIcon className="size-4" />
      </button>
    </li>
  )
}

function rowSubLabel(row: RuntimeUploadRow): string {
  if (row.status === 'cancelled') {
    return translate('auto.components.terminal.pane.terminal.drop.upload.cancelled', 'Cancelled')
  }
  if (row.status === 'failed') {
    return translate('auto.components.terminal.pane.terminal.drop.upload.failed', 'Failed')
  }
  return formatTransferredOfTotal(row.sentBytes, row.totalBytes)
}
