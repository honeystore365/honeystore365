import { useCallback } from 'react';
import arTranslations from '@/locales/ar.json';
import enTranslations from '@/locales/en.json';

type TranslationKey = string;
type TranslationParams = Record<string, string | number>;

const translations = {
  ar: arTranslations,
  en: enTranslations,
};

export function useTranslation(locale: 'ar' | 'en' = 'ar') {
  const t = useCallback((key: TranslationKey, params?: TranslationParams): string => {
    const keys = key.split('.');
    let value: any = translations[locale];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to key if translation not found
        return key;
      }
    }
    
    if (typeof value !== 'string') {
      return key;
    }
    
    // Replace parameters in the translation
    if (params) {
      return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey]?.toString() || match;
      });
    }
    
    return value;
  }, [locale]);

  return { t };
}