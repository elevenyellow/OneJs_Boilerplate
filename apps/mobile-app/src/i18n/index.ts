import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import * as Localization from 'expo-localization'

import en from './locales/en.json'
import es from './locales/es.json'

const resources = {
  en: { translation: en },
  es: { translation: es },
}

// Get device locale, default to 'en' if not supported
const getDeviceLanguage = (): string => {
  const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'en'
  // Only return supported languages
  if (deviceLocale === 'es') {
    return 'es'
  }
  return 'en'
}

i18n.use(initReactI18next).init({
  resources,
  lng: getDeviceLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React already escapes values
  },
  compatibilityJSON: 'v4', // Required for React Native
})

export default i18n
