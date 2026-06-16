import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TrendingUp, Check, ChevronRight, ChevronLeft } from 'lucide-react';
import GoogleIcon from '@/components/GoogleIcon';

const DOMAINS = [
{ id: 'stocks', label: '📈 Stocks & Equities' },
{ id: 'crypto', label: '₿ Cryptocurrency' },
{ id: 'real_estate', label: '🏠 Real Estate' },
{ id: 'venture_capital', label: '🚀 Venture Capital' },
{ id: 'startups', label: '💡 Startups & Innovation' },
{ id: 'commodities', label: '🛢 Commodities' },
{ id: 'forex', label: '💱 Forex & Currency' },
{ id: 'fintech', label: '🏦 FinTech' },
{ id: 'blockchain', label: '🔗 Blockchain & Web3' },
{ id: 'esg', label: '🌱 ESG & Impact Investing' },
{ id: 'private_equity', label: '🏢 Private Equity' },
{ id: 'derivatives', label: '📊 Derivatives & Options' }];


const USER_TYPES = [
{ id: 'investor', label: '💼 Investor', desc: 'I invest in businesses, assets or markets' },
{ id: 'innovator', label: '🚀 Innovator', desc: 'I build products, startups or solutions' },
{ id: 'other', label: '🌐 Other', desc: 'I have a different role or I\'m exploring' }];


const STEP_LABELS = ['Account', 'Personal', 'Role', 'Interests', 'Verify'];

export default function Register() {
  const [step, setStep] = useState(1); // 1=account, 2=personal, 3=role, 4=interests, 5=otp
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [userType, setUserType] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [interests, setInterests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleInterest = (id) => {
    setInterests((prev) =>
    prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleGoogleSignUp = () => {
    supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
  };

  const handleStep1 = (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {setError('Passwords do not match');return;}
    if (password.length < 8) {setError('Password must be at least 8 characters');return;}
    setStep(2);
  };

  const handleStep2 = (e) => {
    e.preventDefault();
    setError('');
    if (!firstName.trim() || !lastName.trim()) {setError('Please enter your full name');return;}
    if (!dob) {setError('Please enter your date of birth');return;}
    setStep(3);
  };

  const handleStep3 = (e) => {
    e.preventDefault();
    setError('');
    if (!userType) {setError('Please select your role');return;}
    setStep(4);
  };

  const handleStep4 = async (e) => {
    e.preventDefault();
    setError('');
    if (interests.length === 0) {setError('Please select at least one area of interest');return;}
    setLoading(true);
    try {
      const { error: signUpError } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            date_of_birth: dob,
            user_type: userType,
            business_type: businessType || undefined,
            interests
          }
        }
      });
      if (signUpError) throw signUpError;
      setStep(5);
    } catch (err) {
      console.error("Signup error:", err);
      setError(err?.message === '{}' ? 'You may have exceeded the email rate limit (3 per hour) on the free plan.' : (err?.message || 'Registration failed'));
    } finally {
      setLoading(false);
    }
  };

  // OTP verification removed in favor of Magic Link / Confirmation URL

  const handleResendOtp = async () => {
    try { await supabase.auth.resend({ type: 'signup', email }); } catch {/* silent */}
  };

  const stepProgress = (step - 1) / (STEP_LABELS.length - 1) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-120px] right-[-60px] w-[320px] h-[320px] rounded-full bg-white/10 blur-xl" />
      <div className="absolute bottom-[-100px] left-[-70px] w-[280px] h-[280px] rounded-full bg-white/10 blur-xl" />

      <div className="w-full max-w-[920px] bg-white rounded-3xl shadow-2xl overflow-hidden flex min-h-[600px] relative z-10">

        {/* Left – Branding */}
        <div className="hidden lg:flex w-[40%] bg-gradient-to-br from-blue-600 to-cyan-500 flex-col items-center justify-center p-10 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-40 h-40 rounded-full border-4 border-white" />
            <div className="absolute bottom-10 right-10 w-24 h-24 rounded-full border-4 border-white" />
          </div>
          <div className="relative z-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Investraders</h1>
            <p className="text-white/80 text-sm mb-10">Make Money Meanwhile -3M</p>
            <div className="w-px h-8 bg-white/30 mx-auto mb-8" />
            <p className="text-white/90 font-medium mb-2">Already have an account?</p>
            <Link
              to="/login"
              className="inline-block px-8 py-3 rounded-full border-2 border-white text-white font-semibold hover:bg-white hover:text-blue-600 transition-all duration-200">
              
              Sign In
            </Link>
          </div>
        </div>

        {/* Right – Step form */}
        <div className="flex-1 p-8 md:p-10 flex flex-col">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {STEP_LABELS.map((label, i) =>
              <span
                key={label}
                className={`text-xs font-medium transition-colors ${i + 1 <= step ? 'text-blue-600' : 'text-muted-foreground'}`}>
                
                  {label}
                </span>
              )}
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${stepProgress}%` }} />
              
            </div>
          </div>

          {error &&
          <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3 mb-5 border border-red-200">{error}</div>
          }

          {/* Step 1 – Account credentials */}
          {step === 1 &&
          <div className="flex-1 flex flex-col">
              <h2 className="text-2xl font-bold mb-1">Create your account</h2>
              <p className="text-muted-foreground text-sm mb-6">Start with your email and a secure password</p>

              <button
              onClick={handleGoogleSignUp}
              type="button"
              className="w-full flex items-center justify-center gap-3 h-12 rounded-xl border border-border hover:bg-gray-50 transition-colors mb-5 font-medium text-sm">
              
                <GoogleIcon className="w-5 h-5" />
                Sign up with Google
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">or with email</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <form onSubmit={handleStep1} className="space-y-4 flex-1">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Email Address</label>
                  <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12 rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Password</label>
                  <Input type="password" placeholder="Min. 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} required className="h-12 rounded-xl" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Confirm Password</label>
                  <Input type="password" placeholder="Repeat password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="h-12 rounded-xl" />
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 text-white font-semibold shadow-md mt-2">
                  Continue <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-5">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 font-medium hover:underline text-sm">Sign in</Link>
              </p>
            </div>
          }

          {/* Step 2 – Personal info */}
          {step === 2 &&
          <div className="flex-1 flex flex-col">
              <h2 className="text-2xl font-bold mb-1">Personal Information</h2>
              <p className="text-muted-foreground text-sm mb-6">Tell us a little about yourself</p>

              <form onSubmit={handleStep2} className="space-y-4 flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">First Name</label>
                    <Input placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="h-12 rounded-xl" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Last Name</label>
                    <Input placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="h-12 rounded-xl" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Date of Birth</label>
                  <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} required className="h-12 rounded-xl" />
                </div>

                <div className="flex gap-3 mt-auto pt-2">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 h-12 rounded-xl">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button type="submit" className="flex-1 h-12 rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 text-white font-semibold shadow-md">
                    Continue <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </form>
            </div>
          }

          {/* Step 3 – Role */}
          {step === 3 &&
          <div className="flex-1 flex flex-col">
              <h2 className="text-2xl font-bold mb-1">What describes you best?</h2>
              <p className="text-muted-foreground text-sm mb-6">This helps us tailor your experience</p>

              <form onSubmit={handleStep3} className="flex-1 flex flex-col">
                <div className="space-y-3 flex-1">
                  {USER_TYPES.map((type) =>
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setUserType(type.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                  userType === type.id ?
                  'border-blue-600 bg-blue-50' :
                  'border-border hover:border-blue-200 hover:bg-gray-50'}`
                  }>
                  
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${userType === type.id ? 'border-blue-600 bg-blue-600' : 'border-gray-300'}`}>
                        {userType === type.id && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{type.label}</p>
                        <p className="text-xs text-muted-foreground">{type.desc}</p>
                      </div>
                    </button>
                )}
                </div>

                <div className="flex gap-3 mt-6">
                  <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1 h-12 rounded-xl">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button type="submit" className="flex-1 h-12 rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 text-white font-semibold shadow-md">
                    Continue <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </form>
            </div>
          }

          {/* Step 4 – Interests */}
          {step === 4 &&
          <div className="flex-1 flex flex-col">
              <h2 className="text-2xl font-bold mb-1">Select your interests</h2>
              <p className="text-muted-foreground text-sm mb-4">We'll suggest relevant circles based on your choices</p>

              <form onSubmit={handleStep4} className="flex-1 flex flex-col">
                <div className="grid grid-cols-2 gap-2 flex-1">
                  {DOMAINS.map((d) =>
                <button
                  key={d.id}
                  type="button"
                  onClick={() => toggleInterest(d.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all text-left ${
                  interests.includes(d.id) ?
                  'border-blue-600 bg-blue-50 text-blue-700' :
                  'border-border hover:border-blue-200 text-foreground'}`
                  }>
                  
                      {interests.includes(d.id) && <Check className="w-3.5 h-3.5 shrink-0 text-blue-600" />}
                      <span className="truncate">{d.label}</span>
                    </button>
                )}
                </div>
                <p className="text-xs text-muted-foreground mt-3 mb-4">{interests.length} selected</p>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(3)} className="flex-1 h-12 rounded-xl">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1 h-12 rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 text-white font-semibold shadow-md">
                    {loading ? 'Creating account...' : <>Finish <ChevronRight className="w-4 h-4 ml-1" /></>}
                  </Button>
                </div>
              </form>
            </div>
          }

          {/* Step 5 – OTP Verification */}
          {step === 5 &&
          <div className="flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-5">
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Verify your email</h2>
              <p className="text-muted-foreground text-sm mb-6">
                We sent a verification code to<br />
                <span className="font-semibold text-foreground">{email}</span>
              </p>

              <div className="w-full max-w-xs space-y-4">
                <p className="text-sm text-slate-600 mb-6">Please check your inbox and click the secure link to activate your account.</p>
                <Link to="/login" className="w-full block">
                  <Button type="button" className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 text-white font-semibold shadow-md">
                    Return to Login
                  </Button>
                </Link>
                <button type="button" onClick={handleResendOtp} className="text-sm text-blue-600 hover:underline w-full mt-4">
                  Resend confirmation email
                </button>
              </div>
            </div>
          }
        </div>
      </div>

      <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-8 text-white/70 text-xs">
        <span className="hover:text-white cursor-pointer">About us</span>
        <span className="hover:text-white cursor-pointer">Contact us</span>
        <span className="hover:text-white cursor-pointer">Support</span>
      </div>
    </div>);

}