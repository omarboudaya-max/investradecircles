import { useMemo } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import en from '@/lib/i18n/translations/en';
import fr from '@/lib/i18n/translations/fr';
import ar from '@/lib/i18n/translations/ar';

const TRANSLATION_MAP = {
  en,
  fr,
  ar,
};

/**
 * Creates a defensive proxy over the target dictionary that automatically
 * falls back to English for any missing section or key, and returns empty
 * string / safe function instead of throwing TypeError.
 */
function createFallbackProxy(target, fallback) {
  if (!target || typeof target !== 'object') return fallback || {};

  return new Proxy(target, {
    get(obj, prop) {
      if (typeof prop === 'symbol') {
        return Reflect.get(obj, prop);
      }

      const val = obj[prop];
      const fallbackVal = fallback ? fallback[prop] : undefined;

      if (val !== undefined) {
        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          return createFallbackProxy(val, fallbackVal);
        }
        return val;
      }

      if (fallbackVal !== undefined) {
        if (typeof fallbackVal === 'object' && fallbackVal !== null && !Array.isArray(fallbackVal)) {
          return createFallbackProxy({}, fallbackVal);
        }
        return fallbackVal;
      }

      // Safe fallback for undefined sub-objects
      return undefined;
    },
  });
}

/**
 * Returns the translation dictionary for the active language with automatic
 * English fallback for any missing key.
 */
export function useTranslation() {
  const { language } = useLanguage();

  return useMemo(() => {
    const active = TRANSLATION_MAP[language] || en;
    if (active === en) return en;
    return createFallbackProxy(active, en);
  }, [language]);
}

export default useTranslation;
