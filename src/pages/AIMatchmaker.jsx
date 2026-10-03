import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, Zap, ArrowRight, ShieldCheck, CheckCircle2, RefreshCw, 
  Building2, Wallet, Briefcase, Landmark, Globe, ChevronRight, Layers, ArrowLeft
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AIMatchmaker() {
  const navigate = useNavigate();

  // Wizard state
  const [role, setRole] = useState('COMPANY'); // Investor, Company, Startup, Project Owner, Institution, Chamber, Govt
  const [intent, setIntent] = useState('Investment'); // Investment, Partner, Distributor, Supplier, Market, Acquisition, Joint Venture
  const [sector, setSector] = useState('Renewable Energy');
  const [capital, setCapital] = useState('€1M – €5M');
  const [region, setRegion] = useState('Europe & Africa');

  const [isSearching, setIsSearching] = useState(false);
  const [matches, setMatches] = useState(null);

  const handleRunMatchmaker = async () => {
    setIsSearching(true);
    // Simulate AI model processing graph matrix
    setTimeout(async () => {
      const results = await base44.aiMatchEngine.findMatches({ role, intent, sector, capital, region });
      setMatches(results);
      setIsSearching(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#071A2B] text-slate-100 font-sans pb-16">
      
      {/* HEADER */}
      <section className="bg-gradient-to-b from-[#051322] to-[#071A2B] border-b border-slate-800 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <button 
              onClick={() => navigate('/investment-network')}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Investment Network
            </button>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white flex items-center gap-3">
              <Zap className="w-8 h-8 text-[#1769FF] fill-[#1769FF]" />
              AI Intelligent Matchmaker
            </h1>
            <p className="text-sm text-slate-300">
              Autonomous matchmaking engine calculating multi-dimensional alignment across sector, ticket size, governance & market signals.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#16C7B7]/10 border border-[#16C7B7]/30 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#16C7B7]">
            <Sparkles className="w-4 h-4 animate-spin" />
            Base44 Economic Graph Engine v2.4
          </div>
        </div>
      </section>

      {/* WIZARD & MATCH RESULTS */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Step Form */}
        <Card className="bg-slate-900/90 border-slate-800 p-6 sm:p-8 rounded-2xl shadow-xl space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 1. I AM */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                1. I am representing a:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'Investor', label: 'Investor / VC' },
                  { id: 'COMPANY', label: 'Company / Enterprise' },
                  { id: 'Startup', label: 'Tech Startup' },
                  { id: 'Project Owner', label: 'Project Owner' },
                  { id: 'Institution', label: 'Institution / Bank' },
                  { id: 'Chamber', label: 'Chamber of Commerce' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRole(item.id)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all text-left ${
                      role === item.id 
                        ? 'bg-[#1769FF] text-white border-[#1769FF] shadow-md shadow-blue-600/30' 
                        : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. LOOKING FOR */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                2. I am primarily looking for:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'Investment', label: 'Equity Investment' },
                  { id: 'Partner', label: 'Strategic Partner' },
                  { id: 'Distributor', label: 'Distributor / Importer' },
                  { id: 'Supplier', label: 'Supply Chain Partner' },
                  { id: 'Market', label: 'New Market Entry' },
                  { id: 'Joint Venture', label: 'Joint Venture' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIntent(item.id)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all text-left ${
                      intent === item.id 
                        ? 'bg-[#16C7B7] text-slate-950 border-[#16C7B7] shadow-md shadow-teal-500/20' 
                        : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Additional Filter parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Target Sector</label>
              <select 
                value={sector} 
                onChange={(e) => setSector(e.target.value)}
                className="w-full bg-slate-950 border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 focus:border-[#1769FF]"
              >
                <option value="Renewable Energy">Renewable Energy</option>
                <option value="Fintech">Fintech & Banking</option>
                <option value="Agri-tech">Agri-tech & Food</option>
                <option value="AI">AI & DeepTech</option>
                <option value="SaaS">Enterprise Software</option>
                <option value="Infrastructure">Infrastructure</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Ticket / Capital Range</label>
              <select 
                value={capital} 
                onChange={(e) => setCapital(e.target.value)}
                className="w-full bg-slate-950 border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 focus:border-[#1769FF]"
              >
                <option value="€100K – €500K">€100K – €500K</option>
                <option value="€500K – €1M">€500K – €1M</option>
                <option value="€1M – €5M">€1M – €5M</option>
                <option value="€5M – €20M">€5M – €20M</option>
                <option value="€20M+">€20M+</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 block mb-1">Target Geographic Focus</label>
              <select 
                value={region} 
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-slate-950 border-slate-800 text-slate-200 text-xs rounded-xl p-2.5 focus:border-[#1769FF]"
              >
                <option value="Europe & Africa">Europe & Africa</option>
                <option value="Tunisia & North Africa">Tunisia & North Africa</option>
                <option value="GCC & Middle East">GCC & Middle East</option>
                <option value="Global">Global Expansion</option>
              </select>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-2 text-center">
            <Button
              onClick={handleRunMatchmaker}
              disabled={isSearching}
              className="bg-gradient-to-r from-[#1769FF] to-[#16C7B7] hover:from-blue-600 hover:to-teal-400 text-white px-10 py-6 text-base font-bold rounded-xl shadow-xl shadow-blue-600/30 w-full sm:w-auto"
            >
              {isSearching ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin" /> Evaluating Knowledge Graph...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Zap className="w-5 h-5 fill-amber-300 text-amber-300" /> AI FIND MATCHES
                </span>
              )}
            </Button>
          </div>

        </Card>

        {/* RESULTS SECTION */}
        {matches && (
          <div className="space-y-6 pt-4 animate-fadeIn">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#16C7B7]" />
                  AI Identified {matches.length} Top Matches
                </h3>
                <p className="text-xs text-slate-400">
                  Ranked by multi-factor algorithmic alignment for {role} seeking {intent} in {sector}.
                </p>
              </div>

              <Badge className="bg-[#1769FF]/20 text-blue-300 border-[#1769FF]/30 text-xs px-3 py-1">
                Highest Match Score: {matches[0]?.aiMatchScore || 96}%
              </Badge>
            </div>

            {/* MATCH CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {matches.map((item, idx) => (
                <Card 
                  key={idx}
                  className="bg-slate-900/90 border-slate-800 hover:border-[#16C7B7]/50 transition-all rounded-2xl p-6 space-y-4 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Match #{idx + 1} • {item.type}
                      </span>
                      <h4 className="text-lg font-bold text-white line-clamp-1">{item.name}</h4>
                      <span className="text-xs text-slate-400">📍 {item.location} • {item.investmentRange}</span>
                    </div>

                    <div className="text-right">
                      <div className="inline-flex items-center gap-1 bg-[#16C7B7]/20 border border-[#16C7B7]/40 px-3 py-1 rounded-xl text-sm font-extrabold text-[#16C7B7]">
                        <Sparkles className="w-4 h-4" />
                        {item.aiMatchScore}%
                      </div>
                      <span className="text-[10px] text-slate-400 block mt-1">AI Alignment</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs space-y-1">
                    <span className="text-[#16C7B7] font-semibold block">AI Rationale:</span>
                    <p className="text-slate-300 italic">"{item.matchReason}"</p>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {(item.sectors || [sector]).map((s, i) => (
                      <Badge key={i} variant="outline" className="border-slate-700 text-slate-300 text-[10px]">
                        {s}
                      </Badge>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <Button 
                      onClick={() => navigate(`/messages?connect=${encodeURIComponent(item.name)}`)}
                      className="w-full bg-[#1769FF] hover:bg-blue-600 text-white text-xs py-2 rounded-xl font-semibold"
                    >
                      Request Introduction
                    </Button>
                    <Button 
                      variant="outline"
                      className="w-full border-slate-700 text-slate-300 hover:text-white text-xs py-2 rounded-xl"
                    >
                      Schedule Deal Room
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
