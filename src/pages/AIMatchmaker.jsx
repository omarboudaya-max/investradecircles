import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, ArrowRight, CheckCircle2, ShieldCheck, Landmark, Building2, Globe, Target, Layers, ArrowLeft } from 'lucide-react';
import { calculateInteractiveMatch } from '@/lib/investmentNetwork';

const USER_ROLES = [
  { id: 'COMPANY', label: 'Company / SME', icon: Building2 },
  { id: 'INVESTOR', label: 'Investor / Fund', icon: Landmark },
  { id: 'STARTUP', label: 'Tech Startup', icon: Sparkles },
  { id: 'PROJECT_OWNER', label: 'Project Promoter', icon: Target },
  { id: 'INSTITUTION', label: 'Government / Chamber', icon: Globe },
];

const USER_OBJECTIVES = [
  { id: 'INVESTMENT', label: 'Seeking Investment / Financing' },
  { id: 'CAPITAL_ALLOCATION', label: 'Offering Capital / Funding Projects' },
  { id: 'PARTNER', label: 'Finding Strategic Co-Founder / Partner' },
  { id: 'DISTRIBUTOR', label: 'Finding Importer / Distributor in EU/GCC' },
  { id: 'JOINT_VENTURE', label: 'Joint Venture & Industrial M&A' },
  { id: 'EXPORT_MARKET', label: 'Expanding Export Channels' },
];

const SECTORS = [
  { id: 'sec_tech', label: 'Technology & AI' },
  { id: 'sec_agri', label: 'Agri-Food & Smart Farming' },
  { id: 'sec_energy', label: 'Renewable Solar & Green Energy' },
  { id: 'sec_industry', label: 'Advanced Manufacturing & Automotive' },
  { id: 'sec_pharma', label: 'Pharma & Biotech' },
];

export default function AIMatchmaker() {
  const navigate = useNavigate();
  const [role, setRole] = useState('COMPANY');
  const [objective, setObjective] = useState('INVESTMENT');
  const [sector, setSector] = useState('sec_tech');
  const [region, setRegion] = useState('Global');
  const [ticket, setTicket] = useState('0.5-2M');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState(null);

  const handleRunMatch = () => {
    setIsSearching(true);
    setTimeout(() => {
      const matchResults = calculateInteractiveMatch(role, objective, sector, region, ticket);
      setResults(matchResults);
      setIsSearching(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      {/* Top Header */}
      <div className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md py-4 sticky top-0 z-30">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/investment-network')}
            className="text-slate-400 hover:text-white text-xs gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Investment Network
          </Button>

          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs gap-1">
              <Sparkles className="w-3.5 h-3.5" /> AI Matchmaker v2.0
            </Badge>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 pt-12 pb-8 border-b border-slate-800/80">
        <div className="container mx-auto px-4 text-center max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-semibold border border-cyan-500/30">
            <Sparkles className="w-4 h-4 text-cyan-400" /> Autonomous Economic Matchmaker
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Find Your Investment & Business Match
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            Tell our AI engine who you are and what you need. Investraders actively computes compatibility across 1,250+ institutional capital mandates and 5,000+ business opportunities.
          </p>
        </div>
      </div>

      {/* Interactive Matchmaker Form Container */}
      <div className="container mx-auto px-4 max-w-4xl -mt-6">
        <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl p-6 sm:p-10 space-y-8">
          {/* STEP 1: I AM */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-cyan-400 block">
              Step 1: I am an...
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {USER_ROLES.map((r) => {
                const Icon = r.icon;
                const active = role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={`p-3.5 rounded-2xl border text-center flex flex-col items-center gap-2 transition-all ${
                      active
                        ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-lg shadow-cyan-500/10'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${active ? 'text-cyan-400' : 'text-slate-500'}`} />
                    <span className="text-xs font-bold leading-tight">{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 2: LOOKING FOR */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">
              Step 2: I am looking for...
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {USER_OBJECTIVES.map((obj) => {
                const active = objective === obj.id;
                return (
                  <button
                    key={obj.id}
                    type="button"
                    onClick={() => setObjective(obj.id)}
                    className={`p-4 rounded-2xl border text-left text-xs font-semibold transition-all ${
                      active
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    {obj.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 3: SECTOR & PARAMETERS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800/80">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Target Sector</label>
              <select
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
              >
                {SECTORS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Target Geography</label>
              <select
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              >
                <option value="Global">Global / Regional</option>
                <option value="Tunisia">Tunisia</option>
                <option value="Europe">Europe (Germany, France, UK)</option>
                <option value="GCC">GCC / Gulf Region</option>
                <option value="Africa">Sub-Saharan Africa</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400">Check Size Range</label>
              <select
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                value={ticket}
                onChange={(e) => setTicket(e.target.value)}
              >
                <option value="0.1-0.5M">0.1M – 0.5M TND (Seed)</option>
                <option value="0.5-2M">0.5M – 2.0M TND (Growth)</option>
                <option value="2-10M">2.0M – 10.0M TND (Series A/B)</option>
                <option value="10M+">10.0M+ TND (Infrastructure / Buyout)</option>
              </select>
            </div>
          </div>

          {/* RUN MATCH BUTTON */}
          <Button
            size="lg"
            className="w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-extrabold py-7 text-base rounded-2xl shadow-xl shadow-cyan-500/20 gap-2"
            onClick={handleRunMatch}
            disabled={isSearching}
          >
            {isSearching ? (
              <>
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                Computing Compatibility Index...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-slate-950" /> 🤖 AI FIND MATCHES NOW
              </>
            )}
          </Button>
        </div>

        {/* RESULTS SECTION */}
        {results && (
          <div className="mt-12 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" /> Ranked AI Matches ({results.length} Identified)
              </h3>
              <span className="text-xs text-slate-400">Sorted by Strategic Mandate Alignment</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {results.map((m) => (
                <Card
                  key={m.id}
                  className="bg-slate-900 border-slate-800 hover:border-cyan-500/50 transition-all rounded-2xl overflow-hidden shadow-lg"
                >
                  <CardContent className="p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-extrabold text-white text-lg">{m.title}</h4>
                          <Badge variant="outline" className="text-xs border-slate-700 text-slate-300">
                            {m.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-400 font-semibold">{m.organization} • {m.country}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-2xl font-black text-emerald-400">{m.score}%</div>
                          <div className="text-[10px] text-slate-400 uppercase font-bold">Match Score</div>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{m.description}</p>

                    <div className="bg-slate-950/70 rounded-xl p-3.5 border border-slate-800/80 space-y-1 text-xs">
                      <p className="font-bold text-cyan-400 text-[11px] uppercase tracking-wider">Alignment Factors:</p>
                      <ul className="space-y-1 text-slate-300">
                        {m.factors.map((f, idx) => (
                          <li key={idx} className="flex items-center gap-1.5">
                            <span className="text-emerald-400 font-bold">•</span> {f}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
                      <span className="text-slate-400">Target Check: <strong className="text-white">{m.ticket}</strong></span>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1 font-bold"
                          onClick={() => alert(`Introduction request dispatched for ${m.organization}`)}
                        >
                          Request Introduction <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
