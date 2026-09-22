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
  Camera
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
    photoPreview: user?.user_metadata?.avatar_url || user?.avatar_url || null,
    photoFile: null,
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
        setFormData(prev => ({
          ...prev,
          photoPreview: reader.result,
          photoFile: file
        }));
      };
      reader.readAsDataURL(file);
    }
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

    let finalPhotoUrl = formData.photoPreview || user?.user_metadata?.avatar_url || user?.avatar_url || null;

    if (formData.photoFile && user) {
      try {
        const filePath = `event_photos/${user.id}_${Date.now()}.jpg`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('media')
          .upload(filePath, formData.photoFile);
        if (!uploadErr && uploadData) {
          const publicUrl = supabase.storage.from('media').getPublicUrl(filePath).data.publicUrl;
          finalPhotoUrl = publicUrl;
        }
      } catch (err) {
        console.warn('Photo upload fallback to preview:', err);
      }
    }

    const badgeCode = `INV-2026-OCT7-${Math.floor(1000 + Math.random() * 9000)}`;
    const regPayload = {
      full_name: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      company: formData.company,
      role: formData.role,
      sector: formData.sector,
      photo_url: finalPhotoUrl,
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
      time: '08h30 – 09h00',
      title: 'Inscription',
      type: 'registration',
      description: 'Accueil et enregistrement des participants.'
    },
    {
      time: '09h00 – 09h15',
      title: 'Allocutions d\'ouverture',
      type: 'keynote',
      speakersList: [
        { name: 'M. le représentant de l\'UTICA', role: 'Union Tunisienne de l\'Industrie, du Commerce et de l\'Artisanat' },
        { name: 'M. Slim JAOUED', role: 'Chargé de programme, Konrad-Adenauer-Stiftung – KAS Tunisie' }
      ]
    },
    {
      time: '09h15 – 09h45',
      title: 'Première session : Vers une entreprise tunisienne intelligente, connectée et compétitive',
      speaker: 'Dr. Maher KHEDHER',
      role: 'Fondateur d\'Investraders',
      type: 'speaker',
      description: 'Sujet : « Le cerveau numérique de l\'entreprise tunisienne à l\'ère de l\'intelligence artificielle »'
    },
    {
      time: '09h45 – 11h00',
      title: 'Deuxième session – Panel de discussion',
      type: 'panel',
      description: 'Thème : L\'autonomisation numérique de l\'entreprise tunisienne à l\'ère de l\'intelligence artificielle — De la transformation numérique à l\'intelligence organisationnelle, à la compétitivité et à l\'investissement',
      moderator: 'Mme Wafa DAHMANI',
      panelists: [
        { name: 'M. Bilel SAHNOUN', role: 'Directeur Général de la Bourse de Tunis' },
        { name: 'Mme Leïla BELKHIRIA JABER', role: 'Présidente de la CNFCE & Vice-Présidente de la Fédération COMESA' },
        { name: 'M. Moncef BEN JOMAA', role: 'Président de la Chambre de Commerce et d\'Industrie de Tunis' },
        { name: 'M. Mohamed Adel CHOUARI', role: 'Directeur Général du Registre National des Entreprises (RNE)' },
        { name: 'M. Jalel TEBIB', role: 'Directeur Général de la FIPA (Agence de Promotion de l\'Investissement Extérieur)' },
        { name: 'Mme Néjia GHARBI', role: 'Directrice Générale de la Caisse des Dépôts et Consignations – CDC' }
      ]
    },
    {
      time: '11h00 – 11h30',
      title: 'Troisième session – Présentation de la plateforme Investraders',
      speaker: 'Équipe Investraders & Wisdom Net',
      type: 'demo',
      description: 'Démonstration Investraders, le centre d\'intelligence et de pilotage de l\'entreprise à l\'ère de l\'intelligence artificielle.'
    },
    {
      time: '11h30 – 12h45',
      title: 'Débats',
      type: 'discussion',
      description: 'Questions, discussions et échanges avec les participants.'
    },
    {
      time: '12h45 – 12h55',
      title: 'Clôture',
      type: 'awards',
      description: 'Synthèse et recommandations de la matinée.'
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
            className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-full bg-slate-900/90 border border-cyan-500/40 text-cyan-300 text-xs sm:text-sm font-semibold mb-6 shadow-[0_0_20px_rgba(6,182,212,0.2)] backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
            <span>Wisdom Net × UTICA × KAS Tunisie • Mardi 13 Octobre 2026</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight mb-4 sm:mb-6"
          >
            Entreprises tunisiennes à l'ère de l'Intelligence Artificielle : <br />
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 bg-clip-text text-transparent">
              de la transformation numérique à l'autonomie et à l'innovation
            </span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="inline-block px-4 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold mb-6"
          >
            🎤 Animation générale : Les séances seront animées par <span className="text-white font-extrabold">M. Anas BEN SAID</span>
          </motion.div>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-xs sm:text-base text-slate-300 max-w-3xl mx-auto mb-8 leading-relaxed"
          >
            Demi-journée d'échange, de dialogue, de démonstration et de partage d'expériences réunissant entreprises, experts et acteurs économiques pour faire de l'IA un véritable levier d'autonomie, de compétitivité et d'innovation.
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
              <span className="text-[10px] text-slate-400 block">Date</span>
              <span className="text-xs sm:text-sm font-bold text-white">Mardi 13 Oct 2026</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-cyan-500/20 backdrop-blur-md">
              <Clock className="w-5 h-5 text-cyan-400 mb-1" />
              <span className="text-[10px] text-slate-400 block">Horaire</span>
              <span className="text-xs sm:text-sm font-bold text-white">08:30 – 12:55</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-cyan-500/20 backdrop-blur-md">
              <MapPin className="w-5 h-5 text-cyan-400 mb-1" />
              <span className="text-[10px] text-slate-400 block">Lieu</span>
              <span className="text-xs sm:text-sm font-bold text-white">Siège UTICA Tunis</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-cyan-500/20 backdrop-blur-md">
              <Award className="w-5 h-5 text-cyan-400 mb-1" />
              <span className="text-[10px] text-slate-400 block">Organisation</span>
              <span className="text-xs sm:text-sm font-bold text-white">Wisdom Net • UTICA • KAS</span>
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
              Obtenir mon Badge Officiel
            </a>

            <a
              href="#agenda-section"
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-bold text-sm border border-slate-700 transition-all text-center"
            >
              Programme détaillé
            </a>
          </motion.div>

        </div>
      </section>

      {/* Vision & Context Argumentaire Cards */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-slate-950/70 border-y border-cyan-500/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 block mb-1">
              Contexte & Enjeux Stratégiques
            </span>
            <h2 className="text-xl sm:text-3xl font-extrabold text-white">
              L'IA au service de l'autonomie et de la compétitivité
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-cyan-500/20 text-left dir-ltr">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-3">
                <Network className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Transformations & Compétitivité</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                L'IA ouvre de nouvelles perspectives en productivité, innovation et création de valeur pour l'économie tunisienne.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-cyan-500/20 text-left dir-ltr">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Autonomie Numérique</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Valorisation des données, compétences locales et maîtrise stratégique des technologies émergentes d'IA.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-cyan-500/20 text-left dir-ltr">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Plateforme Investraders</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Présentation et démonstration du centre d'intelligence et de pilotage numérique développé par Wisdom Net.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Program Agenda Section */}
      <section id="agenda-section" className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 block mb-1">
            Déroulement du programme
          </span>
          <h2 className="text-xl sm:text-3xl font-extrabold text-white">
            Mardi 13 Octobre 2026 • Siège UTICA
          </h2>
          <p className="text-xs text-slate-400 mt-2">
            Animation générale assurée par <span className="text-cyan-300 font-bold">M. Anas BEN SAID</span>
          </p>
        </div>

        <div className="space-y-4">
          {programAgenda.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`p-5 rounded-2xl border transition-all text-left dir-ltr ${
                item.type === 'keynote' || item.type === 'panel' || item.type === 'demo'
                  ? 'bg-slate-900/90 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                  : 'bg-slate-900/50 border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="inline-block px-3 py-1 rounded-md bg-cyan-500/10 text-cyan-400 font-mono text-xs font-bold border border-cyan-500/30">
                    {item.time}
                  </span>
                  <h4 className="text-base sm:text-lg font-bold text-white">{item.title}</h4>
                </div>

                {item.speaker && (
                  <div className="sm:text-right bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 shrink-0">
                    <span className="text-xs font-bold text-cyan-300 block">{item.speaker}</span>
                    {item.role && <span className="text-[11px] text-slate-400 block">{item.role}</span>}
                  </div>
                )}
              </div>

              {item.description && (
                <p className="mt-3 text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-3">
                  {item.description}
                </p>
              )}

              {/* Speakers List */}
              {item.speakersList && (
                <div className="mt-3 border-t border-slate-800/80 pt-3 space-y-2">
                  <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block">Allocutions :</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {item.speakersList.map((sp, i) => (
                      <div key={i} className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 text-xs">
                        <span className="font-bold text-white block">{sp.name}</span>
                        <span className="text-[11px] text-slate-400 block">{sp.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Moderator & Panelists */}
              {item.moderator && (
                <div className="mt-3 border-t border-slate-800/80 pt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/30">
                      Modératrice : {item.moderator}
                    </span>
                  </div>

                  {item.panelists && (
                    <div className="pt-2">
                      <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block mb-2">Panélistes :</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {item.panelists.map((p, i) => (
                          <div key={i} className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                            <span className="font-bold text-white block">{p.name}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{p.role}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
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
              قم بملء بياناتك للحصول على شارة الدخول الرقمية لملتقى 13 أكتوبر بمقر UTICA.
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
                {/* Photo Upload Section */}
                <div className="flex flex-col items-center justify-center mb-5 pb-4 border-b border-slate-800">
                  <label className="block text-xs font-bold text-cyan-300 mb-2 text-center">
                    الصورة الشخصية / Photo de profil <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative group cursor-pointer">
                    <div className="w-24 h-24 rounded-full border-2 border-cyan-400/80 bg-slate-950 flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all group-hover:border-cyan-400">
                      {formData.photoPreview ? (
                        <img src={formData.photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400 text-center p-2">
                          <Camera className="w-7 h-7 text-cyan-400 mb-1" />
                          <span className="text-[10px] font-bold text-slate-300">إضافة صورة</span>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-2">انقر لرفع صورتك الشخصية للشارة الرسمية</span>
                </div>

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
                    قم بملء البيانات لمعاينة الشارة وتفعيل رمز الـ QR للدخول يوم 13 أكتوبر 2026 بمقر UTICA.
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
