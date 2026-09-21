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
  Ticket
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import WebsiteNavbar from '@/components/layout/WebsiteNavbar';
import WebsiteFooter from '@/components/layout/WebsiteFooter';
import EventBadgeCard from '@/components/event/EventBadgeCard';
import { useNavigate } from 'react-router-dom';

export default function EventRegistrationLanding() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Registration Form State
  const [formData, setFormData] = useState({
    fullName: user?.user_metadata?.full_name || user?.full_name || '',
    email: user?.email || '',
    phone: '',
    company: '',
    role: '',
    sector: 'التكنولوجيا والذكاء الاصطناعي',
  });

  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(null);

  // Check if user already registered previously in localStorage
  useEffect(() => {
    const savedReg = localStorage.getItem('investraders_oct7_event_reg');
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
        email: prev.email || user.email || ''
      }));
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSectorSelect = (sector) => {
    setFormData(prev => ({ ...prev, sector }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email) {
      alert('يرجى ملء الاسم الكامل والبريد الإلكتروني');
      return;
    }

    setLoading(true);
    const badgeCode = `INV-2026-OCT7-${Math.floor(1000 + Math.random() * 9000)}`;
    const regPayload = {
      full_name: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      company: formData.company,
      role: formData.role,
      sector: formData.sector,
      badge_code: badgeCode,
      user_id: user?.id || null,
      created_at: new Date().toISOString()
    };

    try {
      const { data } = await supabase
        .from('event_registrations')
        .insert([regPayload])
        .select()
        .single();

      const finalRecord = data || regPayload;
      localStorage.setItem('investraders_oct7_event_reg', JSON.stringify(finalRecord));
      setRegistrationSuccess(finalRecord);
    } catch (err) {
      console.warn('Supabase save notice, falling back to local storage:', err);
      localStorage.setItem('investraders_oct7_event_reg', JSON.stringify(regPayload));
      setRegistrationSuccess(regPayload);
    } finally {
      setLoading(false);
      document.getElementById('badge-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const programAgenda = [
    {
      time: '08:30 – 09:00',
      title: 'التسجيل واستقبال المشاركين',
      speaker: 'فريق التنظيم Investraders & UTICA',
      type: 'registration',
      description: 'استقبال الحاضرين وتسليم شارات الدخول والملفات التعريفية.'
    },
    {
      time: '09:00 – 09:15',
      title: 'الجلسة الافتتاحية الرسمية',
      speaker: 'السيد هشام اللومي',
      role: 'نائب رئيس الإتحاد التونسي للصناعة والتجارة والصناعات التقليدية (UTICA)',
      type: 'keynote',
      description: 'كلمة ترحيبية وتحديد محاور الرؤية الوطنية للتكامل الرقمي للمؤسسات.'
    },
    {
      time: '09:15 – 09:45',
      title: 'الجلسة الأولى: الاقتصاد التفاعلي الجديد - التمكين التقني للتكامل الاقتصادي',
      speaker: 'د. ماهر خضر',
      role: 'خبير التحول الرقمي والذكاء الاصطناعي',
      type: 'speaker',
      topics: [
        'لماذا تحتاج تونس إلى اقتصاد مترابط؟',
        'من الاقتصاد التقليدي إلى اقتصاد الفرص والتفاعلية',
        'From Silos to Interactivity: الانتقال من الأنشطة المنعزلة إلى المنظومة الوطنية',
        'منصة Investraders كبنية تحتية موحدة لبناء المجتمعات الاقتصادية (Business Circles)'
      ]
    },
    {
      time: '09:45 – 10:15',
      title: 'الامتثال الوطني والدولي وتعزيز شفافية المؤسسات',
      speaker: 'السيد بلال سحنون',
      role: 'المدير العام لبورصة تونس (Bourse de Tunis)',
      type: 'speaker',
      topics: [
        'متطلبات المستثمرين الدوليين وحوكمة المؤسسات Corporate Governance & ESG',
        'التحول الرقمي كركيزة أساسية للامتثال والشفافية المالية',
        'أهمية المنصة التفاعلية الموحدة Investraders للشركات المدرجة والواعدة'
      ]
    },
    {
      time: '10:00 – 10:15',
      title: 'دور الريادة النسائية في التمكين الرقمي للمؤسسة التونسية',
      speaker: 'السيدة ليلى بلخيرية جابر',
      role: 'رئيسة الغرفة الوطنية للنساء صاحبات الأعمال ونائبة رئيسة جامعة الكوميسا',
      type: 'speaker',
      description: 'تعزيز مشاركة سيدات الأعمال في التحول الرقمي واقتناص الفرص الإقليمية والدولية.'
    },
    {
      time: '10:15 – 10:35',
      title: 'دور الغرف التجارية المشتركة في تحقيق التكامل الاقتصادي الإقليمي',
      speaker: 'السيد خليل الشايبي',
      role: 'رئيس الغرفة التونسية الفرنسية للصناعة والتجارة',
      type: 'speaker',
      topics: [
        'تجربة الغرف التجارية المشتركة في دعم الاستثمار وزيادة المبادلات',
        'بناء شبكات الأعمال الرقمية والتعاون الدولي عبر Investraders'
      ]
    },
    {
      time: '10:35 – 10:50',
      title: 'استراحة قهوة وشبكات التواصل (Networking Break)',
      type: 'break',
      description: 'فرصة للتواصل المباشر وتبادل بطاقات الأعمال بين أصحاب القرار والمستثمرين.'
    },
    {
      time: '10:50 – 11:20',
      title: 'الجلسة الثانية: البيانات والذكاء الاصطناعي - نحو إطار رقمي وطني موحد',
      speaker: 'السيد محمد عادل الشواري',
      role: 'المدير العام للسجل الوطني للمؤسسات (RNE)',
      type: 'speaker',
      topics: [
        'توحيد قواعد البيانات وتبادل المعلومات بين المؤسسات',
        'رصد الفرص الاستثمارية القائمة على البيانات والذكاء الاصطناعي'
      ]
    },
    {
      time: '11:20 – 11:50',
      title: 'الذكاء الاصطناعي وجذب الاستثمارات الدولية',
      speaker: 'السيد جلال الطبيب',
      role: 'المدير العام لهيئة الاستثمار التونسية (TIA)',
      type: 'speaker',
      topics: [
        'التعرف المبكر على الفرص الاستثمارية عالية القيمة',
        'دور المنصات التفاعلية (Investraders) في جعل تونس منصة استثمار دولية'
      ]
    },
    {
      time: '11:50 – 12:10',
      title: 'الجلسة الثالثة: العرض الحي لمنصة Investraders',
      speaker: 'فريق تطوير منصة Investraders',
      type: 'demo',
      topics: [
        'Business Circles & Corporate Communities',
        'Digital Chambers & Investor Networks',
        'AI Analytics & Opportunity Marketplace'
      ]
    },
    {
      time: '12:10 – 12:30',
      title: 'توزيع الجوائز وإعلان تونس (إطلاق المبادرة الوطنية)',
      speaker: 'الهيئات والشركاء المشاركون',
      type: 'awards',
      description: 'تكريم المؤسسات المتميزة وإعلان بيان تونس نحو منظومة اقتصادية رقمية مترابطة.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#030914] text-slate-100 font-sans dir-rtl overflow-x-hidden pb-20 sm:pb-0">
      <WebsiteNavbar />

      {/* Hero Section */}
      <section className="relative pt-8 sm:pt-16 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Neon Background Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[700px] h-[350px] sm:h-[500px] bg-gradient-to-tr from-cyan-600/20 via-blue-600/20 to-purple-600/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10 text-center">
          
          <motion.div 
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 border border-cyan-500/40 text-cyan-300 text-xs sm:text-sm font-semibold mb-6 shadow-[0_0_20px_rgba(6,182,212,0.2)] backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>Investraders × UTICA • 07 Octobre 2026</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight mb-4 sm:mb-6"
          >
            التمكين الرقمي للمؤسسات التونسية <br />
            في عصر <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 bg-clip-text text-transparent">الذكاء الاصطناعي</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-sm sm:text-lg text-slate-300 max-w-3xl mx-auto mb-8 leading-relaxed"
          >
            نحو منظومة وطنية مترابطة لتحقيق التكامل الاقتصادي وتعزيز تنافسية المؤسسة التونسية من خلال الذكاء الاصطناعي ومجتمعات الأعمال الرقمية.
          </motion.p>

          {/* Mobile-Friendly Grid Badges */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto mb-8 text-right"
          >
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-cyan-500/20 backdrop-blur-md">
              <Calendar className="w-5 h-5 text-cyan-400 mb-1" />
              <span className="text-[10px] text-slate-400 block">التاريخ</span>
              <span className="text-xs sm:text-sm font-bold text-white">07 أكتـوبر 2026</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-cyan-500/20 backdrop-blur-md">
              <Clock className="w-5 h-5 text-cyan-400 mb-1" />
              <span className="text-[10px] text-slate-400 block">التوقيت</span>
              <span className="text-xs sm:text-sm font-bold text-white">08:30 – 12:30</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-cyan-500/20 backdrop-blur-md">
              <MapPin className="w-5 h-5 text-cyan-400 mb-1" />
              <span className="text-[10px] text-slate-400 block">المكان</span>
              <span className="text-xs sm:text-sm font-bold text-white">مقر UTICA تونس</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-cyan-500/20 backdrop-blur-md">
              <Award className="w-5 h-5 text-cyan-400 mb-1" />
              <span className="text-[10px] text-slate-400 block">التنظيم</span>
              <span className="text-xs sm:text-sm font-bold text-white">Investraders & UTICA</span>
            </div>
          </motion.div>

          {/* Action CTAs */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            <a
              href="#register-section"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-sm shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 fill-current" />
              احجز شارتك الرقمية الآن
            </a>

            <a
              href="#agenda-section"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-bold text-sm border border-slate-700 transition-all text-center"
            >
              برنامج اليوم الدراسي
            </a>
          </motion.div>

        </div>
      </section>

      {/* Vision Cards */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-slate-950/70 border-y border-cyan-500/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 block mb-1">
              الرؤية والأهداف الاستراتيجية
            </span>
            <h2 className="text-xl sm:text-3xl font-extrabold text-white">
              من العمل المنعزل إلى اقتصاد البيانات التفاعلي
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-cyan-500/20 text-right">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-3">
                <Network className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">التكامل الاقتصادي المترابط</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                ربط المؤسسات التونسية والغرف التجارية ضمن منظومة رقمية موحدة تعتمد على الذكاء الاصطناعي.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-cyan-500/20 text-right">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">الامتثال والحوكمة (ESG)</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                مناقشة متطلبات الامتثال الوطني (RNE) والدولي وبورصة تونس لتعزيز شفافية المؤسسات.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-cyan-500/20 text-right">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">مجتمعات الأعمال (Business Circles)</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                تحويل كل مؤسسة إلى مجتمع اقتصادي تفاعلي يتيح رصد واستغلال الفرص الاستثمارية المباشرة.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Program Agenda Section */}
      <section id="agenda-section" className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 block mb-1">
            برنامج الملتقى
          </span>
          <h2 className="text-xl sm:text-3xl font-extrabold text-white">
            مواعيد الجلسات والمتحدثين
          </h2>
        </div>

        <div className="space-y-3.5">
          {programAgenda.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`p-4 sm:p-5 rounded-2xl border transition-all text-right ${
                item.type === 'keynote' || item.type === 'demo'
                  ? 'bg-slate-900/90 border-cyan-500/40'
                  : item.type === 'break'
                  ? 'bg-slate-950/40 border-slate-800'
                  : 'bg-slate-900/50 border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-400 font-mono text-[11px] font-bold border border-cyan-500/30">
                    {item.time}
                  </span>
                  <h4 className="text-sm sm:text-base font-bold text-white">{item.title}</h4>
                </div>

                {item.speaker && (
                  <div className="text-right">
                    <span className="text-xs font-bold text-cyan-300 block">{item.speaker}</span>
                    {item.role && <span className="text-[11px] text-slate-400 block">{item.role}</span>}
                  </div>
                )}
              </div>

              {item.description && (
                <p className="mt-2 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-2">
                  {item.description}
                </p>
              )}

              {item.topics && (
                <ul className="mt-2 space-y-1 border-t border-slate-800/80 pt-2">
                  {item.topics.map((tp, i) => (
                    <li key={i} className="text-[11px] text-slate-300 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span>{tp}</span>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      {/* Form & Badge Output Container */}
      <section id="register-section" className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#030914] via-[#06132A] to-[#030914] border-t border-cyan-500/20">
        <div className="max-w-5xl mx-auto">
          
          <div className="text-center mb-10">
            <span className="px-3.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 font-mono text-xs font-bold border border-cyan-500/30 inline-block mb-2">
              التسجيل الذكي • Registration Pass
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white mb-2">
              تأكيد الحضور وتوليد شارة الـ QR
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto">
              قم بملء بياناتك للحصول على شارة الدخول الرقمية لملتقى 07 أكتوبر بمقر UTICA.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Form */}
            <div className="lg:col-span-7 bg-slate-900/90 border border-cyan-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl relative">
              
              <h3 className="text-base sm:text-lg font-bold text-white mb-5 flex items-center gap-2 border-b border-slate-800 pb-3 text-right">
                <User className="w-5 h-5 text-cyan-400" />
                بيانات التسجيل
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4 text-right">
                <div>
                  <label className="block text-xs font-bold text-cyan-300 mb-1.5">
                    الاسم واللقب / Full Name <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="مثال: د. محمد علي"
                      className="w-full bg-slate-950/90 border border-slate-700 focus:border-cyan-400 rounded-xl pr-10 pl-4 py-3 text-white placeholder-slate-500 text-xs sm:text-sm font-medium focus:outline-none transition-all dir-rtl text-right"
                    />
                    <User className="w-4 h-4 text-cyan-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-cyan-300 mb-1.5">
                      البريد الإلكتروني / Email <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="name@company.com"
                        className="w-full bg-slate-950/90 border border-slate-700 focus:border-cyan-400 rounded-xl pr-10 pl-4 py-3 text-white placeholder-slate-500 text-xs sm:text-sm font-medium focus:outline-none transition-all dir-rtl text-right"
                      />
                      <Mail className="w-4 h-4 text-cyan-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-cyan-300 mb-1.5">
                      رقم الهاتف / Phone
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+216 -- --- ---"
                        className="w-full bg-slate-950/90 border border-slate-700 focus:border-cyan-400 rounded-xl pr-10 pl-4 py-3 text-white placeholder-slate-500 text-xs sm:text-sm font-medium focus:outline-none transition-all dir-rtl text-right"
                      />
                      <Phone className="w-4 h-4 text-cyan-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-cyan-300 mb-1.5">
                      المؤسسة / الشركة
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        placeholder="مثال: شركة التنمية"
                        className="w-full bg-slate-950/90 border border-slate-700 focus:border-cyan-400 rounded-xl pr-10 pl-4 py-3 text-white placeholder-slate-500 text-xs sm:text-sm font-medium focus:outline-none transition-all dir-rtl text-right"
                      />
                      <Building2 className="w-4 h-4 text-cyan-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-cyan-300 mb-1.5">
                      الصفة / Role
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="role"
                        value={formData.role}
                        onChange={handleInputChange}
                        placeholder="مثال: مدير عام / مستثمر"
                        className="w-full bg-slate-950/90 border border-slate-700 focus:border-cyan-400 rounded-xl pr-10 pl-4 py-3 text-white placeholder-slate-500 text-xs sm:text-sm font-medium focus:outline-none transition-all dir-rtl text-right"
                      />
                      <Briefcase className="w-4 h-4 text-cyan-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-cyan-300 mb-1.5">
                    القطاع الاقتصادي
                  </label>
                  <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                    {[
                      'التكنولوجيا والذكاء الاصطناعي',
                      'الصناعة والتجارة',
                      'الخدمات المالية والبورصة',
                      'الاستثمار وتطوير الأعمال'
                    ].map(sec => (
                      <button
                        type="button"
                        key={sec}
                        onClick={() => handleSectorSelect(sec)}
                        className={`px-3 py-2 rounded-xl text-xs font-medium transition-all text-center min-h-[40px] flex items-center justify-center ${
                          formData.sector === sec
                            ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                            : 'bg-slate-950/60 text-slate-400 border border-slate-800 hover:border-cyan-500/40'
                        }`}
                      >
                        {sec}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all flex items-center justify-center gap-2 mt-3 cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-current shrink-0" />
                  <span>{loading ? 'جاري توليد الشارة...' : 'تأكيد التسجيل وتوليد الشارة الآن'}</span>
                </button>
              </form>
            </div>

            {/* Right Badge Preview */}
            <div id="badge-section" className="lg:col-span-5">
              <div className="text-center lg:text-right mb-3">
                <span className="text-xs text-cyan-400 font-bold uppercase tracking-wider">
                  معاينة الشارة الرقمية • Digital Pass
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
                <div className="p-6 rounded-3xl bg-slate-900/60 border border-dashed border-cyan-500/30 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto">
                    <Scan className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-white">تذكرتك في انتظار التسجيل</h4>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                    قم بملء البيانات لمعاينة الشارة وتفعيل رمز الـ QR للدخول يوم 07 أكتوبر 2026 بمقر UTICA.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* Floating Bottom Quick Bar for Mobile Devices */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-[#06101E]/95 backdrop-blur-md border-t border-cyan-500/30 p-3 flex items-center justify-between gap-3 shadow-2xl">
        <a
          href="#register-section"
          className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 font-black text-xs text-center flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
        >
          <Ticket className="w-4 h-4" />
          تأكيد التسجيل والشارة
        </a>
        <a
          href="#agenda-section"
          className="py-2.5 px-3 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs text-center border border-slate-700"
        >
          البرنامج
        </a>
      </div>

      <WebsiteFooter />
    </div>
  );
}
