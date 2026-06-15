import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TrendingUp, ArrowLeft, MailCheck } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' });
      if (error) throw error;
    } catch {
      // Always show success for security
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-120px] right-[-60px] w-[320px] h-[320px] rounded-full bg-white/10 blur-xl" />
      <div className="absolute bottom-[-100px] left-[-70px] w-[280px] h-[280px] rounded-full bg-white/10 blur-xl" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 md:p-12 relative z-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-blue-700">Investraders</span>
        </div>

        {sent ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-5">
              <MailCheck className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">Check your inbox</h2>
            <p className="text-muted-foreground text-sm mb-6">
              If an account exists for <span className="font-semibold text-foreground">{email}</span>, we've sent a password reset link.
            </p>
            <Link to="/login" className="inline-flex items-center gap-2 text-blue-600 font-medium hover:underline text-sm">
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-2">Forgot password?</h2>
            <p className="text-muted-foreground text-sm mb-8">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Email Address</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 rounded-xl"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 text-white font-semibold shadow-md"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>

            <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-blue-600 hover:underline mt-6">
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </Link>
          </>
        )}
      </div>
    </div>
  );
}