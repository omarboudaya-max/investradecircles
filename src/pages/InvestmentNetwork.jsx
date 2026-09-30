import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Search,
  Building2,
  Globe2,
  Landmark,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Filter,
  CheckCircle2,
  DollarSign,
  Briefcase,
  Layers,
  MapPin,
  Star,
  Users,
  PlusCircle,
  FolderKanban
} from 'lucide-react';
import { INVESTOR_TYPES, FUND_CATEGORIES } from '@/lib/investmentNetwork';
import MatchingResultsModal from '@/components/investment/MatchingResultsModal';
import InvestorRegisterModal from '@/components/investment/InvestorRegisterModal';

export default function InvestmentNetwork() {
  const navigate = useNavigate();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedCountry, setSelectedCountry] = useState('ALL');
  const [selectedSector, setSelectedSector] = useState('ALL');
  const [selectedStage, setSelectedStage] = useState('ALL');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Modals state
  const [matchingModalOrg, setMatchingModalOrg] = useState(null);
  const [registerOpen, setRegisterOpen] = useState(false);

  // Fetch Organizations
  const { data: organizations = [], isLoading: loadingOrgs, refetch: refetchOrgs } = useQuery({
    queryKey: ['investmentOrganizationsList'],
    queryFn: () => base44.entities.InvestmentOrganization.list()
  });

  // Fetch Vehicles
  const { data: vehicles = [] } = useQuery({
    queryKey: ['investmentVehiclesList'],
    queryFn: () => base44.entities.InvestmentVehicle.list()
  });

  // Fetch Projects for statistics & matching
  const { data: projects = [] } = useQuery({
    queryKey: ['investmentProjectsForNetwork'],
    queryFn: () => base44.entities.InvestmentProject.list()
  });

  // Dynamic Statistics Computation
  const totalOrgs = organizations.length;
  const totalFunds = vehicles.length;
  const totalCountries = useMemo(() => {
    const set = new Set(organizations.map((o) => o.country).filter(Boolean));
    return set.size || 1;
  }, [organizations]);
  const totalCategories = INVESTOR_TYPES.length;
  const publishedProjects = projects.length;
  const potentialMatchesEstimate = totalOrgs * publishedProjects;

  // Filter logic
  const filteredOrganizations = useMemo(() => {
    return organizations.filter((org) => {
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName =
          org.display_name?.toLowerCase().includes(query) ||
          org.legal_name?.toLowerCase().includes(query) ||
          org.country?.toLowerCase().includes(query) ||
          org.city?.toLowerCase().includes(query) ||
          org.description?.toLowerCase().includes(query);
        if (!matchesName) return false;
      }

      // Investor Type
      if (selectedType !== 'ALL' && org.organization_type !== selectedType) {
        return false;
      }

      // Country
      if (selectedCountry !== 'ALL' && org.country !== selectedCountry) {
        return false;
      }

      // Sector
      if (selectedSector !== 'ALL' && !org.investment_focus?.includes(selectedSector)) {
        return false;
      }

      // Stage
      if (selectedStage !== 'ALL' && !org.investment_stages?.includes(selectedStage)) {
        return false;
      }

      // Verified Badge filter
      if (verifiedOnly && org.verification_status !== 'VERIFIED' && !org.official) {
        return false;
      }

      return true;
    });
  }, [organizations, searchTerm, selectedType, selectedCountry, selectedSector, selectedStage, verifiedOnly]);

  // Featured items
  const featuredOrgs = useMemo(() => {
    return filteredOrganizations.filter((o) => o.featured || o.official).slice(0, 3);
  }, [filteredOrganizations]);

  return (
    <div>
      <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pb-16">
        {/* HERO SECTION */}
        <section className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white relative overflow-hidden border-b border-slate-800">
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
            <Landmark className="w-96 h-96 text-emerald-400" />
          </div>

          <div className="container mx-auto px-4 py-14 sm:py-20 relative z-10 space-y-8">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                <Sparkles className="w-4 h-4 text-emerald-400" /> Investment Ecosystem — Capital & Funds Directory
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Investment Network
              </h1>

              <h2 className="text-xl sm:text-2xl font-semibold text-emerald-400">
                Connect Capital With Opportunity
              </h2>

              <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl">
                Explore investment funds, asset managers, family offices, sovereign wealth funds, and institutional capital partners — and discover the projects that match their investment mandates.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Button
                  size="lg"
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold gap-2 shadow-lg shadow-emerald-500/25"
                  onClick={() => setRegisterOpen(true)}
                >
                  <PlusCircle className="w-5 h-5 text-slate-950" /> Represent an Investment Institution / Fund
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 gap-2"
                  onClick={() => navigate('/investment-map')}
                >
                  <FolderKanban className="w-5 h-5" /> Explore Investment Map Projects
                </Button>
              </div>
            </div>

            {/* DYNAMIC STATISTICS BAR (Database Generated) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 pt-6 border-t border-slate-800">
              <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{totalOrgs}+</div>
                <div className="text-xs text-slate-300 font-medium">Investment Institutions</div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{totalCountries}+</div>
                <div className="text-xs text-slate-300 font-medium">Target Countries</div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{totalCategories}</div>
                <div className="text-xs text-slate-300 font-medium">Investor Categories</div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{publishedProjects}</div>
                <div className="text-xs text-slate-300 font-medium">Projects Available</div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 col-span-2 sm:col-span-1">
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{potentialMatchesEstimate}+</div>
                <div className="text-xs text-slate-300 font-medium">Potential Matches</div>
              </div>
            </div>
          </div>
        </section>

        {/* SEARCH & MULTI-FILTER BAR */}
        <section className="container mx-auto px-4 -mt-6 relative z-20">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              <Input
                type="text"
                placeholder="🔍 Search funds, investors, companies, sectors or countries..."
                className="pl-12 pr-4 py-6 rounded-xl border-slate-200 dark:border-slate-800 text-base focus-visible:ring-emerald-500 bg-slate-50 dark:bg-slate-950"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filter Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2">
              {/* Type Filter */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Investor Type</label>
                <select
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <option value="ALL">All Investor Types</option>
                  {INVESTOR_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Country Filter */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Country</label>
                <select
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500"
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                >
                  <option value="ALL">All Countries</option>
                  <option value="Tunisia">🇹🇳 Tunisia</option>
                  <option value="France">🇫🇷 France</option>
                  <option value="United States">🇺🇸 United States</option>
                  <option value="Germany">🇩🇪 Germany</option>
                  <option value="United Arab Emirates">🇦🇪 UAE</option>
                  <option value="Saudi Arabia">🇸🇦 Saudi Arabia</option>
                </select>
              </div>

              {/* Sector Filter */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Sector Focus</label>
                <select
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500"
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                >
                  <option value="ALL">All Sectors</option>
                  <option value="sec_tech">Technology & AI</option>
                  <option value="sec_agri">Agri-Food & Smart Farming</option>
                  <option value="sec_energy">Renewable Energy</option>
                  <option value="sec_industry">Manufacturing & Automotive</option>
                  <option value="sec_pharma">Pharma & Biotech</option>
                </select>
              </div>

              {/* Stage Filter */}
              <div>
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Stage Focus</label>
                <select
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500"
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                >
                  <option value="ALL">All Stages</option>
                  <option value="EARLY_STAGE">Early Stage / Seed</option>
                  <option value="GROWTH">Growth & Expansion</option>
                  <option value="GREENFIELD">Greenfield & Infrastructure</option>
                </select>
              </div>

              {/* Verified Toggle */}
              <div className="flex items-end pb-1">
                <Button
                  variant={verifiedOnly ? 'default' : 'outline'}
                  size="sm"
                  className={`w-full text-xs gap-1.5 py-5 ${
                    verifiedOnly ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'text-slate-700 dark:text-slate-300'
                  }`}
                  onClick={() => setVerifiedOnly(!verifiedOnly)}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  {verifiedOnly ? 'Showing Verified Only' : 'Filter Verified'}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* EXPLORE BY CATEGORY */}
        <section className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" /> Explore Capital Categories
            </h3>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <Button
              variant={selectedType === 'ALL' ? 'default' : 'outline'}
              size="sm"
              className={`rounded-full text-xs shrink-0 ${selectedType === 'ALL' ? 'bg-slate-900 text-white' : ''}`}
              onClick={() => setSelectedType('ALL')}
            >
              All Capital Partners ({organizations.length})
            </Button>
            {INVESTOR_TYPES.map((cat) => {
              const count = organizations.filter((o) => o.organization_type === cat.id).length;
              return (
                <Button
                  key={cat.id}
                  variant={selectedType === cat.id ? 'default' : 'outline'}
                  size="sm"
                  className={`rounded-full text-xs shrink-0 ${
                    selectedType === cat.id ? 'bg-emerald-600 text-white' : 'text-slate-700 dark:text-slate-300'
                  }`}
                  onClick={() => setSelectedType(selectedType === cat.id ? 'ALL' : cat.id)}
                >
                  {cat.label} ({count})
                </Button>
              );
            })}
          </div>
        </section>

        {/* MAIN INVESTOR CARDS GRID */}
        <section className="container mx-auto px-4 py-4 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Investment Institutions & Capital Partners
              </h3>
              <p className="text-xs text-slate-500">
                Displaying {filteredOrganizations.length} verified capital mandates
              </p>
            </div>
          </div>

          {loadingOrgs ? (
            <div className="py-16 text-center">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-slate-500 text-xs mt-3">Loading capital network dataset...</p>
            </div>
          ) : filteredOrganizations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOrganizations.map((org) => {
                const typeObj = INVESTOR_TYPES.find((t) => t.id === org.organization_type);

                return (
                  <Card
                    key={org.id}
                    className="group border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-500/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden"
                  >
                    <CardContent className="p-6 space-y-5">
                      {/* Logo Profile Photo Area & Badges */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="w-16 h-16 rounded-2xl border border-slate-200 dark:border-slate-800 p-1.5 bg-slate-50 dark:bg-slate-800 shrink-0 flex items-center justify-center overflow-hidden shadow-sm">
                          {org.logo ? (
                            <img
                              src={org.logo}
                              alt={org.display_name}
                              className="w-full h-full object-cover rounded-xl"
                            />
                          ) : (
                            <Building2 className="w-8 h-8 text-slate-400" />
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-1.5">
                          <Badge variant="outline" className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300">
                            {typeObj?.badge || org.organization_type}
                          </Badge>
                          {org.verification_status === 'VERIFIED' && (
                            <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 text-[10px] gap-1">
                              🟢 Verified
                            </Badge>
                          )}
                          {org.official && (
                            <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200 text-[10px]">
                              🔵 Official
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Header info */}
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-lg group-hover:text-emerald-600 transition-colors">
                          {org.display_name}
                        </h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                          {org.city ? `${org.city}, ` : ''}{org.country}
                        </p>
                      </div>

                      {/* Description snippet */}
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {org.description}
                      </p>

                      {/* Key Mandate Badges */}
                      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                        <div className="flex items-center justify-between text-slate-500">
                          <span>Target Ticket:</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {org.minimum_ticket ? `${org.minimum_ticket}M – ${org.maximum_ticket}M TND` : 'Custom Check'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500">
                          <span>Stages:</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {org.investment_stages?.slice(0, 2).join(', ').replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Target Sectors Chips */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {org.investment_focus?.map((sId) => (
                          <Badge key={sId} variant="secondary" className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {sId.replace('sec_', '').toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>

                    {/* Card Footer Actions */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs text-slate-700 dark:text-slate-300"
                        onClick={() => navigate(`/investment-network/${org.slug || org.id}`)}
                      >
                        View Profile
                      </Button>
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1"
                        onClick={() => setMatchingModalOrg(org)}
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Find Matches
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-lg font-bold text-slate-800 dark:text-white">No Matching Institutions Found</h4>
              <p className="text-slate-500 text-xs max-w-md mx-auto">
                No investment institutions match your selected filters. Try broadening your sector or geographic search.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedType('ALL');
                  setSelectedCountry('ALL');
                  setSelectedSector('ALL');
                  setSelectedStage('ALL');
                  setVerifiedOnly(false);
                }}
              >
                Reset All Filters
              </Button>
            </div>
          )}
        </section>

        {/* BOTTOM CALL TO ACTION BANNER */}
        <section className="container mx-auto px-4 pt-8">
          <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
            <div className="space-y-3 max-w-xl text-center md:text-left">
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
                Capital Partner Onboarding
              </Badge>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                Are you an Investor or Asset Manager?
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Join the Investraders Investment Network to publish your investment mandate, gain visibility among top Tunisian & Mediterranean promoters, and receive automated dealflow matches.
              </p>
            </div>

            <Button
              size="lg"
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold gap-2 px-8 py-6 text-base shrink-0 shadow-xl"
              onClick={() => setRegisterOpen(true)}
            >
              <PlusCircle className="w-5 h-5 text-slate-950" /> Register Your Institution / Fund
            </Button>
          </div>
        </section>
      </div>

      {/* Two-Way Matching Modal for selected Organization */}
      {matchingModalOrg && (
        <MatchingResultsModal
          open={!!matchingModalOrg}
          onClose={() => setMatchingModalOrg(null)}
          mode="investor-to-projects"
          targetEntity={matchingModalOrg}
          allProjects={projects}
        />
      )}

      {/* Investor Registration Modal */}
      <InvestorRegisterModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSuccess={() => refetchOrgs()}
      />
    </div>
  );
}
