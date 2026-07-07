import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync
} from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { app } from 'electron'
import { createHash } from 'node:crypto'
import {
  ORCA_PI_AGENT_STATUS_EXTENSION_FILE,
  getPiAgentStatusExtensionSource
} from './agent-status-extension-source'
import {
  ORCA_PI_PREFILL_EXTENSION_FILE,
  getPiPrefillExtensionSource
} from './prefill-extension-source'
export { ORCA_OMP_PREFILL_ENV_VAR, ORCA_PI_PREFILL_ENV_VAR } from './prefill-extension-source'
import { ORCA_PI_EXTENSION_FILE, getPiTitlebarExtensionSource } from './titlebar-extension-source'
import {
  isSafeDescendCandidate as sharedIsSafeDescendCandidate,
  safeRemoveOverlay
} from '../pty/overlay-mirror'
import type { PiAgentKind } from '../../shared/pi-agent-kind'

// Why: the Pi test suite imports `isSafeDescendCandidate` from this module's
// public surface to lock in the Windows-junction ordering invariant against
// future refactors. Re-export the shared implementation so the test contract
// keeps holding after the helper moved to src/main/pty/overlay-mirror.ts.
export const isSafeDescendCandidate = sharedIsSafeDescendCandidate

const PI_AGENT_SUBDIR = 'agent'
const ORCA_MANAGED_EXTENSION_MARKER = '@orca-managed-pi-extension'
const OMP_MANAGED_STATUS_EXTENSION_DIR = 'omp-managed-status-extension'
const LEGACY_PI_OVERLAY_MANIFEST_FILE = '.orca-pi-overlay-manifest.json'
const PI_AGENT_SETTINGS_FILE = 'settings.json'
const MANAGED_EXTENSION_FILES = new Set([
  ORCA_PI_EXTENSION_FILE,
  ORCA_PI_PREFILL_EXTENSION_FILE,
  ORCA_PI_AGENT_STATUS_EXTENSION_FILE
])

type ManagedExtensionWriteResult = 'written' | 'skipped-user-owned' | 'failed'

type PiManagedExtensionEnv = {
  extensionDir?: string
  sourceAgentDir: string
  statusExtensionPath?: string
}

// Why: old Orca versions used per-kind overlay roots. Keep the names so
// upgrade-time cleanup can remove stale PTY-scoped Pi/OMP overlay dirs without
// guessing which agent a terminated pane launched.
const OVERLAY_ROOT_DIR_NAME: Record<PiAgentKind, string> = {
  pi: 'pi-agent-overlays',
  omp: 'omp-agent-overlays'
}

// Why: the managed extension target is chosen by which agent is being launched, NOT
// by which `~/.<agent>/agent` dir happens to exist on disk first. A
// cross-agent fallback (Pi -> OMP or vice versa) silently shadows the other
// agent's user extensions when both are installed and the user picks the
// shadowed one in Orca's per-launch agent picker.
const AGENT_HOME_DIR_NAME: Record<PiAgentKind, string> = {
  pi: '.pi',
  omp: '.omp'
}

function getDefaultPiAgentDir(kind: PiAgentKind): string {
  return join(homedir(), AGENT_HOME_DIR_NAME[kind], PI_AGENT_SUBDIR)
}

function toSafeOverlayDirName(ptyId: string): string {
  return createHash('sha256').update(ptyId).digest('hex').slice(0, 32)
}

function withOrcaManagedExtensionMarker(source: string): string {
  return source.includes(ORCA_MANAGED_EXTENSION_MARKER)
    ? source
    : `// ${ORCA_MANAGED_EXTENSION_MARKER}\n${source}`
}

export class PiTitlebarExtensionService {
  private getOverlayRoot(kind: PiAgentKind): string {
    return join(app.getPath('userData'), OVERLAY_ROOT_DIR_NAME[kind])
  }

  private getSourceOverlayDir(sourceAgentDir: string, kind: PiAgentKind): string {
    // Why: builds before managed extensions stored Pi/OMP state in source-scoped
    // overlays. Resolve the old path so OMP upgrades can rescue stranded state.
    return join(this.getOverlayRoot(kind), toSafeOverlayDirName(`source:${sourceAgentDir}`))
  }

  private getPtyOverlayDir(ptyId: string, kind: PiAgentKind): string {
    // Why: old Orca versions used PTY-scoped hashed overlays. Keep resolving
    // that path so new spawns/teardowns can clean stale pre-migration dirs.
    return join(this.getOverlayRoot(kind), toSafeOverlayDirName(ptyId))
  }

  private getLegacyOverlayDir(ptyId: string, kind: PiAgentKind): string {
    return join(this.getOverlayRoot(kind), ptyId)
  }

  // Why: overlay teardown must use the shared safeRemoveOverlay so the
  // Windows-junction guard from issue #1083 stays in lock-step across all
  // overlay consumers (Pi here, OpenCode in src/main/opencode/hook-service.ts).
  private safeRemoveOverlay(overlayDir: string, kind: PiAgentKind): void {
    safeRemoveOverlay(overlayDir, this.getOverlayRoot(kind))
  }

  private canOverwriteManagedExtension(path: string): boolean {
    try {
      return readFileSync(path, 'utf8').includes(ORCA_MANAGED_EXTENSION_MARKER)
    } catch {
      return true
    }
  }

  private writeManagedExtension(path: string, source: string): ManagedExtensionWriteResult {
    if (existsSync(path) && !this.canOverwriteManagedExtension(path)) {
      return 'skipped-user-owned'
    }

    try {
      writeFileSync(path, source)
      return 'written'
    } catch {
      return 'failed'
    }
  }

  private writeOmpFallbackStatusExtension(source: string): string | undefined {
    const fallbackDir = join(app.getPath('userData'), OMP_MANAGED_STATUS_EXTENSION_DIR)
    try {
      mkdirSync(fallbackDir, { recursive: true })
    } catch {
      return undefined
    }

    const fallbackPath = join(fallbackDir, ORCA_PI_AGENT_STATUS_EXTENSION_FILE)
    return this.writeManagedExtension(fallbackPath, source) === 'written' ? fallbackPath : undefined
  }

  private shouldSkipLegacyOverlayEntry(pathSegments: string[]): boolean {
    const name = pathSegments.at(-1)
    if (!name) {
      return true
    }
    if (pathSegments.length === 1) {
      return name === LEGACY_PI_OVERLAY_MANIFEST_FILE || name === PI_AGENT_SETTINGS_FILE
    }
    return pathSegments[0] === 'extensions' && MANAGED_EXTENSION_FILES.has(name)
  }

  private copyMissingLegacyOmpOverlayEntries(
    overlayDir: string,
    sourceAgentDir: string,
    pathSegments: string[] = []
  ): void {
    for (const entry of readdirSync(overlayDir, { withFileTypes: true })) {
      const nextSegments = [...pathSegments, entry.name]
      if (this.shouldSkipLegacyOverlayEntry(nextSegments)) {
        continue
      }

      const overlayPath = join(overlayDir, entry.name)
      const targetPath = join(sourceAgentDir, ...nextSegments)
      let stats
      try {
        stats = lstatSync(overlayPath)
      } catch {
        continue
      }
      if (stats.isSymbolicLink()) {
        continue
      }
      if (stats.isDirectory()) {
        if (existsSync(targetPath)) {
          try {
            if (!lstatSync(targetPath).isDirectory()) {
              continue
            }
          } catch {
            continue
          }
        } else {
          mkdirSync(targetPath, { recursive: true })
        }
        this.copyMissingLegacyOmpOverlayEntries(overlayPath, sourceAgentDir, nextSegments)
        continue
      }
      if (!stats.isFile()) {
        continue
      }
      if (!existsSync(targetPath)) {
        mkdirSync(dirname(targetPath), { recursive: true })
        cpSync(overlayPath, targetPath, { preserveTimestamps: true })
      }
    }
  }

  private migrateLegacyOmpOverlayState(sourceAgentDir: string): void {
    const overlayDir = this.getSourceOverlayDir(sourceAgentDir, 'omp')
    if (!existsSync(overlayDir)) {
      return
    }
    try {
      mkdirSync(sourceAgentDir, { recursive: true })
      // Why: some pre-managed-extension builds pointed OMP at this overlay, so
      // first-login auth/session files can exist only there after an update.
      this.copyMissingLegacyOmpOverlayEntries(overlayDir, sourceAgentDir)
    } catch (error) {
      console.warn('[pi-titlebar-extension] failed to migrate legacy OMP overlay state:', error)
    }
  }

  private installManagedExtensions(
    sourceAgentDir: string,
    kind: PiAgentKind
  ): PiManagedExtensionEnv {
    const extensionsDir = join(sourceAgentDir, 'extensions')
    try {
      mkdirSync(extensionsDir, { recursive: true })
    } catch {
      return { sourceAgentDir }
    }

    this.writeManagedExtension(
      join(extensionsDir, ORCA_PI_EXTENSION_FILE),
      withOrcaManagedExtensionMarker(getPiTitlebarExtensionSource())
    )
    this.writeManagedExtension(
      join(extensionsDir, ORCA_PI_PREFILL_EXTENSION_FILE),
      withOrcaManagedExtensionMarker(getPiPrefillExtensionSource(kind))
    )
    const statusExtensionPath = join(extensionsDir, ORCA_PI_AGENT_STATUS_EXTENSION_FILE)
    const statusSource = withOrcaManagedExtensionMarker(getPiAgentStatusExtensionSource(kind))
    const statusResult = this.writeManagedExtension(statusExtensionPath, statusSource)

    return {
      extensionDir: extensionsDir,
      sourceAgentDir,
      statusExtensionPath:
        statusResult === 'written'
          ? statusExtensionPath
          : kind === 'omp'
            ? this.writeOmpFallbackStatusExtension(statusSource)
            : undefined
    }
  }

  buildPtyEnv(
    ptyId: string,
    existingAgentDir: string | undefined,
    kind: PiAgentKind
  ): Record<string, string> {
    const sourceAgentDir = existingAgentDir || getDefaultPiAgentDir(kind)
    try {
      this.safeRemoveOverlay(this.getPtyOverlayDir(ptyId, kind), kind)
      this.safeRemoveOverlay(this.getLegacyOverlayDir(ptyId, kind), kind)
    } catch {
      // Why: old per-PTY overlay cleanup is best-effort; a locked stale
      // directory should not prevent the terminal from starting.
    }

    if (kind === 'omp') {
      this.migrateLegacyOmpOverlayState(sourceAgentDir)
    }

    const installed = this.installManagedExtensions(sourceAgentDir, kind)
    const env: Record<string, string> = {}
    if (kind === 'omp') {
      env.ORCA_OMP_SOURCE_AGENT_DIR = installed.sourceAgentDir
      if (installed.statusExtensionPath) {
        env.ORCA_OMP_STATUS_EXTENSION = installed.statusExtensionPath
      }
    } else {
      env.ORCA_PI_SOURCE_AGENT_DIR = installed.sourceAgentDir
    }
    return env
  }

  clearPty(ptyId: string): void {
    // Why: PTY teardown doesn't know which kind was launched (the daemon
    // exit path discards the launch command). Sweep both old PTY-scoped
    // overlay roots for migration cleanup. Source-scoped legacy overlays are
    // deliberately left in place so upgrades never delete user runtime state.
    for (const kind of Object.keys(OVERLAY_ROOT_DIR_NAME) as PiAgentKind[]) {
      try {
        this.safeRemoveOverlay(this.getPtyOverlayDir(ptyId, kind), kind)
        this.safeRemoveOverlay(this.getLegacyOverlayDir(ptyId, kind), kind)
      } catch {
        // Why: on Windows the overlay dir can be locked (EPERM/EBUSY) by
        // antivirus or indexers. Overlay cleanup is best-effort - a stale
        // old PTY-scoped directory in userData is harmless and will be
        // retried on the next PTY spawn/teardown.
      }
    }
  }
}

export const piTitlebarExtensionService = new PiTitlebarExtensionService()
