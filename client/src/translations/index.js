/**
 * i18n Configuration
 * Manages English and Urdu translations
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translations
import en from './en.json';
import ur from './ur.json';

const LANGUAGE_KEY = '@app_language';

// Get device language
const deviceLanguage = getLocales()[0]?.languageCode || 'en';

// Initialize i18n
i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources: {
      en: { translation: en },
      ur: { translation: ur },
    },
    lng: deviceLanguage === 'ur' ? 'ur' : 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

// Load saved language from storage
AsyncStorage.getItem(LANGUAGE_KEY).then((savedLanguage) => {
  if (savedLanguage) {
    i18n.changeLanguage(savedLanguage);
  }
});

// Save language when changed
i18n.on('languageChanged', (lng) => {
  AsyncStorage.setItem(LANGUAGE_KEY, lng);
});

export default i18n;
