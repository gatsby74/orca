// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  applyDomBlockFills,
  attachDomBlockFill,
  backgroundImageForUniformBlockRun
} from './terminal-dom-block-fill'

describe('backgroundImageForUniformBlockRun', () => {
  it('fills the top half of the cell for a run of upper-half blocks', () => {
    expect(backgroundImageForUniformBlockRun('▀▀▀')).toBe(
      'linear-gradient(to bottom, var(--orca-block-fg) 50%, transparent 50%)'
    )
  })

  it('fills the bottom half of the cell for lower-half blocks', () => {
    expect(backgroundImageForUniformBlockRun('▄▄')).toBe(
      'linear-gradient(to bottom, transparent 50%, var(--orca-block-fg) 50%)'
    )
  })

  it('fills the whole cell for full blocks', () => {
    expect(backgroundImageForUniformBlockRun('█')).toBe(
      'linear-gradient(to bottom, transparent 0%, var(--orca-block-fg) 0%)'
    )
  })

  it('fills the left half for left-half blocks', () => {
    expect(backgroundImageForUniformBlockRun('▌')).toBe(
      'linear-gradient(to right, var(--orca-block-fg) 50%, transparent 50%)'
    )
  })

  it('fills the right half for right-half blocks', () => {
    expect(backgroundImageForUniformBlockRun('▐')).toBe(
      'linear-gradient(to right, transparent 50%, var(--orca-block-fg) 50%)'
    )
  })

  it('skips mixed runs, spaces, and ASCII', () => {
    expect(backgroundImageForUniformBlockRun('▀█')).toBeNull()
    expect(backgroundImageForUniformBlockRun('▀ ▀')).toBeNull()
    expect(backgroundImageForUniformBlockRun('Ask')).toBeNull()
    expect(backgroundImageForUniformBlockRun('')).toBeNull()
  })
})

describe('applyDomBlockFills', () => {
  afterEach(() => {
    document.body.replaceChildren()
  })

  function mountSpan(text: string, color = 'rgb(30, 30, 30)'): HTMLSpanElement {
    const rows = document.createElement('div')
    rows.className = 'xterm-rows'
    const span = document.createElement('span')
    span.textContent = text
    span.style.color = color
    span.style.backgroundColor = 'rgb(10, 10, 10)'
    rows.appendChild(span)
    document.body.appendChild(rows)
    return span
  }

  it('paints a uniform ▀ composer border with a cell-filling gradient', () => {
    const span = mountSpan('▀'.repeat(12))

    applyDomBlockFills(document)

    expect(span.style.color).toBe('transparent')
    expect(span.style.backgroundImage).toContain('linear-gradient(to bottom')
    expect(span.style.getPropertyValue('--orca-block-fg')).toBe('rgb(30, 30, 30)')
  })

  it('does not restyle mixed block/letter spans', () => {
    const span = mountSpan('▀▀█ Ask')
    applyDomBlockFills(document)
    expect(span.style.color).toBe('rgb(30, 30, 30)')
    expect(span.style.backgroundImage).toBe('')
  })

  it('clears a previous fill when the span is reused for ordinary text', () => {
    const span = mountSpan('▀▀▀')
    applyDomBlockFills(document)
    span.textContent = 'tab agents'
    applyDomBlockFills(document)
    expect(span.style.backgroundImage).toBe('')
    expect(span.style.color).toBe('rgb(30, 30, 30)')
  })
})

describe('attachDomBlockFill', () => {
  it('applies fills after onRender and disposes the listener', () => {
    const rows = document.createElement('div')
    rows.className = 'xterm-rows'
    const span = document.createElement('span')
    span.textContent = '▀▀'
    span.style.color = 'rgb(1, 2, 3)'
    rows.appendChild(span)
    const element = document.createElement('div')
    element.appendChild(rows)

    let render: (() => void) | undefined
    const dispose = vi.fn()
    const terminal = {
      element,
      onRender: (cb: () => void) => {
        render = cb
        return { dispose }
      }
    }

    const detach = attachDomBlockFill(terminal)
    render?.()
    expect(span.style.color).toBe('transparent')
    detach()
    expect(dispose).toHaveBeenCalledTimes(1)
  })
})
