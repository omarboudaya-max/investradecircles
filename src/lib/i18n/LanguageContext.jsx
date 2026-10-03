import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  AUTO,
  LANGUAGES,
  SUPPORTED_LANGUAGES,
  detectBrowserLanguage,
  readStoredPreference,
  resolveLanguage,
  writeStoredPreference,
} from '@/lib/i18n/languages';

const LanguageContext = createContext(null);

/**
 * Investraders language engine.
 *
 * Resolution order:
 *   1. Account preference (synced from the user's profile by <LanguageProfileSync />)
 *   2. Explicit choice saved on this device (localStorage)
 *   3. Ordered browser/device languages (navigator.languages)
 *   4. English fallback
 *
 * `preference` is what the user picked ('auto' or a language code);
 * `language` is the concrete language currently rendered.
 */
export function LanguageProvider({ children }) {
  const [preference, setPreferenceState] = useState(readStoredPreference);
  const [browserLanguage, setBrowserLanguage] = useState(detectBrowserLanguage);

  const language = preference === AUTO ? browserLanguage : resolveLanguage(preference);
  const meta = LANGUAGES[language] || LANGUAGES.en;

  // Listener set by <LanguageProfileSync /> so explicit choices are saved to the account.
  const persistRef = useRef(null);

  // Keep <html lang/dir> in sync -> drives RTL layout + correct screen-reader pronunciation.
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('lang', meta.code);
    root.setAttribute('dir', meta.dir);
  }, [meta.code, meta.dir]);

  // Follow OS/browser language changes live, but only while on "Automatic".
  useEffect(() => {
    const onChange = () => setBrowserLanguage(detectBrowserLanguage());
    window.addEventListener('languagechange', onChange);
    return () => window.removeEventListener('languagechange', onChange);
  }, []);

  /**
   * @param {string} pref  'auto' or a supported language code
   * @param {{ persistToAccount?: boolean }} opts
   */
  const setPreference = useCallback((pref, { persistToAccount = true } = {}) => {
    const next = pref === AUTO || SUPPORTED_LANGUAGES.includes(pref) ? pref : AUTO;
    setPreferenceState(next);
    writeStoredPreference(next);
    if (persistToAccount && persistRef.current) {
      try { persistRef.current(next); } catch { /* never block the UI on sync */ }
    }
  }, []);

  // Backward-compatible API used across existing components.
  const setLanguage = useCallback((lang) => setPreference(lang), [setPreference]);
  const toggleLanguage = useCallback(() => {
    const idx = SUPPORTED_LANGUAGES.indexOf(language);
    setPreference(SUPPORTED_LANGUAGES[(idx + 1) % SUPPORTED_LANGUAGES.length]);
  }, [language, setPreference]);

  const registerAccountPersister = useCallback((fn) => {
    persistRef.current = fn;
    return () => { if (persistRef.current === fn) persistRef.current = null; };
  }, []);

  const value = useMemo(() => ({
    language,
    preference,
    isAuto: preference === AUTO,
    browserLanguage,
    locale: meta.locale,
    dir: meta.dir,
    isRTL: meta.dir === 'rtl',
    isArabic: language === 'ar',
    languages: LANGUAGES,
    setPreference,
    setLanguage,
    toggleLanguage,
    registerAccountPersister,
  }), [language, preference, browserLanguage, meta, setPreference, setLanguage, toggleLanguage, registerAccountPersister]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
