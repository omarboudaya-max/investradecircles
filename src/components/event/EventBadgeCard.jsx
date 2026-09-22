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
  User
} from 'lucide-react';
import confetti from 'canvas-confetti';
import EventQRCode from './EventQRCode';
import html2canvas from 'html2canvas';

// ── Transparent Vector Logo for Wisdom Net / Investraders ──
const WisdomNetLogo = ({ className = "h-8 w-auto" }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
      <Sparkles className="w-4 h-4 text-white" />
    </div>
    <div className="text-left leading-none dir-ltr font-sans">
      <span className="text-[11px] font-black tracking-widest text-slate-900 block uppercase font-mono">WISDOM NET</span>
      <span className="text-[8px] font-bold tracking-wider text-cyan-600 uppercase block">INVESTRADERS</span>
    </div>
  </div>
);

// ── Transparent Vector Logo for UTICA ──
const UticaLogo = ({ className = "h-8 w-auto" }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-600 via-rose-600 to-amber-500 flex items-center justify-center text-white font-black text-xs border border-red-700 shadow-sm">
      <span className="font-serif tracking-tighter">UT</span>
    </div>
    <div className="text-right leading-none dir-rtl font-sans">
      <span className="text-[12px] font-black tracking-wider text-red-700 block font-serif">UTICA</span>
      <span className="text-[7px] font-bold text-slate-600 block">الإتحاد التونسي للصناعة والتجارة</span>
    </div>
  </div>
);

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

  const { full_name, company, role, sector, photo_url, badge_code, email } = registration;
  const displayPassCode = badge_code || `INV-2026-OCT13-${Math.floor(1000 + Math.random() * 9000)}`;
  const qrPayload = JSON.stringify({
    passId: displayPassCode,
    name: full_name,
    email: email,
    company: company || 'Enterprise',
    role: role || 'Delegate',
    eventDate: '2026-10-13',
    venue: 'UTICA HQ, Tunis',
    status: 'VERIFIED_INVITATION'
  });

  const handleDownloadBadge = async () => {
    if (!badgeRef.current) return;
    try {
      setDownloading(true);
      const canvas = await html2canvas(badgeRef.current, {
        scale: 3,
        backgroundColor: '#FFFFFF',
        useCORS: true
      });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `Investraders_WisdomNet_Badge_${full_name.replace(/\s+/g, '_')}.png`;
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
    const title = encodeURIComponent("التمكين الرقمي للمؤسسات التونسية في عصر الذكاء الاصطناعي - Wisdom Net & UTICA");
    const details = encodeURIComponent("الملتقى الوطني للتكمين الرقمي والتكامل الاقتصادي في تونس. المكان: مقر الاتحاد التونسي للصناعة والتجارة والصناعات التقليدية UTICA.");
    const location = encodeURIComponent("UTICA HQ, Cité El Khadra, Tunis");
    const startTime = "20261013T073000Z";
    const endTime = "20261013T113000Z";
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}&location=${location}`;
    window.open(googleCalendarUrl, '_blank');
  };

  return (
    <div className="w-full max-w-lg mx-auto my-4 font-sans text-center">
      
      {/* Outer Glow */}
      <div className="relative group">
        <div className={`absolute -inset-0.5 rounded-3xl opacity-60 blur-lg transition-all duration-700 ${
          isAuthenticated
            ? 'bg-gradient-to-r from-cyan-500 via-emerald-400 to-blue-600'
            : 'bg-gradient-to-r from-amber-500/50 via-purple-600/40 to-cyan-500/50'
        }`} />

        {/* Outer Container */}
        <div className="relative rounded-3xl bg-slate-900 border border-slate-700 overflow-hidden shadow-2xl backdrop-blur-xl">
          
          {/* Top Status Header */}
          <div className="bg-slate-900 px-5 py-3 border-b border-slate-800 text-white flex items-center justify-between gap-3 text-right dir-rtl">
            <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              معاينة الشارة الرقمية • Pass Officiel
            </span>

            <div>
              {isAuthenticated ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  مفعّلة وصالحة
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  <Lock className="w-3.5 h-3.5" />
                  خاصة بالأعضاء 🔒
                </span>
              )}
            </div>
          </div>

          {/* Badge Content Target (Pure White Corporate Pass) */}
          <div ref={badgeRef} className="p-6 sm:p-8 bg-white text-slate-900 relative rounded-2xl border-2 border-slate-200 shadow-xl overflow-hidden m-3">
            
            {/* Top Accent Ribbon */}
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-red-600 via-cyan-500 to-blue-600" />
            <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

            <div className="relative z-10 space-y-4">
              
              {/* Header Logos: Top Right = Wisdom Net, Top Left = UTICA */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dir-ltr">
                {/* Top Left: UTICA Logo */}
                <UticaLogo />

                {/* Top Right: Wisdom Net Logo */}
                <WisdomNetLogo />
              </div>

              {/* Event Subheader */}
              <div>
                <span className="px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 font-mono text-[10px] font-bold border border-cyan-200 inline-block uppercase tracking-wider">
                  Badge Officiel d'Accès • Official Pass
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-slate-800 mt-1">
                  التمكين الرقمي للمؤسسات التونسية في عصر الذكاء الاصطناعي
                </h4>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                  UTICA HQ • 13 OCTOBRE 2026 • TUNIS
                </p>
              </div>

              {/* Delegate Photo in Circular Frame */}
              <div className="relative inline-block my-1">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-cyan-500 p-0.5 bg-white shadow-xl mx-auto overflow-hidden">
                  {photo_url ? (
                    <img src={photo_url} alt={full_name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-slate-100 flex flex-col items-center justify-center text-slate-400">
                      <User className="w-12 h-12 text-slate-400" />
                    </div>
                  )}
                </div>
                <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow">
                  ✓
                </span>
              </div>

              {/* Full Name & Role / Company Details */}
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                  {full_name}
                </h3>
                {(company || role) && (
                  <p className="text-xs sm:text-sm font-bold text-cyan-700">
                    {role && <span>{role}</span>} {role && company && <span>•</span>} {company && <span>{company}</span>}
                  </p>
                )}
                {sector && (
                  <p className="text-[11px] font-medium text-slate-500">
                    {sector}
                  </p>
                )}
              </div>

              {/* QR Code Positioned DIRECTLY UNDER THE NAME */}
              <div className="pt-2 flex flex-col items-center justify-center">
                <div className="p-3 bg-slate-50 rounded-2xl border-2 border-slate-200 relative min-h-[150px] w-44 flex flex-col items-center justify-center shadow-inner">
                  <AnimatePresence mode="wait">
                    {isAuthenticated ? (
                      <motion.div
                        key="unlocked-qr"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex flex-col items-center"
                      >
                        <EventQRCode value={qrPayload} size={120} fgColor="#000000" bgColor="#FFFFFF" />
                        <span className="text-[9px] text-emerald-600 font-bold font-mono mt-1">
                          ACCÈS CONFIRMÉ ✓
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
                        {/* Blurred QR Code preview */}
                        <div className="relative p-1 filter blur-md opacity-30 select-none pointer-events-none">
                          <EventQRCode value={qrPayload} size={110} fgColor="#000000" bgColor="#FFFFFF" />
                        </div>
                        {/* Lock Icon Banner over blurred QR */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-1">
                          <div className="w-8 h-8 rounded-full bg-slate-900 border border-amber-400 flex items-center justify-center text-amber-400 shadow-lg mb-1">
                            <Lock className="w-4 h-4 animate-bounce" />
                          </div>
                          <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300 shadow-sm">
                            خاصة بالأعضاء 🔒
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Watermark & Serial Code Footer */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-200 pt-3 font-mono">
                <span className="font-bold text-slate-700">{displayPassCode}</span>
                <span className="text-cyan-700 font-bold uppercase">WISDOM NET × UTICA</span>
              </div>

            </div>
          </div>

          {/* Action Footer */}
          <div className="bg-slate-950 p-4 border-t border-slate-800">
            {isAuthenticated ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleDownloadBadge}
                    disabled={downloading}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)] disabled:opacity-50 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    {downloading ? 'جاري التحميل...' : 'Télécharger le Badge (PNG)'}
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
              <div className="bg-gradient-to-r from-slate-900 via-[#0A1728] to-slate-900 p-4 rounded-2xl border border-cyan-500/30 space-y-3 text-right dir-rtl">
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

