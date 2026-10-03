/**
 * Central registry of interface languages supported by Investraders.
 *
 * To add a new language (e.g. German):
 *   1. Create `translations/de.js` (partial files are fine — missing keys fall back to English)
 *   2. Add an entry below and register it in `useTranslation.js`
 * Nothing else in the app needs to change.
 */
export const LANGUAGES = {
  en: { code: 'en', label: 'English', nativeLabel: 'English', short: 'EN', dir: 'ltr', locale: 'en-GB' },
  fr: { code: 'fr', label: 'French', nativeLabel: 'Français', short: 'FR', dir: 'ltr', locale: 'fr-FR' },
  ar: { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', short: 'ع', dir: 'rtl', locale: 'ar-TN' },
};

export const SUPPORTED_LANGUAGES = Object.keys(LANGUAGES);
export const DEFAULT_LANGUAGE = 'en';

/** Special preference value meaning "follow the device/browser language". */
export const AUTO = 'auto';

export const STORAGE_KEY = 'investraders_language';
/** Legacy key used by the previous EN/AR toggle — migrated on first load. */
export const LEGACY_STORAGE_KEY = 'language';

/** "fr-FR" -> "fr" if supported, otherwise null. */
export function normalizeLanguage(tag) {
  if (!tag || typeof tag !== 'string') return null;
  const base = tag.toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LANGUAGES.includes(base) ? base : null;
}

/** Walk the ordered browser preference list and return the first supported language. */
export function detectBrowserLanguage() {
  if (typeof navigator === 'undefined') return DEFAULT_LANGUAGE;
  const list = (navigator.languages && navigator.languages.length)
    ? navigator.languages
    : [navigator.language || navigator.userLanguage];
  for (const tag of list) {
    const lang = normalizeLanguage(tag);
    if (lang) return lang;
  }
  return DEFAULT_LANGUAGE;
}

/** Read the stored preference ('auto' | language code). Never throws. */
export function readStoredPreference() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === AUTO || SUPPORTED_LANGUAGES.includes(stored)) return stored;

    // Migrate the old EN/AR toggle value so existing users keep their choice.
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (SUPPORTED_LANGUAGES.includes(legacy)) {
      localStorage.setItem(STORAGE_KEY, legacy);
      return legacy;
    }
  } catch {
    /* storage unavailable (private mode, etc.) */
  }
  return AUTO;
}

export function writeStoredPreference(pref) {
  try {
    localStorage.setItem(STORAGE_KEY, pref);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Resolve a preference into a concrete language code. */
export function resolveLanguage(preference) {
  return SUPPORTED_LANGUAGES.includes(preference) ? preference : detectBrowserLanguage();
}

/**
 * Lightweight script/stop-word heuristic to tag user-generated content with its
 * original language (en / fr / ar). Used to show "Original: Français" badges and
 * to decide whether a translate action is relevant. Not a replacement for a real
 * detector, but good enough for the three core languages.
 */
export function detectTextLanguage(text) {
  if (!text || typeof text !== 'string') return null;
  const sample = text.slice(0, 600);
  const arabicChars = (sample.match(/[\u0600-\u06FF]/g) || []).length;
  const latinChars = (sample.match(/[A-Za-zÀ-ÿ]/g) || []).length;
  if (arabicChars > latinChars) return 'ar';
  if (latinChars === 0) return null;

  const words = sample.toLowerCase().split(/[^a-zà-ÿ']+/).filter(Boolean);
  const FR = new Set(['le', 'la', 'les', 'des', 'une', 'est', 'et', 'pour', 'avec', 'nous', 'vous', 'dans', 'sur', 'pas', 'que', 'qui', 'du', 'au', 'aux', 'cherchons', 'je', 'mais', 'très', 'ce', 'cette']);
  const EN = new Set(['the', 'and', 'is', 'are', 'for', 'with', 'we', 'you', 'in', 'on', 'not', 'that', 'this', 'of', 'to', 'looking', 'i', 'our', 'it', 'be', 'have']);
  let fr = 0;
  let en = 0;
  for (const w of words) {
    if (FR.has(w)) fr++;
    if (EN.has(w)) en++;
  }
  if (/[éèêàçùâîôû]/.test(sample)) fr += 1;
  if (fr === 0 && en === 0) return null;
  return fr > en ? 'fr' : 'en';
}
