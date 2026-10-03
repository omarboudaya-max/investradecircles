import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Sparkles,
  TrendingUp,
  Globe2,
  Building2,
  Landmark,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  MapPin,
  Compass,
  FileText,
  DollarSign,
  Activity,
  Layers,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import {
  EXECUTIVE_INTELLIGENCE_SIGNALS,
  GLOBAL_RADAR_COUNTRIES,
  FEATURED_OPPORTUNITY_OF_THE_DAY
} from '@/lib/investmentNetwork';

export default function ExecutiveIntelligence() {
  const navigate = useNavigate();
  const [selectedCorridor, setSelectedCorridor] = useState('ALL');

  return (
    <div className="min-h-screen bg-[#071A2B] text-white pb-20 font-sans">
      {/* Top Navigation Bar */}
      <div className="border-b border-slate-800 bg-[#071A2B]/90 backdrop-blur-md py-4 sticky top-0 z-30">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center font-black text-slate-950 text-lg shadow-lg">
              i
            </div>
            <div>
              <h2 className="font-extrabold text-white text-base tracking-tight">Investraders Executive Command Center</h2>
              <p className="text-[11px] text-cyan-400 font-semibold">AI Economic Intelligence Platform • Live Sensor Data</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              className="bg-[#1769FF] hover:bg-blue-600 text-white text-xs font-bold gap-1.5 shadow-md shadow-blue-500/20"
              onClick={() => navigate('/matchmaker')}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" /> Run AI Matchmaker
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-slate-700 text-slate-300 hover:text-white text-xs"
              onClick={() => navigate('/investment-network')}
            >
              Investment Network
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Header */}
      <div className="bg-gradient-to-b from-[#071A2B] via-[#0b253e] to-[#071A2B] py-10 border-b border-slate-800">
        <div className="container mx-auto px-4 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-xs gap-1">
                <Activity className="w-3.5 h-3.5 text-cyan-400" /> Macro Economic Signal Network
              </Badge>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                National & International Economic Radar
              </h1>
              <p className="text-slate-300 text-sm leading-relaxed">
                Real-time aggregated intelligence extracted from company updates, investment mandates, regional circles, and trade corridors across Tunisia, Africa, Europe, and the GCC.
              </p>
            </div>

            {/* Opportunity of the Day Widget */}
            <Card className="bg-gradient-to-br from-slate-900 to-[#0b2b48] border-cyan-500/40 text-white w-full md:w-80 shadow-2xl shrink-0">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-amber-400 flex items-center gap-1">
                    ⚡ Opportunity of the Day
                  </span>
                  <Badge className="bg-emerald-500 text-slate-950 font-bold text-[10px]">
                    {FEATURED_OPPORTUNITY_OF_THE_DAY.matchScore}% AI Match
                  </Badge>
                </div>
                <h4 className="font-bold text-sm text-white line-clamp-1">
                  {FEATURED_OPPORTUNITY_OF_THE_DAY.title}
                </h4>
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>📍 {FEATURED_OPPORTUNITY_OF_THE_DAY.location}</span>
                  <span className="font-bold text-emerald-400">{FEATURED_OPPORTUNITY_OF_THE_DAY.investmentRequired}</span>
                </div>
                <Button
                  size="sm"
                  className="w-full bg-[#1769FF] hover:bg-blue-600 text-white text-xs font-bold gap-1 mt-1"
                  onClick={() => navigate('/investment-map')}
                >
                  Explore Deal <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* TOP EXECUTIVE KPI BAR */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 pt-4">
            <div className="bg-[#0b243b] border border-slate-700/80 rounded-2xl p-4 space-y-1">
              <div className="text-xs font-semibold text-slate-400 uppercase">Companies Connected</div>
              <div className="text-2xl font-extrabold text-white">12,480</div>
              <div className="text-[10px] text-emerald-400 font-bold">↑ +420 this week</div>
            </div>
            <div className="bg-[#0b243b] border border-slate-700/80 rounded-2xl p-4 space-y-1">
              <div className="text-xs font-semibold text-slate-400 uppercase">Investment Opportunities</div>
              <div className="text-2xl font-extrabold text-white">1,284</div>
              <div className="text-[10px] text-cyan-400 font-bold">24 Governorates</div>
            </div>
            <div className="bg-[#0b243b] border border-slate-700/80 rounded-2xl p-4 space-y-1">
              <div className="text-xs font-semibold text-slate-400 uppercase">Capital Seeking</div>
              <div className="text-2xl font-extrabold text-emerald-400">14.5B TND</div>
              <div className="text-[10px] text-slate-300 font-medium">~ €4.8 Billion</div>
            </div>
            <div className="bg-[#0b243b] border border-slate-700/80 rounded-2xl p-4 space-y-1">
              <div className="text-xs font-semibold text-slate-400 uppercase">Active Investors</div>
              <div className="text-2xl font-extrabold text-white">642</div>
              <div className="text-[10px] text-amber-400 font-bold">VC, PE, DFI, SWF</div>
            </div>
            <div className="bg-[#0b243b] border border-slate-700/80 rounded-2xl p-4 space-y-1 col-span-2 sm:col-span-1">
              <div className="text-xs font-semibold text-slate-400 uppercase">AI Matches Computed</div>
              <div className="text-2xl font-extrabold text-cyan-400">3,812</div>
              <div className="text-[10px] text-emerald-400 font-bold">High Precision Match</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Intelligence Body */}
      <div className="container mx-auto px-4 py-10 space-y-10">
        {/* SECTION 1: AI ECONOMIC SIGNALS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" /> AI Economic Sensor Signals
              </h3>
              <p className="text-xs text-slate-400">Automated entity & sentiment extraction from daily user updates</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {EXECUTIVE_INTELLIGENCE_SIGNALS.map((sig) => (
              <Card
                key={sig.id}
                className="bg-[#0b243b] border-slate-800 hover:border-cyan-500/50 transition-all rounded-2xl overflow-hidden shadow-lg"
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-slate-900 text-cyan-300 border-slate-700 text-xs font-bold">
                      {sig.category}
                    </Badge>
                    <span className="text-[11px] text-slate-400 font-medium">{sig.timestamp}</span>
                  </div>

                  <h4 className="font-extrabold text-white text-base leading-snug">{sig.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{sig.description}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                    <span>Corridor: <strong className="text-white">{sig.corridor}</strong></span>
                    <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400">
                      High System Confidence
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* SECTION 2: GLOBAL OPPORTUNITY RADAR */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-emerald-400" /> Global Opportunity Radar
              </h3>
              <p className="text-xs text-slate-400">Active investment & export trade opportunities by target country</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {GLOBAL_RADAR_COUNTRIES.map((c) => (
              <div
                key={c.code}
                className="bg-[#0b243b] border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-4 space-y-2 cursor-pointer group transition-all"
                onClick={() => navigate('/investment-network')}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{c.flag}</span>
                  <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">
                    {c.activeDemand} Demand
                  </Badge>
                </div>
                <div>
                  <h4 className="font-bold text-white text-base group-hover:text-emerald-400 transition-colors">
                    {c.name}
                  </h4>
                  <p className="text-xs text-slate-400">{c.region}</p>
                </div>
                <div className="text-lg font-extrabold text-cyan-400 pt-1 border-t border-slate-800">
                  {c.count} <span className="text-xs font-normal text-slate-400">Active Deals</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: INSTITUTIONAL ACTION CENTER */}
        <div className="bg-gradient-to-r from-slate-900 via-[#0b2a48] to-slate-900 rounded-3xl p-8 sm:p-12 border border-slate-800 space-y-6">
          <div className="max-w-2xl space-y-3">
            <Badge className="bg-[#1769FF]/20 text-cyan-300 border-[#1769FF]/40 text-xs">
              Institutional Integration
            </Badge>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              Connect Your Organization to Investraders 2.0
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Designed for UTICA, TIA, FIPA, CDC, RNE, Commercial Banks, and Investment Funds seeking continuous economic signal monitoring, verified dealflow, and AI matchmaking.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Button
              size="lg"
              className="bg-[#1769FF] hover:bg-blue-600 text-white font-bold gap-2 px-8 py-6 text-base shadow-xl"
              onClick={() => navigate('/investment-network')}
            >
              Explore Investment Network Directory <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-slate-700 text-slate-300 hover:text-white"
              onClick={() => navigate('/matchmaker')}
            >
              Run AI Matchmaking Tool
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
