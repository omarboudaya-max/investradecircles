import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/ThemeContext';
import {
  Building2, Users, AlertTriangle, TrendingUp, TrendingDown, Sparkles,
  Zap, Globe, ShieldCheck, Search, Filter, MessageSquare, ArrowRight,
  ChevronRight, MapPin, BarChart3, PieChart, Landmark, CheckCircle2,
  AlertCircle, HelpCircle, Layers, FileText, Send, Radio, Compass, RefreshCw,
  Share2, Award, ExternalLink, Cpu
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

export default function UTICABusinessCommandCenter({ circle, user, isDark: externalIsDark }) {
  const { isDark: contextIsDark } = useTheme();
  const isDark = externalIsDark !== undefined ? externalIsDark : contextIsDark;

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedRegion, setSelectedRegion] = useState('Tunis');
  const [selectedSentimentSegment, setSelectedSentimentSegment] = useState(null);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [executiveBrief, setExecutiveBrief] = useState(null);

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

  return (
    <div className={`rounded-2xl border overflow-hidden shadow-2xl transition-all duration-300 ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
      
      {/* ── Top Header Banner ── */}
      <div className="relative p-6 border-b border-border/50" style={{ background: isDark ? 'linear-gradient(135deg,#030712 0%,#0f172a 50%,#1e1b4b 100%)' : 'linear-gradient(135deg,#1e3a8a 0%,#1e40af 50%,#0f172a 100%)' }}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center p-2 shrink-0 shadow-xl">
              <Landmark className="w-10 h-10 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
                  UTICA LEADERSHIP COMMAND CENTER
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  AI-POWERED ECONOMIC PULSE
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Union Tunisienne de l'Industrie, du Commerce et de l'Artisanat
              </h1>
              <p className="text-xs text-blue-100/80 mt-1 max-w-xl">
                Tableau de bord stratégique d'Intelligence Économique Nationale & d'Écoute en Temps Réel des Entreprises Tunisiennes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              onClick={handleGenerateExecutiveBrief}
              disabled={aiLoading}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {aiLoading ? 'Génération...' : 'Briefing Exécutif CEO'}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className={`flex border-b overflow-x-auto scrollbar-none whitespace-nowrap px-4 ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'}`}>
        {[
          { id: 'overview', label: '1. Business Pulse National', icon: BarChart3 },
          { id: 'ai-pulse', label: '2. Briefing AI & Chat', icon: Cpu },
          { id: 'sentiment', label: '3. Cartographie du Sentiment', icon: PieChart },
          { id: 'regions', label: '4. Carte Économique Régionale', icon: MapPin },
          { id: 'sectors', label: '5. Sector Intelligence', icon: Building2 },
          { id: 'voice', label: '6. Voice of Business', icon: MessageSquare },
          { id: 'policy', label: '7. Veille Réglementaire & Lois', icon: ShieldCheck },
          { id: 'opportunities', label: '8. Radar d\'Opportunités B2B', icon: Zap },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3.5 text-xs font-bold border-b-2 transition-all shrink-0 ${
                isActive
                  ? isDark ? 'border-amber-400 text-amber-300 bg-amber-500/10' : 'border-blue-600 text-blue-700 bg-blue-50'
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

              <div className="flex justify-end pt-2 border-t border-border">
                <Button onClick={() => setExecutiveBrief(null)} size="sm" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs">
                  Fermer & Retourner au Command Center
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Content Area ── */}
      <div className="p-6 space-y-6">

        {/* Executive Proactive Alerts Bar */}
        <div className="space-y-3">
          {EXECUTIVE_ALERTS.map((alert) => (
            <div key={alert.id} className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${alert.type === 'HIGH PRIORITY' ? (isDark ? 'bg-red-950/30 border-red-500/40 text-red-200' : 'bg-red-50 border-red-200 text-red-900') : (isDark ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-900')}`}>
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold shrink-0 mt-0.5 ${alert.type === 'HIGH PRIORITY' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}>
                  {alert.type === 'HIGH PRIORITY' ? <AlertTriangle className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase ${alert.type === 'HIGH PRIORITY' ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'}`}>
                      {alert.type}
                    </span>
                    <h4 className="font-bold text-sm">{alert.title}</h4>
                  </div>
                  <p className="text-xs opacity-90 leading-relaxed">{alert.detail}</p>
                  <p className="text-xs font-bold mt-1.5 text-amber-400">💡 Action Recommandée : {alert.action}</p>
                </div>
              </div>
              <Button size="sm" className="text-xs shrink-0 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900">
                Engager Action <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          ))}
        </div>

        {/* ── TAB 1: OVERVIEW & NATIONAL PULSE ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-amber-400" /> National Business Pulse
                </h3>
                <p className="text-xs text-muted-foreground">
                  Vue d'ensemble en temps réel de l'écosystème économique tunisien (18 450 entreprises connectées).
                </p>
              </div>
              <span className="text-xs text-emerald-500 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Synchronisation Live
              </span>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {NATIONAL_KPIS.map((kpi, idx) => (
                <div key={idx} className={`p-4 rounded-xl border transition-all ${isDark ? 'bg-slate-900/60 border-slate-800 hover:border-amber-500/40' : 'bg-white border-slate-200 shadow-sm hover:shadow-md'}`}>
                  <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-extrabold mt-1 tracking-tight">{kpi.value}</p>
                  <p className={`text-[11px] font-semibold mt-1 ${kpi.status === 'positive' ? 'text-emerald-500' : kpi.status === 'negative' ? 'text-red-500' : 'text-amber-500'}`}>
                    {kpi.change}
                  </p>
                </div>
              ))}
            </div>

            {/* Synthetic Chart & Summary Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className={`lg:col-span-2 p-5 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-sm">Évolution du Sentiment Économique (6 derniers mois)</h4>
                  <span className="text-xs text-muted-foreground">Index Tunisie / UTICA</span>
                </div>
                <ResponsiveContainer width="100%" height={220}>
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
                        className={`w-full text-left p-2.5 rounded-lg border text-xs font-medium transition-all ${isDark ? 'bg-black/30 border-white/10 hover:border-amber-500/50 text-slate-300' : 'bg-white border-slate-200 hover:border-blue-400 text-slate-800'}`}
                      >
                        💡 "{q}"
                      </button>
                    ))}
                  </div>
                </div>

                <Button onClick={() => setActiveTab('ai-pulse')} size="sm" className="mt-4 w-full text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">
                  Ouvrir l'Assistant AI Complet <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: AI BRIEFING & CHAT ── */}
        {activeTab === 'ai-pulse' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-md'}`}>
              <div className="flex items-center gap-3 border-b pb-4 border-border/50">
                <Cpu className="w-6 h-6 text-amber-400" />
                <div>
                  <h3 className="font-extrabold text-base">Investraders AI — UTICA Decision Support System</h3>
                  <p className="text-xs text-muted-foreground">Interrogez en langage naturel le système d'écoute économique d'UTICA.</p>
                </div>
              </div>

              {/* Chat Output */}
              <div className="my-5 space-y-4">
                <div className={`p-4 rounded-xl border ${isDark ? 'bg-amber-950/20 border-amber-500/30' : 'bg-amber-50 border-amber-200'}`}>
                  <p className="text-xs font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> AI Business Brief — Synthese Automatique
                  </p>
                  <ul className="text-xs space-y-1.5 text-muted-foreground list-disc list-inside">
                    <li>📈 <strong>Manufacturing Sentiment</strong>: Amélioration de +8% cette semaine.</li>
                    <li>⚠️ <strong>Financement PME</strong>: Risques de liquidité accrus signalés dans les régions du Sud.</li>
                    <li>🔥 <strong>Adoption IA</strong>: Accélération forte dans les services financiers & tech à Tunis.</li>
                    <li>🚨 <strong>Logistique Export</strong>: Inquiétudes sur les coûts de fret maritime à Radès.</li>
                  </ul>
                </div>

                {aiResponse && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-xl border ${isDark ? 'bg-blue-950/30 border-blue-500/40 text-blue-100' : 'bg-blue-50 border-blue-200 text-slate-900'}`}>
                    <p className="text-xs font-bold text-blue-400 mb-2 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5" /> Reponse Investraders AI :
                    </p>
                    <div className="text-xs whitespace-pre-line leading-relaxed">
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
                  className={isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50'}
                />
                <Button onClick={() => handleAskAI()} disabled={aiLoading || !aiQuery} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shrink-0">
                  {aiLoading ? 'Analyse...' : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: STAKEHOLDER SENTIMENT MAP ── */}
        {activeTab === 'sentiment' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-extrabold flex items-center gap-2">
                <PieChart className="w-5 h-5 text-amber-400" /> Cartographie du Sentiment des Acteurs
              </h3>
              <p className="text-xs text-muted-foreground">
                Baromètre en temps réel par typologie d'entreprise et secteur d'activité.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {STAKEHOLDER_SENTIMENT.map((st, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedSentimentSegment(st)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedSentimentSegment?.segment === st.segment ? 'ring-2 ring-amber-400' : ''} ${isDark ? 'bg-slate-900/60 border-slate-800 hover:border-amber-500/40' : 'bg-white border-slate-200 shadow-sm hover:shadow-md'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold">{st.segment}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${st.status === 'positive' ? 'bg-emerald-500/20 text-emerald-500' : st.status === 'warning' ? 'bg-amber-500/20 text-amber-500' : 'bg-red-500/20 text-red-500'}`}>
                      {st.sentiment}% Positive
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-2">
                    <div className={`h-full ${st.status === 'positive' ? 'bg-emerald-500' : st.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${st.sentiment}%` }} />
                  </div>
                  <p className="text-[11px] text-muted-foreground">{st.count}</p>
                </div>
              ))}
            </div>

            {/* Drilldown Inspector */}
            {selectedSentimentSegment && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900 border-amber-500/30' : 'bg-amber-50/50 border-amber-200'}`}>
                <div className="flex items-center justify-between border-b pb-3 border-border">
                  <h4 className="font-bold text-sm text-amber-400">
                    Drill-down Analyst: {selectedSentimentSegment.segment} ➔ Tunisie
                  </h4>
                  <button onClick={() => setSelectedSentimentSegment(null)} className="text-xs text-muted-foreground hover:text-foreground">Fermer</button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 text-xs">
                  <div>
                    <span className="font-semibold block text-muted-foreground">Préoccupations Majeures :</span>
                    <p className="mt-1 font-medium">Financement de roulement, hausse des loyers et délais de paiement clients.</p>
                  </div>
                  <div>
                    <span className="font-semibold block text-muted-foreground">Sujets les Plus Discutés :</span>
                    <p className="mt-1 font-medium">Digitalisation du point de vente, e-commerce, fiscalité locale.</p>
                  </div>
                  <div>
                    <span className="font-semibold block text-amber-400">Actions UTICA Suggérées :</span>
                    <p className="mt-1 font-medium">Proposer un abattement fiscal pour les investissements de modernisation digitale.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* ── TAB 4: REGIONAL BUSINESS MAP ── */}
        {activeTab === 'regions' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-amber-400" /> Carte Économique Régionale (Tunisie)
                </h3>
                <p className="text-xs text-muted-foreground">Explorez l'activité économique et les problématiques par gouvernorat.</p>
              </div>
            </div>

            {/* Region Selector Pills */}
            <div className="flex flex-wrap gap-2">
              {Object.keys(REGIONAL_PULSE).map((reg) => (
                <button
                  key={reg}
                  onClick={() => setSelectedRegion(reg)}
                  className={`text-xs px-3.5 py-2 rounded-xl font-bold transition-all border ${selectedRegion === reg ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md' : isDark ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-amber-500/40' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                >
                  📍 {reg}
                </button>
              ))}
            </div>

            {/* Selected Region Detailed Card */}
            {REGIONAL_PULSE[selectedRegion] && (
              <div className={`p-6 rounded-2xl border space-y-4 ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-md'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-border">
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Région Sélectionnée</span>
                    <h4 className="text-xl font-extrabold">Gouvernorat de {selectedRegion}</h4>
                  </div>
                  <span className="text-xs font-bold text-emerald-500 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    Croissance Estimée : {REGIONAL_PULSE[selectedRegion].growth}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-black/20 border-white/5' : 'bg-slate-50'}`}>
                    <span className="text-muted-foreground block">Entreprises Connectées</span>
                    <strong className="text-lg font-bold text-amber-400">{REGIONAL_PULSE[selectedRegion].companies}</strong>
                  </div>
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-black/20 border-white/5' : 'bg-slate-50'}`}>
                    <span className="text-muted-foreground block">Stakeholders Actifs</span>
                    <strong className="text-lg font-bold">{REGIONAL_PULSE[selectedRegion].stakeholders}</strong>
                  </div>
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-black/20 border-white/5' : 'bg-slate-50'}`}>
                    <span className="text-muted-foreground block">Sentiment Régional</span>
                    <strong className="text-lg font-bold text-emerald-500">{REGIONAL_PULSE[selectedRegion].sentiment}%</strong>
                  </div>
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-black/20 border-white/5' : 'bg-slate-50'}`}>
                    <span className="text-muted-foreground block">Opportunités Invest.</span>
                    <strong className="text-lg font-bold text-blue-400">{REGIONAL_PULSE[selectedRegion].opps}</strong>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border text-xs ${isDark ? 'bg-black/30 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                  <p className="font-bold text-amber-400 mb-1">⚠️ Inquiétudes & Enjeux Régionaux Prioritaires :</p>
                  <p className="text-muted-foreground leading-relaxed">{REGIONAL_PULSE[selectedRegion].concerns}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 5: SECTOR INTELLIGENCE ── */}
        {activeTab === 'sectors' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-extrabold flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" /> Sector Intelligence & Pulse
              </h3>
              <p className="text-xs text-muted-foreground">Analyse sectorielle des risques, opportunités et croissance.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SECTOR_INTELLIGENCE.map((sec, idx) => (
                <div key={idx} className={`p-5 rounded-2xl border space-y-3 ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm">{sec.name}</h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${sec.priority === 'Critical' ? 'bg-red-500/20 text-red-400' : sec.priority === 'Urgent' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {sec.priority} Priority
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Sentiment</span>
                      <strong className="text-emerald-500">{sec.sentiment}%</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Croissance</span>
                      <strong className="text-amber-400">{sec.growth}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Opportunités</span>
                      <strong className="text-blue-400">{sec.opps}</strong>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    <strong>Risque Majeur :</strong> {sec.risk}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 6: VOICE OF BUSINESS ── */}
        {activeTab === 'voice' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div>
              <h3 className="text-lg font-extrabold flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-400" /> Voice of Business — Continuous AI Feedback
              </h3>
              <p className="text-xs text-muted-foreground">
                Synthèse automatisée des préoccupations exprimées par 18 000+ chefs d'entreprises.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top 5 Concerns */}
              <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <h4 className="font-bold text-sm text-red-500 mb-3">Top 5 Préoccupations Récurrentes</h4>
                <div className="space-y-2.5 text-xs">
                  {[
                    { title: "Accès au Financement & Liquide", count: "842 mentions" },
                    { title: "Pression Fiscale & Complexité", count: "620 mentions" },
                    { title: "Bureaucratie & Délais Administratifs", count: "512 mentions" },
                    { title: "Logistique Portuaire & Dédouanement", count: "410 mentions" },
                    { title: "Recrutement & Rétention des Talents", count: "380 mentions" }
                  ].map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border border-border/40">
                      <span className="font-semibold">{i + 1}. {c.title}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{c.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Emerging Concerns */}
              <div className={`p-5 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <h4 className="font-bold text-sm text-amber-400 mb-3">Top 5 Préoccupations Émergentes</h4>
                <div className="space-y-2.5 text-xs">
                  {[
                    { title: "Réglementation IA & Conformité", growth: "+42% cette semaine" },
                    { title: "Hausse des Tarifs Énergétiques", growth: "+31% cette semaine" },
                    { title: "Cybersécurité & Risques de Données", growth: "+25% cette semaine" },
                    { title: "Compétitivité à l'Exportation", growth: "+18% cette semaine" },
                    { title: "Coûts de la Transition Digitale", growth: "+14% cette semaine" }
                  ].map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border border-border/40">
                      <span className="font-semibold">{i + 1}. {c.title}</span>
                      <span className="text-[10px] text-amber-400 font-bold">{c.growth}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 7: POLICY MONITOR ── */}
        {activeTab === 'policy' && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div>
              <h3 className="text-lg font-extrabold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" /> Veille Réglementaire & Lois de Finances
              </h3>
              <p className="text-xs text-muted-foreground">Suivi de l'impact des réformes et décrets sur les entreprises.</p>
            </div>

            <div className="space-y-3">
              {POLICY_MONITOR.map((pol, i) => (
                <div key={i} className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">{pol.category}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${pol.impact === 'positive' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                        Impact : {pol.impact === 'positive' ? '🟢 Positif' : '🔴 Négatif'}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm">{pol.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{pol.summary}</p>
                  </div>
                  <Button size="sm" variant="outline" className="text-xs shrink-0">Évaluer l'Impact</Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 8: OPPORTUNITIES RADAR ── */}
        {activeTab === 'opportunities' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-extrabold flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" /> Radar d'Opportunités B2B & Partenariats
              </h3>
              <p className="text-xs text-muted-foreground">Matching automatique d'affaires pour les membres UTICA.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {OPPORTUNITIES_RADAR.map((opp, idx) => (
                <div key={idx} className={`p-5 rounded-2xl border flex flex-col justify-between ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-500">{opp.match}% Match AI</span>
                      <span className="text-xs font-bold text-amber-400">{opp.val}</span>
                    </div>
                    <h4 className="font-bold text-sm mb-2">{opp.title}</h4>
                    <p className="text-xs text-muted-foreground mb-1">🤝 {opp.companyA} ➔ {opp.companyB}</p>
                    <p className="text-xs text-muted-foreground">🌍 Marché Target : {opp.country}</p>
                  </div>
                  <Button size="sm" className="mt-4 w-full text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold">
                    Introduire & Initier Matchmaking
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
