import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

/**
 * Detect the preferred language from:
 * 1. localStorage (user's stored preference)
 * 2. navigator.language (OS / browser setting)
 * Fallback: 'en'
 */
function detectLanguage() {
  const stored = localStorage.getItem('language');
  if (stored === 'ar' || stored === 'en') return stored;

  const browserLang = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
  return browserLang.startsWith('ar') ? 'ar' : 'en';
}

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(detectLanguage);

  useEffect(() => {
    const root = document.documentElement;
    if (language === 'ar') {
      root.setAttribute('dir', 'rtl');
      root.setAttribute('lang', 'ar');
    } else {
      root.setAttribute('dir', 'ltr');
      root.setAttribute('lang', 'en');
    }
    localStorage.setItem('language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'ar' : 'en'));
  };

  const isArabic = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, isArabic, toggleLanguage, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
