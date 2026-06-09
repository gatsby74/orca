import {
  UI_LANGUAGE_ENGLISH,
  UI_LANGUAGE_SYSTEM,
  type UiLanguage
} from '../../../shared/ui-language'

export const DEFAULT_LOCALE = 'en'

export type UiLanguageChoice = {
  value: UiLanguage
  labelKey: string
}

export const UI_LANGUAGE_CHOICES: UiLanguageChoice[] = [
  { value: UI_LANGUAGE_SYSTEM, labelKey: 'settings.appearance.language.system' },
  { value: UI_LANGUAGE_ENGLISH, labelKey: 'settings.appearance.language.english' }
]

export function resolveUiLocale(_language: UiLanguage): typeof DEFAULT_LOCALE {
  return DEFAULT_LOCALE
}
