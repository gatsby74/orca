import { describe, expect, it } from 'vitest'
import { formatTerminalDropUploadProgress } from './terminal-drop-upload-progress'

describe('formatTerminalDropUploadProgress', () => {
  it('shows moved bytes, total and percent', () => {
    const label = formatTerminalDropUploadProgress(1, 10 * 1024 * 1024, 40 * 1024 * 1024)
    expect(label).toContain('10.0 MB')
    expect(label).toContain('40.0 MB')
    expect(label).toContain('25%')
  })

  it('pluralises the file count', () => {
    expect(formatTerminalDropUploadProgress(1, 0, 100)).toContain('1 file')
    expect(formatTerminalDropUploadProgress(3, 0, 100)).toContain('3 files')
  })

  it('omits the byte figures for a drop with no measurable size', () => {
    const label = formatTerminalDropUploadProgress(1, 0, 0)
    expect(label).not.toContain('0 B')
    expect(label).not.toContain('%')
  })

  it('never rounds up to 100% before the last byte lands', () => {
    expect(formatTerminalDropUploadProgress(1, 999_999, 1_000_000)).toContain('99%')
  })

  it('reaches 100% when everything has moved', () => {
    expect(formatTerminalDropUploadProgress(1, 1_000, 1_000)).toContain('100%')
  })
})
