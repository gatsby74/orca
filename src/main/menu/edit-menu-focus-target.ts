import { webContents } from 'electron'

/**
 * The WebContents that owns an Edit-menu action when it is not the window's own
 * renderer — docked/undocked DevTools, or an embedded browser guest view.
 *
 * Why: menu accelerators fire application-wide, and getFocusedWindow() still
 * returns the Orca window while its DevTools holds keyboard focus. Edit items
 * that override a native role must delegate here or they steal the keystroke.
 */
export function resolveEditMenuTarget(
  focusedWindow: Electron.BrowserWindow
): Electron.WebContents | null {
  const focusedContents = webContents.getFocusedWebContents()
  if (focusedContents && focusedContents !== focusedWindow.webContents) {
    return focusedContents
  }
  return null
}
