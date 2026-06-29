import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TrendingUp } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const t = useTranslation();
  const { isArabic } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirm) { setError(t.resetPassword.passwordMismatch); return; }
    setLoading(true);
    setError('');
    try {
      const { error: resetError } = await supabase.auth.updateUser({ password: newPassword });
      if (resetError) throw resetError;
      window.location.href = '/login';
    } catch (err) {
      setError(err.message || t.resetPassword.resetFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 flex items-center justify-center p-4">
      <div className={`w-full max-w-md bg-card rounded-2xl shadow-2xl p-8 md:p-12 ${isArabic ? 'text-right' : 'text-left'}`}>
        <div className={`flex items-center gap-2 mb-8 ${isArabic ? 'flex-row-reverse' : ''}`}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-blue-700">Investraders</span>
        </div>

        <h1 className="text-2xl font-bold mb-6">{t.resetPassword.title}</h1>
        {error && <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3 mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input type="password" placeholder={t.resetPassword.newPassword} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="h-12" dir="ltr" />
          <Input type="password" placeholder={t.resetPassword.confirmPassword} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-12" dir="ltr" />
          <Button type="submit" disabled={loading} className="w-full h-12 rounded-full bg-gradient-to-r from-blue-700 to-blue-500 text-white font-semibold shadow-lg">
            {loading ? t.resetPassword.resetting : t.resetPassword.resetButton}
          </Button>
        </form>
      </div>
    </div>
  );
}
