import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ko from './locales/ko';
import en from './locales/en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ko: { translation: ko },
      en: { translation: en },
    },
    lng: 'ko', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
