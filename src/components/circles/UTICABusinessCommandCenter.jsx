import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/ThemeContext';
import {
  Building2, Users, AlertTriangle, TrendingUp, TrendingDown, Sparkles,
  Zap, Globe, ShieldCheck, Search, Filter, MessageSquare, ArrowRight,
  ChevronRight, ChevronLeft, MapPin, BarChart3, PieChart, Landmark, CheckCircle2,
  AlertCircle, HelpCircle, Layers, FileText, Send, Radio, Compass, RefreshCw,
  Share2, Award, ExternalLink, Cpu, Maximize2, Minimize2, Copy, Printer, Check, X,
  Play, Pause, Monitor
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';

// ── Mock Data for UTICA Command Center ──
const NATIONAL_KPIS = [
  { label: '🏢 Companies Connected', value: '18,450', change: '+4.2% MoM', status: 'positive' },
  { label: '👥 Active Stakeholders', value: '126,800', change: 'Across 24 Regions', status: 'neutral' },
  { label: '💬 Issues Reported', value: '1,284', change: '-5.1% this week', status: 'positive' },
  { label: '⚠️ Emerging Risks', value: '37', change: '8 High Priority', status: 'negative' },
  { label: '🚀 Business Opportunities', value: '214', change: '47 International', status: 'positive' },
  { label: '📈 Business Sentiment', value: '68% Positive', change: '🟢 Stable (+2%)', status: 'positive' },
  { label: '🤝 Active Partnerships', value: '486', change: '+18 this month', status: 'positive' },
  { label: '🔥 Trending Sectors', value: '7', change: 'Tech & Cleantech Lead', status: 'neutral' },
];

const STAKEHOLDER_SENTIMENT = [
  { segment: 'Members', sentiment: 72, status: 'positive', count: '14,200 companies' },
  { segment: 'SMEs', sentiment: 58, status: 'warning', count: '11,800 companies' },
  { segment: 'Large Enterprises', sentiment: 76, status: 'positive', count: '1,450 companies' },
  { segment: 'Exporters', sentiment: 61, status: 'warning', count: '3,200 companies' },
  { segment: 'Manufacturing', sentiment: 70, status: 'positive', count: '4,100 companies' },
  { segment: 'Services', sentiment: 73, status: 'positive', count: '5,600 companies' },
  { segment: 'Retail & Crafts', sentiment: 48, status: 'danger', count: '2,900 companies' },
  { segment: 'Technology & AI', sentiment: 82, status: 'positive', count: '1,800 companies' },
];

const REGIONAL_PULSE = {
  'Tunis': { companies: 6420, stakeholders: 48100, sentiment: 71, issues: 12, opps: 84, concerns: 'Financing & Commercial Rents', growth: '+5.4%' },
  'Sfax': { companies: 2840, stakeholders: 14200, sentiment: 63, issues: 8, opps: 31, concerns: 'Port Logistics & Export Clearance', growth: '+3.8%' },
  'Sousse': { companies: 2150, stakeholders: 18900, sentiment: 67, issues: 6, opps: 29, concerns: 'Tourism Seasonality & Energy Rates', growth: '+4.1%' },
  'Bizerte': { companies: 1480, stakeholders: 9800, sentiment: 65, issues: 5, opps: 18, concerns: 'Industrial Water & Subcontracting', growth: '+2.9%' },
  'Gabès': { companies: 980, stakeholders: 6200, sentiment: 54, issues: 9, opps: 14, concerns: 'Environmental Regulations & Logistics', growth: '+1.5%' },
  'Kairouan': { companies: 820, stakeholders: 5100, sentiment: 59, issues: 4, opps: 12, concerns: 'Agri-processing Access to Credit', growth: '+2.2%' },
  'Monastir': { companies: 1920, stakeholders: 13400, sentiment: 53, issues: 11, opps: 22, concerns: 'Textile Export Delays & Energy Costs', growth: '-1.2%' },
  'Nabeul': { companies: 1650, stakeholders: 11200, sentiment: 69, issues: 3, opps: 24, concerns: 'Handicraft Raw Material Inflation', growth: '+4.5%' },
};

const SECTOR_INTELLIGENCE = [
  { name: 'Manufacturing & Industry', sentiment: 70, growth: '+6.2%', risk: 'Energy Tariffs & Freight Costs', opps: 42, engagement: '+14%', priority: 'High' },
  { name: 'Tourism & Hospitality', sentiment: 64, growth: '+12.0%', risk: 'Off-Season Liquidity & Hiring', opps: 28, engagement: '+8%', priority: 'Medium' },
  { name: 'Agriculture & Agrofood', sentiment: 58, growth: '+4.1%', risk: 'Water Scarcity & Input Prices', opps: 35, engagement: '+19%', priority: 'High' },
  { name: 'AI & Technology', sentiment: 84, growth: '+28.4%', risk: 'Talent Brain Drain & FX Limits', opps: 56, engagement: '+32%', priority: 'Critical' },
  { name: 'Banking & Financial Services', sentiment: 75, growth: '+5.5%', risk: 'Key Interest Rates & Non-Performing Loans', opps: 19, engagement: '+11%', priority: 'Medium' },
  { name: 'Retail & Commerce', sentiment: 48, growth: '-2.1%', risk: 'Purchasing Power & Informal Sector', opps: 14, engagement: '+6%', priority: 'Urgent' },
  { name: 'Logistics & Transport', sentiment: 52, growth: '+3.4%', risk: 'Radès Port Dwell Times', opps: 22, engagement: '+16%', priority: 'High' },
  { name: 'Energy & Cleantech', sentiment: 79, growth: '+18.2%', risk: 'STEG Grid Interconnection Permits', opps: 38, engagement: '+24%', priority: 'High' },
];

const POLICY_MONITOR = [
  { title: 'Loi de Finances 2026 — Corporate Tax Provisions', category: 'Taxation', impact: 'negative', level: 'High', summary: 'Proposed 2% extra solidarity contribution on corporate profits above 1M TND.' },
  { title: 'Startup Act 2.0 & Innovation Investment Decree', category: 'Technology', impact: 'positive', level: 'Critical', summary: 'Tax holiday extension to 8 years and simplified foreign currency accounts for tech exporters.' },
  { title: 'RE Auto-Production Framework (STEG Grid Access)', category: 'Energy', impact: 'positive', level: 'High', summary: 'Allows industrial companies to self-generate solar power up to 15MW with grid wheeling.' },
  { title: 'Port Customs Dwell Time & Inspection Directive', category: 'Customs', impact: 'negative', level: 'Medium', summary: 'New physical inspection requirement for containerized chemical imports.' },
];

const OPPORTUNITIES_RADAR = [
  { title: 'Agro-processing Supplier ➔ EU Retail Chain', companyA: 'Olive Oil Coop Sfax', companyB: 'EuroDistrib France', val: '2.4M TND', match: 94, country: 'France (EU)', sector: 'Food' },
  { title: 'Software R&D Subcontracting Hub', companyA: 'Tunis Tech Solutions', companyB: 'Gulf Innovation Bank (Riyadh)', val: '1.8M TND', match: 91, country: 'Saudi Arabia', sector: 'Technology' },
  { title: 'Textile Eco-Labeling Partnership', companyA: 'Monastir Weaving Mills', companyB: 'GreenCert Germany', val: '850K TND', match: 87, country: 'Germany', sector: 'Textile' },
];

const EXECUTIVE_ALERTS = [
  { id: 1, type: 'HIGH PRIORITY', title: 'Textile Industry Sentiment Drop in Monastir (-17%)', detail: 'Exporters report severe margin pressure due to 22% increase in industrial gas tariffs and container delays at Radès Port.', action: 'Schedule emergency roundtable with Textile Federation & Ministry of Industry.' },
  { id: 2, type: 'OPPORTUNITY', title: '14 Tunisian Companies Cleared for Saudi Expansion', detail: 'Saudi Vision 2030 tenders open for Tunisian construction & IT consultancy firms.', action: 'Organize Tunisia–Saudi B2B Matchmaking Session with UTICA Trade Council.' },
];

// ── Command Tabs Definition ──
export const UTICA_COMMAND_TABS = [
  { id: 'overview', label: '1. Business Pulse National', icon: BarChart3 },
  { id: 'ai-pulse', label: '2. Briefing AI & Chat', icon: Cpu },
  { id: 'sentiment', label: '3. Cartographie du Sentiment', icon: PieChart },
  { id: 'regions', label: '4. Carte Économique Régionale', icon: MapPin },
  { id: 'sectors', label: '5. Sector Intelligence', icon: Building2 },
  { id: 'voice', label: '6. Voice of Business', icon: MessageSquare },
  { id: 'policy', label: '7. Veille Réglementaire & Lois', icon: ShieldCheck },
  { id: 'opportunities', label: '8. Radar d\'Opportunités B2B', icon: Zap },
];

export default function UTICABusinessCommandCenter({
  circle,
  user,
  isDark: externalIsDark,
  initialFullscreen = false,
  onExitFullscreen,
}) {
  const { isDark: contextIsDark } = useTheme();
  const isDark = externalIsDark !== undefined ? externalIsDark : contextIsDark;

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedRegion, setSelectedRegion] = useState('Tunis');
  const [selectedSentimentSegment, setSelectedSentimentSegment] = useState(null);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [executiveBrief, setExecutiveBrief] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(initialFullscreen));

  // Interactive Action Modals
  const [actionAlertModal, setActionAlertModal] = useState(null);
  const [actionSuccessToast, setActionSuccessToast] = useState(null);
  const [matchmakingModal, setMatchmakingModal] = useState(null);
  const [matchmakingSuccessToast, setMatchmakingSuccessToast] = useState(null);
  const [policyModal, setPolicyModal] = useState(null);
  const [copiedBrief, setCopiedBrief] = useState(false);

  // Sync initialFullscreen prop
  useEffect(() => {
    if (initialFullscreen && !isFullscreen) {
      setIsFullscreen(true);
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    }
  }, [initialFullscreen]);

  // Lock body scroll in fullscreen mode
  useEffect(() => {
    if (isFullscreen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isFullscreen]);

  // Fetch live metrics from Supabase database to enrich the dashboard
  const { data: dbStats } = useQuery({
    queryKey: ['utica-db-live-stats'],
    queryFn: async () => {
      try {
        const [usersRes, circlesRes, projectsRes, eventRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('Circle').select('id', { count: 'exact', head: true }),
          supabase.from('InvestmentProject').select('id', { count: 'exact', head: true }),
          supabase.from('event_registrations').select('id', { count: 'exact', head: true }),
        ]);
        return {
          members: usersRes?.count || 0,
          circles: circlesRes?.count || 0,
          projects: projectsRes?.count || 0,
          eventAttendees: eventRes?.count || 0,
        };
      } catch (err) {
        return null;
      }
    },
    staleTime: 60000,
  });

  const handlePrevTab = () => {
    const tabIds = UTICA_COMMAND_TABS.map(t => t.id);
    const idx = tabIds.indexOf(activeTab);
    if (idx !== -1) {
      setActiveTab(tabIds[(idx - 1 + tabIds.length) % tabIds.length]);
    }
  };

  const handleNextTab = () => {
    const tabIds = UTICA_COMMAND_TABS.map(t => t.id);
    const idx = tabIds.indexOf(activeTab);
    if (idx !== -1) {
      setActiveTab(tabIds[(idx + 1) % tabIds.length]);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        setIsFullscreen(false);
        if (onExitFullscreen) onExitFullscreen();
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isFullscreen, onExitFullscreen]);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      setIsFullscreen(false);
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      if (onExitFullscreen) onExitFullscreen();
    }
  };

  // Keyboard shortcut listener for 'F' (fullscreen toggle), 'Escape' (close modals / exit), and Arrow keys (tab switch)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'Escape') {
        if (executiveBrief) setExecutiveBrief(null);
        else if (actionAlertModal) setActionAlertModal(null);
        else if (matchmakingModal) setMatchmakingModal(null);
        else if (policyModal) setPolicyModal(null);
        else if (isFullscreen) {
          toggleFullscreen();
        }
      } else if (isFullscreen && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
        e.preventDefault();
        if (e.key === 'ArrowRight') handleNextTab();
        else handlePrevTab();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, activeTab, executiveBrief, actionAlertModal, matchmakingModal, policyModal]);

  const handleCopyBrief = () => {
    if (!executiveBrief) return;
    const text = `UTICA CEO Daily AI Executive Briefing (${executiveBrief.date})\n\n` +
      `URGENCES LEADERSHIP:\n` + executiveBrief.attention.map(i => `• ${i}`).join('\n') + `\n\n` +
      `OPPORTUNITÉS STRATÉGIQUES:\n` + executiveBrief.opportunities.map(i => `• ${i}`).join('\n') + `\n\n` +
      `ACTIONS RECOMMANDÉES:\n` + executiveBrief.actions.map(i => `• ${i}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedBrief(true);
    setTimeout(() => setCopiedBrief(false), 2500);
  };

  const handlePrintBrief = () => {
    window.print();
  };

  // AI Assistant Generator
  const handleAskAI = (questionText) => {
    const q = questionText || aiQuery;
    if (!q) return;
    setAiQuery(q);
    setAiLoading(true);

    setTimeout(() => {
      let reply = '';
      if (q.includes('concerns') || q.includes('SMEs')) {
        reply = `**Top 3 Concerns of Tunisian SMEs (Current Month):**\n1. **Access to Bank Liquidity & Credit Lines**: 64% of SMEs report credit rationing and elevated interest rates.\n2. **Inflation & Operating Costs**: Rising prices of imported raw materials and energy tariffs.\n3. **Administrative & Customs Delays**: Port dwell times at Radès averaging 14 days for raw inputs.`;
      } else if (q.includes('sectors') || q.includes('growth')) {
        reply = `**Highest Growth Potential Sectors:**\n1. **AI & Technology (+28.4% YoY)**: Strong demand from MENA and European clients for tech offshoring.\n2. **Energy & Cleantech (+18.2% YoY)**: Accelerating adoption of industrial solar auto-production.\n3. **Agro-export & Olive Oil (+12.0% YoY)**: Premium bottled oil expansion into North American and Asian markets.`;
      } else if (q.includes('government') || q.includes('prioritize')) {
        reply = `**Recommended UTICA Priorities for Government Dialogue:**\n1. **Customs Clearance Speed-up**: Mandate a 48-hour green channel for accredited exporters at Radès Port.\n2. **SME Liquidity Guarantee**: Establish a joint UTICA-BCT emergency working capital guarantee fund.\n3. **Energy Transition Support**: Expedite STEG grid connection approvals for industrial solar auto-producers.`;
      } else {
        reply = `**UTICA Executive AI Synthesis for "${q}":**\nBased on real-time data from 18,450 connected Tunisian enterprises across 24 governorates:\n• Business sentiment is holding steady at 68% positive.\n• Priority attention is recommended for Retail & Textile sectors currently facing cost pressures.\n• 47 international trade matchmaking opportunities are ready for UTICA leadership endorsement.`;
      }
      setAiResponse(reply);
      setAiLoading(false);
    }, 1000);
  };

  const handleGenerateExecutiveBrief = () => {
    setAiLoading(true);
    setTimeout(() => {
      setExecutiveBrief({
        date: new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        attention: [
          'Textile & Garment sector in Monastir/Sousse experiencing 17% drop in sentiment due to energy tariffs & port delays.',
          'Retail & Crafts sector sentiment fell below 50% threshold due to purchasing power constraints.',
          'SME financing requests spiked +24% across Central and Southern governorates.'
        ],
        opportunities: [
          'Saudi Arabia Vision 2030: 14 Tunisian tech & engineering firms shortlisted for B2B contracts.',
          'EU Green Deal Transition: 38 industrial units ready for joint cleantech investment.',
          'Sub-Saharan Africa (COMESA): 23 agricultural machinery export leads detected.'
        ],
        actions: [
          'Schedule urgent meeting with Ministry of Industry & BCT on SME working capital lines.',
          'Convene Sector Federations (Textile, Agriculture, Tech) for the Q4 Executive Policy Forum.',
          'Launch the UTICA B2B Saudi Arabia Trade Delegation registration.'
        ]
      });
      setAiLoading(false);
    }, 1100);
  };

  const content = (
    <div
      className={`transition-all duration-200 no-scrollbar ${
        isFullscreen
          ? 'fixed inset-0 z-[999999] overflow-y-auto w-screen h-screen rounded-none border-none p-0 m-0'
          : 'relative rounded-2xl border overflow-hidden shadow-2xl'
      } ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
    >
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      
      {/* ── Top Header Banner ── */}
      <div
        className="relative border-b border-border/40 p-6 sm:p-8 transition-all"
        style={{ background: isDark ? 'linear-gradient(135deg,#0a192f 0%,#0f2b48 50%,#1e3a8a 100%)' : 'linear-gradient(135deg,#1e3a8a 0%,#1e40af 50%,#0f172a 100%)' }}
      >
        {/* Small corner Fullscreen button */}
        <button
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 sm:top-5 sm:right-6 z-20 flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
          title={isFullscreen ? "Quitter le plein écran (Échap ou F)" : "Plein écran (F)"}
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline text-[11px]">Quitter</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline text-[11px]">Plein écran</span>
            </>
          )}
        </button>

        {/* Header content with clear, uncompacted visual hierarchy */}
        <div className="flex items-start sm:items-center gap-4 sm:gap-5 relative z-10 text-white pr-20 sm:pr-28">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-lg">
            <Landmark className="text-amber-400 w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                UTICA LEADERSHIP COMMAND CENTER
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-200 border border-blue-500/30">
                AI-POWERED ECONOMIC PULSE
              </span>
            </div>
            
            <h1 className="text-lg sm:text-2xl font-bold tracking-normal leading-snug text-white">
              Union Tunisienne de l'Industrie, du Commerce et de l'Artisanat
            </h1>
            
            <p className="text-blue-100/85 mt-1.5 text-xs sm:text-sm font-normal leading-relaxed max-w-3xl">
              Tableau de bord stratégique d'Intelligence Économique Nationale & d'Écoute en Temps Réel des Entreprises Tunisiennes.
            </p>

            {/* Briefing Exécutif CEO placed under the title */}
            <div className="pt-3">
              <Button
                onClick={handleGenerateExecutiveBrief}
                disabled={aiLoading}
                size="sm"
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl shadow-md inline-flex items-center gap-2 cursor-pointer transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                {aiLoading ? 'Génération du Briefing...' : 'Briefing Exécutif CEO'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className={`flex border-b overflow-x-auto no-scrollbar whitespace-nowrap px-4 sm:px-6 ${isFullscreen ? 'sticky top-0 z-40 backdrop-blur-md' : ''} ${isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200'}`}>
        {UTICA_COMMAND_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 transition-all shrink-0 cursor-pointer px-4 py-3 text-xs font-semibold ${
                isActive
                  ? isDark ? 'border-amber-400 text-amber-300 bg-amber-500/10' : 'border-blue-600 text-blue-700 bg-blue-50/70'
                  : isDark ? 'text-slate-400 hover:text-white border-transparent' : 'text-slate-600 hover:text-slate-900 border-transparent'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Executive AI Briefing Modal ── */}
      <AnimatePresence>
        {executiveBrief && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }} className={`w-full max-w-2xl rounded-2xl p-6 border shadow-2xl space-y-5 ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
              <div className="flex items-center justify-between border-b pb-3 border-border">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <h3 className="font-extrabold text-base">UTICA CEO Daily AI Executive Briefing</h3>
                </div>
                <button onClick={() => setExecutiveBrief(null)} className="text-muted-foreground hover:text-foreground text-sm font-bold p-1">✕</button>
              </div>

              <p className="text-xs text-amber-400 font-semibold">{executiveBrief.date}</p>

              <div className="space-y-4 text-xs">
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-red-950/20 border-red-500/30' : 'bg-red-50 border-red-200'}`}>
                  <h4 className="font-bold text-red-500 mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> 3 Urgences nécessitant une attention leadership :
                  </h4>
                  <ul className="space-y-1.5 list-disc list-inside text-muted-foreground">
                    {executiveBrief.attention.map((item, idx) => <li key={idx}>{item}</li>)}
                  </ul>
                </div>

                <div className={`p-4 rounded-xl border ${isDark ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'}`}>
                  <h4 className="font-bold text-emerald-500 mb-2 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" /> 3 Opportunités stratégiques majeures :
                  </h4>
                  <ul className="space-y-1.5 list-disc list-inside text-muted-foreground">
                    {executiveBrief.opportunities.map((item, idx) => <li key={idx}>{item}</li>)}
                  </ul>
                </div>

                <div className={`p-4 rounded-xl border ${isDark ? 'bg-blue-950/20 border-blue-500/30' : 'bg-blue-50 border-blue-200'}`}>
                  <h4 className="font-bold text-blue-500 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> 3 Recommandations d'actions UTICA :
                  </h4>
                  <ul className="space-y-1.5 list-disc list-inside text-muted-foreground">
                    {executiveBrief.actions.map((item, idx) => <li key={idx}>{item}</li>)}
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Button onClick={handleCopyBrief} size="sm" variant="outline" className="text-xs flex items-center gap-1.5 font-bold cursor-pointer">
                    {copiedBrief ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedBrief ? 'Copié !' : 'Copier Synthèse'}
                  </Button>
                  <Button onClick={handlePrintBrief} size="sm" variant="outline" className="text-xs flex items-center gap-1.5 font-bold cursor-pointer">
                    <Printer className="w-3.5 h-3.5 text-cyan-400" /> Imprimer / PDF
                  </Button>
                </div>
                <Button onClick={() => setExecutiveBrief(null)} size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs cursor-pointer">
                  Fermer & Retourner au Command Center
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Action Alert Modal (Protocol Initiation) ── */}
      <AnimatePresence>
        {actionAlertModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[130] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }} className={`w-full max-w-xl rounded-2xl p-6 border shadow-2xl space-y-5 ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
              <div className="flex items-center justify-between border-b pb-3 border-border">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-5 h-5 ${actionAlertModal.type === 'HIGH PRIORITY' ? 'text-red-500' : 'text-amber-400'}`} />
                  <h3 className="font-extrabold text-base">Protocole d'Action Leadership UTICA</h3>
                </div>
                <button onClick={() => setActionAlertModal(null)} className="text-muted-foreground hover:text-foreground text-sm font-bold p-1 cursor-pointer">✕</button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50">
                  <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider block">Alerte Ciblée</span>
                  <p className="font-bold text-sm text-foreground mt-0.5">{actionAlertModal.title}</p>
                  <p className="text-muted-foreground mt-1.5 leading-relaxed">{actionAlertModal.detail}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
                  <span className="font-bold uppercase text-[10px] tracking-wider block text-amber-400">Action Recommandée</span>
                  <p className="font-semibold text-xs mt-1">{actionAlertModal.action}</p>
                </div>

                <div className="space-y-2 pt-1">
                  <label className="font-bold text-xs block text-foreground">Destinataire Protocolaire :</label>
                  <select className={`w-full p-2.5 rounded-xl border text-xs font-medium outline-none ${isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'}`}>
                    <option>Bureau Exécutif National de l'UTICA</option>
                    <option>Fédération Nationale de l'Industrie & Textile</option>
                    <option>Conseil National du Commerce Extérieur & Douanes</option>
                    <option>Cellule de Concertation Banque Centrale / UTICA</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button onClick={() => setActionAlertModal(null)} size="sm" variant="outline" className="text-xs">
                  Annuler
                </Button>
                <Button
                  onClick={() => {
                    setActionSuccessToast(`Action transmise avec succès au Bureau Exécutif : "${actionAlertModal.title}"`);
                    setActionAlertModal(null);
                    setTimeout(() => setActionSuccessToast(null), 4000);
                  }}
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs cursor-pointer shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Confirmer l'Ordre de Mission
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── B2B Matchmaking Dialog ── */}
      <AnimatePresence>
        {matchmakingModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[130] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }} className={`w-full max-w-lg rounded-2xl p-6 border shadow-2xl space-y-5 ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
              <div className="flex items-center justify-between border-b pb-3 border-border">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <h3 className="font-extrabold text-base">Introduction Protocolaire B2B</h3>
                </div>
                <button onClick={() => setMatchmakingModal(null)} className="text-muted-foreground hover:text-foreground text-sm font-bold p-1 cursor-pointer">✕</button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black uppercase text-emerald-400">Score de Compatibilité IA</span>
                    <span className="font-black text-amber-400 text-sm">{matchmakingModal.val}</span>
                  </div>
                  <h4 className="font-bold text-sm text-foreground">{matchmakingModal.title}</h4>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50'}`}>
                    <span className="text-muted-foreground block text-[10px]">Entreprise Initiatrice</span>
                    <strong className="text-foreground">{matchmakingModal.companyA}</strong>
                  </div>
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50'}`}>
                    <span className="text-muted-foreground block text-[10px]">Partenaire Cible</span>
                    <strong className="text-foreground">{matchmakingModal.companyB}</strong>
                  </div>
                </div>

                <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50'}`}>
                  <span className="text-muted-foreground block text-[10px]">Marché International & Canal</span>
                  <p className="font-medium mt-0.5 text-cyan-400">🌍 {matchmakingModal.country} • Secteur : {matchmakingModal.sector}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button onClick={() => setMatchmakingModal(null)} size="sm" variant="outline" className="text-xs">
                  Fermer
                </Button>
                <Button
                  onClick={() => {
                    setMatchmakingSuccessToast(`Introduction officielle générée entre ${matchmakingModal.companyA} et ${matchmakingModal.companyB}`);
                    setMatchmakingModal(null);
                    setTimeout(() => setMatchmakingSuccessToast(null), 4000);
                  }}
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs cursor-pointer shadow-md"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" /> Émettre l'Introduction Protocolaire
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Regulatory Policy Assessment Sheet Modal ── */}
      <AnimatePresence>
        {policyModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[130] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }} className={`w-full max-w-xl rounded-2xl p-6 border shadow-2xl space-y-5 ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
              <div className="flex items-center justify-between border-b pb-3 border-border">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  <h3 className="font-extrabold text-base">Fiche d'Évaluation d'Impact Législatif</h3>
                </div>
                <button onClick={() => setPolicyModal(null)} className="text-muted-foreground hover:text-foreground text-sm font-bold p-1 cursor-pointer">✕</button>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 uppercase">{policyModal.category}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${policyModal.impact === 'positive' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      Impact : {policyModal.impact === 'positive' ? '🟢 Opportunité Majeure' : '🔴 Pression Économique'}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-foreground">{policyModal.title}</h4>
                  <p className="text-muted-foreground mt-1 leading-relaxed">{policyModal.summary}</p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50'}`}>
                    <span className="text-[10px] text-muted-foreground block">Impact Trésorerie</span>
                    <strong className={policyModal.impact === 'positive' ? 'text-emerald-400' : 'text-red-400'}>
                      {policyModal.impact === 'positive' ? '+8.5%' : '-4.2%'}
                    </strong>
                  </div>
                  <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50'}`}>
                    <span className="text-[10px] text-muted-foreground block">Entreprises Visées</span>
                    <strong className="text-amber-400">3 400+ PME</strong>
                  </div>
                  <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50'}`}>
                    <span className="text-[10px] text-muted-foreground block">Délai d'Entrée</span>
                    <strong className="text-blue-400">Immédiat (Q4)</strong>
                  </div>
                </div>

                <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-amber-950/20 border-amber-500/30' : 'bg-amber-50 border-amber-200'}`}>
                  <strong className="text-amber-400 block mb-1">Recommandation Stratégique pour l'UTICA :</strong>
                  <p className="text-muted-foreground leading-relaxed">
                    Présenter un amendement officiel lors de la plénière parlementaire visant à intégrer un crédit d'impôt compensatoire pour les entreprises certifiées exportatrices.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-border">
                <Button onClick={() => setPolicyModal(null)} size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs cursor-pointer">
                  Fermer l'Évaluation
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toast Notifications ── */}
      <AnimatePresence>
        {(actionSuccessToast || matchmakingSuccessToast) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-6 right-6 z-[140] p-4 rounded-2xl bg-emerald-500 text-slate-950 font-extrabold text-xs shadow-2xl flex items-center gap-2.5 border border-emerald-400">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{actionSuccessToast || matchmakingSuccessToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Content Area ── */}
      <div className={`transition-all ${isFullscreen ? 'p-8 md:p-10 space-y-8 max-w-[1800px] mx-auto' : 'p-6 space-y-6'}`}>

        {/* Executive Proactive Alerts Bar */}
        <div className="space-y-3">
          {EXECUTIVE_ALERTS.map((alert) => (
            <div key={alert.id} className={`rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${isFullscreen ? 'p-6' : 'p-4'} ${alert.type === 'HIGH PRIORITY' ? (isDark ? 'bg-red-950/30 border-red-500/40 text-red-200' : 'bg-red-50 border-red-200 text-red-900') : (isDark ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-900')}`}>
              <div className="flex items-start gap-3">
                <div className={`rounded-lg flex items-center justify-center font-bold shrink-0 mt-0.5 ${isFullscreen ? 'w-10 h-10' : 'w-8 h-8'} ${alert.type === 'HIGH PRIORITY' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
                  {alert.type === 'HIGH PRIORITY' ? <AlertTriangle className={isFullscreen ? 'w-5 h-5' : 'w-4 h-4'} /> : <Zap className={isFullscreen ? 'w-5 h-5' : 'w-4 h-4'} />}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-extrabold rounded uppercase ${isFullscreen ? 'text-xs px-2.5 py-1' : 'text-[10px] px-2 py-0.5'} ${alert.type === 'HIGH PRIORITY' ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'}`}>
                      {alert.type}
                    </span>
                    <h4 className={`font-bold ${isFullscreen ? 'text-base' : 'text-sm'}`}>{alert.title}</h4>
                  </div>
                  <p className={`opacity-90 leading-relaxed ${isFullscreen ? 'text-sm' : 'text-xs'}`}>{alert.detail}</p>
                  <p className={`font-bold mt-1.5 text-amber-400 ${isFullscreen ? 'text-sm' : 'text-xs'}`}>💡 Action Recommandée : {alert.action}</p>
                </div>
              </div>
              <Button
                size={isFullscreen ? "default" : "sm"}
                onClick={() => setActionAlertModal(alert)}
                className="text-xs shrink-0 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 font-bold cursor-pointer"
              >
                Engager Action <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          ))}
        </div>

        {/* ── TAB 1: OVERVIEW & NATIONAL PULSE ── */}
        {activeTab === 'overview' && (
          <div className={isFullscreen ? "space-y-8" : "space-y-6"}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-extrabold flex items-center gap-2 ${isFullscreen ? 'text-2xl' : 'text-lg'}`}>
                  <BarChart3 className={`text-amber-400 ${isFullscreen ? 'w-7 h-7' : 'w-5 h-5'}`} /> National Business Pulse
                </h3>
                <p className={`text-muted-foreground ${isFullscreen ? 'text-sm mt-1' : 'text-xs'}`}>
                  Vue d'ensemble en temps réel de l'écosystème économique tunisien (18 450 entreprises connectées).
                </p>
              </div>
              <span className={`font-bold flex items-center gap-1.5 text-emerald-500 ${isFullscreen ? 'text-sm' : 'text-xs'}`}>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                Synchronisation Live {dbStats?.members ? `(${dbStats.members} profils)` : ''}
              </span>
            </div>

            {/* KPI Cards Grid */}
            <div className={`grid grid-cols-2 sm:grid-cols-4 ${isFullscreen ? 'gap-6' : 'gap-3'}`}>
              {NATIONAL_KPIS.map((kpi, idx) => (
                <div key={idx} className={`rounded-2xl border transition-all ${isFullscreen ? 'p-6' : 'p-4'} ${isDark ? 'bg-slate-900/60 border-slate-800 hover:border-amber-500/40' : 'bg-white border-slate-200 shadow-sm hover:shadow-md'}`}>
                  <p className={`font-bold text-muted-foreground ${isFullscreen ? 'text-sm' : 'text-xs'}`}>{kpi.label}</p>
                  <p className={`font-black tracking-tight mt-1 ${isFullscreen ? 'text-3xl sm:text-4xl text-amber-400' : 'text-2xl'}`}>{kpi.value}</p>
                  <p className={`font-bold mt-1 ${isFullscreen ? 'text-xs' : 'text-[11px]'} ${kpi.status === 'positive' ? 'text-emerald-500' : kpi.status === 'negative' ? 'text-red-500' : 'text-amber-500'}`}>
                    {kpi.change}
                  </p>
                </div>
              ))}
            </div>

            {/* Synthetic Chart & Summary Grid */}
            <div className={`grid grid-cols-1 lg:grid-cols-3 ${isFullscreen ? 'gap-8' : 'gap-6'}`}>
              <div className={`lg:col-span-2 rounded-2xl border ${isFullscreen ? 'p-8' : 'p-5'} ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className={`font-bold ${isFullscreen ? 'text-base' : 'text-sm'}`}>Évolution du Sentiment Économique (6 derniers mois)</h4>
                  <span className={`text-muted-foreground ${isFullscreen ? 'text-xs' : 'text-xs'}`}>Index Tunisie / UTICA</span>
                </div>
                <ResponsiveContainer width="100%" height={isFullscreen ? 360 : 220}>
                  <AreaChart data={[
                    { month: 'Avr', Sentiment: 62, Optimisme: 58 },
                    { month: 'Mai', Sentiment: 64, Optimisme: 60 },
                    { month: 'Juin', Sentiment: 61, Optimisme: 59 },
                    { month: 'Juil', Sentiment: 65, Optimisme: 63 },
                    { month: 'Août', Sentiment: 66, Optimisme: 65 },
                    { month: 'Sept', Sentiment: 68, Optimisme: 67 },
                  ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSentiment" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} domain={[40, 100]} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Area type="monotone" dataKey="Sentiment" stroke="#f59e0b" strokeWidth={3} fill="url(#colorSentiment)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Quick AI Prompt Box */}
              <div className={`p-5 rounded-2xl border flex flex-col justify-between ${isDark ? 'bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border-indigo-500/30' : 'bg-gradient-to-br from-indigo-50 via-white to-blue-50 border-indigo-200'}`}>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <h4 className="font-bold text-sm">Posez une question à Investraders AI</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                    Obtenez une analyse stratégique basée sur 126 000 interactions d'entreprises tunisiennes.
                  </p>

                  <div className="space-y-2">
                    {[
                      "What are the three biggest concerns of Tunisian SMEs this month?",
                      "Which sectors are showing the strongest growth potential?",
                      "What should UTICA prioritize in its next meeting with government?"
                    ].map((q, qIdx) => (
                      <button
                        key={qIdx}
                        onClick={() => handleAskAI(q)}
                        className={`w-full text-left p-2.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${isDark ? 'bg-black/30 border-white/10 hover:border-amber-500/50 text-slate-300' : 'bg-white border-slate-200 hover:border-blue-400 text-slate-800'}`}
                      >
                        💡 "{q}"
                      </button>
                    ))}
                  </div>
                </div>

                <Button onClick={() => setActiveTab('ai-pulse')} size="sm" className="mt-4 w-full text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold cursor-pointer">
                  Ouvrir l'Assistant AI Complet <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: AI BRIEFING & CHAT ── */}
        {activeTab === 'ai-pulse' && (
          <div className={`space-y-6 mx-auto ${isFullscreen ? 'w-full max-w-[1700px]' : 'max-w-4xl'}`}>
            <div className={`rounded-3xl border ${isFullscreen ? 'p-8' : 'p-6'} ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-md'}`}>
              <div className="flex items-center gap-3 border-b pb-4 border-border/50">
                <Cpu className={`text-amber-400 ${isFullscreen ? 'w-8 h-8' : 'w-6 h-6'}`} />
                <div>
                  <h3 className={`font-extrabold ${isFullscreen ? 'text-xl' : 'text-base'}`}>Investraders AI — UTICA Decision Support System</h3>
                  <p className={`text-muted-foreground ${isFullscreen ? 'text-sm' : 'text-xs'}`}>Interrogez en langage naturel le système d'écoute économique d'UTICA.</p>
                </div>
              </div>

              {/* Chat Output */}
              <div className="my-5 space-y-4">
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-amber-950/20 border-amber-500/30' : 'bg-amber-50 border-amber-200'}`}>
                  <p className="text-xs font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> AI Business Brief — Synthèse Automatique en Temps Réel
                  </p>
                  <ul className={`space-y-1.5 text-muted-foreground list-disc list-inside ${isFullscreen ? 'text-sm' : 'text-xs'}`}>
                    <li>📈 <strong>Manufacturing Sentiment</strong>: Amélioration de +8% cette semaine.</li>
                    <li>⚠️ <strong>Financement PME</strong>: Risques de liquidité accrus signalés dans les régions du Sud.</li>
                    <li>🔥 <strong>Adoption IA</strong>: Accélération forte dans les services financiers & tech à Tunis.</li>
                    <li>🚨 <strong>Logistique Export</strong>: Inquiétudes sur les coûts de fret maritime et délais de passage à Radès.</li>
                  </ul>
                </div>

                {aiResponse && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-5 rounded-2xl border ${isDark ? 'bg-blue-950/30 border-blue-500/40 text-blue-100' : 'bg-blue-50 border-blue-200 text-slate-900'}`}>
                    <p className="text-xs font-bold text-blue-400 mb-2 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5" /> Réponse Investraders AI :
                    </p>
                    <div className={`whitespace-pre-line leading-relaxed ${isFullscreen ? 'text-base' : 'text-xs'}`}>
                      {aiResponse}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Chat Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Posez une question stratégique (ex: Quels sont les 3 principaux risques pour les PME ce mois-ci ?)"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
                  className={`flex-1 ${isFullscreen ? 'text-sm py-5 rounded-2xl' : ''} ${isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50'}`}
                />
                <Button onClick={() => handleAskAI()} disabled={aiLoading || !aiQuery} className={`bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shrink-0 cursor-pointer ${isFullscreen ? 'px-6 rounded-2xl' : ''}`}>
                  {aiLoading ? 'Analyse...' : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: STAKEHOLDER SENTIMENT MAP ── */}
        {activeTab === 'sentiment' && (
          <div className={isFullscreen ? "space-y-8" : "space-y-6"}>
            <div>
              <h3 className={`font-extrabold flex items-center gap-2 ${isFullscreen ? 'text-2xl' : 'text-lg'}`}>
                <PieChart className={`text-amber-400 ${isFullscreen ? 'w-7 h-7' : 'w-5 h-5'}`} /> Cartographie du Sentiment des Acteurs
              </h3>
              <p className={`text-muted-foreground ${isFullscreen ? 'text-sm mt-1' : 'text-xs'}`}>
                Baromètre en temps réel par typologie d'entreprise et secteur d'activité.
              </p>
            </div>

            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 ${isFullscreen ? 'gap-6' : 'gap-4'}`}>
              {STAKEHOLDER_SENTIMENT.map((st, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedSentimentSegment(st)}
                  className={`rounded-2xl border cursor-pointer transition-all ${isFullscreen ? 'p-6' : 'p-4'} ${selectedSentimentSegment?.segment === st.segment ? 'ring-2 ring-amber-400' : ''} ${isDark ? 'bg-slate-900/60 border-slate-800 hover:border-amber-500/40' : 'bg-white border-slate-200 shadow-sm hover:shadow-md'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-bold ${isFullscreen ? 'text-sm' : 'text-xs'}`}>{st.segment}</span>
                    <span className={`font-bold px-2.5 py-0.5 rounded-full ${isFullscreen ? 'text-xs' : 'text-xs'} ${st.status === 'positive' ? 'bg-emerald-500/20 text-emerald-500' : st.status === 'warning' ? 'bg-amber-500/20 text-amber-500' : 'bg-red-500/20 text-red-500'}`}>
                      {st.sentiment}% Positive
                    </span>
                  </div>
                  <div className={`w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-2.5 ${isFullscreen ? 'h-3' : 'h-2'}`}>
                    <div className={`h-full ${st.status === 'positive' ? 'bg-emerald-500' : st.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${st.sentiment}%` }} />
                  </div>
                  <p className={`text-muted-foreground ${isFullscreen ? 'text-xs' : 'text-[11px]'}`}>{st.count}</p>
                </div>
              ))}
            </div>

            {/* Drilldown Inspector */}
            {selectedSentimentSegment && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rounded-3xl border ${isFullscreen ? 'p-8' : 'p-5'} ${isDark ? 'bg-slate-900 border-amber-500/30' : 'bg-amber-50/50 border-amber-200'}`}>
                <div className="flex items-center justify-between border-b pb-3 border-border">
                  <h4 className={`font-bold text-amber-400 ${isFullscreen ? 'text-lg' : 'text-sm'}`}>
                    Drill-down Analyst: {selectedSentimentSegment.segment} ➔ Tunisie
                  </h4>
                  <button onClick={() => setSelectedSentimentSegment(null)} className="text-xs text-muted-foreground hover:text-foreground font-bold cursor-pointer">✕ Fermer</button>
                </div>

                <div className={`grid grid-cols-1 sm:grid-cols-3 gap-6 mt-4 ${isFullscreen ? 'text-sm' : 'text-xs'}`}>
                  <div>
                    <span className="font-semibold block text-muted-foreground">Préoccupations Majeures :</span>
                    <p className="mt-1 font-medium leading-relaxed">Financement de roulement, hausse des loyers et délais de paiement clients.</p>
                  </div>
                  <div>
                    <span className="font-semibold block text-muted-foreground">Sujets les Plus Discutés :</span>
                    <p className="mt-1 font-medium leading-relaxed">Digitalisation du point de vente, e-commerce, fiscalité locale.</p>
                  </div>
                  <div>
                    <span className="font-semibold block text-amber-400">Actions UTICA Suggérées :</span>
                    <p className="mt-1 font-medium leading-relaxed">Proposer un abattement fiscal pour les investissements de modernisation digitale.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* ── TAB 4: REGIONAL BUSINESS MAP ── */}
        {activeTab === 'regions' && (
          <div className={isFullscreen ? "space-y-8" : "space-y-6"}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-extrabold flex items-center gap-2 ${isFullscreen ? 'text-2xl' : 'text-lg'}`}>
                  <MapPin className={`text-amber-400 ${isFullscreen ? 'w-7 h-7' : 'w-5 h-5'}`} /> Carte Économique Régionale (Tunisie)
                </h3>
                <p className={`text-muted-foreground ${isFullscreen ? 'text-sm mt-1' : 'text-xs'}`}>Explorez l'activité économique et les problématiques par gouvernorat (24 régions connectées).</p>
              </div>
            </div>

            {/* Region Selector Pills */}
            <div className={`flex flex-wrap ${isFullscreen ? 'gap-3' : 'gap-2'}`}>
              {Object.keys(REGIONAL_PULSE).map((reg) => (
                <button
                  key={reg}
                  onClick={() => setSelectedRegion(reg)}
                  className={`font-bold transition-all border cursor-pointer ${
                    isFullscreen ? 'text-sm px-4.5 py-2.5 rounded-2xl' : 'text-xs px-3.5 py-2 rounded-xl'
                  } ${selectedRegion === reg ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-500/20' : isDark ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-amber-500/40' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                >
                  📍 {reg}
                </button>
              ))}
            </div>

            {/* Selected Region Detailed Card */}
            {REGIONAL_PULSE[selectedRegion] && (
              <div className={`rounded-3xl border space-y-6 ${isFullscreen ? 'p-8' : 'p-6'} ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-md'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-border">
                  <div>
                    <span className={`font-bold text-amber-400 uppercase tracking-wider ${isFullscreen ? 'text-xs' : 'text-[10px]'}`}>Région Sélectionnée</span>
                    <h4 className={`font-black ${isFullscreen ? 'text-3xl' : 'text-xl'}`}>Gouvernorat de {selectedRegion}</h4>
                  </div>
                  <span className={`font-bold text-emerald-500 rounded-full bg-emerald-500/10 border border-emerald-500/20 ${isFullscreen ? 'text-sm px-4 py-1.5' : 'text-xs px-3 py-1'}`}>
                    Croissance Estimée : {REGIONAL_PULSE[selectedRegion].growth}
                  </span>
                </div>

                <div className={`grid grid-cols-2 sm:grid-cols-4 ${isFullscreen ? 'gap-6' : 'gap-3'}`}>
                  <div className={`rounded-2xl border ${isFullscreen ? 'p-5' : 'p-3'} ${isDark ? 'bg-black/20 border-white/5' : 'bg-slate-50'}`}>
                    <span className={`text-muted-foreground block ${isFullscreen ? 'text-xs' : 'text-[10px]'}`}>Entreprises Connectées</span>
                    <strong className={`font-black text-amber-400 ${isFullscreen ? 'text-3xl' : 'text-lg'}`}>{REGIONAL_PULSE[selectedRegion].companies}</strong>
                  </div>
                  <div className={`rounded-2xl border ${isFullscreen ? 'p-5' : 'p-3'} ${isDark ? 'bg-black/20 border-white/5' : 'bg-slate-50'}`}>
                    <span className={`text-muted-foreground block ${isFullscreen ? 'text-xs' : 'text-[10px]'}`}>Stakeholders Actifs</span>
                    <strong className={`font-black ${isFullscreen ? 'text-3xl' : 'text-lg'}`}>{REGIONAL_PULSE[selectedRegion].stakeholders}</strong>
                  </div>
                  <div className={`rounded-2xl border ${isFullscreen ? 'p-5' : 'p-3'} ${isDark ? 'bg-black/20 border-white/5' : 'bg-slate-50'}`}>
                    <span className={`text-muted-foreground block ${isFullscreen ? 'text-xs' : 'text-[10px]'}`}>Sentiment Régional</span>
                    <strong className={`font-black text-emerald-500 ${isFullscreen ? 'text-3xl' : 'text-lg'}`}>{REGIONAL_PULSE[selectedRegion].sentiment}%</strong>
                  </div>
                  <div className={`rounded-2xl border ${isFullscreen ? 'p-5' : 'p-3'} ${isDark ? 'bg-black/20 border-white/5' : 'bg-slate-50'}`}>
                    <span className={`text-muted-foreground block ${isFullscreen ? 'text-xs' : 'text-[10px]'}`}>Opportunités Invest.</span>
                    <strong className={`font-black text-blue-400 ${isFullscreen ? 'text-3xl' : 'text-lg'}`}>{REGIONAL_PULSE[selectedRegion].opps}</strong>
                  </div>
                </div>

                <div className={`rounded-2xl border ${isFullscreen ? 'p-6 text-sm' : 'p-4 text-xs'} ${isDark ? 'bg-black/30 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                  <p className="font-bold text-amber-400 mb-1.5 flex items-center gap-1.5">
                    <AlertTriangle className={isFullscreen ? 'w-4.5 h-4.5' : 'w-4 h-4'} /> Inquiétudes & Enjeux Régionaux Prioritaires :
                  </p>
                  <p className="text-muted-foreground leading-relaxed">{REGIONAL_PULSE[selectedRegion].concerns}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 5: SECTOR INTELLIGENCE ── */}
        {activeTab === 'sectors' && (
          <div className={isFullscreen ? "space-y-8" : "space-y-6"}>
            <div>
              <h3 className={`font-extrabold flex items-center gap-2 ${isFullscreen ? 'text-2xl' : 'text-lg'}`}>
                <Building2 className={`text-amber-400 ${isFullscreen ? 'w-7 h-7' : 'w-5 h-5'}`} /> Sector Intelligence & Pulse
              </h3>
              <p className={`text-muted-foreground ${isFullscreen ? 'text-sm mt-1' : 'text-xs'}`}>Analyse sectorielle des risques, opportunités et croissance.</p>
            </div>

            <div className={`grid grid-cols-1 sm:grid-cols-2 ${isFullscreen ? 'gap-6' : 'gap-4'}`}>
              {SECTOR_INTELLIGENCE.map((sec, idx) => (
                <div key={idx} className={`rounded-2xl border space-y-4 ${isFullscreen ? 'p-6' : 'p-5'} ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className="flex items-center justify-between">
                    <h4 className={`font-bold ${isFullscreen ? 'text-base' : 'text-sm'}`}>{sec.name}</h4>
                    <span className={`font-bold rounded ${isFullscreen ? 'text-xs px-2.5 py-1' : 'text-[10px] px-2 py-0.5'} ${sec.priority === 'Critical' ? 'bg-red-500/20 text-red-400' : sec.priority === 'Urgent' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {sec.priority} Priority
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">Sentiment</span>
                      <strong className={`text-emerald-500 ${isFullscreen ? 'text-xl' : 'text-sm'}`}>{sec.sentiment}%</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">Croissance</span>
                      <strong className={`text-amber-400 ${isFullscreen ? 'text-xl' : 'text-sm'}`}>{sec.growth}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-bold">Opportunités</span>
                      <strong className={`text-blue-400 ${isFullscreen ? 'text-xl' : 'text-sm'}`}>{sec.opps}</strong>
                    </div>
                  </div>

                  <p className={`text-muted-foreground ${isFullscreen ? 'text-sm' : 'text-xs'}`}>
                    <strong className="text-foreground">Risque Majeur :</strong> {sec.risk}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 6: VOICE OF BUSINESS ── */}
        {activeTab === 'voice' && (
          <div className={`space-y-6 mx-auto ${isFullscreen ? 'w-full max-w-[1700px] space-y-8' : 'max-w-4xl'}`}>
            <div>
              <h3 className={`font-extrabold flex items-center gap-2 ${isFullscreen ? 'text-2xl' : 'text-lg'}`}>
                <MessageSquare className={`text-amber-400 ${isFullscreen ? 'w-7 h-7' : 'w-5 h-5'}`} /> Voice of Business — Continuous AI Feedback
              </h3>
              <p className={`text-muted-foreground ${isFullscreen ? 'text-sm mt-1' : 'text-xs'}`}>
                Synthèse automatisée des préoccupations exprimées par 18 000+ chefs d'entreprises.
              </p>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-2 ${isFullscreen ? 'gap-8' : 'gap-6'}`}>
              {/* Top 5 Concerns */}
              <div className={`rounded-2xl border ${isFullscreen ? 'p-8' : 'p-5'} ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <h4 className={`font-bold text-red-500 mb-4 flex items-center gap-2 ${isFullscreen ? 'text-lg' : 'text-sm'}`}>
                  <AlertTriangle className={isFullscreen ? 'w-5 h-5' : 'w-4 h-4'} /> Top 5 Préoccupations Récurrentes
                </h4>
                <div className="space-y-3">
                  {[
                    { title: "Accès au Financement & Liquidités Bancaires", count: "842 mentions" },
                    { title: "Pression Fiscale & Complexité Administrative", count: "620 mentions" },
                    { title: "Bureaucratie & Délais d'Autorisation", count: "512 mentions" },
                    { title: "Logistique Portuaire & Dédouanement Radès", count: "410 mentions" },
                    { title: "Recrutement & Rétention des Compétences", count: "380 mentions" }
                  ].map((c, i) => (
                    <div key={i} className={`flex items-center justify-between rounded-xl border border-border/40 transition-all ${isFullscreen ? 'p-4 text-sm' : 'p-2.5 text-xs'}`}>
                      <span className="font-semibold">{i + 1}. {c.title}</span>
                      <span className="text-[10px] text-muted-foreground font-mono font-bold bg-muted/40 px-2.5 py-1 rounded">{c.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Emerging Concerns */}
              <div className={`rounded-2xl border ${isFullscreen ? 'p-8' : 'p-5'} ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <h4 className={`font-bold text-amber-400 mb-4 flex items-center gap-2 ${isFullscreen ? 'text-lg' : 'text-sm'}`}>
                  <TrendingUp className={isFullscreen ? 'w-5 h-5' : 'w-4 h-4'} /> Top 5 Signaux Faibles & Émergents
                </h4>
                <div className="space-y-3">
                  {[
                    { title: "Réglementation IA & Conformité Européenne (AI Act)", growth: "+42% cette semaine" },
                    { title: "Hausse des Tarifs Énergétiques & Gaz Industriel", growth: "+31% cette semaine" },
                    { title: "Cybersécurité & Attaques Contre les Systèmes PME", growth: "+25% cette semaine" },
                    { title: "Compétitivité et Accords de Libre-Échange Africains (ZLECAF)", growth: "+18% cette semaine" },
                    { title: "Coûts de la Décarbonation & Bilan Carbone", growth: "+14% cette semaine" }
                  ].map((c, i) => (
                    <div key={i} className={`flex items-center justify-between rounded-xl border border-border/40 transition-all ${isFullscreen ? 'p-4 text-sm' : 'p-2.5 text-xs'}`}>
                      <span className="font-semibold">{i + 1}. {c.title}</span>
                      <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded">{c.growth}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 7: POLICY MONITOR ── */}
        {activeTab === 'policy' && (
          <div className={`space-y-6 mx-auto ${isFullscreen ? 'w-full max-w-[1700px] space-y-8' : 'max-w-4xl'}`}>
            <div>
              <h3 className={`font-extrabold flex items-center gap-2 ${isFullscreen ? 'text-2xl' : 'text-lg'}`}>
                <ShieldCheck className={`text-amber-400 ${isFullscreen ? 'w-7 h-7' : 'w-5 h-5'}`} /> Veille Réglementaire & Lois de Finances
              </h3>
              <p className={`text-muted-foreground ${isFullscreen ? 'text-sm mt-1' : 'text-xs'}`}>Suivi de l'impact des réformes et décrets sur les entreprises.</p>
            </div>

            <div className="space-y-4">
              {POLICY_MONITOR.map((pol, i) => (
                <div key={i} className={`rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${isFullscreen ? 'p-6' : 'p-4'} ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-400 uppercase tracking-wider">{pol.category}</span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded ${pol.impact === 'positive' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                        Impact : {pol.impact === 'positive' ? '🟢 Positif' : '🔴 Négatif'}
                      </span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                        Niveau {pol.level}
                      </span>
                    </div>
                    <h4 className={`font-bold ${isFullscreen ? 'text-base' : 'text-sm'}`}>{pol.title}</h4>
                    <p className={`text-muted-foreground mt-1 leading-relaxed ${isFullscreen ? 'text-sm' : 'text-xs'}`}>{pol.summary}</p>
                  </div>
                  <Button
                    size={isFullscreen ? "default" : "sm"}
                    variant="outline"
                    onClick={() => setPolicyModal(pol)}
                    className="text-xs shrink-0 cursor-pointer font-bold border-amber-500/30 hover:bg-amber-500/10 hover:text-amber-400"
                  >
                    Évaluer l'Impact <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 8: OPPORTUNITIES RADAR ── */}
        {activeTab === 'opportunities' && (
          <div className={isFullscreen ? "space-y-8" : "space-y-6"}>
            <div>
              <h3 className={`font-extrabold flex items-center gap-2 ${isFullscreen ? 'text-2xl' : 'text-lg'}`}>
                <Zap className={`text-amber-400 ${isFullscreen ? 'w-7 h-7' : 'w-5 h-5'}`} /> Radar d'Opportunités B2B & Partenariats
              </h3>
              <p className={`text-muted-foreground ${isFullscreen ? 'text-sm mt-1' : 'text-xs'}`}>Matching automatique d'affaires pour les membres UTICA.</p>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-3 ${isFullscreen ? 'gap-8' : 'gap-4'}`}>
              {OPPORTUNITIES_RADAR.map((opp, idx) => (
                <div key={idx} className={`rounded-2xl border flex flex-col justify-between transition-all ${isFullscreen ? 'p-8' : 'p-5'} ${isDark ? 'bg-slate-900/60 border-slate-800 hover:border-amber-500/40' : 'bg-white border-slate-200 shadow-sm hover:shadow-md'}`}>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {opp.match}% Match AI
                      </span>
                      <span className={`font-black text-amber-400 ${isFullscreen ? 'text-xl' : 'text-sm'}`}>{opp.val}</span>
                    </div>
                    <h4 className={`font-bold mb-3 ${isFullscreen ? 'text-lg' : 'text-sm'}`}>{opp.title}</h4>
                    <p className={`text-muted-foreground mb-1.5 ${isFullscreen ? 'text-sm' : 'text-xs'}`}>🤝 <strong className="text-foreground">{opp.companyA}</strong> ➔ {opp.companyB}</p>
                    <p className={`text-muted-foreground ${isFullscreen ? 'text-sm' : 'text-xs'}`}>🌍 Marché Target : <strong className="text-cyan-400">{opp.country}</strong></p>
                    <p className={`text-muted-foreground mt-1 ${isFullscreen ? 'text-sm' : 'text-xs'}`}>🏷️ Secteur : {opp.sector}</p>
                  </div>
                  <Button
                    size={isFullscreen ? "default" : "sm"}
                    onClick={() => setMatchmakingModal(opp)}
                    className="mt-6 w-full text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-black cursor-pointer shadow-md shadow-amber-500/20"
                  >
                    Introduire & Initier Matchmaking <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );

  if (isFullscreen && typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }

  return content;
}
