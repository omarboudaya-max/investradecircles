import React, { useState } from 'react';
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
  Briefcase
} from 'lucide-react';
import MatchingResultsModal from '@/components/investment/MatchingResultsModal';

export default function FundProfileDetail() {
  const { fundSlug } = useParams();
  const navigate = useNavigate();
  const [matchingOpen, setMatchingOpen] = useState(false);

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
      <div className="container mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-500 text-sm">Loading vehicle profile...</p>
      </div>
    );
  }

  if (error || !fund) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4">
        <Landmark className="w-16 h-16 text-slate-300 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Investment Vehicle Not Found</h2>
        <p className="text-slate-500 text-sm">The fund profile you requested does not exist or has been updated.</p>
        <Button onClick={() => navigate('/investment-network')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          Return to Investment Network
        </Button>
      </div>
    );
  }

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
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Link to="/investment-network" className="hover:underline">Funds & Investors</Link>
              <span>/</span>
              <span className="font-semibold text-slate-900 dark:text-white">{fund.name}</span>
            </div>
          </div>
        </div>

        {/* Hero Header */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white py-12">
          <div className="container mx-auto px-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
                  {fund.vehicle_type}
                </Badge>
                <Badge className="bg-emerald-500 text-white text-xs">{fund.fund_status}</Badge>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">{fund.name}</h1>

              {organization && (
                <p className="text-slate-300 text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  Managed by:{' '}
                  <Link
                    to={`/investment-network/${organization.slug || organization.id}`}
                    className="font-bold text-emerald-300 hover:underline"
                  >
                    {organization.display_name}
                  </Link>
                </p>
              )}
            </div>

            <Button
              size="lg"
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold gap-2 shadow-lg shadow-emerald-500/20"
              onClick={() => setMatchingOpen(true)}
            >
              <Sparkles className="w-5 h-5 text-slate-950" /> Find Matching Projects
            </Button>
          </div>
        </div>

        {/* Fund Mandate Grid */}
        <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
          <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Fund Specification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-sm">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{fund.description}</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Target Fund Size</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                    {fund.target_size}M {fund.currency}
                  </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Ticket Size Range</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                    {fund.minimum_ticket}M – {fund.maximum_ticket}M {fund.currency}
                  </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                  <div className="text-xs font-semibold text-slate-500 uppercase">Fund Category</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">{fund.fund_category}</div>
                </div>
              </div>
            </CardContent>
          </Card>
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
