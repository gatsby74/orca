import { randomUUID } from 'node:crypto'
import type { Page } from '@stablyai/playwright-test'
import { expect, test } from './helpers/orca-app'
import { parkHiddenTabBehindDecoy } from './helpers/terminal-hidden-parking'
import {
  ensureTerminalVisible,
  getActiveTabId,
  waitForActiveWorktree,
  waitForSessionReady
} from './helpers/store'
import {
  getTerminalContent,
  sendToTerminal,
  waitForActivePanePtyId,
  waitForActiveTerminalManager
} from './helpers/terminal'
import { waitForPtyShellEcho } from './terminal-pty-readiness'

const PARKING_DELAY_MS = Number(process.env.ORCA_E2E_TERMINAL_PARKING_DELAY_MS) || 500

test.use({
  orcaAppExtraEnv: { ORCA_E2E_TERMINAL_PARKING_DELAY_MS: String(PARKING_DELAY_MS) }
})

type LinkProbe = {
  clientX: number
  clientY: number
  tabId: string
}

async function locateLink(page: Page, label: string): Promise<LinkProbe> {
  return page.evaluate((label) => {
    const state = window.__store?.getState()
    const tabId = state?.activeTabId ?? null
    const manager = tabId ? window.__paneManagers?.get(tabId) : null
    const pane = manager?.getActivePane?.() ?? manager?.getPanes?.()[0] ?? null
    const screen = pane?.terminal.element?.querySelector<HTMLElement>('.xterm-screen')
    if (!tabId || !pane || !screen) {
      throw new Error('active terminal pane unavailable')
    }

    const buffer = pane.terminal.buffer.active
    for (let row = pane.terminal.rows - 1; row >= 0; row -= 1) {
      const line = buffer.getLine(buffer.viewportY + row)
      const col = line?.translateToString(true).lastIndexOf(label) ?? -1
      if (col >= 0) {
        const rect = screen.getBoundingClientRect()
        return {
          clientX: rect.left + (col + label.length / 2) * (rect.width / pane.terminal.cols),
          clientY: rect.top + (row + 0.5) * (rect.height / pane.terminal.rows),
          tabId
        }
      }
    }
    throw new Error('OSC 8 label not visible in terminal viewport')
  }, label)
}

async function readLinkState(
  page: Page,
  tabId: string
): Promise<{
  bufferType: string
  tooltipDisplay: string
  tooltipText: string
  underlined: boolean
}> {
  return page.evaluate((tabId) => {
    const manager = window.__paneManagers?.get(tabId)
    const pane = manager?.getActivePane?.() ?? manager?.getPanes?.()[0] ?? null
    if (!pane) {
      throw new Error('terminal pane unavailable')
    }
    const buffer = pane.terminal.buffer.active
    let underlined = false
    for (let row = buffer.viewportY; row < buffer.viewportY + pane.terminal.rows; row += 1) {
      const line = buffer.getLine(row)
      for (let col = 0; line && col < line.length; col += 1) {
        if (line.getCell(col)?.isUnderline()) {
          underlined = true
          break
        }
      }
    }
    return {
      bufferType: buffer.type,
      tooltipDisplay: pane.linkTooltip.style.display,
      tooltipText: pane.linkTooltip.textContent ?? '',
      underlined
    }
  }, tabId)
}

async function activateTerminalTab(page: Page, tabId: string): Promise<void> {
  await page.evaluate((tabId) => {
    const state = window.__store?.getState()
    if (!state) {
      throw new Error('Orca store unavailable')
    }
    state.setActiveTabType('terminal')
    state.setActiveTab(tabId)
  }, tabId)
  await expect.poll(() => getActiveTabId(page)).toBe(tabId)
  await waitForActiveTerminalManager(page, 30_000)
}

async function serializedBufferContains(
  page: Page,
  tabId: string,
  value: string
): Promise<boolean> {
  return page.evaluate(
    ({ tabId, value }) => {
      const manager = window.__paneManagers?.get(tabId)
      const pane = manager?.getActivePane?.() ?? manager?.getPanes?.()[0] ?? null
      return pane?.serializeAddon.serialize().includes(value) ?? false
    },
    { tabId, value }
  )
}

test('restores an OSC 8 hyperlink after its terminal is cold-parked', async ({ orcaPage }) => {
  await waitForSessionReady(orcaPage)
  const worktreeId = await waitForActiveWorktree(orcaPage)
  await ensureTerminalVisible(orcaPage)
  await waitForActiveTerminalManager(orcaPage, 30_000)
  const tabId = await getActiveTabId(orcaPage)
  const ptyId = await waitForActivePanePtyId(orcaPage)
  await waitForPtyShellEcho(orcaPage, ptyId, 15_000)

  const label = `#${randomUUID().slice(0, 6)}`
  const url = `https://github.com/stablyai/orca/issues/${randomUUID()}`
  await sendToTerminal(
    orcaPage,
    ptyId,
    `printf '\\033[?1049h\\033[2J\\033[H\\033]8;;${url}\\033\\\\${label}\\033]8;;\\033\\\\\\n'\r`
  )
  await expect.poll(() => getTerminalContent(orcaPage, 4_000)).toContain(label)
  await orcaPage.waitForTimeout(300)

  const baselineProbe = await locateLink(orcaPage, label)
  await orcaPage.mouse.move(baselineProbe.clientX, baselineProbe.clientY)
  await expect
    .poll(() => readLinkState(orcaPage, tabId))
    .toMatchObject({
      bufferType: 'alternate',
      tooltipDisplay: '',
      tooltipText: expect.stringContaining(url),
      underlined: true
    })
  await expect.poll(() => serializedBufferContains(orcaPage, tabId, url)).toBe(true)

  await parkHiddenTabBehindDecoy(orcaPage, worktreeId, tabId, {
    parkDelayMs: PARKING_DELAY_MS
  })
  await activateTerminalTab(orcaPage, tabId)
  await expect.poll(() => getTerminalContent(orcaPage, 4_000)).toContain(label)
  await expect.poll(() => serializedBufferContains(orcaPage, tabId, url)).toBe(true)

  const restoredProbe = await locateLink(orcaPage, label)
  await orcaPage.mouse.move(restoredProbe.clientX, restoredProbe.clientY)
  // Why: cold-park restores from SerializeAddon output, which must retain the
  // OSC 8 target in addition to its underline styling.
  await expect
    .poll(() => readLinkState(orcaPage, tabId))
    .toMatchObject({
      bufferType: 'alternate',
      tooltipDisplay: '',
      tooltipText: expect.stringContaining(url),
      underlined: true
    })
})
