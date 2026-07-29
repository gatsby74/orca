import type { PluginIconThemeRegistration } from './plugin-icon-theme-artifact'

/** Longest compound suffix a theme may key on, e.g. `spec.tsx` in `a.spec.tsx`. */
const MAX_SUFFIX_SEGMENTS = 3

function getFilename(filePath: string | undefined | null): string {
  if (!filePath) {
    return ''
  }
  // Why: SSH worktrees report POSIX paths while Windows hosts report `\`;
  // split on both so icon lookup does not depend on the host separator.
  return filePath.split(/[\\/]/).at(-1) ?? ''
}

/**
 * Resolves a file to a theme icon URL, or null when the theme has no opinion
 * and the caller should fall back to Orca's built-in Lucide icons.
 */
export function resolvePluginFileIconUrl(
  theme: PluginIconThemeRegistration | null | undefined,
  filePath: string | undefined | null
): string | null {
  if (!theme) {
    return null
  }
  const filename = getFilename(filePath).toLowerCase()
  if (!filename) {
    return null
  }

  const byName = theme.fileNames[filename]
  if (byName) {
    return theme.icons[byName] ?? null
  }

  // Longest suffix first so `d.ts` beats `ts` for `types.d.ts`.
  const segments = filename.split('.')
  const suffixCount = Math.min(segments.length - 1, MAX_SUFFIX_SEGMENTS)
  for (let take = suffixCount; take >= 1; take -= 1) {
    const suffix = segments.slice(segments.length - take).join('.')
    const definitionId = theme.fileExtensions[suffix]
    if (definitionId) {
      return theme.icons[definitionId] ?? null
    }
  }

  return theme.defaultIcon ? (theme.icons[theme.defaultIcon] ?? null) : null
}

/**
 * Picks the theme to render with. Until a user-facing picker lands, a single
 * contributed theme activates on its own; ambiguity falls back to built-ins.
 */
export function selectActivePluginIconTheme(
  themes: readonly PluginIconThemeRegistration[],
  activeThemeId?: string | null
): PluginIconThemeRegistration | null {
  if (activeThemeId) {
    return themes.find((theme) => theme.id === activeThemeId) ?? null
  }
  return themes.length === 1 ? (themes[0] ?? null) : null
}
