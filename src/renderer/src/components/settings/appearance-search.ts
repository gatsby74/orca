import type { StatusBarItem } from '../../../../shared/types'
import type { SettingsSearchEntry } from './settings-search'
import { TERMINAL_APPEARANCE_SEARCH_ENTRIES } from './terminal-search'
import { translate } from '@/i18n/i18n'

export const STATUS_BAR_TOGGLES: readonly {
  id: StatusBarItem
  title: string
  description: string
  keywords: string[]
  toggleDescription: string
}[] = [
  {
    id: 'claude',
    title: translate("auto.components.settings.appearance.search.9dc15020d7", "Claude Usage"),
    description: translate("auto.components.settings.appearance.search.de50c6f516", "Show Claude token and cost usage in the status bar."),
    keywords: [translate("auto.components.settings.appearance.search.896eb53fd4", "status bar"), translate("auto.components.settings.appearance.search.c9fe3a7876", "claude"), translate("auto.components.settings.appearance.search.00a028f25f", "usage"), translate("auto.components.settings.appearance.search.afbb6a3767", "tokens"), translate("auto.components.settings.appearance.search.edbf0f63a0", "cost"), translate("auto.components.settings.appearance.search.dea0a9a665", "anthropic")],
    toggleDescription: 'Show Claude token and cost usage for the active workspace.'
  },
  {
    id: 'codex',
    title: translate("auto.components.settings.appearance.search.54b1acf24f", "Codex Usage"),
    description: translate("auto.components.settings.appearance.search.e9e4412545", "Show Codex token and cost usage in the status bar."),
    keywords: [translate("auto.components.settings.appearance.search.896eb53fd4", "status bar"), translate("auto.components.settings.appearance.search.8dfd676c28", "codex"), translate("auto.components.settings.appearance.search.00a028f25f", "usage"), translate("auto.components.settings.appearance.search.afbb6a3767", "tokens"), translate("auto.components.settings.appearance.search.edbf0f63a0", "cost"), translate("auto.components.settings.appearance.search.97957e374e", "openai")],
    toggleDescription: 'Show Codex token and cost usage for the active workspace.'
  },
  {
    id: 'gemini',
    title: translate("auto.components.settings.appearance.search.5bfb874d05", "Gemini Usage"),
    description: translate("auto.components.settings.appearance.search.9660c5b2f1", "Show Gemini token and cost usage in the status bar."),
    keywords: [translate("auto.components.settings.appearance.search.896eb53fd4", "status bar"), translate("auto.components.settings.appearance.search.2804a920ad", "gemini"), translate("auto.components.settings.appearance.search.00a028f25f", "usage"), translate("auto.components.settings.appearance.search.afbb6a3767", "tokens"), translate("auto.components.settings.appearance.search.edbf0f63a0", "cost"), translate("auto.components.settings.appearance.search.51b0ccd6a2", "google")],
    toggleDescription: 'Show Gemini token and cost usage for the active workspace.'
  },
  {
    id: 'opencode-go',
    title: translate("auto.components.settings.appearance.search.bc046e7899", "OpenCode Go Usage"),
    description: translate("auto.components.settings.appearance.search.7f72de7cbe", "Show OpenCode Go token and cost usage in the status bar."),
    keywords: [translate("auto.components.settings.appearance.search.896eb53fd4", "status bar"), translate("auto.components.settings.appearance.search.a9d56852eb", "opencode"), translate("auto.components.settings.appearance.search.d77537b580", "opencode-go"), translate("auto.components.settings.appearance.search.00a028f25f", "usage"), translate("auto.components.settings.appearance.search.afbb6a3767", "tokens"), translate("auto.components.settings.appearance.search.edbf0f63a0", "cost")],
    toggleDescription: 'Show OpenCode Go token and cost usage for the active workspace.'
  },
  {
    id: 'kimi',
    title: translate("auto.components.settings.appearance.search.3a6c028ea8", "Kimi Usage"),
    description: translate("auto.components.settings.appearance.search.c927a155d5", "Show Kimi subscription usage in the status bar."),
    keywords: [translate("auto.components.settings.appearance.search.896eb53fd4", "status bar"), translate("auto.components.settings.appearance.search.40e5c3c285", "kimi"), translate("auto.components.settings.appearance.search.00a028f25f", "usage"), translate("auto.components.settings.appearance.search.de586def95", "subscription"), translate("auto.components.settings.appearance.search.35565867cb", "moonshot")],
    toggleDescription: 'Show Kimi subscription usage for the active workspace.'
  },
  {
    id: 'ssh',
    title: translate("auto.components.settings.appearance.search.57fb424c56", "SSH Status"),
    description: translate("auto.components.settings.appearance.search.f17d66d0d2", "Show the active SSH connection status in the status bar."),
    keywords: [translate("auto.components.settings.appearance.search.896eb53fd4", "status bar"), translate("auto.components.settings.appearance.search.6ecad74eb3", "ssh"), translate("auto.components.settings.appearance.search.a278406ed5", "remote"), translate("auto.components.settings.appearance.search.f4997e0f8a", "connection"), translate("auto.components.settings.appearance.search.fe192b060e", "host")],
    toggleDescription:
      'Show the active SSH connection. Only visible once an SSH target is configured.'
  },
  {
    id: 'resource-usage',
    title: translate("auto.components.settings.appearance.search.7cf005b29f", "Resource Manager"),
    description: translate("auto.components.settings.appearance.search.81ef5abc2f", "Show CPU, memory, terminal sessions, and workspace disk usage in the status bar."),
    keywords: [translate("auto.components.settings.appearance.search.896eb53fd4", "status bar"), translate("auto.components.settings.appearance.search.c690a15849", "resource"), translate("auto.components.settings.appearance.search.9c4d5f0894", "manager"), translate("auto.components.settings.appearance.search.4355f18ac6", "memory"), translate("auto.components.settings.appearance.search.4ddbde4999", "cpu"), translate("auto.components.settings.appearance.search.96b4fb0064", "terminal"), translate("auto.components.settings.appearance.search.90bdc043ea", "disk"), translate("auto.components.settings.appearance.search.cb1cc62cf8", "space")],
    toggleDescription:
      'Show the Resource Manager. Click it for CPU, memory, sessions, daemon controls, and workspace disk scans.'
  },
  {
    id: 'ports',
    title: translate("auto.components.settings.appearance.search.cf409b6c4d", "Ports"),
    description: translate("auto.components.settings.appearance.search.0ececfa190", "Show live workspace ports in the status bar."),
    keywords: [translate("auto.components.settings.appearance.search.896eb53fd4", "status bar"), translate("auto.components.settings.appearance.search.006e67b279", "ports"), translate("auto.components.settings.appearance.search.46d21eef62", "localhost"), translate("auto.components.settings.appearance.search.43cfba3b95", "server"), translate("auto.components.settings.appearance.search.dc02c8759d", "workspace")],
    toggleDescription:
      'Show live workspace ports. Click it for workspace-scoped ports and external listeners.'
  }
]

export const THEME_ENTRIES: SettingsSearchEntry[] = [
  {
    title: translate("auto.components.settings.appearance.search.71e06350b4", "Theme"),
    description: translate("auto.components.settings.appearance.search.0709c794f7", "Choose how Orca looks in the app window."),
    keywords: [translate("auto.components.settings.appearance.search.262fe1d24f", "dark"), translate("auto.components.settings.appearance.search.44d873fd18", "light"), translate("auto.components.settings.appearance.search.3a9b69d734", "system")]
  }
]

export const ZOOM_ENTRIES: SettingsSearchEntry[] = [
  {
    title: translate("auto.components.settings.appearance.search.c5e933970f", "UI Zoom"),
    description: translate("auto.components.settings.appearance.search.adddb91a3d", "Scale the entire application interface."),
    keywords: [translate("auto.components.settings.appearance.search.3ae5de6101", "zoom"), translate("auto.components.settings.appearance.search.0952091186", "scale"), translate("auto.components.settings.appearance.search.0c83659f48", "shortcut")]
  }
]

export const TYPOGRAPHY_ENTRIES: SettingsSearchEntry[] = [
  {
    title: translate("auto.components.settings.appearance.search.ddb991024d", "IDE Font"),
    description: translate("auto.components.settings.appearance.search.07c7c38fac", "Choose the font used by the Orca interface."),
    keywords: [translate("auto.components.settings.appearance.search.24094af355", "font"), translate("auto.components.settings.appearance.search.a0e09aed9c", "typeface"), translate("auto.components.settings.appearance.search.8b36fb3f64", "typography"), translate("auto.components.settings.appearance.search.fab91464dd", "ide"), translate("auto.components.settings.appearance.search.1f2880a9d5", "orca"), translate("auto.components.settings.appearance.search.5095258df2", "interface"), translate("auto.components.settings.appearance.search.36e006efc1", "app"), translate("auto.components.settings.appearance.search.2f12e1aa3a", "ui")]
  }
]

export const LAYOUT_ENTRIES: SettingsSearchEntry[] = [
  {
    title: translate("auto.components.settings.appearance.search.f8129fb544", "Show Git-Ignored Files"),
    description: translate("auto.components.settings.appearance.search.7164edf71a", "Dim files matched by .gitignore in the file explorer."),
    keywords: [translate("auto.components.settings.appearance.search.bce3ac317a", "git"), translate("auto.components.settings.appearance.search.08c86bf58e", "gitignore"), translate("auto.components.settings.appearance.search.9f2df826ac", "ignored"), translate("auto.components.settings.appearance.search.c1bca1885a", "file explorer"), translate("auto.components.settings.appearance.search.5bff6a2ef0", "sidebar"), translate("auto.components.settings.appearance.search.648eeada79", "hide")]
  }
]

export const TITLEBAR_ENTRIES: SettingsSearchEntry[] = [
  {
    title: translate("auto.components.settings.appearance.search.fdd31b00d0", "Titlebar App Name"),
    description: translate("auto.components.settings.appearance.search.18b4c4c30b", "Show Orca in the titlebar."),
    keywords: [translate("auto.components.settings.appearance.search.bed343b03e", "titlebar"), translate("auto.components.settings.appearance.search.1f2880a9d5", "orca"), translate("auto.components.settings.appearance.search.36e006efc1", "app"), translate("auto.components.settings.appearance.search.51f957ce39", "name"), translate("auto.components.settings.appearance.search.a895d0f938", "brand")]
  }
]

export const STATUS_BAR_ENTRIES: SettingsSearchEntry[] = STATUS_BAR_TOGGLES.map(
  ({ title, description, keywords }) => ({ title, description, keywords })
)

export const SIDEBAR_ENTRIES: SettingsSearchEntry[] = [
  {
    title: translate("auto.components.settings.appearance.search.155a1e7438", "Show Tasks Button"),
    description: translate("auto.components.settings.appearance.search.9a248333c7", "Show the Tasks button at the top of the left sidebar."),
    keywords: [translate("auto.components.settings.appearance.search.0d5a74b606", "tasks"), translate("auto.components.settings.appearance.search.5bff6a2ef0", "sidebar"), translate("auto.components.settings.appearance.search.6cf5f54ce1", "button"), translate("auto.components.settings.appearance.search.648eeada79", "hide"), translate("auto.components.settings.appearance.search.ac79fe4a04", "show"), translate("auto.components.settings.appearance.search.2ee4810f38", "github"), translate("auto.components.settings.appearance.search.6b846424cc", "linear")]
  },
  {
    title: translate("auto.components.settings.appearance.search.caa27e1a8e", "Show Automations Button"),
    description: translate("auto.components.settings.appearance.search.ae13a0d340", "Show the Automations button at the top of the left sidebar."),
    keywords: [translate("auto.components.settings.appearance.search.b186f3cefb", "automations"), translate("auto.components.settings.appearance.search.58f4e22fa2", "automation"), translate("auto.components.settings.appearance.search.4c920ab2d1", "schedule"), translate("auto.components.settings.appearance.search.5bff6a2ef0", "sidebar"), translate("auto.components.settings.appearance.search.6cf5f54ce1", "button"), translate("auto.components.settings.appearance.search.648eeada79", "hide"), translate("auto.components.settings.appearance.search.ac79fe4a04", "show")]
  },
  {
    title: translate("auto.components.settings.appearance.search.1de96ec8a6", "Show Orca Mobile Button"),
    description: translate("auto.components.settings.appearance.search.682293cadf", "Show the Orca Mobile button at the top of the left sidebar."),
    keywords: [translate("auto.components.settings.appearance.search.74618577c7", "mobile"), translate("auto.components.settings.appearance.search.5e5b8878bf", "phone"), translate("auto.components.settings.appearance.search.5bff6a2ef0", "sidebar"), translate("auto.components.settings.appearance.search.6cf5f54ce1", "button"), translate("auto.components.settings.appearance.search.648eeada79", "hide"), translate("auto.components.settings.appearance.search.ac79fe4a04", "show"), translate("auto.components.settings.appearance.search.839fb1e3ed", "toolbox")]
  }
]

export const APP_ICON_ENTRIES: SettingsSearchEntry[] = [
  {
    title: translate("auto.components.settings.appearance.search.2b313598c6", "App Icon"),
    description: translate("auto.components.settings.appearance.search.e80c2af428", "Choose the app icon shown in the Dock and window switcher."),
    keywords: [translate("auto.components.settings.appearance.search.2cfb3420c0", "app icon"), translate("auto.components.settings.appearance.search.1f2880a9d5", "orca"), translate("auto.components.settings.appearance.search.d18b54ca90", "dock"), translate("auto.components.settings.appearance.search.e5bc35d59e", "window"), translate("auto.components.settings.appearance.search.651f35b2c6", "switcher"), translate("auto.components.settings.appearance.search.f586abfa35", "blue"), translate("auto.components.settings.appearance.search.468448bba4", "watercolor")]
  }
]

export const APPEARANCE_PANE_SEARCH_ENTRIES: SettingsSearchEntry[] = [
  ...THEME_ENTRIES,
  ...TYPOGRAPHY_ENTRIES,
  ...ZOOM_ENTRIES,
  ...TERMINAL_APPEARANCE_SEARCH_ENTRIES,
  ...LAYOUT_ENTRIES,
  ...TITLEBAR_ENTRIES,
  ...STATUS_BAR_ENTRIES,
  ...SIDEBAR_ENTRIES,
  ...APP_ICON_ENTRIES
]
