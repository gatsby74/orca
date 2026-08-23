import { formatBytes } from '../status-bar/workspace-space-format'
import { translate } from '@/i18n/i18n'

/**
 * Label for the in-place drop toast while bytes are moving.
 *
 * Falls back to the plain "uploading" wording when the drop has no measurable
 * size — an empty file, or a folder of empty files — because "0 B of 0 B" reads
 * like a failure rather than a fast success.
 */
export function formatTerminalDropUploadProgress(
  fileCount: number,
  sentBytes: number,
  totalBytes: number
): string {
  const uploading = translate(
    'auto.components.terminal.pane.terminal.drop.handler.29c031b49a',
    'Uploading {{value0}} file{{value1}} to runtime…',
    { value0: fileCount, value1: fileCount === 1 ? '' : 's' }
  )
  if (totalBytes <= 0) {
    return uploading
  }
  const percent = Math.min(100, Math.floor((sentBytes / totalBytes) * 100))
  return `${uploading} ${formatBytes(sentBytes)} / ${formatBytes(totalBytes)} (${percent}%)`
}
