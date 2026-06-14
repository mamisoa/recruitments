import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './en.json'
import fr from './fr.json'
import et from './et.json'
import de from './de.json'
import nl from './nl.json'

const STORAGE_KEY = 'recruitment.lang'

const saved =
  typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    et: { translation: et },
    de: { translation: de },
    nl: { translation: nl },
  },
  lng: saved ?? 'fr',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem(STORAGE_KEY, lng)
  } catch {
    /* ignore */
  }
})

export default i18n
