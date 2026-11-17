import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import { de } from './de.ts'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: { translation: typeof de }
  }
}

// Synchrone Initialisierung: Ressourcen sind gebündelt, kein Backend-Load.
void i18next.use(initReactI18next).init({
  lng: 'de',
  fallbackLng: 'de',
  resources: { de: { translation: de } },
  interpolation: { escapeValue: false },
  initAsync: false,
  showSupportNotice: false,
})

export default i18next
