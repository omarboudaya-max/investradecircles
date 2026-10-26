import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Calendar, 
  Clock, 
  MapPin, 
  Building2, 
  CheckCircle2, 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Globe, 
  ShieldCheck, 
  Zap, 
  Award, 
  Cpu, 
  Network, 
  Users, 
  Scan,
  Ticket,
  Camera,
  Layers,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  Handshake,
  Compass,
  Rocket,
  Check,
  ChevronRight,
  Share2
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import WebsiteNavbar from '@/components/layout/WebsiteNavbar';
import WebsiteFooter from '@/components/layout/WebsiteFooter';
import EventBadgeCard from '@/components/event/EventBadgeCard';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { getEventTranslations } from '@/lib/i18n/investradeEventTranslations';

export default function EventRegistrationLanding() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language, setPreference, preference, isArabic, isRTL, dir } = useLanguage();

  // If user passes ?lang=ar or ?lang=fr or ?lang=en in the URL, switch to that language
  useEffect(() => {
    const urlLang = searchParams.get('lang');
    if (urlLang && ['ar', 'fr', 'en'].includes(urlLang.toLowerCase())) {
      setPreference(urlLang.toLowerCase());
    }
  }, [searchParams, setPreference]);

  const t = getEventTranslations(language);

  // Selected Attendee Category
  const [selectedCategory, setSelectedCategory] = useState('investor');

  // Registration Form State
  const [formData, setFormData] = useState({
    fullName: user?.user_metadata?.full_name || user?.full_name || '',
    email: user?.email || '',
    phone: '',
    company: '',
    role: '',
    sector: 'Technology & AI',
    photoPreview: user?.user_metadata?.avatar_url || user?.avatar_url || null,
    photoFile: null,
  });

  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(null);
  const [selectedDay, setSelectedDay] = useState(1);

  // Live Countdown to April 20, 2027
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const targetDate = new Date('2027-04-20T08:30:00+01:00').getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check if user already registered previously in localStorage
  useEffect(() => {
    const savedReg = localStorage.getItem('investraders_investrade1_event_reg');
    if (savedReg) {
      try {
        const parsed = JSON.parse(savedReg);
        setRegistrationSuccess(parsed);
      } catch (e) {}
    }
  }, []);

  // Sync profile details if authenticated user loads page
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || user.full_name || user.user_metadata?.full_name || '',
        email: prev.email || user.email || '',
        photoPreview: prev.photoPreview || user.avatar_url || user.user_metadata?.avatar_url || null
      }));
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 500;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL('image/jpeg', 0.88);
          setFormData(prev => ({
            ...prev,
            photoPreview: compressed,
            photoFile: file
          }));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const normalizedEmail = formData.email.trim().toLowerCase();
    const finalPhotoUrl = formData.photoPreview;

    let memberUserId = user?.id || null;
    let isMember = !!user;

    if (!memberUserId) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', normalizedEmail)
          .maybeSingle();
        if (profile?.id) {
          memberUserId = profile.id;
          isMember = true;
        }
      } catch (e) {}
    }

    const badgeCode = `INVESTRADE1-2027-${Math.floor(1000 + Math.random() * 9000)}`;
    const regPayload = {
      full_name: formData.fullName.trim(),
      email: normalizedEmail,
      phone: formData.phone.trim(),
      company: formData.company.trim() || 'Independent Partner',
      role: formData.role.trim() || 'Delegate',
      sector: formData.sector,
      photo_url: finalPhotoUrl,
      badge_code: badgeCode,
      user_id: memberUserId,
      is_member: isMember,
      status: 'confirmed',
      created_at: new Date().toISOString()
    };

    try {
      const { data: existingReg } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (existingReg) {
        const updatePayload = {
          full_name: formData.fullName || existingReg.full_name,
          phone: formData.phone || existingReg.phone,
          company: formData.company || existingReg.company,
          role: formData.role || existingReg.role,
          sector: formData.sector || existingReg.sector,
          photo_url: finalPhotoUrl || existingReg.photo_url,
          user_id: memberUserId || existingReg.user_id,
          is_member: isMember || existingReg.is_member,
        };

        const { data: updatedReg } = await supabase
          .from('event_registrations')
          .update(updatePayload)
          .eq('id', existingReg.id)
          .select()
          .single();

        const finalRecord = { ...(updatedReg || existingReg), category: selectedCategory };
        localStorage.setItem('investraders_investrade1_event_reg', JSON.stringify(finalRecord));
        setRegistrationSuccess(finalRecord);
      } else {
        const { data: newReg, error: insertErr } = await supabase
          .from('event_registrations')
          .insert([regPayload])
          .select()
          .single();

        const finalRecord = { ...((!insertErr && newReg) ? newReg : regPayload), category: selectedCategory };
        localStorage.setItem('investraders_investrade1_event_reg', JSON.stringify(finalRecord));
        setRegistrationSuccess(finalRecord);
      }
    } catch (err) {
      console.warn('Registration saved locally:', err);
      const fallbackRecord = { ...regPayload, category: selectedCategory };
      localStorage.setItem('investraders_investrade1_event_reg', JSON.stringify(fallbackRecord));
      setRegistrationSuccess(fallbackRecord);
    } finally {
      setLoading(false);
      setTimeout(() => {
        document.getElementById('badge-preview-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  };

  const handleAddToCalendar = () => {
    const title = encodeURIComponent(t.meta.title);
    const details = encodeURIComponent(`${t.hero.description}\n\n${t.meta.venue}\n${t.meta.platform} (${t.meta.platformUrl})`);
    const location = encodeURIComponent(t.meta.venue);
    const startTime = "20270420T080000Z";
    const endTime = "20270421T180000Z";
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}&location=${location}`;
    window.open(googleCalendarUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 overflow-x-hidden" dir={dir}>
      <WebsiteNavbar />

      {/* Floating In-Page Language Switcher Bar */}
      <div className="w-full bg-[#040a18]/90 border-b border-cyan-500/20 py-2.5 px-4 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-2 text-slate-300">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold">{t.languageSelector.switchPrompt}:</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setPreference('en')}
              className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                language === 'en' && preference !== 'auto'
                  ? 'bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                  : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setPreference('fr')}
              className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                language === 'fr' && preference !== 'auto'
                  ? 'bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                  : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Français
            </button>
            <button
              onClick={() => setPreference('ar')}
              className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                language === 'ar' && preference !== 'auto'
                  ? 'bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                  : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              العربية
            </button>
            <button
              onClick={() => setPreference('auto')}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                preference === 'auto'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Automatically detect based on browser / system language"
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>{t.languageSelector.auto}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 pb-20 sm:pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[350px] sm:h-[500px] bg-gradient-to-tr from-cyan-600/20 via-emerald-600/15 to-purple-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-12 right-10 w-72 h-72 bg-amber-500/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 text-center">
          
          {/* Top Event Badge */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 border border-cyan-500/40 text-cyan-300 text-xs sm:text-sm font-semibold mb-6 shadow-[0_0_25px_rgba(6,182,212,0.25)] backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>{t.hero.badge}</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-tight mb-4"
          >
            {t.hero.headingMain}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-300 bg-clip-text text-transparent max-w-3xl mx-auto mb-6"
          >
            {t.hero.headingSub}
          </motion.p>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-base sm:text-lg text-slate-300 max-w-4xl mx-auto mb-10 leading-relaxed font-normal"
          >
            {t.hero.description}
          </motion.p>

          {/* Key Facts Pill Grid */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto mb-12 text-left rtl:text-right"
          >
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/20 backdrop-blur-md flex items-center gap-3.5 shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/30">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  {isArabic ? 'تاريخ المنتدى' : (language === 'fr' ? 'Dates du Sommet' : 'Summit Dates')}
                </span>
                <span className="text-sm sm:text-base font-extrabold text-white">{t.meta.dates}</span>
                <span className="text-[10px] text-cyan-300 block font-medium">
                  {isArabic ? 'يومان مكثفان' : (language === 'fr' ? '2 Journées Intensives' : '2 High-Intensity Days')}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/20 backdrop-blur-md flex items-center gap-3.5 shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  {isArabic ? 'المقر الرسمي' : (language === 'fr' ? 'Lieu Officiel' : 'Official Venue')}
                </span>
                <span className="text-sm sm:text-base font-extrabold text-white">{t.meta.venueShort}</span>
                <span className="text-[10px] text-emerald-300 block font-medium">
                  {isArabic ? 'الجمهورية التونسية' : (language === 'fr' ? 'Tunis, Tunisie' : 'Tunis, Tunisia')}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-amber-500/20 backdrop-blur-md flex items-center gap-3.5 shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  {isArabic ? 'المنصة الرقمية' : (language === 'fr' ? 'Plateforme Numérique' : 'Digital Platform')}
                </span>
                <span className="text-sm sm:text-base font-extrabold text-white">{t.meta.platform}</span>
                <span className="text-[10px] text-amber-300 block font-medium">www.investraders.net</span>
              </div>
            </div>
          </motion.div>

          {/* Live Countdown Timer */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="max-w-2xl mx-auto mb-10 p-5 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-2xl"
          >
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest block mb-1">
              {t.countdown.title}
            </span>
            <p className="text-[11px] text-slate-400 mb-4 font-mono">
              {t.countdown.subtitle}
            </p>
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/10">
                <div className="text-2xl sm:text-4xl font-black text-white">{timeLeft.days}</div>
                <div className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase">{t.countdown.days}</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/10">
                <div className="text-2xl sm:text-4xl font-black text-white">{timeLeft.hours}</div>
                <div className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase">{t.countdown.hours}</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/10">
                <div className="text-2xl sm:text-4xl font-black text-white">{timeLeft.minutes}</div>
                <div className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase">{t.countdown.minutes}</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/10">
                <div className="text-2xl sm:text-4xl font-black text-cyan-400 animate-pulse">{timeLeft.seconds}</div>
                <div className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase">{t.countdown.seconds}</div>
              </div>
            </div>
          </motion.div>

          {/* Action CTAs */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <a
              href="#register-section"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-500 hover:from-cyan-300 hover:to-emerald-400 text-slate-950 font-black text-sm shadow-[0_0_25px_rgba(6,182,212,0.45)] transition-all flex items-center justify-center gap-2 hover:scale-105"
            >
              <Ticket className="w-5 h-5" />
              <span>{t.hero.registerBtn}</span>
            </a>

            <button
              onClick={handleAddToCalendar}
              className="w-full sm:w-auto px-7 py-4 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-bold text-sm border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>{t.hero.calendarBtn}</span>
            </button>

            <a
              href="#schedule-section"
              className="w-full sm:w-auto px-6 py-4 rounded-full bg-white/5 hover:bg-white/10 text-cyan-300 font-bold text-sm border border-cyan-500/30 transition-all flex items-center justify-center gap-2"
            >
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>{t.hero.agendaBtn}</span>
            </a>
          </motion.div>

        </div>
      </section>

      {/* Key Stats Bar */}
      <section className="border-y border-white/10 bg-slate-950/70 py-8 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-2xl sm:text-4xl font-extrabold text-cyan-400">{t.hero.stats.delegates}</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">{t.hero.stats.delegatesDesc}</div>
          </div>
          <div>
            <div className="text-2xl sm:text-4xl font-extrabold text-emerald-400">{t.hero.stats.countries}</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">{t.hero.stats.countriesDesc}</div>
          </div>
          <div>
            <div className="text-2xl sm:text-4xl font-extrabold text-amber-400">{t.hero.stats.pipeline}</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">{t.hero.stats.pipelineDesc}</div>
          </div>
          <div>
            <div className="text-2xl sm:text-4xl font-extrabold text-purple-400">{t.hero.stats.dealRooms}</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">{t.hero.stats.dealRoomsDesc}</div>
          </div>
        </div>
      </section>

      {/* Executive Summary & Vision / Mission */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-12">
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 block mb-2">
            {t.foundations.badge}
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            {t.foundations.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            {t.foundations.subtitle}
          </p>
        </div>

        {/* Executive Summary Hero Card */}
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-slate-900 via-[#0B152A] to-slate-900 border border-cyan-500/30 shadow-2xl relative overflow-hidden text-left rtl:text-right">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <Award className="w-6 h-6 text-cyan-400 shrink-0" />
            <span>{t.foundations.execSummary.title}</span>
          </h3>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-4 font-normal">
            {t.foundations.execSummary.text1}
          </p>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-4 font-normal">
            {t.foundations.execSummary.text2}
          </p>
          <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-xs sm:text-sm text-cyan-200 leading-relaxed font-medium">
            💡 {t.foundations.execSummary.highlight}
          </div>
        </div>

        {/* Vision & Mission Split Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left rtl:text-right">
          {/* Vision */}
          <div className="p-8 rounded-3xl bg-slate-900/80 border border-emerald-500/30 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6 border border-emerald-500/30">
                <Compass className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block mb-2">{t.foundations.vision.title}</span>
              <p className="text-sm text-slate-300 leading-relaxed">
                {t.foundations.vision.text}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center gap-2 text-xs text-emerald-300 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{isArabic ? 'ملتقى إفريقيا وأوروبا والشرق الأوسط' : (language === 'fr' ? 'Carrefour Afrique, Europe & Moyen-Orient' : 'Crossroads of Africa, Europe & Middle East')}</span>
            </div>
          </div>

          {/* Mission */}
          <div className="p-8 rounded-3xl bg-slate-900/80 border border-cyan-500/30 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-6 border border-cyan-500/30">
                <Rocket className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest block mb-2">{t.foundations.mission.title}</span>
              <p className="text-sm text-slate-300 leading-relaxed">
                {t.foundations.mission.text}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center gap-2 text-xs text-cyan-300 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{isArabic ? 'بيئة مهيكلة ومبنية على البيانات الموثقة' : (language === 'fr' ? 'Environnement structuré et axé sur les données' : 'Data-Driven & Structured Deal Environment')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Strategic Goals & Objectives */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-950/60 border-y border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 block mb-2">
              {t.goals.badge}
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              {t.goals.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              {t.goals.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left rtl:text-right">
            {t.goals.items.map((goal, idx) => {
              const icons = [Zap, Globe, Rocket, ShieldCheck];
              const colors = ['text-amber-400', 'text-cyan-400', 'text-emerald-400', 'text-purple-400'];
              const borders = ['border-amber-500/30', 'border-cyan-500/30', 'border-emerald-500/30', 'border-purple-500/30'];
              const bgs = ['bg-amber-500/10', 'bg-cyan-500/10', 'bg-emerald-500/10', 'bg-purple-500/10'];
              const Icon = icons[idx % icons.length];
              return (
                <div 
                  key={goal.id}
                  className={`p-6 rounded-3xl bg-slate-900/80 border ${borders[idx]} hover:scale-[1.02] transition-transform duration-300 shadow-xl flex flex-col justify-between`}
                >
                  <div>
                    <div className={`w-12 h-12 rounded-2xl ${bgs[idx]} ${colors[idx]} flex items-center justify-center mb-5 border border-white/10`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{goal.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{goal.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Targeted Audience & Participants Matrix */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 block mb-2">
            {t.stakeholders.badge}
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-4">
            {t.stakeholders.title}
          </h2>
          <p className="text-sm text-slate-300">
            {t.stakeholders.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left rtl:text-right">
          {t.stakeholders.categories.map((cat, idx) => {
            const icons = [TrendingUp, Rocket, Building2, Handshake];
            const badgeColors = [
              'bg-amber-500/10 text-amber-300 border-amber-500/30',
              'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
              'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
              'bg-purple-500/10 text-purple-300 border-purple-500/30'
            ];
            const Icon = icons[idx];
            return (
              <div 
                key={cat.id}
                className="p-8 rounded-3xl bg-slate-900/90 border border-white/10 hover:border-cyan-500/40 transition-all duration-300 shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 text-cyan-400">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${badgeColors[idx]}`}>
                      {cat.role}
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-white mb-3">{cat.name}</h3>
                  <p className="text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed">
                    {cat.desc}
                  </p>

                  <div className="space-y-2.5">
                    {cat.bullets.map((bullet, bIdx) => (
                      <div key={bIdx} className="flex items-start gap-2.5 text-xs text-slate-200">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between">
                  <a
                    href="#register-section"
                    onClick={() => setSelectedCategory(cat.id)}
                    className="text-xs font-bold text-cyan-300 hover:text-cyan-200 flex items-center gap-1.5 transition-colors"
                  >
                    <span>{isArabic ? `التسجيل كـ ${cat.name}` : (language === 'fr' ? `S'inscrire comme ${cat.name}` : `Register as ${cat.name}`)}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Featured Pillars & Core Outcomes */}
      <section id="pillars-section" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#030712] via-[#071329] to-[#030712] border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 block mb-2">
              {t.pillars.badge}
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-4">
              {t.pillars.title}
            </h2>
            <p className="text-sm text-slate-300">
              {t.pillars.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left rtl:text-right">
            {/* Pillar 1: Platform */}
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-cyan-500/30 shadow-2xl backdrop-blur-xl relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl font-black text-cyan-400/30 font-mono">01</span>
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    {t.pillars.pillar1.badge}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                  {t.pillars.pillar1.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed">
                  {t.pillars.pillar1.desc}
                </p>

                <div className="space-y-3">
                  {t.pillars.pillar1.features.map((feat, fIdx) => (
                    <div key={fIdx} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200">
                      <div className="font-bold text-cyan-300 mb-1 flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{feat.title}</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed text-[11px]">{feat.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between">
                <Link
                  to="/investment-network"
                  className="text-xs font-bold text-cyan-300 hover:underline flex items-center gap-1.5"
                >
                  <span>{isArabic ? 'استكشاف منصة المطابقة الاستثمارية' : (language === 'fr' ? 'Explorer la plateforme de mise en relation' : 'Explore Matchmaking Network')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Pillar 2: Forum & Panels */}
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-purple-500/30 shadow-2xl backdrop-blur-xl relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl font-black text-purple-400/30 font-mono">02</span>
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
                    {t.pillars.pillar2.badge}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                  {t.pillars.pillar2.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed">
                  {t.pillars.pillar2.desc}
                </p>

                <div className="p-5 rounded-2xl bg-purple-950/30 border border-purple-500/20 text-xs text-purple-200 leading-relaxed">
                  <Compass className="w-6 h-6 text-purple-400 mb-2" />
                  <p>{isArabic ? 'جلسات عامة، وكلمات لكبار الشخصيات، ومناقشات حول الاستثمار الأخضر والتحول الرقمي وتدفقات رأس المال العابر للحدود.' : (language === 'fr' ? 'Sessions plénières, keynotes ministérielles et débats sur les investissements durables et les flux de capitaux régionaux.' : 'Plenary keynotes, ministerial panels, and expert country spotlights focusing on global macroeconomic trends and sustainable FDI.')}</p>
                </div>
              </div>
            </div>

            {/* Pillar 3: Exhibition Hall */}
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-amber-500/30 shadow-2xl backdrop-blur-xl relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl font-black text-amber-400/30 font-mono">03</span>
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    {t.pillars.pillar3.badge}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                  {t.pillars.pillar3.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed">
                  {t.pillars.pillar3.desc}
                </p>

                <div className="p-5 rounded-2xl bg-amber-950/30 border border-amber-500/20 text-xs text-amber-200 leading-relaxed">
                  <Building2 className="w-6 h-6 text-amber-400 mb-2" />
                  <p>{isArabic ? 'فضاء عرض تفاعلي يضم أجنحة الشركات، والشركات الناشئة الصاعدة، والوكالات الحكومية والبعثات الاقتصادية الدولية.' : (language === 'fr' ? 'Espace d\'exposition interactif réunissant entreprises innovantes, pavillons de pays et agences d\'investissement.' : 'An interactive showcase hosting 100+ vetted enterprise pavilions, startup showcases, and international country delegations.')}</p>
                </div>
              </div>
            </div>

            {/* Pillar 4: Direct Outcomes */}
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-emerald-500/30 shadow-2xl backdrop-blur-xl relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl font-black text-emerald-400/30 font-mono">04</span>
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    {t.pillars.pillar4.badge}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                  {t.pillars.pillar4.title}
                </h3>

                <div className="space-y-3 mt-4">
                  {t.pillars.pillar4.bullets.map((bullet, bIdx) => (
                    <div key={bIdx} className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-200 flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{bullet}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Program Schedule (2 Days) */}
      <section id="schedule-section" className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 block mb-2">
            {t.agenda.badge}
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-4">
            {t.agenda.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            {t.agenda.subtitle}
          </p>

          {/* Day Switcher Tabs */}
          <div className="flex items-center justify-center gap-4 mt-8 flex-wrap">
            <button
              onClick={() => setSelectedDay(1)}
              className={`px-6 py-3 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                selectedDay === 1
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-900 text-slate-300 border border-slate-700 hover:border-cyan-500/40'
              }`}
            >
              {t.agenda.day1Btn}
            </button>
            <button
              onClick={() => setSelectedDay(2)}
              className={`px-6 py-3 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                selectedDay === 2
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-900 text-slate-300 border border-slate-700 hover:border-cyan-500/40'
              }`}
            >
              {t.agenda.day2Btn}
            </button>
          </div>
        </div>

        {/* Schedule List */}
        <div className="space-y-4 text-left rtl:text-right">
          {(selectedDay === 1 ? t.agenda.day1 : t.agenda.day2).map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl border border-slate-800 bg-slate-900/80 hover:border-cyan-500/40 transition-all shadow-md"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-md bg-cyan-500/10 text-cyan-400 font-mono text-xs font-bold border border-cyan-500/30">
                      {item.time}
                    </span>
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-white pt-1">{item.title}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Registration Section & Live Badge Generation */}
      <section id="register-section" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#020617] via-[#051124] to-[#020617] border-t border-cyan-500/20">
        <div className="max-w-6xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="px-3.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 font-mono text-xs font-bold border border-cyan-500/30 inline-block mb-3">
              {t.registration.badge}
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">
              {t.registration.title}
            </h2>
            <p className="text-slate-300 text-sm max-w-xl mx-auto">
              {t.registration.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Registration Form */}
            <div className="lg:col-span-7 bg-slate-900/90 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative text-left rtl:text-right">
              
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
                <User className="w-5 h-5 text-cyan-400 shrink-0" />
                <span>{t.registration.title}</span>
              </h3>

              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Category Selection Tabs */}
                <div>
                  <label className="block text-xs font-bold text-cyan-300 uppercase tracking-wider mb-2">
                    {t.registration.categoryLabel} *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {t.stakeholders.categories.map((cat) => (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`p-3 rounded-xl text-xs font-bold border transition-all text-left rtl:text-right flex items-center justify-between cursor-pointer ${
                          selectedCategory === cat.id
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                            : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <span>{cat.name}</span>
                        {selectedCategory === cat.id && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Photo Upload Section */}
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                  <div className="relative group cursor-pointer shrink-0">
                    <div className="w-20 h-20 rounded-full border-2 border-cyan-400/80 bg-slate-900 flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                      {formData.photoPreview ? (
                        <img src={formData.photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-6 h-6 text-cyan-400" />
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                  <div className="flex-1 text-center sm:text-left rtl:sm:text-right">
                    <span className="text-xs font-bold text-white block">{t.registration.photoUpload}</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {t.registration.photoUploadHint}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-cyan-300 mb-1.5 uppercase tracking-wider">
                    {t.registration.fullName} *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder={t.registration.fullNamePlaceholder}
                      className="w-full bg-slate-950/90 border border-slate-700 focus:border-cyan-400 rounded-xl px-11 py-3 text-white placeholder-slate-500 text-sm font-medium focus:outline-none transition-all"
                    />
                    <User className="w-4 h-4 text-cyan-400 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-cyan-300 mb-1.5 uppercase tracking-wider">
                      {t.registration.email} *
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder={t.registration.emailPlaceholder}
                        className="w-full bg-slate-950/90 border border-slate-700 focus:border-cyan-400 rounded-xl px-11 py-3 text-white placeholder-slate-500 text-sm font-medium focus:outline-none transition-all"
                      />
                      <Mail className="w-4 h-4 text-cyan-400 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-cyan-300 mb-1.5 uppercase tracking-wider">
                      {t.registration.phone}
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder={t.registration.phonePlaceholder}
                        className="w-full bg-slate-950/90 border border-slate-700 focus:border-cyan-400 rounded-xl px-11 py-3 text-white placeholder-slate-500 text-sm font-medium focus:outline-none transition-all"
                      />
                      <Phone className="w-4 h-4 text-cyan-400 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-cyan-300 mb-1.5 uppercase tracking-wider">
                      {t.registration.company} *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="company"
                        required
                        value={formData.company}
                        onChange={handleInputChange}
                        placeholder={t.registration.companyPlaceholder}
                        className="w-full bg-slate-950/90 border border-slate-700 focus:border-cyan-400 rounded-xl px-11 py-3 text-white placeholder-slate-500 text-sm font-medium focus:outline-none transition-all"
                      />
                      <Building2 className="w-4 h-4 text-cyan-400 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-cyan-300 mb-1.5 uppercase tracking-wider">
                      {t.registration.role} *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="role"
                        required
                        value={formData.role}
                        onChange={handleInputChange}
                        placeholder={t.registration.rolePlaceholder}
                        className="w-full bg-slate-950/90 border border-slate-700 focus:border-cyan-400 rounded-xl px-11 py-3 text-white placeholder-slate-500 text-sm font-medium focus:outline-none transition-all"
                      />
                      <Briefcase className="w-4 h-4 text-cyan-400 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-cyan-300 mb-1.5 uppercase tracking-wider">
                    {t.registration.sector}
                  </label>
                  <select
                    name="sector"
                    value={formData.sector}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950/90 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-3 text-white text-sm font-medium focus:outline-none transition-all"
                  >
                    {t.registration.sectors.map((s, idx) => (
                      <option key={idx} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-500 hover:from-cyan-300 hover:to-emerald-400 text-slate-950 font-black text-sm shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
                >
                  <Zap className="w-5 h-5 fill-current shrink-0" />
                  <span>{loading ? t.registration.submitting : t.registration.submitBtn}</span>
                </button>
              </form>
            </div>

            {/* Right Badge Preview */}
            <div id="badge-preview-section" className="lg:col-span-5 sticky top-24">
              <div className="text-center lg:text-left rtl:lg:text-right mb-3">
                <span className="text-xs text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5 justify-center lg:justify-start rtl:lg:justify-end">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{t.badgeCard.officialPass}</span>
                </span>
              </div>

              {registrationSuccess ? (
                <EventBadgeCard
                  registration={registrationSuccess}
                  isAuthenticated={isAuthenticated}
                  user={user}
                  onOpenLogin={() => navigate('/login?redirect=/event')}
                  onOpenRegister={() => navigate('/register?redirect=/event')}
                />
              ) : (
                <div className="p-8 rounded-3xl bg-slate-900/60 border border-dashed border-cyan-500/30 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/20">
                    <Scan className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-white">
                    {isArabic ? 'بانتظار إدخال بيانات المفوض' : (language === 'fr' ? 'Votre Pass en Attente d\'Inscription' : 'Your Pass Awaits Registration')}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                    {isArabic 
                      ? 'املأ الاستمارة للحصول فوراً على شارة الدخول الرسمية المزودة برمز QR المشفر والمؤهلة للقاءات الاستثمارية في قصر المؤتمرات بتونس (20-21 أفريل 2027).'
                      : (language === 'fr'
                        ? 'Remplissez le formulaire pour obtenir instantanément votre QR code d\'accès officiel pour Investrade 1 (20–21 Avril 2027 au Palais des Congrès, Tunis).'
                        : 'Fill in your credentials to instantly generate your encrypted QR access code and personalized badge for Investrade 1 (April 20–21, 2027 at Palais des Congrès, Tunis).'
                      )}
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      <WebsiteFooter />
    </div>
  );
}
