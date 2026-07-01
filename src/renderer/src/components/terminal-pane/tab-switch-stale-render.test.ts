/**
 * @vitest-environment happy-dom
 *
 * Reproduction: switching between terminal *tabs* inside one worktree (the light
 * resume path) leaves the returned tab rendered garbled — overlapping glyphs
 * from output that streamed while it was hidden — until a manual scroll forces a
 * repaint.
 *
 * Companion to worktree-switch-stale-render.test.ts (#6849), which covers the
 * worktree-switch *heavy* path. #6849 explicitly does not run on the intra-
 * worktree tab-switch path; this guards that remaining case.
 *
 * Root cause hypothesis (pinned here):
 * An intra-worktree tab switch keeps the hidden tab mounted with its renderer
 * attached and only toggles the overlay. On return, #6041 re-fits the overlay
 * via SYNC_FIT_PANES_EVENT, but safeFit() early-returns without painting when
 * the container dimensions are unchanged (proposeDimensions === current
 * cols/rows — the common case across a tab switch). The light resume path itself
 * never calls fit() or resumeRendering(), so nothing repaints the canvas: xterm
 * keeps the glyphs it accumulated while hidden until the user scrolls.
 *
 * This test drives the REAL resumeTerminalVisibility() light path and delegates
 * refreshAllPanes() to the REAL terminal.refresh(), asserting the pane is
 * repainted on resume — the regression guard for the deferred repaint added to
 * the light path.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resumeTerminalVisibility } from './terminal-visibility-resume'
import {
  registerLivePaneManager,
  unregisterLivePaneManager
} from '@/lib/pane-manager/pane-manager-registry'
import { scheduleTerminalWebglAtlasRecovery } from './terminal-webgl-atlas-recovery'

// The container/PTY size is unchanged across the tab switch, so xterm's fit
// addon would propose the same cols/rows the terminal already has.
const STEADY_COLS = 120
const STEADY_ROWS = 30

type FakeTerminal = {
  cols: number
  rows: number
  refresh: ReturnType<typeof vi.fn<(start: number, end: number) => void>>
  focus: ReturnType<typeof vi.fn<() => void>>
}

type FakePane = {
  id: number
  // DOM-renderer pane: GPU rendering off, no WebGL addon attached.
  gpuRenderingEnabled: boolean
  webglAddon: null
  webglAttachmentDeferred: boolean
  webglDisabledAfterContextLoss: boolean
  terminal: FakeTerminal
  container: { getBoundingClientRect: () => { width: number; height: number } }
  fitAddon: {
    proposeDimensions: () => { cols: number; rows: number }
    fit: ReturnType<typeof vi.fn>
  }
}

function makeDomRendererPane(id: number): FakePane {
  const terminal: FakeTerminal = {
    cols: STEADY_COLS,
    rows: STEADY_ROWS,
    refresh: vi.fn(),
    focus: vi.fn()
  }
  return {
    id,
    gpuRenderingEnabled: false,
    webglAddon: null,
    webglAttachmentDeferred: false, // tab-hidden panes keep WebGL attached
    webglDisabledAfterContextLoss: false,
    terminal,
    container: { getBoundingClientRect: () => ({ width: 800, height: 480 }) },
    fitAddon: {
      proposeDimensions: () => ({ cols: STEADY_COLS, rows: STEADY_ROWS }),
      fit: vi.fn()
    }
  }
}

function makeManager(panes: FakePane[]) {
  return {
    panes,
    getPanes: () => panes,
    getActivePane: () => panes[0] ?? null,
    refreshAllPanes: () => {
      for (const pane of panes) {
        pane.terminal.refresh(0, pane.terminal.rows - 1)
      }
    },
    // Light resume never calls these, but a real manager exposes them.
    fitAllPanes: vi.fn(),
    resumeRendering: vi.fn(),
    suspendRendering: vi.fn(),
    resetWebglTextureAtlases: vi.fn()
  }
}

describe('tab switch resume (intra-worktree light path)', () => {
  const registered: { resetWebglTextureAtlases(): void }[] = []

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    // The light repaint is deferred to the next animation frame; run it
    // synchronously so the assertion observes the refresh.
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn((callback: FrameRequestCallback) => {
        callback(0)
        return 1
      })
    )
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    for (const manager of registered.splice(0)) {
      unregisterLivePaneManager(manager)
    }
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('repaints the returned tab on light resume even when dimensions are unchanged', () => {
    const pane = makeDomRendererPane(1)
    const manager = makeManager([pane])
    registerLivePaneManager(manager as never)
    registered.push(manager as never)

    // Intra-worktree tab switch: the worktree stayed active and the pane was
    // only hidden behind a sibling tab (hidden reason 'tab', rendering not
    // suspended), so the caller selects the light resume path.
    resumeTerminalVisibility({
      manager: manager as never,
      isActive: true,
      wasVisible: true,
      shouldUseLightTabResume: true,
      captureViewportPositions: () => new Map(),
      withSuppressedScrollTracking: (cb) => cb()
    })

    // The light path never fits — geometry recovery is the overlay's job — so a
    // tab returned at unchanged size would otherwise show its stale buffer.
    expect(pane.fitAddon.fit).not.toHaveBeenCalled()
    expect(manager.fitAllPanes).not.toHaveBeenCalled()

    // The fix forces a repaint on resume regardless of whether geometry changed,
    // so the returned tab renders correctly without the manual scroll the user
    // reported.
    expect(pane.terminal.refresh).toHaveBeenCalled()
  })

  it('repaints on light resume even when atlas recovery is already coalesced', () => {
    const pane = makeDomRendererPane(1)
    const manager = makeManager([pane])
    registerLivePaneManager(manager as never)
    registered.push(manager as never)

    // Renderer-risk output can schedule atlas recovery before the hidden tab is
    // shown again. The light resume path still needs its own visible repaint
    // because the coalesced recovery call is a no-op while the burst is active.
    scheduleTerminalWebglAtlasRecovery()
    expect(pane.terminal.refresh).toHaveBeenCalledTimes(1)
    pane.terminal.refresh.mockClear()

    resumeTerminalVisibility({
      manager: manager as never,
      isActive: true,
      wasVisible: true,
      shouldUseLightTabResume: true,
      captureViewportPositions: () => new Map(),
      withSuppressedScrollTracking: (cb) => cb()
    })

    expect(pane.terminal.refresh).toHaveBeenCalledTimes(1)
  })
})
