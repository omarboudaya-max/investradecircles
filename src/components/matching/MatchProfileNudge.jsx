import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from '@/lib/i18n/useTranslation';

const DISMISS_KEY = 'match_nudge_dismissed_at';
const DISMISS_DAYS = 7;
const TYPES = ['investor', 'innovator', 'other'];

function dismissedRecently() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return Number.isFinite(at) && at > 0 && Date.now() - at < DISMISS_DAYS * 86400000;
  } catch {
    return false;
  }
}

/**
 * Home-feed card shown to members the matchmaker cannot place yet: those without a
 * member type, and those who have not said what they are looking for.
 */
export default function MatchProfileNudge() {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const t = useTranslation();
  const copy = t.matchNudge || {};
  const [hidden, setHidden] = useState(dismissedRecently);
  const [saving, setSaving] = useState(false);

  const needsType = !user?.user_type;
  const needsPrefs = !user?.match_profile;
  if (!user?.id || hidden || (!needsType && !needsPrefs)) return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* storage unavailable */ }
    setHidden(true);
  };

  const chooseType = async (userType) => {
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({ user_type: userType }).eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
    } catch (error) {
      toast({ title: copy.saveFailed || 'Could not save your choice', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative mb-5 rounded-2xl border border-primary/20 bg-primary/5 p-4">
      <button
        type="button"
        onClick={dismiss}
        aria-label={copy.later || 'Later'}
        className="absolute top-2.5 end-2.5 p-1 rounded-full text-muted-foreground hover:bg-muted"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-start gap-3 pe-6">
        <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground">{copy.title || 'Get matched with the right people'}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {needsType
              ? (copy.needType || 'Tell us who you are so we can match you with investors, innovators and partners.')
              : (copy.needPrefs || 'Say what you are looking for and we will rank the investors, projects and members that fit.')}
          </p>
          {needsType ? (
            <div className="flex flex-wrap gap-2 mt-3">
              {TYPES.map((type) => (
                <Button
                  key={type}
                  size="sm"
                  variant="outline"
                  disabled={saving}
                  onClick={() => chooseType(type)}
                  className="h-8 rounded-full bg-background"
                >
                  {copy[type] || type}
                </Button>
              ))}
            </div>
          ) : (
            <Button asChild size="sm" className="h-8 rounded-full mt-3">
              <Link to="/matchmaker">{copy.cta || 'Set up my matching'}</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
