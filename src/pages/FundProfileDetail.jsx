import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Landmark,
  Building2,
  Globe,
  MapPin,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  ExternalLink,
  DollarSign,
  Layers,
  Briefcase,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import MatchingResultsModal from '@/components/investment/MatchingResultsModal';

export default function FundProfileDetail() {
  const { fundSlug } = useParams();
  const navigate = useNavigate();
  const [matchingOpen, setMatchingOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [fundSlug]);

  // Fetch fund
  const { data: fund, isLoading, error } = useQuery({
    queryKey: ['investmentVehicleDetail', fundSlug],
    queryFn: () => base44.entities.InvestmentVehicle.get(fundSlug)
  });

  // Fetch parent organization
  const { data: organization } = useQuery({
    queryKey: ['investmentOrganizationParent', fund?.organization_id],
    queryFn: () => base44.entities.InvestmentOrganization.get(fund.organization_id),
    enabled: !!fund?.organization_id
  });

  // Fetch all projects for matching
  const { data: allProjects = [] } = useQuery({
    queryKey: ['allProjectsForFundMatch'],
    queryFn: () => base44.entities.InvestmentProject.list()
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-500 text-sm font-medium">Loading fund vehicle profile...</p>
      </div>
    );
  }

  if (error || !fund) {
    return (
      <div className="container mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto">
          <Landmark className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Investment Fund Not Found</h2>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          The investment fund profile you requested could not be located or has been relocated.
        </p>
        <div className="pt-2">
          <Button onClick={() => navigate('/investment-network')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
            Return to Investment Network
          </Button>
        </div>
      </div>
    );
  }

  const rawPhoto = organization?.logo_url || organization?.logo || organization?.image_url;
  const orgPhoto = !imgError && rawPhoto ? rawPhoto : null;
  const currencyCode = fund.currency || 'TND';

  return (
    <div>
      <div className="bg-slate-50 dark:bg-slate-950 min-h-screen pb-16">
        {/* Navigation back bar */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-3">
          <div className="container mx-auto px-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/investment-network')}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 text-xs gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Investment Network
            </Button>
            <div className="flex items-center gap-2 text-xs text-slate-500 truncate max-w-md">
              <Link to="/investment-network" className="hover:underline shrink-0">Funds & Investors</Link>
              <span>/</span>
              <span className="font-semibold text-slate-900 dark:text-white truncate">{fund.name}</span>
            </div>
          </div>
        </div>

        {/* Hero Header */}
        <div className="bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-900 text-white py-12 border-b border-slate-800">
          <div className="container mx-auto px-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-5">
              {orgPhoto ? (
                <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-800 p-2 shadow-xl shrink-0 flex items-center justify-center overflow-hidden border border-slate-200/20">
                  <img
                    src={orgPhoto}
                    alt={organization?.display_name || fund.name}
                    className="w-full h-full object-contain rounded-xl"
                    onError={() => setImgError(true)}
                  />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 p-2 shadow-xl shrink-0 flex items-center justify-center text-emerald-400">
                  <Landmark className="w-10 h-10" />
                </div>
              )}

              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
                    {fund.vehicle_type || 'Investment Vehicle'}
                  </Badge>
                  {fund.fund_status && (
                    <Badge className="bg-emerald-500 text-white text-xs">
                      {fund.fund_status.replace(/_/g, ' ')}
                    </Badge>
                  )}
                  {fund.fund_category && (
                    <Badge variant="outline" className="text-slate-300 border-slate-700 text-xs">
                      {fund.fund_category.replace(/_/g, ' ')}
                    </Badge>
                  )}
                </div>

                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">{fund.name}</h1>

                {organization && (
                  <p className="text-slate-300 text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    Managed by:{' '}
                    <Link
                      to={`/investment-network/${organization.slug || organization.id}`}
                      className="font-bold text-emerald-300 hover:underline flex items-center gap-1"
                    >
                      {organization.display_name}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </p>
                )}
              </div>
            </div>

            <Button
              size="lg"
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold gap-2 shadow-lg shadow-emerald-500/20 whitespace-normal text-center h-auto py-3 px-5 shrink-0"
              onClick={() => setMatchingOpen(true)}
            >
              <Sparkles className="w-5 h-5 text-slate-950 shrink-0" /> Find Matching Projects
            </Button>
          </div>
        </div>

        {/* Fund Mandate Grid */}
        <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
          {/* Main Specification */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-600" /> Fund Specification & Criteria
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-sm">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {fund.description || 'Dedicated investment vehicle focused on driving high-impact growth and capital allocation.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1 border border-slate-100 dark:border-slate-800">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Target Fund Size</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                    {fund.target_size ? `${fund.target_size}M ${currencyCode}` : 'Undisclosed'}
                  </div>
                  {fund.current_size && (
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      Current: {fund.current_size}M {currencyCode}
                    </div>
                  )}
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1 border border-slate-100 dark:border-slate-800">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Ticket Size Range</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                    {fund.minimum_ticket && fund.maximum_ticket
                      ? `${fund.minimum_ticket}M – ${fund.maximum_ticket}M ${currencyCode}`
                      : fund.minimum_ticket
                      ? `From ${fund.minimum_ticket}M ${currencyCode}`
                      : 'Flexible'}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1 border border-slate-100 dark:border-slate-800">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Fund Category</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                    {fund.fund_category ? fund.fund_category.replace(/_/g, ' ') : 'Venture / Private Equity'}
                  </div>
                </div>
              </div>

              {/* Sectors */}
              {fund.sector_focus && fund.sector_focus.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Sectors</h4>
                  <div className="flex flex-wrap gap-2">
                    {fund.sector_focus.map((secId) => (
                      <Badge key={secId} className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 px-3 py-1">
                        {secId.replace('sec_', '').toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Investment Stages */}
              {fund.investment_stages && fund.investment_stages.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Investment Stages</h4>
                  <div className="flex flex-wrap gap-2">
                    {fund.investment_stages.map((stg) => (
                      <Badge key={stg} variant="secondary" className="px-3 py-1">
                        {stg.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Geographic Scope */}
              {fund.geographic_focus && fund.geographic_focus.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Geographic Mandate</h4>
                  <div className="flex flex-wrap gap-2">
                    {fund.geographic_focus.map((geo) => (
                      <Badge key={geo} variant="outline" className="text-slate-700 dark:text-slate-300 px-3 py-1">
                        🌍 {geo}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Managing Institution Card */}
          {organization && (
            <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-emerald-600" /> Management Institution
                  </span>
                  <Link
                    to={`/investment-network/${organization.slug || organization.id}`}
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    View Full Institution Profile <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{organization.display_name}</h3>
                    {organization.legal_name && (
                      <p className="text-xs text-slate-500">{organization.legal_name}</p>
                    )}
                  </div>
                  {organization.country && (
                    <Badge variant="outline" className="text-xs">
                      {organization.country}
                    </Badge>
                  )}
                </div>

                {organization.description && (
                  <p className="text-slate-600 dark:text-slate-300 line-clamp-3 text-xs leading-relaxed">
                    {organization.description}
                  </p>
                )}

                <div className="pt-2 flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1.5"
                    onClick={() => navigate(`/investment-network/${organization.slug || organization.id}`)}
                  >
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    Visit Institution Overview
                  </Button>
                  {organization.website && (
                    <a
                      href={organization.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs text-slate-500 hover:text-emerald-600 gap-1 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-800"
                    >
                      Official Website <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <MatchingResultsModal
        open={matchingOpen}
        onClose={() => setMatchingOpen(false)}
        mode="investor-to-projects"
        targetEntity={organization || fund}
        allProjects={allProjects}
      />
    </div>
  );
}
