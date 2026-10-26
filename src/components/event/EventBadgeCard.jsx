import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, 
  Download, 
  Calendar, 
  CheckCircle2, 
  Building2, 
  Briefcase, 
  LogIn, 
  UserPlus, 
  ShieldCheck, 
  Sparkles,
  Copy,
  User,
  MapPin,
  ExternalLink,
  QrCode
} from 'lucide-react';
import confetti from 'canvas-confetti';
import EventQRCode from './EventQRCode';
import html2canvas from 'html2canvas';

const CATEGORY_STYLES = {
  investor: {
    label: 'CAPITAL PROVIDER • VIP INVESTOR',
    color: 'from-amber-400 to-amber-600',
    border: 'border-amber-400',
    bg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    accent: '#f59e0b'
  },
  project: {
    label: 'CAPITAL SEEKER • PROJECT FOUNDER',
    color: 'from-emerald-400 to-teal-500',
    border: 'border-emerald-400',
    bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    accent: '#10b981'
  },
  institution: {
    label: 'OFFICIAL DELEGATE • INSTITUTIONAL',
    color: 'from-cyan-400 to-blue-600',
    border: 'border-cyan-400',
    bg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
    accent: '#06b6d4'
  },
  partner: {
    label: 'ECOSYSTEM PARTNER • ADVISOR',
    color: 'from-purple-400 to-indigo-500',
    border: 'border-purple-400',
    bg: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
    accent: '#a855f7'
  }
};

export default function EventBadgeCard({
  registration,
  isAuthenticated,
  user,
  onOpenLogin,
  onOpenRegister
}) {
  const badgeRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isAuthenticated && registration) {
      try {
        confetti({
          particleCount: 100,
          spread: 85,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }
  }, [isAuthenticated, registration]);

  if (!registration) return null;

  const { full_name, company, role, sector, photo_url, badge_code, email, category = 'investor' } = registration;
  const displayPassCode = badge_code || `INVESTRADE1-2027-${Math.floor(1000 + Math.random() * 9000)}`;
  const currentCategory = CATEGORY_STYLES[category] || CATEGORY_STYLES.investor;

  const qrPayload = JSON.stringify({
    passId: displayPassCode,
    name: full_name,
    email: email,
    company: company || 'Enterprise Delegate',
    role: role || 'Delegate',
    event: 'Investrade 1 — 1st Forum & Exhibition for Investment & Int. Cooperation',
    dates: '2027-04-20 / 2027-04-21',
    venue: 'Palais des Congrès, Tunis, Tunisia',
    status: 'VERIFIED_DELEGATE_PASS'
  });

  const handleDownloadBadge = async () => {
    if (!badgeRef.current) return;
    try {
      setDownloading(true);
      const canvas = await html2canvas(badgeRef.current, {
        scale: 3,
        backgroundColor: '#050B17',
        useCORS: true
      });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `Investrade1_VIP_Badge_${(full_name || 'Delegate').replace(/\s+/g, '_')}.png`;
      link.click();
    } catch (err) {
      console.error('Badge download failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(displayPassCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddToCalendar = () => {
    const title = encodeURIComponent("Investrade 1: 1st Forum & Exhibition for Investment & International Cooperation");
    const details = encodeURIComponent("North Africa’s premier international platform bridging high-impact projects, innovative startups, and expanding corporate enterprises with global investors, venture capitalists, sovereign funds, and financial institutions.\n\nPalais des Congrès, Tunis.\nPowered by Investraders (https://www.investraders.net)");
    const location = encodeURIComponent("Palais des Congrès, Avenue Habib Thameur, Tunis, Tunisia");
    const startTime = "20270420T080000Z";
    const endTime = "20270421T180000Z";
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}&location=${location}`;
    window.open(googleCalendarUrl, '_blank');
  };

  return (
    <div className="w-full max-w-md mx-auto my-4 font-sans text-center">
      
      {/* Outer Glow */}
      <div className="relative group">
        <div className={`absolute -inset-1 rounded-3xl opacity-70 blur-xl transition-all duration-700 ${
          isAuthenticated
            ? 'bg-gradient-to-r from-cyan-500 via-emerald-400 to-amber-500'
            : 'bg-gradient-to-r from-amber-500/40 via-purple-600/30 to-cyan-500/40'
        }`} />

        {/* Outer Card Frame */}
        <div className="relative rounded-3xl bg-[#070E1E] border border-cyan-500/30 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
          
          {/* Top Status Header */}
          <div className="bg-[#050A16] px-5 py-3 border-b border-white/10 text-white flex items-center justify-between gap-3 text-left">
            <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
              Official Delegate Pass
            </span>

            <div>
              {isAuthenticated ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified & Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Lock className="w-3.5 h-3.5" />
                  Member Access 🔒
                </span>
              )}
            </div>
          </div>

          {/* Printable Badge Target Canvas */}
          <div ref={badgeRef} className="p-6 bg-gradient-to-b from-[#091326] via-[#050C1A] to-[#040814] text-white relative rounded-2xl border border-white/10 shadow-2xl overflow-hidden m-3">
            
            {/* Lanyard Hole Punch Visual Indicator */}
            <div className="w-16 h-2 rounded-full bg-slate-900 border border-slate-700/60 mx-auto mb-4" />

            {/* Top Glowing Ambient Accents */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-400" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              
              {/* Summit Brand Header */}
              <div className="text-center border-b border-white/10 pb-4">
                <div className="flex items-center justify-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 font-black italic text-base shadow-[0_0_12px_rgba(6,182,212,0.6)]">
                    i
                  </div>
                  <span className="text-xl font-black tracking-tight text-white uppercase">
                    INVESTRADE <span className="text-cyan-400">1</span>
                  </span>
                </div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-300">
                  1st Forum & Exhibition for Investment & Int. Cooperation
                </p>
                <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-mono mt-1">
                  <span>📅 April 20 – 21, 2027</span>
                  <span>•</span>
                  <span>📍 Palais des Congrès, Tunis</span>
                </div>
              </div>

              {/* Attendee Category Ribbon */}
              <div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm inline-block ${currentCategory.bg}`}>
                  {currentCategory.label}
                </span>
              </div>

              {/* Delegate Photo in Circular Frame */}
              <div className="relative inline-block my-1">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-cyan-400/80 p-1 bg-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)] mx-auto overflow-hidden">
                  {photo_url ? (
                    <img src={photo_url} alt={full_name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-slate-900 flex flex-col items-center justify-center text-slate-400">
                      <User className="w-10 h-10 text-cyan-400/80" />
                    </div>
                  )}
                </div>
                <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#091326] flex items-center justify-center text-slate-950 text-xs font-black shadow">
                  ✓
                </span>
              </div>

              {/* Full Name & Role / Company Details */}
              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight uppercase leading-snug">
                  {full_name}
                </h3>
                {(company || role) && (
                  <p className="text-xs font-bold text-cyan-300 flex items-center justify-center gap-1.5 flex-wrap">
                    {role && <span>{role}</span>}
                    {role && company && <span>•</span>}
                    {company && <span className="text-slate-200">{company}</span>}
                  </p>
                )}
                {sector && (
                  <p className="text-[11px] font-medium text-slate-400">
                    Sector: {sector}
                  </p>
                )}
              </div>

              {/* QR Code Section */}
              <div className="pt-2 flex flex-col items-center justify-center">
                <div className="p-3 bg-white rounded-2xl border border-white/20 relative min-h-[140px] w-40 flex flex-col items-center justify-center shadow-2xl">
                  <AnimatePresence mode="wait">
                    {isAuthenticated ? (
                      <motion.div
                        key="unlocked-qr"
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        className="flex flex-col items-center"
                      >
                        <EventQRCode value={qrPayload} size={115} fgColor="#050C1A" bgColor="#FFFFFF" />
                        <span className="text-[9px] text-emerald-600 font-extrabold font-mono mt-1">
                          VIP ACCESS CONFIRMED ✓
                        </span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="locked-qr"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center text-center relative w-full"
                      >
                        <div className="relative p-1 filter blur-md opacity-25 select-none pointer-events-none">
                          <EventQRCode value={qrPayload} size={110} fgColor="#000000" bgColor="#FFFFFF" />
                        </div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-1">
                          <div className="w-8 h-8 rounded-full bg-slate-900 border border-amber-400 flex items-center justify-center text-amber-400 shadow-lg mb-1">
                            <Lock className="w-4 h-4 animate-bounce" />
                          </div>
                          <span className="text-[9px] font-bold text-slate-950 bg-amber-400 px-2 py-0.5 rounded-full shadow-sm">
                            Members Only 🔒
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Pass Code & Platform Watermark Footer */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-white/10 pt-3 font-mono">
                <span className="font-bold text-cyan-300">{displayPassCode}</span>
                <span className="text-slate-300 font-semibold tracking-wide">
                  POWERED BY INVESTRADERS.NET
                </span>
              </div>

            </div>
          </div>

          {/* Action Controls Footer */}
          <div className="bg-[#050A16] p-4 border-t border-white/10">
            {isAuthenticated ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleDownloadBadge}
                    disabled={downloading}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-50 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    {downloading ? 'Generating PNG...' : 'Download Pass (PNG)'}
                  </button>

                  <button
                    onClick={handleAddToCalendar}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    Add to Calendar
                  </button>
                </div>

                <button
                  onClick={handleCopyCode}
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all cursor-pointer self-end sm:self-auto"
                  title="Copy Pass Code"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-slate-900/90 via-[#0A1728] to-slate-900/90 p-4 rounded-2xl border border-cyan-500/30 space-y-3 text-left">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                    Activate Full QR Pass with Free Account
                  </span>
                  {email && <span className="text-[11px] text-cyan-400 font-mono truncate max-w-[200px]">{email}</span>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    onClick={onOpenLogin}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Sign In to Unlock Pass
                  </button>

                  <button
                    onClick={onOpenRegister}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-cyan-500/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
                    Join Platform Free
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
