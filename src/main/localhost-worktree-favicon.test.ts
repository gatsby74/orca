import { describe, expect, it } from 'vitest'
import {
  getLocalhostWorktreeFaviconHue,
  getLocalhostWorktreeFaviconIco,
  getLocalhostWorktreeFaviconSvg
} from './localhost-worktree-favicon'

describe('localhost worktree favicon', () => {
  it('derives a stable hue from the label', () => {
    const first = getLocalhostWorktreeFaviconHue('analytics')
    const second = getLocalhostWorktreeFaviconHue('analytics')

    expect(first).toBe(second)
    expect(first).toBeGreaterThanOrEqual(0)
    expect(first).toBeLessThan(360)
    expect(first % 30).toBe(0)
  })

  it('gives different labels different hues', () => {
    // Deterministic sanity check: these known labels land on distinct wheel slots.
    expect(getLocalhostWorktreeFaviconHue('analytics')).not.toBe(
      getLocalhostWorktreeFaviconHue('snapstudio-main')
    )
  })

  it('renders an svg disc with the uppercased label initial', () => {
    const svg = getLocalhostWorktreeFaviconSvg('analytics')

    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"')
    expect(svg).toContain('<circle')
    expect(svg).toContain('>A</text>')
    expect(svg).toContain(`hsl(${getLocalhostWorktreeFaviconHue('analytics')} 68% 46%)`)
  })

  it('builds a structurally valid deterministic 32x32 ico', () => {
    const ico = getLocalhostWorktreeFaviconIco('analytics')

    expect(ico.equals(getLocalhostWorktreeFaviconIco('analytics'))).toBe(true)
    expect(ico.readUInt16LE(0)).toBe(0) // reserved
    expect(ico.readUInt16LE(2)).toBe(1) // icon type
    expect(ico.readUInt16LE(4)).toBe(1) // image count
    expect(ico.readUInt8(6)).toBe(32) // width
    expect(ico.readUInt8(7)).toBe(32) // height
    expect(ico.readUInt16LE(12)).toBe(32) // bits per pixel
    expect(ico.readUInt32LE(18)).toBe(22) // bitmap offset
    expect(ico.readUInt32LE(22)).toBe(40) // BITMAPINFOHEADER size
    expect(ico.readInt32LE(30)).toBe(64) // doubled height (color + AND mask)
    // Total size = headers + declared bitmap byte count.
    expect(ico.length).toBe(22 + ico.readUInt32LE(14))
  })

  it('fills the disc center opaque and the corners transparent', () => {
    const ico = getLocalhostWorktreeFaviconIco('analytics')
    const pixelStart = 22 + 40
    const alphaAt = (x: number, y: number): number =>
      ico.readUInt8(pixelStart + ((31 - y) * 32 + x) * 4 + 3)

    expect(alphaAt(16, 16)).toBe(255)
    expect(alphaAt(0, 0)).toBe(0)
    expect(alphaAt(31, 31)).toBe(0)
  })
})
