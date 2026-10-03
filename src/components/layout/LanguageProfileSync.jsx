import { useEffect, useRef } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { supabase } from '@/lib/supabase';

/**
 * Headless component that synchronizes the user's explicit language preference
 * with their Supabase user profile across devices.
 *
 * Placed inside AuthProvider in App.jsx.
 */
export default function LanguageProfileSync() {
  const { user } = useAuth();
  const { registerAccountPersister, setPreference } = useLanguage();
  const hasInitializedRef = useRef(false);

  // 1. On authenticated session init, load profile language if set
  useEffect(() => {
    if (!user?.id || hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    async function loadAccountLanguage() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('language')
          .eq('id', user.id)
          .maybeSingle();

        if (!error && data?.language) {
          // Apply account language
          setPreference(data.language, { persistToAccount: false });
        }
      } catch {
        // Silently continue if column doesn't exist yet or network error
      }
    }

    loadAccountLanguage();
  }, [user?.id, setPreference]);

  // 2. Register account persister for future changes
  useEffect(() => {
    if (!user?.id) return;

    const unregister = registerAccountPersister(async (newPreference) => {
      try {
        await supabase
          .from('profiles')
          .update({ language: newPreference })
          .eq('id', user.id);
      } catch {
        // Silently fail if table lacks column or offline
      }
    });

    return unregister;
  }, [user?.id, registerAccountPersister]);

  return null;
}
