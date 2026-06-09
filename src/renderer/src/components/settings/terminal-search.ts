import type { SettingsSearchEntry } from './settings-search'
import { getTerminalClipboardSearchEntries } from './terminal-clipboard-search'
import { getTerminalWindowsSearchEntries } from './terminal-windows-search'
import { translate } from '@/i18n/i18n'
import { createLocalizedCatalog } from '@/i18n/localized-catalog'

export const getTerminalTypographySearchEntries = createLocalizedCatalog(() => [
  {
    title: translate('auto.components.settings.terminal.search.5930244899', 'Font Size'),
    description: translate(
      'auto.components.settings.terminal.search.0fe0073f0c',
      'Default terminal font size for new panes and live updates.'
    ),
    keywords: [
      translate('auto.components.settings.terminal.search.f66a7cf715', 'terminal'),
      translate('auto.components.settings.terminal.search.103cdb862f', 'typography'),
      translate('auto.components.settings.terminal.search.33031c1465', 'text size')
    ]
  },
  {
    title: translate('auto.components.settings.terminal.search.e989914ad6', 'Font Family'),
    description: translate(
      'auto.components.settings.terminal.search.0acdc17891',
      'Default terminal font family for new panes and live updates.'
    ),
    keywords: [
      translate('auto.components.settings.terminal.search.f66a7cf715', 'terminal'),
      translate('auto.components.settings.terminal.search.103cdb862f', 'typography'),
      translate('auto.components.settings.terminal.search.b0bb76ae6b', 'font')
    ]
  },
  {
    title: translate('auto.components.settings.terminal.search.28ea41bd2d', 'Font Weight'),
    description: translate(
      'auto.components.settings.terminal.search.98c18f2c77',
      'Controls the terminal text font weight.'
    ),
    keywords: [
      translate('auto.components.settings.terminal.search.f66a7cf715', 'terminal'),
      translate('auto.components.settings.terminal.search.103cdb862f', 'typography'),
      translate('auto.components.settings.terminal.search.20ce287cc6', 'weight')
    ]
  },
  {
    title: translate('auto.components.settings.terminal.search.0f2fb0cb74', 'Line Height'),
    description: translate(
      'auto.components.settings.terminal.search.36a1b38bc8',
      'Controls the terminal line height multiplier.'
    ),
    keywords: [
      translate('auto.components.settings.terminal.search.f66a7cf715', 'terminal'),
      translate('auto.components.settings.terminal.search.103cdb862f', 'typography'),
      translate('auto.components.settings.terminal.search.7341e3d00e', 'line height'),
      translate('auto.components.settings.terminal.search.b2f52cb96c', 'spacing')
    ]
  },
  {
    title: translate('auto.components.settings.terminal.search.58da1ae45d', 'Font Ligatures'),
    description: translate(
      'auto.components.settings.terminal.search.893aa92997',
      'Render programming ligatures (e.g. => → ≠ ≥) for fonts that ship them. "Auto" enables ligatures only for known ligature fonts (Fira Code, JetBrains Mono, Cascadia Code, Iosevka, etc.).'
    ),
    keywords: [
      translate('auto.components.settings.terminal.search.f66a7cf715', 'terminal'),
      translate('auto.components.settings.terminal.search.103cdb862f', 'typography'),
      translate('auto.components.settings.terminal.search.afc8d5f790', 'ligatures'),
      translate('auto.components.settings.terminal.search.7ab424c4d3', 'ligature'),
      translate('auto.components.settings.terminal.search.7f7640c29e', 'fira code'),
      translate('auto.components.settings.terminal.search.35c2311a33', 'jetbrains mono'),
      translate('auto.components.settings.terminal.search.e3aeea308e', 'cascadia code'),
      translate('auto.components.settings.terminal.search.6ded6297fe', 'iosevka'),
      translate('auto.components.settings.terminal.search.a16224d16a', 'calt'),
      translate('auto.components.settings.terminal.search.d5e6c7fab1', 'font features')
    ]
  }
])

export const getTerminalRenderingSearchEntries = createLocalizedCatalog(() => [
  {
    title: translate('auto.components.settings.terminal.search.13a2502dfc', 'GPU Acceleration'),
    description: translate(
      'auto.components.settings.terminal.search.8f9f953de7',
      'Controls whether the terminal uses xterm.js WebGL rendering. Auto tries WebGL when the renderer is supported, with conservative fallback for software or unknown GPU renderers.'
    ),
    keywords: [
      translate('auto.components.settings.terminal.search.f66a7cf715', 'terminal'),
      translate('auto.components.settings.terminal.search.db82cb13b0', 'gpu'),
      translate('auto.components.settings.terminal.search.4b4e80d850', 'acceleration'),
      translate('auto.components.settings.terminal.search.6cddc858ba', 'webgl'),
      translate('auto.components.settings.terminal.search.fffa9ab980', 'renderer'),
      translate('auto.components.settings.terminal.search.bc7ae1f7c0', 'rendering'),
      translate('auto.components.settings.terminal.search.7d924d870d', 'graphics'),
      translate('auto.components.settings.terminal.search.1abcf4d7de', 'linux')
    ]
  }
])

export const getTerminalCursorSearchEntries = createLocalizedCatalog(() => [
  {
    title: translate('auto.components.settings.terminal.search.97bcfff662', 'Cursor Shape'),
    description: translate(
      'auto.components.settings.terminal.search.275a9d6395',
      'Default cursor appearance for Orca terminal panes.'
    ),
    keywords: [
      translate('auto.components.settings.terminal.search.f66a7cf715', 'terminal'),
      translate('auto.components.settings.terminal.search.6eaf7ee0e4', 'cursor'),
      translate('auto.components.settings.terminal.search.a6e9dcc829', 'bar'),
      translate('auto.components.settings.terminal.search.015c82349f', 'block'),
      translate('auto.components.settings.terminal.search.eefd1d8332', 'underline')
    ]
  },
  {
    title: translate('auto.components.settings.terminal.search.b03d01fd49', 'Blinking Cursor'),
    description: translate(
      'auto.components.settings.terminal.search.a27f6edf52',
      'Uses the blinking variant of the selected cursor shape.'
    ),
    keywords: [
      translate('auto.components.settings.terminal.search.f66a7cf715', 'terminal'),
      translate('auto.components.settings.terminal.search.6eaf7ee0e4', 'cursor'),
      translate('auto.components.settings.terminal.search.25f606d9e5', 'blink')
    ]
  },
  {
    title: translate('auto.components.settings.terminal.search.7f1e356a54', 'Cursor Opacity'),
    description: translate(
      'auto.components.settings.terminal.search.d4f7d1ce5c',
      'Opacity of the terminal cursor.'
    ),
    keywords: [
      translate('auto.components.settings.terminal.search.f66a7cf715', 'terminal'),
      translate('auto.components.settings.terminal.search.6eaf7ee0e4', 'cursor'),
      translate('auto.components.settings.terminal.search.46d99ef4bb', 'opacity'),
      translate('auto.components.settings.terminal.search.4f7f8f28ca', 'transparency')
    ]
  }
])

export const getTerminalPaneAppearanceSearchEntries = createLocalizedCatalog(() => [
  {
    title: translate(
      'auto.components.settings.terminal.search.72bbcbd1dd',
      'Inactive Pane Opacity'
    ),
    description: translate(
      'auto.components.settings.terminal.search.18dd5026c6',
      'Opacity applied to panes that are not currently active.'
    ),
    keywords: [
      translate('auto.components.settings.terminal.search.846a7a1204', 'pane'),
      translate('auto.components.settings.terminal.search.46d99ef4bb', 'opacity'),
      translate('auto.components.settings.terminal.search.6c4c85ba43', 'dimming')
    ]
  },
  {
    title: translate('auto.components.settings.terminal.search.2d5ab88b7c', 'Divider Thickness'),
    description: translate(
      'auto.components.settings.terminal.search.e58d4040d0',
      'Thickness of the pane divider line.'
    ),
    keywords: [
      translate('auto.components.settings.terminal.search.846a7a1204', 'pane'),
      translate('auto.components.settings.terminal.search.781f49d942', 'divider'),
      translate('auto.components.settings.terminal.search.f637a7dee9', 'thickness')
    ]
  }
])

export const getTerminalPaneInteractionSearchEntries = createLocalizedCatalog(() => [
  {
    title: translate('auto.components.settings.terminal.search.c6178a2b4d', 'Focus Follows Mouse'),
    description: translate(
      'auto.components.settings.terminal.search.17cc3ea102',
      "Hovering a terminal pane activates it without needing to click. Mirrors Ghostty's focus-follows-mouse setting. Selections and window switching stay safe."
    ),
    keywords: [
      translate('auto.components.settings.terminal.search.f5d1e3d472', 'focus'),
      translate('auto.components.settings.terminal.search.b5116e7b12', 'follows'),
      translate('auto.components.settings.terminal.search.ea364ce6e4', 'mouse'),
      translate('auto.components.settings.terminal.search.d1fa00a9cb', 'hover'),
      translate('auto.components.settings.terminal.search.846a7a1204', 'pane'),
      translate('auto.components.settings.terminal.search.82b63d07fe', 'ghostty'),
      translate('auto.components.settings.terminal.search.f036794286', 'active')
    ]
  },
  ...getTerminalClipboardSearchEntries()
])

export const getTerminalDarkThemeSearchEntries = createLocalizedCatalog(() => [
  {
    title: translate('auto.components.settings.terminal.search.ec07ce9b02', 'Dark Theme'),
    description: translate(
      'auto.components.settings.terminal.search.13f6310dd3',
      'Choose the terminal theme used in dark mode.'
    ),
    keywords: [
      translate('auto.components.settings.terminal.search.f66a7cf715', 'terminal'),
      translate('auto.components.settings.terminal.search.0ce176909a', 'theme'),
      translate('auto.components.settings.terminal.search.f785374072', 'dark'),
      translate('auto.components.settings.terminal.search.7718d70356', 'preview')
    ]
  },
  {
    title: translate('auto.components.settings.terminal.search.8987db7ff2', 'Dark Divider Color'),
    description: translate(
      'auto.components.settings.terminal.search.9c32726f47',
      'Controls the split divider line between panes in dark mode.'
    ),
    keywords: [
      translate('auto.components.settings.terminal.search.f66a7cf715', 'terminal'),
      translate('auto.components.settings.terminal.search.781f49d942', 'divider'),
      translate('auto.components.settings.terminal.search.f785374072', 'dark'),
      translate('auto.components.settings.terminal.search.674b7c8436', 'color')
    ]
  }
])

export const getTerminalLightThemeSearchEntries = createLocalizedCatalog(() => [
  {
    title: translate(
      'auto.components.settings.terminal.search.232e532169',
      'Use Separate Theme In Light Mode'
    ),
    description: translate(
      'auto.components.settings.terminal.search.f268092ee3',
      'When disabled, light mode reuses the dark terminal theme.'
    ),
    keywords: [
      translate('auto.components.settings.terminal.search.f66a7cf715', 'terminal'),
      translate('auto.components.settings.terminal.search.da864e6cec', 'light mode'),
      translate('auto.components.settings.terminal.search.0ce176909a', 'theme')
    ]
  },
  {
    title: translate('auto.components.settings.terminal.search.1d89457764', 'Light Theme'),
    description: translate(
      'auto.components.settings.terminal.search.1dee533bd9',
      'Choose the theme used when Orca is in light mode.'
    ),
    keywords: [
      translate('auto.components.settings.terminal.search.f66a7cf715', 'terminal'),
      translate('auto.components.settings.terminal.search.0ce176909a', 'theme'),
      translate('auto.components.settings.terminal.search.411229c636', 'light'),
      translate('auto.components.settings.terminal.search.7718d70356', 'preview')
    ]
  },
  {
    title: translate('auto.components.settings.terminal.search.595b97b446', 'Light Divider Color'),
    description: translate(
      'auto.components.settings.terminal.search.77d9f9cd55',
      'Controls the split divider line between panes in light mode.'
    ),
    keywords: [
      translate('auto.components.settings.terminal.search.f66a7cf715', 'terminal'),
      translate('auto.components.settings.terminal.search.781f49d942', 'divider'),
      translate('auto.components.settings.terminal.search.411229c636', 'light'),
      translate('auto.components.settings.terminal.search.674b7c8436', 'color')
    ]
  }
])

export const getTerminalAdvancedSearchEntries = createLocalizedCatalog(() => [
  {
    title: translate('auto.components.settings.terminal.search.7674e758e1', 'Scrollback Size'),
    description: translate(
      'auto.components.settings.terminal.search.f7d56b6281',
      'Maximum terminal scrollback buffer size.'
    ),
    keywords: [
      translate('auto.components.settings.terminal.search.f66a7cf715', 'terminal'),
      translate('auto.components.settings.terminal.search.cde233f5da', 'scrollback'),
      translate('auto.components.settings.terminal.search.fffdff40a7', 'buffer'),
      translate('auto.components.settings.terminal.search.56fff3d113', 'memory')
    ]
  },
  {
    title: translate('auto.components.settings.terminal.search.957a0203fc', 'Word Separators'),
    description: translate(
      'auto.components.settings.terminal.search.3ab64c47d8',
      'Characters treated as word boundaries for double-click selection.'
    ),
    keywords: [
      translate('auto.components.settings.terminal.search.7286cd2566', 'word'),
      translate('auto.components.settings.terminal.search.d4aeafac10', 'separator'),
      translate('auto.components.settings.terminal.search.4ed3e239a8', 'boundary'),
      translate('auto.components.settings.terminal.search.d2a366c7f9', 'double-click'),
      translate('auto.components.settings.terminal.search.affb14efd4', 'selection')
    ]
  }
])

export const getTerminalMacOptionSearchEntries = createLocalizedCatalog(() => [
  {
    title: translate('auto.components.settings.terminal.search.9bd7229927', 'Option as Alt'),
    description: translate(
      'auto.components.settings.terminal.search.1f8b00f5ce',
      "Controls whether the macOS Option key sends Alt/Esc sequences or composes characters. Mirrors Ghostty's macos-option-as-alt."
    ),
    keywords: [
      translate('auto.components.settings.terminal.search.f66a7cf715', 'terminal'),
      translate('auto.components.settings.terminal.search.b37edfc65a', 'option'),
      translate('auto.components.settings.terminal.search.c4427dc5ff', 'alt'),
      translate('auto.components.settings.terminal.search.38f1b4f4cb', 'key'),
      translate('auto.components.settings.terminal.search.7ace5beec9', 'meta'),
      translate('auto.components.settings.terminal.search.983d45cf4c', 'compose'),
      translate('auto.components.settings.terminal.search.1ab57a0fbd', 'mac'),
      translate('auto.components.settings.terminal.search.d8d6f7a3c5', 'macos'),
      translate('auto.components.settings.terminal.search.abaa24752d', 'keyboard'),
      translate('auto.components.settings.terminal.search.dd4f6cb541', 'german'),
      translate('auto.components.settings.terminal.search.b3b94cfcb5', 'international'),
      translate('auto.components.settings.terminal.search.fae142a354', 'readline'),
      translate('auto.components.settings.terminal.search.82b63d07fe', 'ghostty')
    ]
  }
])

export const getTerminalMacYenSearchEntries = createLocalizedCatalog(() => [
  {
    title: translate(
      'auto.components.settings.terminal.search.694b8764ac',
      'JIS Yen (¥) to Backslash (\\)'
    ),
    description: translate(
      'auto.components.settings.terminal.search.063914c486',
      'Controls whether pressing the JIS Yen (¥) key sends a backslash (\\) instead.'
    ),
    keywords: [
      translate('auto.components.settings.terminal.search.f66a7cf715', 'terminal'),
      translate('auto.components.settings.terminal.search.9c35f56625', 'yen'),
      translate('auto.components.settings.terminal.search.98059d0944', 'backslash'),
      translate('auto.components.settings.terminal.search.24f7977756', 'japanese'),
      translate('auto.components.settings.terminal.search.abaa24752d', 'keyboard'),
      translate('auto.components.settings.terminal.search.1ab57a0fbd', 'mac'),
      translate('auto.components.settings.terminal.search.d8d6f7a3c5', 'macos'),
      translate('auto.components.settings.terminal.search.b495dc6a9f', 'jis'),
      translate('auto.components.settings.terminal.search.4cec42dbf7', 'intl')
    ]
  }
])

export const getTerminalGhosttyImportSearchEntries = createLocalizedCatalog(() => [
  {
    title: translate('auto.components.settings.terminal.search.a979df0083', 'Import from Ghostty'),
    description: translate(
      'auto.components.settings.terminal.search.73e9422f19',
      'One-time import of supported Ghostty terminal settings.'
    ),
    keywords: [
      translate('auto.components.settings.terminal.search.82b63d07fe', 'ghostty'),
      translate('auto.components.settings.terminal.search.fd752b3cac', 'import'),
      translate('auto.components.settings.terminal.search.f66a7cf715', 'terminal'),
      translate('auto.components.settings.terminal.search.2ade3ea490', 'config'),
      translate('auto.components.settings.terminal.search.10f9fb6fea', 'settings')
    ]
  }
])

export const getManageSessionsSearchEntries = createLocalizedCatalog(() => [
  {
    title: translate('auto.components.settings.terminal.search.6f5d486a68', 'Manage Sessions'),
    description: translate(
      'auto.components.settings.terminal.search.f72abc493c',
      'Recover from frozen terminals by killing sessions, clearing saved scrollback, or restarting the daemon.'
    ),
    keywords: [
      translate('auto.components.settings.terminal.search.f35400f7e8', 'daemon'),
      translate('auto.components.settings.terminal.search.9f2dda133c', 'pty'),
      translate('auto.components.settings.terminal.search.d802a578bf', 'sessions'),
      translate('auto.components.settings.terminal.search.a8d2784214', 'manage'),
      translate('auto.components.settings.terminal.search.a3e5297c10', 'kill'),
      translate('auto.components.settings.terminal.search.920573d65b', 'kill all'),
      translate('auto.components.settings.terminal.search.456da64d4d', 'clear'),
      translate('auto.components.settings.terminal.search.3982d88725', 'history'),
      translate('auto.components.settings.terminal.search.cde233f5da', 'scrollback'),
      translate('auto.components.settings.terminal.search.6892fb1019', 'restart'),
      translate('auto.components.settings.terminal.search.f66a7cf715', 'terminal'),
      translate('auto.components.settings.terminal.search.0a05629060', 'recover'),
      translate('auto.components.settings.terminal.search.88561b3499', 'frozen'),
      translate('auto.components.settings.terminal.search.d4daf4f612', 'unfreeze')
    ]
  }
])

export const getTerminalWindowSearchEntries = createLocalizedCatalog(() => [
  {
    title: translate('auto.components.settings.terminal.search.b36fd2416d', 'Background Opacity'),
    description: translate(
      'auto.components.settings.terminal.search.4c643695aa',
      'Controls the transparency of the terminal background.'
    ),
    keywords: [
      translate('auto.components.settings.terminal.search.46d99ef4bb', 'opacity'),
      translate('auto.components.settings.terminal.search.4f7f8f28ca', 'transparency'),
      translate('auto.components.settings.terminal.search.f6dd9ff606', 'background'),
      translate('auto.components.settings.terminal.search.7db59c4738', 'alpha')
    ]
  },
  {
    title: translate('auto.components.settings.terminal.search.72d0482137', 'Window Blur'),
    description: translate(
      'auto.components.settings.terminal.search.bc2054657a',
      'Apply background blur to the terminal window. Requires restart.'
    ),
    keywords: [
      translate('auto.components.settings.terminal.search.0838b3717b', 'window'),
      translate('auto.components.settings.terminal.search.71eb45e293', 'blur'),
      translate('auto.components.settings.terminal.search.f6dd9ff606', 'background'),
      translate('auto.components.settings.terminal.search.4f7f8f28ca', 'transparency'),
      translate('auto.components.settings.terminal.search.6c2f9f05c8', 'vibrancy')
    ]
  },
  {
    title: translate('auto.components.settings.terminal.search.b4f182f24d', 'Horizontal Padding'),
    description: translate(
      'auto.components.settings.terminal.search.75691e4911',
      'Horizontal padding around the terminal grid in pixels.'
    ),
    keywords: [
      translate('auto.components.settings.terminal.search.e8baf0d12c', 'padding'),
      translate('auto.components.settings.terminal.search.54a9b3725b', 'horizontal'),
      translate('auto.components.settings.terminal.search.b2f52cb96c', 'spacing'),
      translate('auto.components.settings.terminal.search.f25d948664', 'margin')
    ]
  },
  {
    title: translate('auto.components.settings.terminal.search.692c4ad032', 'Vertical Padding'),
    description: translate(
      'auto.components.settings.terminal.search.4655567c37',
      'Vertical padding around the terminal grid in pixels.'
    ),
    keywords: [
      translate('auto.components.settings.terminal.search.e8baf0d12c', 'padding'),
      translate('auto.components.settings.terminal.search.18ce996647', 'vertical'),
      translate('auto.components.settings.terminal.search.b2f52cb96c', 'spacing'),
      translate('auto.components.settings.terminal.search.f25d948664', 'margin')
    ]
  },
  {
    title: translate(
      'auto.components.settings.terminal.search.d1fe5f99ff',
      'Hide Mouse While Typing'
    ),
    description: translate(
      'auto.components.settings.terminal.search.77201c0bb2',
      'Hide the mouse cursor when typing in the terminal.'
    ),
    keywords: [
      translate('auto.components.settings.terminal.search.ea364ce6e4', 'mouse'),
      translate('auto.components.settings.terminal.search.ee611ae238', 'hide'),
      translate('auto.components.settings.terminal.search.34fe1af39d', 'typing'),
      translate('auto.components.settings.terminal.search.6eaf7ee0e4', 'cursor')
    ]
  },
  {
    title: translate('auto.components.settings.terminal.search.aed2a4b4eb', 'Color Overrides'),
    description: translate(
      'auto.components.settings.terminal.search.3023e01415',
      'Override individual terminal colors.'
    ),
    keywords: [
      translate('auto.components.settings.terminal.search.674b7c8436', 'color'),
      translate('auto.components.settings.terminal.search.d8bd6182b8', 'override'),
      translate('auto.components.settings.terminal.search.11fd3fbcf2', 'ansi'),
      translate('auto.components.settings.terminal.search.4ba8623632', 'palette'),
      translate('auto.components.settings.terminal.search.0ce176909a', 'theme')
    ]
  }
])

export const getTerminalSetupScriptSearchEntries = createLocalizedCatalog(() => [
  {
    title: translate(
      'auto.components.settings.terminal.search.5be2d67678',
      'Setup Script Location'
    ),
    description: translate(
      'auto.components.settings.terminal.search.2610ee3b56',
      "Where the repository setup script runs when a new workspace is created: a vertical split (default), a horizontal split, or a background tab titled 'Setup'."
    ),
    keywords: [
      translate('auto.components.settings.terminal.search.4529806908', 'setup'),
      translate('auto.components.settings.terminal.search.6b659fff2a', 'script'),
      translate('auto.components.settings.terminal.search.7a48c7715b', 'workspace'),
      translate('auto.components.settings.terminal.search.de7bc1d5f5', 'split'),
      translate('auto.components.settings.terminal.search.54a9b3725b', 'horizontal'),
      translate('auto.components.settings.terminal.search.18ce996647', 'vertical'),
      translate('auto.components.settings.terminal.search.f44643328e', 'tab'),
      translate('auto.components.settings.terminal.search.fd6c24313d', 'new'),
      translate('auto.components.settings.terminal.search.b872de3926', 'location'),
      translate('auto.components.settings.terminal.search.c047f398cc', 'launch')
    ]
  }
])

export const getTerminalAppearanceSearchEntries = createLocalizedCatalog(
  (): SettingsSearchEntry[] => [
    ...getTerminalTypographySearchEntries(),
    ...getTerminalCursorSearchEntries(),
    ...getTerminalPaneAppearanceSearchEntries(),
    ...getTerminalDarkThemeSearchEntries(),
    ...getTerminalLightThemeSearchEntries(),
    ...getTerminalWindowSearchEntries(),
    ...getTerminalGhosttyImportSearchEntries()
  ]
)

export function getTerminalPaneSearchEntries(platform: {
  isWindows: boolean
  isMac: boolean
}): SettingsSearchEntry[] {
  // Why: the settings search index must mirror the visible controls. Keeping
  // platform-only controls out of other platforms' search results prevents
  // users from landing on an option the UI intentionally hides.
  return [
    ...getTerminalRenderingSearchEntries(),
    ...getTerminalPaneInteractionSearchEntries(),
    ...(platform.isWindows ? getTerminalWindowsSearchEntries() : []),
    ...getTerminalSetupScriptSearchEntries(),
    ...getManageSessionsSearchEntries(),
    ...getTerminalAdvancedSearchEntries(),
    ...(platform.isMac
      ? [...getTerminalMacOptionSearchEntries(), ...getTerminalMacYenSearchEntries()]
      : [])
  ]
}
