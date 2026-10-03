import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { 
  Sparkles, Search, SlidersHorizontal, MapPin, Building2, Coins, TrendingUp, 
  ShieldCheck, Globe, Zap, ArrowRight, CheckCircle2, UserCheck, Layers, Filter,
  Share2, Send, ExternalLink, Bookmark, Award, Landmark, Lock
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { formatMTND, formatNumber } from '@/lib/investment';
import InvestorInterestModal from '@/components/investment/InvestorInterestModal';

// Sample Network Entities dataset (Funds, VCs, Companies, Institutions)
const INITIAL_ENTITIES = [
  {
    id: 'ent_1',
    name: 'Sahel Capital Partners',
    type: 'FUND',
    roleLabel: 'Venture Capital & Growth Fund',
    country: 'Tunisia / France',
    city: 'Tunis',
    location: 'Tunis & Paris',
    minTicket: '€500K',
    maxTicket: '€5M',
    sectors: ['AI', 'Fintech', 'SaaS', 'AgriTech'],
    aiMatch: 96,
    matchReason: 'Strong alignment based on sector focus, target expansion size and Mediterranean market presence.',
    verified: true,
    activeDeals: 14,
    description: 'Growth-stage venture fund investing €500K to €5M in high-scalability North African & Mediterranean tech startups.',
    logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=200&q=80',
    contactPerson: 'Karim Ben Ammar (Managing Partner)'
  },
  {
    id: 'ent_2',
    name: 'Bizerte Smart Agri-Food Park',
    type: 'PROJECT',
    roleLabel: 'Investment-Ready Project',
    country: 'Tunisia',
    city: 'Bizerte',
    location: 'Bizerte, Tunisia',
    minTicket: '€250K',
    maxTicket: '€1.8M',
    sectors: ['AgriTech', 'Cold Storage', 'Export'],
    aiMatch: 94,
    matchReason: 'High export potential into EU markets with existing solar cold-chain infrastructure.',
    verified: true,
    activeDeals: 3,
    description: '15-hectare smart agricultural processing facility with solar powered cold storage for European organic distribution.',
    logo: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=200&q=80',
    contactPerson: 'Sami Ben Salem (Promoter)'
  },
  {
    id: 'ent_3',
    name: 'Bavaria-Tunisia Trade Chamber',
    type: 'INSTITUTION',
    roleLabel: 'Institutional Partner & Chamber',
    country: 'Germany / Tunisia',
    city: 'Munich & Tunis',
    location: 'Munich & Tunis',
    minTicket: 'N/A',
    maxTicket: 'Institutional',
    sectors: ['Industrial', 'Renewable Energy', 'Automotive'],
    aiMatch: 91,
    matchReason: 'Official trade gateway linking Bavarian industrial buyers with North African manufacturing exporters.',
    verified: true,
    activeDeals: 28,
    description: 'Facilitating direct joint ventures, technology transfers and supplier development between German and Tunisian industrial SMEs.',
    logo: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=200&q=80',
    contactPerson: 'Dr. Hans Weber (International Trade Delegate)'
  },
  {
    id: 'ent_4',
    name: 'NeuraCode Labs Tunisia',
    type: 'COMPANY',
    roleLabel: 'Tech Enterprise & AI Developer',
    country: 'Tunisia',
    city: 'Tunis (El Gazala)',
    location: 'El Gazala Technopark',
    minTicket: '€100K',
    maxTicket: '€1.2M',
    sectors: ['AI', 'Fintech', 'Credit Scoring'],
    aiMatch: 89,
    matchReason: 'Fast-growing AI credit assessment platform serving microfinance banks in North & West Africa.',
    verified: true,
    activeDeals: 5,
    description: 'Scaling proprietary AI credit scoring SaaS platform for regional banks and microfinance institutions across MENA.',
    logo: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=200&q=80',
    contactPerson: 'Yasmine Triki (CEO & Founder)'
  },
  {
    id: 'ent_5',
    name: 'Sahara Green Hydrogen Fund',
    type: 'FUND',
    roleLabel: 'Clean Energy Infrastructure Fund',
    country: 'UAE / Tunisia',
    city: 'Dubai & Tataouine',
    location: 'Dubai & Southern Tunisia',
    minTicket: '€1M',
    maxTicket: '€25M',
    sectors: ['Renewable Energy', 'Solar', 'Hydrogen'],
    aiMatch: 95,
    matchReason: 'Targeting utility-scale 100MW solar photovoltaic and green hydrogen projects in Southern Tunisia.',
    verified: true,
    activeDeals: 8,
    description: 'Institutional renewable energy fund dedicated to funding utility-scale solar and green hydrogen generation across North Africa.',
    logo: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=200&q=80',
    contactPerson: 'Nizar Belhadj (Investment Director)'
  },
  {
    id: 'ent_6',
    name: 'Sousse EV Cable Assembly Plant',
    type: 'PROJECT',
    roleLabel: 'Industrial Expansion Project',
    country: 'Tunisia',
    city: 'Sousse',
    location: 'Enfidha Industrial Zone',
    minTicket: '€500K',
    maxTicket: '€3M',
    sectors: ['Industrial', 'Automotive', 'EV Cables'],
    aiMatch: 92,
    matchReason: 'Tier-1 supplier pre-certified for high-voltage European electric vehicle manufacturing contracts.',
    verified: true,
    activeDeals: 4,
    description: 'Expansion of manufacturing lines for high-voltage EV sensory cables with ISO/IATF 16949 certification in Enfidha Hub.',
    logo: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=200&q=80',
    contactPerson: 'Karem Haddad (Operations Director)'
  }
];

export default function InvestmentNetwork() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('ALL');
  const [matchmakingOpen, setMatchmakingOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [selectedProjectForModal, setSelectedProjectForModal] = useState(null);

  // Matchmaking Form State
  const [matchForm, setMatchForm] = useState({
    userRole: 'COMPANY',
    intent: 'INVESTMENT',
    sector: 'Technology & AI',
    region: 'Tunisia & Europe',
  });
  const [isMatching, setIsMatching] = useState(false);
  const [matchResults, setMatchResults] = useState(null);

  const filteredEntities = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return INITIAL_ENTITIES.filter((ent) => {
      if (selectedTab !== 'ALL' && ent.type !== selectedTab) return false;
      if (q) {
        const hay = `${ent.name} ${ent.roleLabel} ${ent.country} ${ent.city} ${ent.sectors.join(' ')} ${ent.description}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [searchTerm, selectedTab]);

  const handleRunMatchmaking = () => {
    setIsMatching(true);
    setTimeout(() => {
      setIsMatching(false);
      setMatchResults(INITIAL_ENTITIES.slice(0, 4));
      toast({
        title: '🤖 AI Matchmaking Complete',
        description: `Found 4 high-compatibility opportunities matching your parameters (${matchForm.intent} in ${matchForm.sector}).`,
      });
    }, 1200);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* 1. HERO SECTION */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#071A2B] via-[#0b2540] to-[#040e18] p-8 sm:p-12 border border-blue-500/20 shadow-2xl overflow-hidden">
        {/* Neon Background Accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/30 text-[#38bdf8] text-xs font-bold uppercase tracking-widest">
            <Sparkles className="w-4 h-4 text-[#38bdf8] animate-pulse" />
            AI-Powered Economic Intelligence & Matchmaking Network
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight tracking-tight">
            Connect Capital. Discover Opportunities. <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38bdf8] via-[#16C7B7] to-blue-400">Grow Globally.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            AI-powered economic intelligence connecting businesses, investors, funds, institutions and markets across Tunisia, Africa, Europe and the Middle East.
          </p>

          {/* Action Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button 
              onClick={() => setMatchmakingOpen(!matchmakingOpen)} 
              className="px-6 py-3 rounded-xl bg-[#1769FF] hover:bg-blue-600 text-white font-extrabold text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(23,105,255,0.4)] transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-current" />
              AI Matchmaking Engine
            </button>
            <a 
              href="/investment-map" 
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm border border-white/20 flex items-center gap-2 transition-all"
            >
              <Globe className="w-4 h-4 text-[#16C7B7]" />
              Explore Investment Map
            </a>
          </div>

          {/* Core Navigation Pills */}
          <div className="pt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-300">
            <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[#38bdf8]">AI MATCHMAKING</span>
            <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[#16C7B7]">INVESTMENT MAP</span>
            <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-emerald-400">GLOBAL NETWORK</span>
            <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-amber-400">MARKET INTELLIGENCE</span>
          </div>
        </div>
      </div>

      {/* 2. SEMANTIC SEARCH & AI MATCHMAKER FORM */}
      <div className="bg-card border rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        
        {/* Large Semantic Search Bar */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Search className="w-4 h-4 text-primary" /> Semantic AI Intelligence Search
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder='🔍 What are you looking for? (e.g. "Renewable energy projects in Tunisia", "Investors interested in fintech", "German companies seeking partners")'
              className="w-full bg-background border-2 border-primary/20 focus:border-primary rounded-2xl px-5 py-4 pl-12 text-sm font-medium focus:outline-none transition-all shadow-inner"
            />
            <Search className="w-5 h-5 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
          </div>
          <div className="flex flex-wrap gap-2 pt-1 text-xs">
            <span className="text-muted-foreground">Quick queries:</span>
            {['Renewable solar projects', 'VC Funds €1M+', 'AgriTech Export', 'Bavarian Industrial Partners'].map((q) => (
              <button 
                key={q} 
                onClick={() => setSearchTerm(q)}
                className="text-primary hover:underline font-medium cursor-pointer"
              >
                "{q}"
              </button>
            ))}
          </div>
        </div>

        {/* Expandable Matchmaker Form */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Find Your Instant AI Match</h3>
                <p className="text-xs text-muted-foreground">Configure your criteria for real-time bilateral matchmaking</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setMatchmakingOpen(!matchmakingOpen)}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              {matchmakingOpen ? 'Hide Parameters' : 'Configure Parameters'}
            </Button>
          </div>

          {matchmakingOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-2xl bg-muted/40 border border-primary/10 mb-4"
            >
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">I am:</label>
                <select 
                  value={matchForm.userRole}
                  onChange={(e) => setMatchForm({ ...matchForm, userRole: e.target.value })}
                  className="w-full rounded-xl border bg-background px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="INVESTOR">Investor / Fund Manager</option>
                  <option value="COMPANY">Company / SME</option>
                  <option value="STARTUP">Startup Founder</option>
                  <option value="PROJECT">Project Owner</option>
                  <option value="INSTITUTION">Institutional / Chamber</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">I am looking for:</label>
                <select 
                  value={matchForm.intent}
                  onChange={(e) => setMatchForm({ ...matchForm, intent: e.target.value })}
                  className="w-full rounded-xl border bg-background px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="INVESTMENT">Capital / Equity Investment</option>
                  <option value="PARTNER">Strategic Partner</option>
                  <option value="EXPORT">International Export Market</option>
                  <option value="SUPPLIER">Industrial Supplier</option>
                  <option value="JOINT_VENTURE">Joint Venture</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Target Sector:</label>
                <select 
                  value={matchForm.sector}
                  onChange={(e) => setMatchForm({ ...matchForm, sector: e.target.value })}
                  className="w-full rounded-xl border bg-background px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Technology & AI">Technology & AI</option>
                  <option value="Renewable Energy">Renewable Energy</option>
                  <option value="AgriTech">AgriTech & Food Processing</option>
                  <option value="Industrial">Industrial & Automotive</option>
                  <option value="Pharma">Pharma & Healthcare</option>
                </select>
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={handleRunMatchmaking} 
                  disabled={isMatching}
                  className="w-full bg-[#1769FF] hover:bg-blue-600 font-bold text-xs"
                >
                  {isMatching ? <Sparkles className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                  {isMatching ? 'Processing AI...' : 'AI FIND MATCHES'}
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* 3. OPPORTUNITY OF THE DAY HERO CARD */}
      <div className="rounded-3xl border-2 border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-card to-card p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 fill-amber-500" /> Opportunity of the Day
            </span>
            <span className="text-xs text-muted-foreground font-mono">INV-2026-FEATURED</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#20B26B] bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 96% AI Match
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 items-center">
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-2xl font-bold text-foreground">
              Sfax Industrial Green Solar Power Station (20MW)
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Construction of a 20MW photovoltaic solar farm with 20-year Power Purchase Agreement (PPA) secured with industrial manufacturing plants in Sfax South Zone.
            </p>
            <div className="flex flex-wrap gap-3 text-xs font-semibold pt-1">
              <span className="px-3 py-1 rounded-lg bg-muted flex items-center gap-1">📍 Sfax, Tunisia</span>
              <span className="px-3 py-1 rounded-lg bg-muted flex items-center gap-1">💰 Required: €5.5M Equity</span>
              <span className="px-3 py-1 rounded-lg bg-muted flex items-center gap-1">📈 ROI: 18% / yr</span>
              <span className="px-3 py-1 rounded-lg bg-muted flex items-center gap-1">⚡ Sector: Renewable Energy</span>
            </div>
          </div>

          <div className="lg:col-span-1 flex flex-col gap-2.5">
            <Button 
              className="w-full bg-[#1769FF] hover:bg-blue-600 font-bold"
              onClick={() => setSelectedProjectForModal({
                id: 'proj_sfax_solar',
                title: 'Sfax Industrial Green Solar Power Station 20MW',
                investment_required: 18500000
              })}
            >
              Express Investor Interest <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <a 
              href="/investment-project/proj_sfax_solar" 
              className="w-full text-center py-2.5 rounded-xl border font-semibold text-xs hover:bg-muted transition-colors"
            >
              Explore Full Technical Brief
            </a>
          </div>
        </div>
      </div>

      {/* 4. ENTITY CATEGORY FILTER TABS & ENTITY CARDS */}
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-1.5 bg-muted/60 p-1.5 rounded-2xl overflow-x-auto">
            {[
              { id: 'ALL', label: 'All Ecosystem' },
              { id: 'FUND', label: 'VCs & Funds' },
              { id: 'PROJECT', label: 'Projects' },
              { id: 'COMPANY', label: 'Companies' },
              { id: 'INSTITUTION', label: 'Institutions & Chambers' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedTab === tab.id
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-muted-foreground font-medium">
            Showing {filteredEntities.length} active entities
          </span>
        </div>

        {/* Entity Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEntities.map((ent) => (
            <motion.div 
              key={ent.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border bg-card p-6 flex flex-col justify-between hover:shadow-xl transition-all duration-300 group hover:-translate-y-1"
            >
              <div className="space-y-4">
                {/* Header: Logo & Match Score */}
                <div className="flex items-start justify-between gap-3">
                  <div className="w-14 h-14 rounded-2xl border bg-muted overflow-hidden shrink-0 shadow-sm">
                    <img src={ent.logo} alt={ent.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#16C7B7]/10 text-[#16C7B7] border border-[#16C7B7]/30 text-xs font-black">
                      <Zap className="w-3 h-3 fill-current" /> {ent.aiMatch}% AI Match
                    </div>
                    <span className="text-[10px] text-muted-foreground block mt-1 font-mono">{ent.type}</span>
                  </div>
                </div>

                {/* Info */}
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                      {ent.name}
                    </h3>
                    {ent.verified && <ShieldCheck className="w-4 h-4 text-primary shrink-0" />}
                  </div>
                  <p className="text-xs text-primary font-medium">{ent.roleLabel}</p>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {ent.description}
                </p>

                {/* Match Reason Banner */}
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 text-[11px] text-muted-foreground leading-snug">
                  <span className="font-bold text-primary block mb-0.5">AI Insights:</span>
                  {ent.matchReason}
                </div>

                {/* Metadata Pills */}
                <div className="space-y-2 pt-1 border-t text-xs">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-primary" /> Location</span>
                    <span className="font-semibold text-foreground">{ent.location}</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-1"><Coins className="w-3.5 h-3.5 text-primary" /> Ticket Range</span>
                    <span className="font-semibold text-foreground">{ent.minTicket} – {ent.maxTicket}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {ent.sectors.map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-semibold text-muted-foreground">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-5 flex items-center gap-2">
                <Button 
                  size="sm" 
                  className="flex-1 bg-[#1769FF] hover:bg-blue-600 font-bold text-xs"
                  onClick={() => {
                    setSelectedProjectForModal({
                      id: ent.id,
                      title: ent.name,
                      investment_required: 1000000
                    });
                  }}
                >
                  Find Match / Connect
                </Button>
                <Button 
                  size="icon" 
                  variant="outline" 
                  className="h-8 w-8 shrink-0"
                  onClick={() => toast({ title: 'Saved to your bookmarked network entities' })}
                >
                  <Bookmark className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* 5. GLOBAL OPPORTUNITY RADAR */}
      <div className="rounded-3xl border bg-card p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-3 border-b pb-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" /> Global Opportunity Radar
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live breakdown of active investment and trade opportunities by international corridor
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
            Real-Time Radar
          </span>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {/* Europe */}
          <div className="rounded-2xl border p-5 bg-muted/30 space-y-3">
            <h3 className="font-bold text-sm flex items-center justify-between">
              <span>🇪🇺 Europe Corridor</span>
              <span className="text-xs font-bold text-primary">82 Deals</span>
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b"><span>🇩🇪 Germany</span><span className="font-bold">34 Opportunities</span></div>
              <div className="flex justify-between py-1 border-b"><span>🇫🇷 France</span><span className="font-bold">27 Opportunities</span></div>
              <div className="flex justify-between py-1"><span>🇬🇧 United Kingdom</span><span className="font-bold">21 Opportunities</span></div>
            </div>
          </div>

          {/* Africa */}
          <div className="rounded-2xl border p-5 bg-muted/30 space-y-3">
            <h3 className="font-bold text-sm flex items-center justify-between">
              <span>🌍 Africa & Mediterranean</span>
              <span className="text-xs font-bold text-[#16C7B7]">50 Deals</span>
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b"><span>🇹🇳 Tunisia (Governorates)</span><span className="font-bold">40 Projects</span></div>
              <div className="flex justify-between py-1 border-b"><span>🇲🇦 Morocco</span><span className="font-bold">19 Opportunities</span></div>
              <div className="flex justify-between py-1"><span>🇰🇪 Kenya / Ivory Coast</span><span className="font-bold">17 Opportunities</span></div>
            </div>
          </div>

          {/* GCC */}
          <div className="rounded-2xl border p-5 bg-muted/30 space-y-3">
            <h3 className="font-bold text-sm flex items-center justify-between">
              <span>🌴 GCC & Middle East</span>
              <span className="text-xs font-bold text-amber-500">59 Deals</span>
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b"><span>🇸🇦 Saudi Arabia</span><span className="font-bold">31 Opportunities</span></div>
              <div className="flex justify-between py-1 border-b"><span>🇦🇪 United Arab Emirates</span><span className="font-bold">28 Opportunities</span></div>
              <div className="flex justify-between py-1"><span>🇶🇦 Qatar & Kuwait</span><span className="font-bold">12 Opportunities</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for expressing interest */}
      {selectedProjectForModal && (
        <InvestorInterestModal
          open={!!selectedProjectForModal}
          onClose={() => setSelectedProjectForModal(null)}
          project={selectedProjectForModal}
          user={user}
        />
      )}
    </div>
  );
}
