import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import GoogleIcon from '@/components/GoogleIcon';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setEmailError('');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address.');
      setLoading(false);
      return;
    }
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      window.location.href = '/';
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-[-120px] right-[-60px] w-[320px] h-[320px] rounded-full bg-white/10 blur-xl" />
      <div className="absolute bottom-[-100px] left-[-70px] w-[280px] h-[280px] rounded-full bg-white/10 blur-xl" />
      <div className="absolute top-[30%] left-[5%] w-[100px] h-[100px] rounded-full bg-cyan-300/20" />

      <div className="w-full max-w-[920px] bg-white rounded-3xl shadow-2xl overflow-hidden flex min-h-[580px] relative z-10">

        {/* Left – Branding panel */}
        <div className="hidden lg:flex w-[45%] bg-gradient-to-br from-blue-600 to-cyan-500 flex-col items-center justify-center p-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-10 left-10 w-40 h-40 rounded-full border-4 border-white" />
            <div className="absolute bottom-10 right-10 w-24 h-24 rounded-full border-4 border-white" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full border-4 border-white" />
          </div>
          <div className="relative z-10 text-center">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-3xl font-bold bg-gradient-to-br from-blue-700 to-sky-400 bg-clip-text text-transparent leading-none select-none">i</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Investraders</h1>
            <p className="text-white/80 text-sm mb-10">Make Money Meanwhile -3M</p>
            <div className="w-px h-8 bg-white/30 mx-auto mb-8" />
            <p className="text-white/90 text-lg font-medium mb-2">New here?</p>
            <p className="text-white/70 text-sm mb-6">Join thousands of investors and innovators on our platform.</p>
            <Link
              to="/register"
              className="inline-block px-8 py-3 rounded-full border-2 border-white text-white font-semibold hover:bg-white hover:text-blue-600 transition-all duration-200"
            >
              Create Account
            </Link>
          </div>
        </div>

        {/* Right – Form panel */}
        <div className="flex-1 p-8 md:p-12 flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full">
            <h2 className="text-2xl font-bold text-foreground mb-1">Welcome back</h2>
            <p className="text-muted-foreground text-sm mb-8">Sign in to your Investraders account</p>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3 mb-5 border border-red-200">{error}</div>
            )}

            {/* Google sign-in */}
            <button
              onClick={handleGoogleLogin}
              type="button"
              className="w-full flex items-center justify-center gap-3 h-12 rounded-xl border border-border hover:bg-gray-50 transition-colors mb-5 font-medium text-sm text-foreground"
            >
              <GoogleIcon className="w-5 h-5" />
              Continue with Google
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or sign in with email</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Email Address</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                  required
                  className={`h-12 rounded-xl ${emailError ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                />
                {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  <Link to="/forgot-password" className="text-xs text-blue-600 hover:underline font-medium">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 rounded-xl pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-800 hover:to-blue-600 text-white font-semibold text-base shadow-md mt-2"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {/* Sign up link */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 font-medium hover:underline text-sm">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-8 text-white/70 text-xs">
        <span className="hover:text-white cursor-pointer">About us</span>
        <span className="hover:text-white cursor-pointer">Contact us</span>
        <span className="hover:text-white cursor-pointer">Support</span>
      </div>
    </div>
  );
}