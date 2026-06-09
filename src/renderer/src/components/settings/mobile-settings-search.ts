import type { SettingsSearchEntry } from './settings-search'
import { MOBILE_PANE_SEARCH_ENTRIES } from './mobile-pane-search'
import { translate } from '@/i18n/i18n'

export const MOBILE_ENABLE_SEARCH_ENTRY: SettingsSearchEntry = {
  title: translate("auto.components.settings.mobile.settings.search.ffd52a96e4", "Mobile"),
  description: translate("auto.components.settings.mobile.settings.search.671eb4173c", "Control terminals and agents from your phone."),
  keywords: [
    translate("auto.components.settings.mobile.settings.search.f213400800", "mobile"),
    translate("auto.components.settings.mobile.settings.search.f4ed142753", "phone"),
    translate("auto.components.settings.mobile.settings.search.cf2c93b479", "pair"),
    translate("auto.components.settings.mobile.settings.search.87816d1c59", "qr"),
    translate("auto.components.settings.mobile.settings.search.59b1d75fd1", "code"),
    translate("auto.components.settings.mobile.settings.search.0b7e585cb9", "scan"),
    translate("auto.components.settings.mobile.settings.search.7e801801ac", "remote"),
    translate("auto.components.settings.mobile.settings.search.a7eececc1d", "android"),
    translate("auto.components.settings.mobile.settings.search.6bfa001752", "apk"),
    translate("auto.components.settings.mobile.settings.search.8d4ba0ef09", "beta"),
    translate("auto.components.settings.mobile.settings.search.b730ff7049", "experimental")
  ]
}

export const MOBILE_SETTINGS_PANE_SEARCH_ENTRIES: SettingsSearchEntry[] = [
  MOBILE_ENABLE_SEARCH_ENTRY,
  ...MOBILE_PANE_SEARCH_ENTRIES
]
