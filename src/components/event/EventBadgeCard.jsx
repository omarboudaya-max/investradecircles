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
  Copy
} from 'lucide-react';
import confetti from 'canvas-confetti';
import EventQRCode from './EventQRCode';
import html2canvas from 'html2canvas';

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
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }
  }, [isAuthenticated, registration]);

  if (!registration) return null;

  const { full_name, company, role, sector, badge_code, email } = registration;
  const displayPassCode = badge_code || `INV-2026-OCT7-${Math.floor(1000 + Math.random() * 9000)}`;
  const qrPayload = JSON.stringify({
    passId: displayPassCode,
    name: full_name,
    email: email,
    company: company || 'Enterprise',
    role: role || 'Delegate',
    eventDate: '2026-10-07',
    venue: 'UTICA HQ, Tunis',
    status: 'VERIFIED_INVITATION'
  });

  const handleDownloadBadge = async () => {
    if (!badgeRef.current) return;
    try {
      setDownloading(true);
      const canvas = await html2canvas(badgeRef.current, {
        scale: 2,
        backgroundColor: '#030914',
        useCORS: true
      });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `Investraders_Event_Badge_${full_name.replace(/\s+/g, '_')}.png`;
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
    const title = encodeURIComponent("التمكين الرقمي للمؤسسات التونسية في عصر الذكاء الاصطناعي - Investraders & UTICA");
    const details = encodeURIComponent("الملتقى الوطني للتكمين الرقمي والتكامل الاقتصادي في تونس. المكان: مقر الاتحاد التونسي للصناعة والتجارة والصناعات التقليدية UTICA.");
    const location = encodeURIComponent("UTICA HQ, Cité El Khadra, Tunis");
    const startTime = "20261007T073000Z";
    const endTime = "20261007T113000Z";
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}&location=${location}`;
    window.open(googleCalendarUrl, '_blank');
  };

  return (
    <div className="w-full max-w-xl mx-auto my-4 font-sans dir-rtl text-right">
      
      {/* Outer Card Glow */}
      <div className="relative group">
        <div className={`absolute -inset-0.5 rounded-3xl opacity-60 blur-lg transition-all duration-700 ${
          isAuthenticated
            ? 'bg-gradient-to-r from-cyan-500 via-emerald-400 to-blue-600'
            : 'bg-gradient-to-r from-amber-500/50 via-purple-600/40 to-cyan-500/50'
        }`} />

        {/* Badge Card Main Structure */}
        <div className="relative rounded-3xl bg-[#06101E] border border-cyan-500/30 overflow-hidden shadow-2xl backdrop-blur-xl">
          
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-cyan-950/90 via-[#0A1A30] to-indigo-950/90 px-5 py-4 border-b border-cyan-500/20 text-white flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 font-bold font-serif text-lg shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                i
              </div>
              <div>
                <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-cyan-400 uppercase block">
                  Investraders × UTICA
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  الملتقى الوطني 07 أكتوبر 2026
                </h3>
              </div>
            </div>

            {/* Status Pill */}
            <div>
              {isAuthenticated ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  شارة عضو مفعّلة وصالحة
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  <Lock className="w-3.5 h-3.5" />
                  خاصة بالأعضاء 🔒 (يتطلب حساب)
                </span>
              )}
            </div>
          </div>

          {/* Badge Content (Target for PNG download) */}
          <div ref={badgeRef} className="p-4 sm:p-7 bg-[#06101E] relative">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />

            <div className="relative z-10 space-y-5">
              
              {/* Event Subheader */}
              <div className="text-center border-b border-slate-800/80 pb-3">
                <p className="text-cyan-300 text-xs sm:text-sm font-semibold">
                  التمكين الرقمي للمؤسسات التونسية في عصر الذكاء الاصطناعي
                </p>
                <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
                  UTICA HQ • 07 Octobre 2026 • 08:30 AM
                </span>
              </div>

              {/* Participant Profile Details & QR Section */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center bg-slate-900/80 p-4 sm:p-5 rounded-2xl border border-cyan-500/20">
                
                {/* Profile Details */}
                <div className="sm:col-span-7 md:col-span-8 space-y-2.5 text-right">
                  <div>
                    <span className="text-[10px] sm:text-xs text-cyan-400 font-medium block">اسم المشارك / Delegate</span>
                    <h4 className="text-lg sm:text-2xl font-black text-white tracking-wide break-words">
                      {full_name}
                    </h4>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                    {company && (
                      <div className="flex items-center gap-1 bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-700">
                        <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate max-w-[140px] sm:max-w-none">{company}</span>
                      </div>
                    )}
                    {role && (
                      <div className="flex items-center gap-1 bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-700">
                        <Briefcase className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate max-w-[140px] sm:max-w-none">{role}</span>
                      </div>
                    )}
                  </div>

                  {sector && (
                    <div className="text-[11px] text-slate-400">
                      القطاع: <span className="text-cyan-300 font-medium">{sector}</span>
                    </div>
                  )}

                  {/* Serial Code */}
                  <div className="pt-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-black/70 border border-cyan-500/30 font-mono text-xs text-cyan-300">
                      <span className="text-slate-400 text-[10px]">رمز التذكرة:</span>
                      <span className="font-bold text-white tracking-wider">{displayPassCode}</span>
                    </div>
                  </div>
                </div>

                {/* QR Code Container with Blurred Pass State for Non-Members */}
                <div className="sm:col-span-5 md:col-span-4 flex flex-col items-center justify-center p-3 bg-black/50 rounded-2xl border border-cyan-500/30 relative min-h-[160px] overflow-hidden">
                  <AnimatePresence mode="wait">
                    {isAuthenticated ? (
                      <motion.div
                        key="unlocked-qr"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex flex-col items-center"
                      >
                        <EventQRCode value={qrPayload} size={120} fgColor="#00F0FF" bgColor="#050D1A" />
                        <span className="text-[10px] text-cyan-400 font-mono mt-2">
                          رمز الدخول الرسمي للأعضاء ✓
                        </span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="locked-qr"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center text-center p-1 relative w-full"
                      >
                        {/* Blurred QR Code preview */}
                        <div className="relative p-1 filter blur-md opacity-30 select-none pointer-events-none">
                          <EventQRCode value={qrPayload} size={110} fgColor="#00F0FF" bgColor="#050D1A" />
                        </div>
                        {/* Lock Icon Banner over blurred QR */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-2">
                          <div className="w-10 h-10 rounded-full bg-slate-900/90 border border-amber-400/50 flex items-center justify-center text-amber-400 shadow-lg mb-1">
                            <Lock className="w-5 h-5 animate-bounce" />
                          </div>
                          <span className="text-[10px] font-bold text-amber-300 bg-black/80 px-2 py-1 rounded-full border border-amber-500/30 shadow-md">
                            خاصة بالأعضاء 🔒
                          </span>
                          <span className="text-[9px] text-slate-300 mt-1">
                            سجل الدخول لعرض الشارة
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>

              {/* Watermark Footer */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-3">
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  دعوة رسمية مؤكدة
                </span>
                <span className="font-mono text-slate-400 text-[10px]">WWW.INVESTRADERS.NET</span>
              </div>

            </div>
          </div>

          {/* Action Section */}
          <div className="bg-slate-950 p-4 border-t border-cyan-500/20">
            {isAuthenticated ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleDownloadBadge}
                    disabled={downloading}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)] disabled:opacity-50 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    {downloading ? 'جاري التحميل...' : 'تحميل الشارة (PNG)'}
                  </button>

                  <button
                    onClick={handleAddToCalendar}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    التقويم
                  </button>
                </div>

                <button
                  onClick={handleCopyCode}
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all cursor-pointer self-end sm:self-auto"
                  title="نسخ رمز التذكرة"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            ) : (
              /* Account Action Card when unauthenticated */
              <div className="bg-gradient-to-r from-slate-900 via-[#0A1728] to-slate-900 p-4 rounded-2xl border border-cyan-500/30 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                    تفعيل الشارة المكشوفة متاح حصرياً للأعضاء
                  </span>
                  {email && <span className="text-[11px] text-cyan-400 font-mono truncate max-w-[200px]">{email}</span>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    onClick={onOpenLogin}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    تسجيل الدخول كعضو
                  </button>

                  <button
                    onClick={onOpenRegister}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-cyan-500/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
                    انضمام كعضو جديد
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
