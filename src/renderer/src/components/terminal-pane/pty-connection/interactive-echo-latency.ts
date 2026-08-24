// Why: the interactive-redraw windows are calibrated against local echo (2ms plain
// shell, ~22ms Codex composer). On a remote runtime the echo cannot arrive before one
// round trip, so a fixed window silently stops recognizing the user's own typing above
// ~150ms RTT and drops repaints into the 250ms/1000ms fallback lane (#16265). Measuring
// the pane's own input -> first-output delay lets the same windows widen by exactly what
// the link costs, and leaves local panes untouched because their allowance is ~0.

/** Beyond this a chunk is agent work, not an echo, so it must not inflate the estimate. */
const MAX_ECHO_LATENCY_SAMPLE_MS = 2_000
/** Caps how far a slow link may widen the windows, bounding over-classification. */
export const MAX_ECHO_LATENCY_ALLOWANCE_MS = 500
const ECHO_LATENCY_SAMPLE_COUNT = 8

export type InteractiveEchoLatencyTracker = {
  recordInput: (now: number) => void
  recordOutput: (now: number) => void
  /** Milliseconds to add to a base interactivity window; 0 until a sample exists. */
  allowanceMs: () => number
}

export function createInteractiveEchoLatencyTracker(): InteractiveEchoLatencyTracker {
  const samples: number[] = []
  let pendingInputAt: number | null = null

  return {
    recordInput(now: number): void {
      // Why earliest-unmatched: echo is pipelined, so the chunk arriving now answers the
      // oldest keystroke still outstanding. Measuring from the newest one underestimates.
      pendingInputAt ??= now
    },
    recordOutput(now: number): void {
      if (pendingInputAt === null) {
        return
      }
      const sample = now - pendingInputAt
      pendingInputAt = null
      if (!Number.isFinite(sample) || sample < 0 || sample > MAX_ECHO_LATENCY_SAMPLE_MS) {
        return
      }
      samples.push(sample)
      if (samples.length > ECHO_LATENCY_SAMPLE_COUNT) {
        samples.shift()
      }
    },
    allowanceMs(): number {
      if (samples.length === 0) {
        return 0
      }
      // Median, not mean: one stalled chunk must not widen the window for the rest.
      const ordered = [...samples].sort((first, second) => first - second)
      const median = ordered[Math.floor(ordered.length / 2)] ?? 0
      return Math.min(median, MAX_ECHO_LATENCY_ALLOWANCE_MS)
    }
  }
}
