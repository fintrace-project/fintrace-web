import i18next from 'i18next'
import en from './en.yml'

// English only until post-MVP (§3.6); a second language is a second YAML file beside en.yml
export const i18n = i18next.createInstance()

void i18n.init({
  lng: 'en',
  fallbackLng: 'en',
  resources: { en: { translation: en } },
  // The resources are bundled, so init completes before the first render reads a message
  initAsync: false,
  // React escapes what it renders; escaping here as well would show entities in the UI
  interpolation: { escapeValue: false },
})

// For framework-free code (src/core); the UI reads messages through react-i18next's useTranslation
export const t = i18n.t.bind(i18n)
