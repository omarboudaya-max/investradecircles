import { useLanguage } from '@/lib/i18n/LanguageContext';
import en from '@/lib/i18n/translations/en';
import ar from '@/lib/i18n/translations/ar';

/**
 * Returns the correct translation object based on the current language.
 * Usage inside any component:
 *   const t = useTranslation();
 *   <p>{t.login.signIn}</p>
 */
export function useTranslation() {
  const { isArabic } = useLanguage();
  return isArabic ? ar : en;
}
