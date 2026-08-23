export type RuntimeUploadProgressReport = { sentBytes: number; totalBytes: number }

export type RuntimeUploadProgressTracker = {
  /** Bytes of the file currently in flight that have reached the runtime. */
  reportFileProgress: (sentBytes: number) => void
  /** Called once a file is committed, so its bytes move from in-flight to done. */
  completeFile: (byteLength: number) => void
}

/**
 * Turn per-file byte counts into one figure for a whole drop.
 *
 * Files upload strictly one at a time, so "in flight" is always a single file and
 * the running total is simply the committed files plus that file's progress.
 * Directory entries carry no bytes and are deliberately absent from the total —
 * they would otherwise stall the bar at each `createDirNoClobber`.
 */
export function createRuntimeUploadProgressTracker(
  totalBytes: number,
  report: (progress: RuntimeUploadProgressReport) => void
): RuntimeUploadProgressTracker {
  let completedBytes = 0
  let inFlightBytes = 0
  let lastReported = -1

  const emit = (): void => {
    // Why: a source can grow between staging and upload, so the sum of what
    // actually moved may exceed the total staging measured.
    const sentBytes = Math.min(completedBytes + inFlightBytes, totalBytes)
    if (sentBytes === lastReported) {
      return
    }
    lastReported = sentBytes
    report({ sentBytes, totalBytes })
  }

  return {
    reportFileProgress: (sentBytes) => {
      inFlightBytes = sentBytes
      emit()
    },
    completeFile: (byteLength) => {
      completedBytes += byteLength
      inFlightBytes = 0
      emit()
    }
  }
}

/** Total bytes a staged drop will move; directory entries contribute nothing. */
export function sumStagedUploadBytes(
  sources: { status: string; entries?: { kind: string; byteLength?: number }[] }[]
): number {
  let total = 0
  for (const source of sources) {
    if (source.status !== 'staged') {
      continue
    }
    for (const entry of source.entries ?? []) {
      if (entry.kind === 'file') {
        total += entry.byteLength ?? 0
      }
    }
  }
  return total
}
