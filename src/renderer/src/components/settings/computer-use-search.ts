import type { SettingsSearchEntry } from './settings-search'
import { translate } from '@/i18n/i18n'

export const COMPUTER_USE_PANE_SEARCH_ENTRIES: SettingsSearchEntry[] = [
  {
    title: translate("auto.components.settings.computer.use.search.442bec10fe", "Computer Use"),
    description: translate("auto.components.settings.computer.use.search.9210db582b", "Allow agents to inspect screenshots and operate local apps when you ask."),
    keywords: [
      translate("auto.components.settings.computer.use.search.fefb452f5b", "computer use"),
      translate("auto.components.settings.computer.use.search.82f01c2d2c", "accessibility"),
      translate("auto.components.settings.computer.use.search.26c1290d83", "screen recording"),
      translate("auto.components.settings.computer.use.search.e27f8bafbf", "screenshot"),
      translate("auto.components.settings.computer.use.search.798be54d7e", "automation"),
      translate("auto.components.settings.computer.use.search.6e88da3508", "skill")
    ]
  }
]
