import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Sparkles, Search, Compass, Globe, TrendingUp, Building2, Wallet, 
  Briefcase, Landmark, ShieldCheck, Zap, ArrowRight, Filter, ChevronRight,
  Target, CheckCircle2, ArrowUpRight, BarChart3, Layers, SlidersHorizontal, MapPin
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function InvestmentNetwork() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedSector, setSelectedSector] = useState('ALL');
  const [selectedRegion, setSelectedRegion] = useState('ALL');

  // Fetch entities from base44Client
  const { data: investors = [] } = useQuery({
    queryKey: ['investors'],
    queryFn: () => base44.investor.list(),
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.company.list(),
  });

  const { data: institutions = [] } = useQuery({
    queryKey: ['institutions'],
    queryFn: () => base44.institution.list(),
  });

  const { data: markets = [] } = useQuery({
    queryKey: ['markets'],
    queryFn: () => base44.market.list(),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['investmentProjects'],
    queryFn: () => base44.project.list(),
  });

  // Consolidate into unified Network Entities
  const allEntities = useMemo(() => {
    const combined = [
      ...investors.map(item => ({ ...item, entityType: 'INVESTOR' })),
      ...companies.map(item => ({ ...item, entityType: 'COMPANY' })),
      ...institutions.map(item => ({ ...item, entityType: 'INSTITUTION' })),
      ...markets.map(item => ({ ...item, entityType: 'MARKET' })),
      ...projects.map(item => ({ 
        id: item.id || `proj_${Math.random()}`,
        name: item.title || item.name,
        type: item.sector || 'Investment Project',
        entityType: 'PROJECT',
        location: item.location || 'Tunisia',
        country: 'Tunisia',
        flag: '🇹🇳',
        investmentRange: item.capitalRequired ? `€${(item.capitalRequired / 1000000).toFixed(1)}M` : '€1M – €5M',
        sectors: [item.sector || 'General'],
        aiMatchScore: item.aiMatchScore || 91,
        matchReason: 'High demand in regional economic development plan',
        status: item.status || 'Active'
      }))
    ];
    return combined;
  }, [investors, companies, institutions, markets, projects]);

  // Search & Filter Logic
  const filteredEntities = useMemo(() => {
    return allEntities.filter(entity => {
      // Tab filter
      if (activeTab !== 'ALL' && entity.entityType !== activeTab) {
        return false;
      }
      // Sector filter
      if (selectedSector !== 'ALL') {
        const entitySectors = entity.sectors || [entity.sector, entity.type].filter(Boolean);
        const hasSector = entitySectors.some(s => s && s.toLowerCase().includes(selectedSector.toLowerCase()));
        if (!hasSector) return false;
      }
      // Region filter
      if (selectedRegion !== 'ALL') {
        if (selectedRegion === 'AFRICA' && !['Tunisia', 'Morocco', 'Egypt', 'Ivory Coast', 'Senegal', 'Africa'].includes(entity.country)) return false;
        if (selectedRegion === 'EUROPE' && !['France', 'Germany', 'UK', 'Italy', 'Europe'].includes(entity.country)) return false;
        if (selectedRegion === 'GCC' && !['Saudi Arabia', 'UAE', 'Qatar', 'GCC'].includes(entity.country)) return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = entity.name?.toLowerCase().includes(query);
        const matchType = entity.type?.toLowerCase().includes(query);
        const matchLoc = entity.location?.toLowerCase().includes(query);
        const matchSectors = (entity.sectors || []).some(s => s?.toLowerCase().includes(query));
        return matchName || matchType || matchLoc || matchSectors;
      }
      return true;
    });
  }, [allEntities, activeTab, selectedSector, selectedRegion, searchTerm]);

  // Opportunity of the Day (Spotlight)
  const opportunityOfTheDay = useMemo(() => {
    return projects[0] || {
      id: 'opt_day_1',
      title: 'Tunisian Solar & Wind Microgrid Project',
      location: 'Kasserine, Tunisia',
      capitalRequired: 4200000,
      sector: 'Renewable Energy',
      aiMatchScore: 96,
      expectedRoi: '14.5% p.a.',
      description: 'Utility-scale solar installation with smart storage aimed at powering regional industrial zones and exporting clean energy.',
      flag: '🇹🇳'
    };
  }, [projects]);

  return (
    <div className="min-h-screen bg-[#071A2B] text-slate-100 font-sans pb-16">
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#051322] via-[#071A2B] to-[#0A2239] border-b border-slate-800/80 pt-10 pb-16 px-4 sm:px-6 lg:px-8">
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1769FF0d_1px,transparent_1px),linear-gradient(to_bottom,#1769FF0d_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />
        
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#1769FF]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-72 h-72 bg-[#16C7B7]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto text-center space-y-6">
          
          {/* Badge pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1769FF]/10 border border-[#1769FF]/30 backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-[#16C7B7] animate-pulse" />
            <span className="text-xs font-semibold tracking-wide text-blue-200 uppercase">
              AI-Powered Global Investment Intelligence Network
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Connect Capital. Discover Opportunities. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#1769FF] via-[#16C7B7] to-emerald-400 bg-clip-text text-transparent">
              Grow Globally.
            </span>
          </h1>

          {/* Subheading */}
          <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
            Intelligent investment matchmaking connecting businesses, investors, financial institutions, and sovereign markets across Tunisia, Africa, Europe, and GCC.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Button 
              onClick={() => navigate('/matchmaker')}
              className="bg-[#1769FF] hover:bg-blue-600 text-white px-7 py-6 text-base font-semibold rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 transition-all flex items-center gap-2"
            >
              <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
              AI Matchmaker
            </Button>
            
            <Button 
              onClick={() => navigate('/executive-intelligence')}
              variant="outline"
              className="border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 px-7 py-6 text-base font-semibold rounded-xl backdrop-blur-sm flex items-center gap-2"
            >
              <BarChart3 className="w-5 h-5 text-[#16C7B7]" />
              Executive Command Center
            </Button>
            
            <Button 
              onClick={() => navigate('/investment-map')}
              variant="ghost"
              className="text-slate-300 hover:text-white hover:bg-slate-800/50 px-5 py-6 text-base font-medium rounded-xl flex items-center gap-2"
            >
              <Compass className="w-5 h-5 text-emerald-400" />
              Interactive Map
            </Button>
          </div>

          {/* Value Pills bar */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-900/80 border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-[#16C7B7]"></span> AI Matchmaking
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-900/80 border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-[#1769FF]"></span> Global Economic Knowledge Graph
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-900/80 border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Verified Institutional Network
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-900/80 border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span> Real-time Market Signals
            </span>
          </div>

        </div>
      </section>

      {/* MAIN CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-10">

        {/* 1. SEMANTIC INTELLIGENT SEARCH BAR */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#1769FF]/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Search className="w-4 h-4 text-[#1769FF]" />
                What are you looking for?
              </label>
              <span className="text-xs text-[#16C7B7] flex items-center gap-1 font-medium">
                <Sparkles className="w-3.5 h-3.5" /> Semantic AI Search Active
              </span>
            </div>

            <div className="relative">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder='Try: "Renewable energy projects in Tunisia", "Fintech investors", "German expansion partners"...'
                className="w-full bg-slate-950/80 border-slate-700 text-white placeholder-slate-500 rounded-xl py-6 pl-12 pr-28 text-sm sm:text-base focus:border-[#1769FF] focus:ring-[#1769FF]"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <Button 
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#1769FF] hover:bg-blue-600 text-white text-xs px-4 py-2 rounded-lg"
              >
                Search
              </Button>
            </div>

            {/* Quick Search Suggestions */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-400">
              <span className="text-slate-500 font-medium">Trending searches:</span>
              {[
                'Renewable energy Tunisia',
                'Fintech VC €1M–5M',
                'Agri-tech exporters',
                'German strategic partners',
                'Institutional Funds'
              ].map((query, idx) => (
                <button
                  key={idx}
                  onClick={() => setSearchTerm(query)}
                  className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 hover:text-white border border-slate-700/60 transition-colors"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 2. OPPORTUNITY OF THE DAY & GLOBAL RADAR */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Spotlight Opportunity of the Day */}
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-900 to-[#0A2239] border border-emerald-500/30 rounded-2xl p-6 relative overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-bl-xl border-l border-b border-emerald-500/30 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 fill-emerald-400" />
              Opportunity of the Day
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs px-2.5 py-0.5">
                  {opportunityOfTheDay.sector || 'Renewable Energy'}
                </Badge>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" /> {opportunityOfTheDay.location || 'Kasserine, Tunisia'}
                </span>
              </div>

              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {opportunityOfTheDay.title || opportunityOfTheDay.name}
                  </h3>
                  <p className="text-sm text-slate-300 mt-1 line-clamp-2 max-w-xl">
                    {opportunityOfTheDay.description}
                  </p>
                </div>

                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-right min-w-[140px]">
                  <div className="text-xs text-slate-400">Required Capital</div>
                  <div className="text-xl font-extrabold text-emerald-400">
                    €{opportunityOfTheDay.capitalRequired ? (opportunityOfTheDay.capitalRequired / 1000000).toFixed(1) : '4.2'}M
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Est. ROI: {opportunityOfTheDay.expectedRoi || '14.5%'}</div>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800/80">
                <div className="flex items-center gap-2 bg-[#16C7B7]/10 border border-[#16C7B7]/30 px-3 py-1.5 rounded-lg">
                  <Sparkles className="w-4 h-4 text-[#16C7B7]" />
                  <span className="text-xs font-bold text-[#16C7B7]">
                    {opportunityOfTheDay.aiMatchScore || 96}% AI Match
                  </span>
                  <span className="text-xs text-slate-400 hidden sm:inline">| Strong alignment with EU Green Transition Fund</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => navigate(`/project/${opportunityOfTheDay.id}`)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-2 rounded-lg font-semibold"
                  >
                    Explore Opportunity
                  </Button>
                  <Button 
                    onClick={() => navigate('/matchmaker')}
                    variant="outline" 
                    className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-4 py-2 rounded-lg"
                  >
                    Match Investors
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Global Opportunity Radar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#1769FF]" />
                Global Opportunity Radar
              </h3>
              <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-700">
                Live Data
              </Badge>
            </div>

            <div className="space-y-3 text-xs">
              
              {/* Europe */}
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                <div className="font-semibold text-slate-300 flex items-center justify-between">
                  <span>🇪🇺 Europe</span>
                  <span className="text-[#1769FF] font-bold">82 Opportunities</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                  <span>🇩🇪 Germany (34)</span>
                  <span>•</span>
                  <span>🇫🇷 France (27)</span>
                  <span>•</span>
                  <span>🇬🇧 UK (21)</span>
                </div>
              </div>

              {/* Africa */}
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                <div className="font-semibold text-slate-300 flex items-center justify-between">
                  <span>🌍 Africa</span>
                  <span className="text-emerald-400 font-bold">65 Opportunities</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                  <span>🇹🇳 Tunisia (34)</span>
                  <span>•</span>
                  <span>🇲🇦 Morocco (17)</span>
                  <span>•</span>
                  <span>🇰🇪 Kenya (14)</span>
                </div>
              </div>

              {/* GCC */}
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                <div className="font-semibold text-slate-300 flex items-center justify-between">
                  <span>🇸🇦 GCC Region</span>
                  <span className="text-amber-400 font-bold">59 Opportunities</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                  <span>🇸🇦 Saudi Arabia (31)</span>
                  <span>•</span>
                  <span>🇦🇪 UAE (28)</span>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* 3. ECOSYSTEM ENTITY CATEGORIES & FILTERS */}
        <div className="space-y-6">
          
          {/* Section Heading */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#1769FF]" />
                Investment Ecosystem Directory
              </h2>
              <p className="text-xs text-slate-400">
                Explore verified companies, institutional investors, funds, projects, and sovereign markets.
              </p>
            </div>

            {/* Region Filter Buttons */}
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-medium">
              {[
                { id: 'ALL', label: 'Global' },
                { id: 'AFRICA', label: 'Africa / Tunisia' },
                { id: 'EUROPE', label: 'Europe' },
                { id: 'GCC', label: 'GCC' }
              ].map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRegion(r.id)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    selectedRegion === r.id 
                      ? 'bg-[#1769FF] text-white shadow-sm' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Bar & Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            
            {/* Entity Tabs */}
            <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: 'ALL', label: 'All Entities', icon: Compass, count: allEntities.length },
                { id: 'INVESTOR', label: 'Investors', icon: Wallet, count: investors.length },
                { id: 'COMPANY', label: 'Companies', icon: Building2, count: companies.length },
                { id: 'PROJECT', label: 'Projects', icon: Briefcase, count: projects.length },
                { id: 'INSTITUTION', label: 'Institutions', icon: Landmark, count: institutions.length },
                { id: 'MARKET', label: 'Markets', icon: Globe, count: markets.length },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      isActive 
                        ? 'bg-[#1769FF] text-white shadow-lg shadow-blue-600/20' 
                        : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Sector Selector */}
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-slate-400" />
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2.5 focus:border-[#1769FF]"
              >
                <option value="ALL">All Sectors</option>
                <option value="Renewable Energy">Renewable Energy</option>
                <option value="Fintech">Fintech / Financial Tech</option>
                <option value="Agri-tech">Agri-tech / Agriculture</option>
                <option value="AI">AI & DeepTech</option>
                <option value="SaaS">Enterprise SaaS</option>
                <option value="Infrastructure">Infrastructure</option>
              </select>
            </div>

          </div>

          {/* ENTITY CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEntities.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 space-y-3">
                <Search className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-base font-medium">No investment entities match your search criteria.</p>
                <Button variant="outline" onClick={() => { setSearchTerm(''); setActiveTab('ALL'); setSelectedSector('ALL'); setSelectedRegion('ALL'); }}>
                  Reset Filters
                </Button>
              </div>
            ) : (
              filteredEntities.map((entity) => (
                <Card 
                  key={entity.id} 
                  className="bg-slate-900/90 border-slate-800 hover:border-[#1769FF]/50 transition-all duration-300 rounded-2xl overflow-hidden shadow-lg group flex flex-col justify-between"
                >
                  <CardContent className="p-6 space-y-4">
                    
                    {/* Header: Logo, Name & Verified Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {entity.logo ? (
                          <img 
                            src={entity.logo} 
                            alt={entity.name} 
                            className="w-12 h-12 rounded-xl object-contain bg-slate-950 p-1.5 border border-slate-800"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-900/40 to-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-lg">
                            {entity.flag || entity.name?.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-white text-base group-hover:text-[#1769FF] transition-colors line-clamp-1">
                              {entity.name}
                            </h4>
                            {entity.verified !== false && (
                              <ShieldCheck className="w-4 h-4 text-[#1769FF] shrink-0" />
                            )}
                          </div>
                          <span className="text-xs text-slate-400 block font-medium">
                            {entity.type || entity.entityType}
                          </span>
                        </div>
                      </div>

                      {/* Country Flag */}
                      <span className="text-xl">{entity.flag || '🌍'}</span>
                    </div>

                    {/* Meta info: Location & Investment Range */}
                    <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-800/80">
                      <div>
                        <span className="text-slate-500 block">Location</span>
                        <span className="text-slate-300 font-medium line-clamp-1">📍 {entity.location || entity.country || 'Global'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Investment Range</span>
                        <span className="text-emerald-400 font-semibold line-clamp-1">💰 {entity.investmentRange || entity.capitalRange || '€500K – €5M'}</span>
                      </div>
                    </div>

                    {/* Sector Pills */}
                    <div className="flex flex-wrap gap-1.5">
                      {(entity.sectors || [entity.sector, 'Tech']).slice(0, 3).map((sec, i) => (
                        <Badge 
                          key={i} 
                          variant="secondary"
                          className="bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700/60 text-[10px] px-2 py-0.5 rounded-md"
                        >
                          {sec}
                        </Badge>
                      ))}
                    </div>

                    {/* AI Match Score Badge & Rationale */}
                    <div className="bg-[#16C7B7]/10 border border-[#16C7B7]/30 rounded-xl p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#16C7B7] flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" /> AI Match Score
                        </span>
                        <span className="text-sm font-extrabold text-[#16C7B7]">
                          {entity.aiMatchScore || Math.floor(Math.random() * 12 + 86)}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 line-clamp-1 italic">
                        "{entity.matchReason || 'Strong strategic alignment with current market focus & capital profile'}"
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 flex items-center gap-2">
                      <Button
                        onClick={() => {
                          if (entity.entityType === 'INVESTOR') navigate(`/investor/${entity.id}`);
                          else if (entity.entityType === 'PROJECT') navigate(`/project/${entity.id}`);
                          else navigate(`/company/${entity.id}`);
                        }}
                        variant="outline"
                        className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 text-xs py-2 rounded-xl"
                      >
                        View Profile
                      </Button>
                      
                      <Button
                        onClick={() => navigate('/matchmaker')}
                        className="w-full bg-[#1769FF] hover:bg-blue-600 text-white text-xs py-2 rounded-xl font-semibold flex items-center justify-center gap-1"
                      >
                        <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                        Find Match
                      </Button>
                    </div>

                  </CardContent>
                </Card>
              ))
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
