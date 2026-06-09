import i18next, { type i18n as I18nInstance, type TOptions } from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './locales/en.json'
import { DEFAULT_LOCALE } from './supported-languages'

export const i18n: I18nInstance = i18next.createInstance()

void i18n.use(initReactI18next).init({
  fallbackLng: DEFAULT_LOCALE,
  lng: DEFAULT_LOCALE,
  resources: {
    en: {
      translation: en
    }
  },
  interpolation: {
    escapeValue: false
  },
  react: {
    useSuspense: false
  }
})

export function translate(key: string, fallback: string, options?: TOptions): string {
  return i18n.t(key, { defaultValue: fallback, ...options })
}
