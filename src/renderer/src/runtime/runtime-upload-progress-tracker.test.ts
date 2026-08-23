import { describe, expect, it } from 'vitest'
import {
  createRuntimeUploadProgressTracker,
  sumSourceUploadBytes
} from './runtime-upload-progress-tracker'

describe('sumSourceUploadBytes', () => {
  it('counts file bytes and ignores directory entries', () => {
    expect(
      sumSourceUploadBytes({
        entries: [
          { kind: 'directory' },
          { kind: 'file', byteLength: 10 },
          { kind: 'directory' },
          { kind: 'file', byteLength: 32 }
        ]
      })
    ).toBe(42)
  })

  it('is zero for a source of only empty files', () => {
    expect(sumSourceUploadBytes({ entries: [{ kind: 'file', byteLength: 0 }] })).toBe(0)
  })

  it('is zero for a source with no entries at all', () => {
    expect(sumSourceUploadBytes({})).toBe(0)
  })
})

describe('createRuntimeUploadProgressTracker', () => {
  it('carries completed files into the running total', () => {
    const seen: number[] = []
    const tracker = createRuntimeUploadProgressTracker(300, (p) => seen.push(p.sentBytes))

    tracker.reportFileProgress(50)
    tracker.reportFileProgress(100)
    tracker.completeFile(100)
    tracker.reportFileProgress(75)

    expect(seen).toEqual([50, 100, 175])
  })

  it('reports the same total on every update', () => {
    const totals: number[] = []
    const tracker = createRuntimeUploadProgressTracker(500, (p) => totals.push(p.totalBytes))

    tracker.reportFileProgress(10)
    // completeFile does not re-emit: the figure has not moved.
    tracker.completeFile(10)
    tracker.reportFileProgress(20)

    expect(totals).toEqual([500, 500])
  })

  it('does not repeat a figure that has not moved', () => {
    const seen: number[] = []
    const tracker = createRuntimeUploadProgressTracker(100, (p) => seen.push(p.sentBytes))

    tracker.reportFileProgress(40)
    tracker.reportFileProgress(40)
    tracker.completeFile(40)

    expect(seen).toEqual([40])
  })

  it('clamps to the staged total when a source grew after staging', () => {
    const seen: number[] = []
    const tracker = createRuntimeUploadProgressTracker(100, (p) => seen.push(p.sentBytes))

    tracker.reportFileProgress(250)

    expect(seen).toEqual([100])
  })

  it('advances across a directory of several files', () => {
    const seen: number[] = []
    const tracker = createRuntimeUploadProgressTracker(30, (p) => seen.push(p.sentBytes))

    for (const size of [10, 10, 10]) {
      tracker.reportFileProgress(size)
      tracker.completeFile(size)
    }

    expect(seen).toEqual([10, 20, 30])
  })

  it('emits nothing until bytes move', () => {
    const seen: number[] = []
    createRuntimeUploadProgressTracker(100, (p) => seen.push(p.sentBytes))

    expect(seen).toEqual([])
  })
})
