import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, TrendingUp, Building2, Wallet, Globe, Sparkles, 
  ArrowUpRight, ShieldCheck, Download, Zap, Layers, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import UTICABusinessCommandCenter from '@/components/circles/UTICABusinessCommandCenter';
import { useAuth } from '@/lib/AuthContext';

export default function ExecutiveIntelligence() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeInstitution, setActiveInstitution] = useState('ALL'); // ALL, UTICA, TIA_FIPA, CDC, RNE

  // Dynamic Macro KPIs per institutional view
  const kpiData = {
    ALL: [
      { label: 'Companies Connected', value: '12,480', change: '+12.4% MoM', isUp: true, icon: Building2 },
      { label: 'Investment Opportunities', value: '1,284', change: '+8.1% MoM', isUp: true, icon: Sparkles },
      { label: 'Capital Seeking', value: '€4.8B', change: '+15.2% MoM', isUp: true, icon: Wallet },
      { label: 'Active Investors', value: '642', change: '+5.7% MoM', isUp: true, icon: Globe },
      { label: 'International Matches', value: '3,812', change: '+24.9% MoM', isUp: true, icon: Zap }
    ],
    UTICA: [
      { label: 'UTICA Member SMEs', value: '18,450', change: '+4.2% MoM', isUp: true, icon: Building2 },
      { label: 'Sector Issues Logged', value: '1,284', change: '-5.1% this week', isUp: true, icon: Sparkles },
      { label: 'Regional Partnerships', value: '486', change: '+18 this month', isUp: true, icon: Wallet },
      { label: 'Business Sentiment', value: '68% Positive', change: '🟢 Stable (+2%)', isUp: true, icon: Globe },
      { label: 'Cross-Border Opportunities', value: '214', change: '47 International', isUp: true, icon: Zap }
    ],
    TIA_FIPA: [
      { label: 'FDI Pipeline Projects', value: '342', change: '+18.4% YoY', isUp: true, icon: Building2 },
      { label: 'Target Capital Inflow', value: '€2.1B', change: '+14.0% YoY', isUp: true, icon: Wallet },
      { label: 'Foreign Investor Leads', value: '189', change: 'Europe & GCC', isUp: true, icon: Globe },
      { label: 'FDI Matches Closed', value: '64', change: 'Completed Q3', isUp: true, icon: Zap },
      { label: 'Priority Tech Hubs', value: '12', change: 'Tunis, Sousse, Sfax', isUp: true, icon: Sparkles }
    ],
    CDC: [
      { label: 'Sovereign Co-Investments', value: '48', change: '€450M Portfolio', isUp: true, icon: Wallet },
      { label: 'Growth Funds Backed', value: '16 VCs', change: 'Fintech & Green', isUp: true, icon: Building2 },
      { label: 'SME Equity Demand', value: '€1.2B', change: '84 Projects', isUp: true, icon: Sparkles },
      { label: 'Impact Score', value: '91/100', change: 'High ESG Alignment', isUp: true, icon: Globe },
      { label: 'Green Energy Assets', value: '€180M', change: '+22% YoY', isUp: true, icon: Zap }
    ],
    RNE: [
      { label: 'Registered Enterprises', value: '142,600', change: '+8.4% YoY', isUp: true, icon: Building2 },
      { label: 'New Business Creations', value: '3,840', change: 'This Month', isUp: true, icon: Sparkles },
      { label: 'Beneficial Ownership Logs', value: '94.2%', change: 'Compliance Rate', isUp: true, icon: ShieldCheck },
      { label: 'Export Active Companies', value: '6,420', change: 'Validated', isUp: true, icon: Globe },
      { label: 'Digital Filing Pulse', value: '98%', change: 'Real-time sync', isUp: true, icon: Zap }
    ]
  };

  const currentKPIs = kpiData[activeInstitution] || kpiData.ALL;

  return (
    <div className="min-h-screen bg-[#071A2B] text-slate-100 font-sans pb-16">
      
      {/* COMMAND CENTER HEADER */}
      <section className="bg-gradient-to-b from-[#051322] via-[#071A2B] to-[#0A2239] border-b border-slate-800 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1769FF]/10 border border-[#1769FF]/30 text-xs font-bold text-[#16C7B7] uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5" /> Institutional Executive View
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-[#1769FF]" />
              Executive Command Center
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Aggregated macroeconomic intelligence, trade flow telemetry, and AI investment signals for Chambers, Sovereign Funds, and Ministries.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button 
              onClick={() => alert('Downloading Weekly AI Executive Briefing PDF...')}
              className="bg-[#1769FF] hover:bg-blue-600 text-white text-xs px-4 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/30"
            >
              <Download className="w-4 h-4" /> Download Executive Brief
            </Button>
            
            <Button
              onClick={() => navigate('/investment-network')}
              variant="outline"
              className="border-slate-700 bg-slate-900 text-slate-300 hover:text-white text-xs px-4 py-2.5 rounded-xl"
            >
              Investment Network
            </Button>
          </div>
        </div>

        {/* Institution Context Switcher */}
        <div className="max-w-7xl mx-auto pt-6 flex flex-wrap items-center gap-2 text-xs font-medium">
          <span className="text-slate-400 font-semibold mr-2">Institutional Lens:</span>
          {[
            { id: 'ALL', label: 'Global Overview' },
            { id: 'UTICA', label: 'UTICA (Private Sector)' },
            { id: 'TIA_FIPA', label: 'TIA / FIPA (FDI)' },
            { id: 'CDC', label: 'CDC (Sovereign Fund)' },
            { id: 'RNE', label: 'RNE (National Register)' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveInstitution(item.id)}
              className={`px-3.5 py-1.5 rounded-lg border transition-all ${
                activeInstitution === item.id 
                  ? 'bg-[#1769FF] text-white border-[#1769FF] shadow-md shadow-blue-600/30' 
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {/* COMMAND CENTER CONTENT */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-10">
        
        {/* 1. TOP EXECUTIVE KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {currentKPIs.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <Card key={idx} className="bg-slate-900/90 border-slate-800 p-4 rounded-2xl shadow-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">{kpi.label}</span>
                  <Icon className="w-4 h-4 text-[#1769FF]" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white">{kpi.value}</div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                  <ArrowUpRight className="w-3.5 h-3.5" /> {kpi.change}
                </div>
              </Card>
            );
          })}
        </div>

        {/* IF UTICA MODE IS ACTIVE: Render deep UTICA Command Center panel */}
        {activeInstitution === 'UTICA' && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6">
            <UTICABusinessCommandCenter circle={{ name: 'UTICA National Business Center' }} user={user} isDark={true} />
          </div>
        )}

        {/* 2. REAL-TIME MACROECONOMIC AI SIGNALS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* AI Signals Feed */}
          <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#16C7B7]" />
                  AI Real-Time Economic Signal Network
                </h3>
                <p className="text-xs text-slate-400">
                  Continuous NLP classification of social feed updates, circle discussions, and investment disclosures.
                </p>
              </div>

              <Badge className="bg-[#16C7B7]/20 text-[#16C7B7] border-[#16C7B7]/30 text-xs">
                Live Sensor Feed
              </Badge>
            </div>

            <div className="space-y-4">
              {[
                {
                  type: 'MARKET TREND',
                  title: 'North Africa Renewable Energy Demand Spike',
                  body: 'Demand for solar microgrids and clean tech financing increased 18% this month across Tunisia & Morocco.',
                  sources: '46 public posts & 14 investment disclosures',
                  confidence: 'High (94%)',
                  time: '2 hours ago',
                  badgeCls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                },
                {
                  type: 'INTERNATIONALIZATION',
                  title: 'German Market Expansion Requests Surge',
                  body: '22 Tunisian agri-food exporters are currently seeking distribution partners in Munich and Frankfurt.',
                  sources: '37 intent posts & 8 company profiles',
                  confidence: 'High (91%)',
                  time: '4 hours ago',
                  badgeCls: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                },
                {
                  type: 'CAPITAL DEMAND',
                  title: 'DeepTech Seed Funding Gap Detected',
                  body: '14 AI & SaaS startups published capital requirements totaling €28M with limited local VC coverage.',
                  sources: '14 project sheets & 6 circle proposals',
                  confidence: 'Medium (87%)',
                  time: '6 hours ago',
                  badgeCls: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                },
                {
                  type: 'SUPPLY CHAIN SIGNAL',
                  title: 'Logistics Costs Friction in Manufacturing',
                  body: 'Negative sentiment surrounding port latency & freight costs rose 12% in the Industrial Circle.',
                  sources: '19 circle posts & 32 user comments',
                  confidence: 'High (92%)',
                  time: '12 hours ago',
                  badgeCls: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }
              ].map((sig, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <Badge className={`text-[10px] uppercase font-bold border ${sig.badgeCls}`}>
                      {sig.type}
                    </Badge>
                    <span className="text-slate-500">{sig.time}</span>
                  </div>

                  <h4 className="text-base font-bold text-white">{sig.title}</h4>
                  <p className="text-xs text-slate-300">{sig.body}</p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                    <span>Source: <strong className="text-slate-300">{sig.sources}</strong></span>
                    <span className="text-[#16C7B7]">AI Confidence: {sig.confidence}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trade & Capital Flow Radar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#1769FF]" />
                Capital & Trade Flow Matrix
              </h3>
              <p className="text-xs text-slate-400">
                Active partnership and capital routing vectors.
              </p>
            </div>

            <div className="space-y-4">
              
              {/* Tunisia -> Europe */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>🇹🇳 Tunisia ➔ 🇪🇺 Europe</span>
                  <span className="text-emerald-400">€1.4B Active Flow</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-[#1769FF] to-[#16C7B7] h-full w-[78%]" />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>342 Active Deals</span>
                  <span>Top: Renewable, IT, Textile</span>
                </div>
              </div>

              {/* Tunisia -> GCC */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>🇹🇳 Tunisia ➔ 🇸🇦 GCC</span>
                  <span className="text-amber-400">€980M Active Flow</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-amber-500 to-amber-300 h-full w-[62%]" />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>189 Active Deals</span>
                  <span>Top: Infrastructure, Tourism</span>
                </div>
              </div>

              {/* Tunisia -> Sub-Saharan Africa */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>🇹🇳 Tunisia ➔ 🌍 Sub-Saharan</span>
                  <span className="text-[#16C7B7]">€620M Active Flow</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-300 h-full w-[45%]" />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>124 Active Deals</span>
                  <span>Top: Agri, Pharma, Banking</span>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
