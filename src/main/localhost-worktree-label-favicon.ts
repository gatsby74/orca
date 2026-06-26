import type { RepoIcon } from '../shared/repo-icon'

const DEFAULT_ACCENT = '#14b8a6'

const LUCIDE_PATHS: Record<string, string> = {
  Bot: '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',
  Box: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  Braces:
    '<path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/>',
  Briefcase:
    '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
  Building2:
    '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18"/><path d="M6 12H4a2 2 0 0 0-2 2v8"/><path d="M18 9h2a2 2 0 0 1 2 2v11"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>',
  Code2: '<path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/>',
  Cpu: '<rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/>',
  Database:
    '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>',
  Folder:
    '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9L9.6 3.9A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  Gauge: '<path d="m12 14 4-4"/><path d="M3.3 19a10 10 0 1 1 17.4 0"/>',
  Globe:
    '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 0 20"/><path d="M12 2a15.3 15.3 0 0 0 0 20"/>',
  Layers:
    '<path d="m12.8 2.6 8 4a1 1 0 0 1 0 1.8l-8 4a2 2 0 0 1-1.8 0l-8-4a1 1 0 0 1 0-1.8l8-4a2 2 0 0 1 1.8 0"/><path d="m22 12-9.2 4.6a2 2 0 0 1-1.8 0L2 12"/><path d="m22 17-9.2 4.6a2 2 0 0 1-1.8 0L2 17"/>',
  Package:
    '<path d="m7.5 4.3 9 5.2"/><path d="M21 8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  Palette:
    '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 22a10 10 0 1 1 10-10 5 5 0 0 1-5 5h-1.5a1.5 1.5 0 0 0-1.3 2.3 1.5 1.5 0 0 1-1.2 2.7Z"/>',
  Rocket:
    '<path d="M4.5 16.5c-1.5 1.3-2 3.4-2 3.4s2.1-.5 3.4-2c.7-.8.7-2 0-2.7s-1.9-.7-2.7 0"/><path d="M9 15 4 10l8-8c4 0 7 3 7 7l-8 8Z"/><path d="M15 9h.01"/>',
  Server:
    '<rect width="20" height="8" x="2" y="2" rx="2"/><rect width="20" height="8" x="2" y="14" rx="2"/><path d="M6 6h.01"/><path d="M6 18h.01"/>',
  Shapes:
    '<path d="M8.3 10a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5"/><path d="M20 9a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/><path d="M9 22H4a2 2 0 0 1-2-2v-5"/><path d="M22 15v5a2 2 0 0 1-2 2h-5"/><path d="m17 14-5 5-5-5Z"/>',
  Sparkles:
    '<path d="M9.9 2.9 8.8 6a2 2 0 0 1-1.2 1.2L4.5 8.3l3.1 1.1a2 2 0 0 1 1.2 1.2l1.1 3.1 1.1-3.1a2 2 0 0 1 1.2-1.2l3.1-1.1-3.1-1.1A2 2 0 0 1 11 6Z"/><path d="M19 13v4"/><path d="M21 15h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>',
  SquareTerminal:
    '<path d="m7 11 2-2-2-2"/><path d="M11 13h4"/><rect width="18" height="18" x="3" y="3" rx="2"/>',
  Wrench:
    '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.1-3.1a6 6 0 0 1-7.9 7.9L5.6 21.4a2.1 2.1 0 0 1-3-3l7.3-7.3a6 6 0 0 1 7.9-7.9Z"/>'
}

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;'
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '"':
        return '&quot;'
      default:
        return '&apos;'
    }
  })
}

function normalizeAccent(value: string | null | undefined): string {
  if (value && /^#[0-9a-f]{6}$/i.test(value)) {
    return value
  }
  return DEFAULT_ACCENT
}

function lucideIconSvg(iconName: string): string {
  const paths = LUCIDE_PATHS[iconName] ?? LUCIDE_PATHS.Folder
  return `<g transform="translate(5 5) scale(2.25)" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</g>`
}

function repoIconSvgContent(repoIcon: RepoIcon | null | undefined, projectName: string): string {
  if (repoIcon?.type === 'emoji') {
    return `<text x="32" y="40" text-anchor="middle" font-size="34">${escapeXml(repoIcon.emoji)}</text>`
  }
  if (repoIcon?.type === 'lucide') {
    return lucideIconSvg(repoIcon.name)
  }
  const initials = projectName
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return `<text x="32" y="39" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="white">${escapeXml(initials || 'O')}</text>`
}

export function createLocalhostWorktreeFaviconDataUrl({
  repoIcon,
  badgeColor,
  projectName
}: {
  repoIcon?: RepoIcon | null
  badgeColor?: string | null
  projectName: string
}): string {
  if (repoIcon?.type === 'image') {
    return repoIcon.src
  }
  const accent = normalizeAccent(badgeColor)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#111111"/><rect x="6" y="6" width="52" height="52" rx="11" fill="${accent}"/><rect x="10" y="10" width="44" height="44" rx="9" fill="#111111"/>${repoIconSvgContent(repoIcon, projectName)}<circle cx="51" cy="51" r="9" fill="${accent}" stroke="#111111" stroke-width="4"/></svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}
