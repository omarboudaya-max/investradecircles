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
import { useNavigate, Link } from 'react-router-dom';

export default function EventRegistrationLanding() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

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
  const [activeTab, setActiveTab] = useState('pillars');
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
    const savedReg = localStorage.getItem('investraders_investrade1_event_reg') || localStorage.getItem('investraders_oct7_event_reg');
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
        // Compress photo via canvas for light, instant payload
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
    if (!formData.fullName.trim() || !formData.email.trim()) {
      alert('Please provide your full name and email address.');
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

    const normalizedEmail = formData.email.trim().toLowerCase();

    // Check if user is platform member
    let isMember = !!user;
    let memberUserId = user?.id || null;

    if (!memberUserId && normalizedEmail) {
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
      // Check existing registration
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
      console.warn('Registration save queued locally:', err);
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

  const audienceCategories = [
    {
      id: 'investor',
      title: 'Capital Providers',
      subtitle: 'Global & Regional Allocators',
      icon: TrendingUp,
      color: 'from-amber-400 to-amber-600',
      badgeColor: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
      stakeholders: [
        'Institutional Investors & Sovereign Wealth Funds (SWFs)',
        'Venture Capital (VC) & Growth Funds',
        'Private Equity (PE) & Mezzanine Providers',
        'Angel Investor Networks & Syndicates',
        'Development Finance Institutions (DFIs) & Multilaterals',
        'Single & Multi-Family Offices'
      ],
      valueProp: 'Access pre-vetted cap tables, direct deal rooms, and proprietary pipeline across North Africa.'
    },
    {
      id: 'project',
      title: 'Capital Seekers',
      subtitle: 'Ventures & Developers',
      icon: Rocket,
      color: 'from-emerald-400 to-teal-600',
      badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
      stakeholders: [
        'High-growth Tech & AI Startups',
        'SME Scale-ups seeking series funding or debt',
        'Large Industrial & Manufacturing Enterprises',
        'Renewable Solar & Green Hydrogen Developers',
        'Logistics, Agribusiness & Health Units',
        'Commercial Real Estate & Infrastructure Promoters'
      ],
      valueProp: 'Direct pitch access to 500+ accredited international capital allocators with structured term-sheet matching.'
    },
    {
      id: 'institution',
      title: 'Institutional & Public Sector',
      subtitle: 'Policy & Economic Leaders',
      icon: Building2,
      color: 'from-cyan-400 to-blue-600',
      badgeColor: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
      stakeholders: [
        'Economic & Finance Ministries',
        'Investment Promotion Agencies (IPAs & FIPA)',
        'International Chambers of Commerce & Trade Bodies',
        'National Registries & Public Holding Entities',
        'Diplomatic Delegations & Commercial Attachés',
        'Regional Economic Commissions (COMESA, UMA, EU)'
      ],
      valueProp: 'Shape cross-border FDI frameworks, bilateral trade treaties, and public-private co-investment structures.'
    },
    {
      id: 'partner',
      title: 'Ecosystem Partners',
      subtitle: 'Enablers & Advisory',
      icon: Handshake,
      color: 'from-purple-400 to-indigo-600',
      badgeColor: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
      stakeholders: [
        'Incubators, Accelerators & Tech Hubs',
        'Corporate Innovation Units & Labs',
        'International Legal, Audit & Tax Advisory Firms',
        'M&A and Investment Banking Boutiques',
        'Technology Providers & Cloud Infrastructure Partners',
        'Global Financial Media & Industry Analysts'
      ],
      valueProp: 'Showcase advisory excellence, build strategic alliances, and power the next wave of cross-border investments.'
    }
  ];

  const strategicGoals = [
    {
      icon: Zap,
      title: 'Capital Deployment',
      desc: 'Accelerate deal-making by connecting investment-ready ventures directly with international equity, debt, and venture capital.',
      color: 'text-amber-400',
      border: 'border-amber-500/30',
      bg: 'bg-amber-500/5'
    },
    {
      icon: Globe,
      title: 'International Cooperation',
      desc: 'Strengthen trade, economic ties, and cross-border partnerships between Tunisia, regional economies, and global financial centers.',
      color: 'text-cyan-400',
      border: 'border-cyan-500/30',
      bg: 'bg-cyan-500/5'
    },
    {
      icon: Rocket,
      title: 'Ecosystem Empowerment',
      desc: 'Showcase high-potential startups and scale-ups to global investors, elevating regional innovation onto the international stage.',
      color: 'text-emerald-400',
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/5'
    },
    {
      icon: ShieldCheck,
      title: 'Policy & Strategic Dialog',
      desc: 'Host high-level panel discussions and roundtables focusing on foreign direct investment (FDI) frameworks, green transition, and digital transformation.',
      color: 'text-purple-400',
      border: 'border-purple-500/30',
      bg: 'bg-purple-500/5'
    }
  ];

  const eventPillars = [
    {
      number: '01',
      title: 'Powered by Investraders Platform',
      tag: 'Proprietary Matchmaking Engine',
      desc: 'At the core of Investrade 1 is the Investraders platform, moving beyond conventional networking into precision algorithmic execution.',
      features: [
        'Curated Cap Tables & Project Profiles: Pre-vetted metrics, funding requirements, equity structure, and growth projections.',
        'Precision Matchmaking: Algorithm pairs investors with opportunities based on sector, maturity stage, ticket size, and geography.',
        'Structured B2B Scheduling: Browse portfolios in advance, request high-intent 1-on-1 meetings, and secure dedicated deal rooms.'
      ],
      icon: Cpu,
      gradient: 'from-cyan-500 to-blue-600'
    },
    {
      number: '02',
      title: 'High-Level Forum & Panels',
      tag: 'Plenary Thought Leadership',
      desc: 'Two full days of keynote sessions, ministerial panels, and country spotlights analyzing the macro-investment landscape.',
      features: [
        'Global Macroeconomic Trends & Inflation Resilient Assets',
        'Cross-Border Regulatory Frameworks & Regional Integration',
        'Emerging AI Technologies, Clean Hydrogen & Sustainable Capital'
      ],
      icon: Compass,
      gradient: 'from-purple-500 to-indigo-600'
    },
    {
      number: '03',
      title: 'Interactive Exhibition Hall',
      tag: '100+ Showcases & Pavilions',
      desc: 'A dynamic, high-visibility exhibition space at Palais des Congrès featuring leading corporations, emerging ventures, and global delegations.',
      features: [
        'Corporate Innovation & Regional Industrial Champions',
        'Startup Alley: 50+ Vetted Seed & Series-A Scaleups',
        'International Country & Investment Agency Pavilions'
      ],
      icon: Building2,
      gradient: 'from-amber-500 to-rose-600'
    },
    {
      number: '04',
      title: 'Direct Strategic Outcomes',
      tag: 'Tangible Deal Flow',
      desc: 'Designed purposefully to translate dialogue into signed commitments, sovereign co-investments, and executed term sheets.',
      features: [
        'Signed MOUs & Term Sheets executed directly on site',
        'Global Media & Investor Community Visibility',
        'Long-term Cross-Border Trade & Investment Alliances'
      ],
      icon: FileCheck2,
      gradient: 'from-emerald-500 to-teal-600'
    }
  ];

  const scheduleDay1 = [
    { time: '08:30 – 09:30', title: 'Delegate Registration & Networking Breakfast', type: 'Welcome', track: 'Registration Hall' },
    { time: '09:30 – 10:45', title: 'Grand Opening Plenary: Tunisia at the Crossroads of Global Capital', type: 'Plenary', track: 'Auditorium Hannibal' },
    { time: '11:00 – 12:30', title: 'High-Level Panel: FDI Modernization, Cross-Border Treaties & European Corridors', type: 'Policy', track: 'Auditorium Hannibal' },
    { time: '12:30 – 14:00', title: 'VIP Exhibition Hall Inauguration & Executive Networking Luncheon', type: 'Exhibition', track: 'Exhibition Pavilions' },
    { time: '14:00 – 15:30', title: 'Sovereign Wealth & Infrastructure: Deploying Capital in Clean Energy & Green Hydrogen', type: 'Roundtable', track: 'Hall Carthage' },
    { time: '15:45 – 17:30', title: 'Structured B2B Matchmaking: 1-on-1 Investor & Enterprise Pre-Scheduled Meetings', type: 'Deal-Room', track: 'Investraders B2B Hub' },
    { time: '18:00 – 20:00', title: 'VIP Networking Cocktail & Strategic Partnership Announcements', type: 'Reception', track: 'VIP Terrace' }
  ];

  const scheduleDay2 = [
    { time: '09:00 – 10:30', title: 'Venture & Scale-Up Arena: Top 25 Regional Startups Pitch to Global VCs', type: 'Pitching', track: 'Auditorium Hannibal' },
    { time: '10:45 – 12:15', title: 'Sectoral Deep-Dive: Agri-Food Sovereignty, Smart Cold-Chain & Export Logistics', type: 'Sectoral', track: 'Hall Carthage' },
    { time: '12:15 – 13:45', title: 'Lunch & Exhibition Exploration: Tech & Industrial Innovation Showcases', type: 'Networking', track: 'Exhibition Pavilions' },
    { time: '13:45 – 15:15', title: 'Advanced Manufacturing, Automotive & Electronics Harness Manufacturing in North Africa', type: 'Industrial', track: 'Hall Carthage' },
    { time: '15:30 – 16:45', title: 'Final Deal-Room Closures & Term Sheet Execution Sessions', type: 'Deal-Room', track: 'Investraders B2B Hub' },
    { time: '17:00 – 17:45', title: 'Official Closing Ceremony: Announcement of Signed MOUs & Investrade 2 Roadmap', type: 'Closing', track: 'Auditorium Hannibal' }
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 overflow-x-hidden">
      <WebsiteNavbar />

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
            <span>1st Forum & Exhibition for Investment and International Cooperation</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-tight mb-6"
          >
            INVESTRADE <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">1</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-base sm:text-xl text-slate-300 max-w-4xl mx-auto mb-10 leading-relaxed font-normal"
          >
            North Africa’s premier international platform bridging <span className="text-white font-semibold">high-impact projects</span>, <span className="text-white font-semibold">innovative startups</span>, and <span className="text-white font-semibold">expanding corporate enterprises</span> with global investors, venture capitalists, sovereign funds, and financial institutions.
          </motion.p>

          {/* Key Facts Pill Grid */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto mb-12 text-left"
          >
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-cyan-500/20 backdrop-blur-md flex items-center gap-3.5 shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/30">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Summit Dates</span>
                <span className="text-sm sm:text-base font-extrabold text-white">April 20 – 21, 2027</span>
                <span className="text-[10px] text-cyan-300 block font-medium">2 High-Intensity Days</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-emerald-500/20 backdrop-blur-md flex items-center gap-3.5 shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Official Venue</span>
                <span className="text-sm sm:text-base font-extrabold text-white">Palais des Congrès</span>
                <span className="text-[10px] text-emerald-300 block font-medium">Tunis, Tunisia</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-amber-500/20 backdrop-blur-md flex items-center gap-3.5 shadow-lg">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Matchmaking Engine</span>
                <span className="text-sm sm:text-base font-extrabold text-white">Investraders Platform</span>
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
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest block mb-3">
              Official Summit Countdown • April 20, 2027
            </span>
            <div className="grid grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/10">
                <div className="text-2xl sm:text-4xl font-black text-white">{timeLeft.days}</div>
                <div className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase">Days</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/10">
                <div className="text-2xl sm:text-4xl font-black text-white">{timeLeft.hours}</div>
                <div className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase">Hours</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/10">
                <div className="text-2xl sm:text-4xl font-black text-white">{timeLeft.minutes}</div>
                <div className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase">Minutes</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-white/10">
                <div className="text-2xl sm:text-4xl font-black text-cyan-400 animate-pulse">{timeLeft.seconds}</div>
                <div className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase">Seconds</div>
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
              Register for Delegate Pass
            </a>

            <a
              href="#pillars-section"
              className="w-full sm:w-auto px-7 py-4 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-bold text-sm border border-slate-700 transition-all flex items-center justify-center gap-2"
            >
              <span>Explore 4 Core Pillars</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <a
              href="#schedule-section"
              className="w-full sm:w-auto px-6 py-4 rounded-full bg-white/5 hover:bg-white/10 text-cyan-300 font-bold text-sm border border-cyan-500/30 transition-all flex items-center justify-center gap-2"
            >
              <Clock className="w-4 h-4 text-cyan-400" />
              2-Day Program Schedule
            </a>
          </motion.div>

        </div>
      </section>

      {/* Key Stats Bar */}
      <section className="border-y border-white/10 bg-slate-950/70 py-8 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
          <div>
            <div className="text-2xl sm:text-4xl font-extrabold text-cyan-400">2 Full Days</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">B2B Deal-Making</div>
          </div>
          <div>
            <div className="text-2xl sm:text-4xl font-extrabold text-emerald-400">500+</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">Accredited Capital Allocators</div>
          </div>
          <div>
            <div className="text-2xl sm:text-4xl font-extrabold text-amber-400">150+</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">Pre-Vetted Projects</div>
          </div>
          <div>
            <div className="text-2xl sm:text-4xl font-extrabold text-purple-400">40+</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">Participating Countries</div>
          </div>
          <div className="col-span-2 md:col-span-1">
            <div className="text-2xl sm:text-4xl font-extrabold text-blue-400">$500M+</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">Target Pipeline Capacity</div>
          </div>
        </div>
      </section>

      {/* Executive Summary & Vision / Mission */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-12">
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 block mb-2">
            Executive Framework
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            Transforming Cross-Border Investment Dialog into Concrete Deal Flows
          </h2>
        </div>

        {/* Executive Summary Hero Card */}
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-slate-900 via-[#0B152A] to-slate-900 border border-cyan-500/30 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <Award className="w-6 h-6 text-cyan-400" />
            Executive Summary
          </h3>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6 font-normal">
            Held over two high-intensity days at the <strong>Palais des Congrès in Tunis</strong>, <strong>Investrade 1</strong> is designed to transform cross-border investment dialog into concrete deal flows, joint ventures, and sustainable strategic partnerships.
          </p>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Powered by the <strong>Investraders</strong> digital platform, the event moves beyond conventional networking by utilizing smart matchmaking tools and curated cap tables to seamlessly connect capital seekers with the right capital providers.
          </p>
        </div>

        {/* Vision & Mission Split Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Vision */}
          <div className="p-8 rounded-3xl bg-slate-900/80 border border-emerald-500/30 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6 border border-emerald-500/30">
                <Compass className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block mb-2">Our Vision</span>
              <h4 className="text-xl sm:text-2xl font-extrabold text-white mb-4">
                The Central Investment Hub for Africa & Europe
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                To establish Tunisia as a central investment hub at the crossroads of Africa, Europe, and the Middle East, fostering a dynamic global ecosystem where visionary capital meets transformative projects to drive sustainable economic growth.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center gap-2 text-xs text-emerald-300 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Crossroads of Africa, Europe & Middle East
            </div>
          </div>

          {/* Mission */}
          <div className="p-8 rounded-3xl bg-slate-900/80 border border-cyan-500/30 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
            <div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-6 border border-cyan-500/30">
                <Rocket className="w-6 h-6" />
              </div>
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest block mb-2">Our Mission</span>
              <h4 className="text-xl sm:text-2xl font-extrabold text-white mb-4">
                Structured, High-Value Deal Execution
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                To facilitate direct, high-value investment opportunities by providing a structured, data-driven environment for project owners, startups, established companies, and international investors to connect, negotiate, and execute strategic partnerships.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center gap-2 text-xs text-cyan-300 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              Data-Driven Negotiation & Strategic Partnering
            </div>
          </div>
        </div>
      </section>

      {/* Strategic Goals & Objectives */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-950/60 border-y border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 block mb-2">
              Strategic Blueprint
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              Key Event Objectives & Strategic Goals
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {strategicGoals.map((goal, idx) => {
              const Icon = goal.icon;
              return (
                <div 
                  key={idx}
                  className={`p-6 rounded-3xl bg-slate-900/80 border ${goal.border} hover:scale-[1.02] transition-transform duration-300 shadow-xl flex flex-col justify-between`}
                >
                  <div>
                    <div className={`w-12 h-12 rounded-2xl ${goal.bg} ${goal.color} flex items-center justify-center mb-5 border border-white/10`}>
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
            Targeted Stakeholders
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-4">
            Curated Ecosystem of Decision Makers
          </h2>
          <p className="text-sm text-slate-300">
            Investrade 1 gathers accredited participants across four complementary investment pillars.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {audienceCategories.map((cat) => {
            const Icon = cat.icon;
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
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${cat.badgeColor}`}>
                      {cat.subtitle}
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-white mb-3">{cat.title}</h3>
                  <p className="text-xs text-slate-400 mb-6 font-medium italic">
                    "{cat.valueProp}"
                  </p>

                  <div className="space-y-2.5">
                    {cat.stakeholders.map((s, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-slate-200">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{s}</span>
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
                    Register as {cat.title} <ArrowRight className="w-3.5 h-3.5" />
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
              Signature Pillars
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-4">
              Featured Pillars & Tangible Outcomes
            </h2>
            <p className="text-sm text-slate-300">
              Four interconnected modules powering cross-border transactions at Palais des Congrès.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {eventPillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div 
                  key={idx}
                  className="p-8 rounded-3xl bg-slate-900/80 border border-cyan-500/20 shadow-2xl backdrop-blur-xl relative overflow-hidden flex flex-col justify-between"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-3xl font-black text-cyan-400/30 font-mono">
                        {pillar.number}
                      </span>
                      <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                        {pillar.tag}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                      {pillar.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed">
                      {pillar.desc}
                    </p>

                    <div className="space-y-3">
                      {pillar.features.map((feat, fIdx) => (
                        <div key={fIdx} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-200 flex items-start gap-3">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {pillar.number === '01' && (
                    <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between">
                      <Link
                        to="/investment-network"
                        className="text-xs font-bold text-cyan-300 hover:underline flex items-center gap-1.5"
                      >
                        Explore Live Matchmaking Network <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Program Schedule (2 Days) */}
      <section id="schedule-section" className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 block mb-2">
            Summit Program
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-4">
            Two Days of Strategic Dialog & Deal-Rooms
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Palais des Congrès, Tunis • High-intensity plenary keynotes, sector deep-dives, and pre-scheduled deal rooms.
          </p>

          {/* Day Switcher Tabs */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => setSelectedDay(1)}
              className={`px-6 py-3 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                selectedDay === 1
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-900 text-slate-300 border border-slate-700 hover:border-cyan-500/40'
              }`}
            >
              Day 1: Tuesday, April 20, 2027
            </button>
            <button
              onClick={() => setSelectedDay(2)}
              className={`px-6 py-3 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                selectedDay === 2
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-900 text-slate-300 border border-slate-700 hover:border-cyan-500/40'
              }`}
            >
              Day 2: Wednesday, April 21, 2027
            </button>
          </div>
        </div>

        {/* Schedule List */}
        <div className="space-y-4">
          {(selectedDay === 1 ? scheduleDay1 : scheduleDay2).map((item, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-2xl border transition-all ${
                item.type === 'Plenary' || item.type === 'Deal-Room' || item.type === 'Closing'
                  ? 'bg-slate-900/90 border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.1)]'
                  : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-md bg-cyan-500/10 text-cyan-400 font-mono text-xs font-bold border border-cyan-500/30">
                      {item.time}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/5 text-slate-300 border border-white/10 uppercase">
                      {item.type}
                    </span>
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-white pt-1">{item.title}</h4>
                </div>

                <div className="text-right sm:text-left bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 shrink-0">
                  <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    {item.track}
                  </span>
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
              Official Delegation Registration
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">
              Reserve Your Investrade 1 Delegate Pass
            </h2>
            <p className="text-slate-300 text-sm max-w-xl mx-auto">
              Register now to generate your official encrypted QR pass and unlock pre-event cap table matching for April 20–21, 2027 at Palais des Congrès.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Registration Form */}
            <div className="lg:col-span-7 bg-slate-900/90 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">
              
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
                <User className="w-5 h-5 text-cyan-400" />
                Delegate Information & Cap Table Credentials
              </h3>

              <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Category Selection Tabs */}
                <div>
                  <label className="block text-xs font-bold text-cyan-300 uppercase tracking-wider mb-2">
                    Select Your Participant Category *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'investor', label: 'Capital Provider / Investor' },
                      { id: 'project', label: 'Capital Seeker / Project' },
                      { id: 'institution', label: 'Institutional / Public' },
                      { id: 'partner', label: 'Ecosystem Partner / Advisory' },
                    ].map((cat) => (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`p-3 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between ${
                          selectedCategory === cat.id
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                            : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <span>{cat.label}</span>
                        {selectedCategory === cat.id && <Check className="w-4 h-4 text-cyan-400" />}
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
                  <div className="flex-1 text-center sm:text-left">
                    <span className="text-xs font-bold text-white block">Official Pass Photo</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Upload a professional portrait photo to be printed on your digital badge pass.
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-cyan-300 mb-1.5 uppercase tracking-wider">
                    Full Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="fullName"
                      required
                      value={formData.fullName}
                      onChange={handleInputChange}
                      placeholder="e.g. Dr. Alexandre Dupont"
                      className="w-full bg-slate-950/90 border border-slate-700 focus:border-cyan-400 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 text-sm font-medium focus:outline-none transition-all"
                    />
                    <User className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-cyan-300 mb-1.5 uppercase tracking-wider">
                      Work Email *
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="name@organization.com"
                        className="w-full bg-slate-950/90 border border-slate-700 focus:border-cyan-400 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 text-sm font-medium focus:outline-none transition-all"
                      />
                      <Mail className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-cyan-300 mb-1.5 uppercase tracking-wider">
                      Phone Number
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+216 -- --- ---"
                        className="w-full bg-slate-950/90 border border-slate-700 focus:border-cyan-400 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 text-sm font-medium focus:outline-none transition-all"
                      />
                      <Phone className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-cyan-300 mb-1.5 uppercase tracking-wider">
                      Company / Organization *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="company"
                        required
                        value={formData.company}
                        onChange={handleInputChange}
                        placeholder="e.g. Apex Capital Partners"
                        className="w-full bg-slate-950/90 border border-slate-700 focus:border-cyan-400 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 text-sm font-medium focus:outline-none transition-all"
                      />
                      <Building2 className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-cyan-300 mb-1.5 uppercase tracking-wider">
                      Role / Position *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="role"
                        required
                        value={formData.role}
                        onChange={handleInputChange}
                        placeholder="e.g. Managing Partner / CEO"
                        className="w-full bg-slate-950/90 border border-slate-700 focus:border-cyan-400 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 text-sm font-medium focus:outline-none transition-all"
                      />
                      <Briefcase className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-cyan-300 mb-1.5 uppercase tracking-wider">
                    Primary Sector Focus
                  </label>
                  <select
                    name="sector"
                    value={formData.sector}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950/90 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-3 text-white text-sm font-medium focus:outline-none transition-all"
                  >
                    <option value="Technology & AI">Technology & Artificial Intelligence</option>
                    <option value="Renewable Energy & Solar">Renewable Energy, Solar & Green Hydrogen</option>
                    <option value="Agri-Food & Smart Farming">Agri-Food, Cold-Chain & Smart Farming</option>
                    <option value="Advanced Manufacturing & Auto">Advanced Manufacturing & Automotive Cables</option>
                    <option value="Pharma & Healthcare Biotech">Pharma, Medical Devices & Biotech</option>
                    <option value="Logistics, Trade & Ports">Logistics, International Trade & Ports</option>
                    <option value="Venture Capital & Private Equity">Venture Capital & Private Equity Funds</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-500 hover:from-cyan-300 hover:to-emerald-400 text-slate-950 font-black text-sm shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer"
                >
                  <Zap className="w-5 h-5 fill-current shrink-0" />
                  <span>{loading ? 'Generating Official Pass...' : 'Confirm Registration & Generate Badge Now'}</span>
                </button>
              </form>
            </div>

            {/* Right Badge Preview */}
            <div id="badge-preview-section" className="lg:col-span-5 sticky top-24">
              <div className="text-center lg:text-left mb-3">
                <span className="text-xs text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5 justify-center lg:justify-start">
                  <ShieldCheck className="w-4 h-4" />
                  Live Digital Delegate Pass
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
                  <h4 className="text-lg font-bold text-white">Your Pass Awaits Registration</h4>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                    Fill in your credentials to instantly generate your encrypted QR access code and personalized badge for <strong>Investrade 1 (April 20–21, 2027 at Palais des Congrès, Tunis)</strong>.
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
