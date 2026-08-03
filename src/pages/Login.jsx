import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, ChevronRight, ChevronLeft, Lock, Mail } from 'lucide-react';
import GoogleIcon from '@/components/GoogleIcon';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function Login() {
  const [step, setStep] = useState(1); // 1 = Email / Social, 2 = Password
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const t = useTranslation();
  const { isArabic } = useLanguage();

  const navigate = useNavigate();

  const handleStep1 = (e) => {
    e.preventDefault();
    setError('');
    setEmailError('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError(t.login.invalidEmail || 'Please enter a valid email address');
      return;
    }
    setStep(2);
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      navigate('/home');
    } catch (err) {
      setError(err.message || t.login.loginFailed || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient light */}
      <div className="absolute top-[-120px] right-[-60px] w-[320px] h-[320px] rounded-full bg-white/10 blur-xl pointer-events-none" />
      <div className="absolute bottom-[-100px] left-[-70px] w-[280px] h-[280px] rounded-full bg-white/10 blur-xl pointer-events-none" />

      <div className="w-full max-w-md bg-card rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 relative z-10 border border-white/20">
        
        {/* Mobile Header Branding */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/20">
            <span className="text-2xl font-bold text-white leading-none">i</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Investraders</h1>
          <p className="text-muted-foreground text-xs mt-1">{t.login.welcomeBack || 'Welcome back to your financial community'}</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 1 ? 'w-8 bg-blue-600' : 'w-2 bg-gray-200 dark:bg-gray-700'}`} />
          <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 2 ? 'w-8 bg-blue-600' : 'w-2 bg-gray-200 dark:bg-gray-700'}`} />
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs rounded-xl p-3 mb-5 border border-red-200 dark:border-red-900">{error}</div>
        )}

        {/* STEP 1: Email & Google */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <button
              onClick={handleGoogleLogin}
              type="button"
              className="w-full flex items-center justify-center gap-3 h-12 rounded-xl border border-border hover:bg-muted/50 transition-colors font-medium text-sm text-foreground shadow-sm"
            >
              <GoogleIcon className="w-5 h-5" />
              {t.login.continueWithGoogle || 'Continue with Google'}
            </button>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">{t.login.orSignInWithEmail || 'or with email'}</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <form onSubmit={handleStep1} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 block">{t.login.emailAddress || 'Email Address'}</label>
                <div className="relative">
                  <Input
                    type="email"
                    placeholder={t.login.emailPlaceholder || 'you@example.com'}
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                    required
                    dir="ltr"
                    className={`h-12 rounded-xl pl-10 ${emailError ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                  />
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 text-white font-semibold text-sm shadow-md mt-2 gap-1"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground pt-4">
              {t.login.noAccount || "Don't have an account?"}{' '}
              <Link to="/register" className="text-blue-600 font-semibold hover:underline">
                {t.login.signUp || 'Sign Up'}
              </Link>
            </p>
          </div>
        )}

        {/* STEP 2: Password */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-muted/50 p-3 rounded-xl flex items-center justify-between border border-border">
              <div className="flex items-center gap-2 min-w-0">
                <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-xs font-medium truncate text-foreground">{email}</span>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-blue-600 font-medium hover:underline shrink-0"
              >
                Change
              </button>
            </div>

            <form onSubmit={handleFinalSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-foreground">{t.login.password || 'Password'}</label>
                  <Link to="/forgot-password" className="text-xs text-blue-600 hover:underline font-medium">
                    {t.login.forgotPassword || 'Forgot?'}
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    dir="ltr"
                    className="h-12 rounded-xl pl-10 pr-11"
                  />
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 h-12 rounded-xl"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>

                <Button
                  type="submit"
                  disabled={loading || !password}
                  className="flex-1 h-12 rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 text-white font-semibold text-sm shadow-md"
                >
                  {loading ? (t.login.signingIn || 'Signing in...') : (t.login.signIn || 'Sign In')}
                </Button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
