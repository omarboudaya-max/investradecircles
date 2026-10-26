import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
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
  Calendar,
  Mail,
  Phone,
  Landmark,
  Edit3,
  Trash2,
  Loader2
} from 'lucide-react';
import MatchingResultsModal from '@/components/investment/MatchingResultsModal';
import InvestorInterestModal from '@/components/investment/InvestorInterestModal';
import InvestorRegisterModal from '@/components/investment/InvestorRegisterModal';

export default function InvestorProfileDetail() {
  const { organizationSlug, id } = useParams();
  const slugOrId = organizationSlug || id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [matchingOpen, setMatchingOpen] = useState(false);
  const [interestOpen, setInterestOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [slugOrId]);

  // Fetch organization
  const { data: organization, isLoading, error, refetch } = useQuery({
    queryKey: ['investmentOrganization', slugOrId],
    queryFn: () => base44.entities.InvestmentOrganization.get(slugOrId)
  });

  // Fetch managed funds/vehicles
  const { data: vehicles = [] } = useQuery({
    queryKey: ['investmentVehicles', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      const allVehicles = await base44.entities.InvestmentVehicle.list();
      return allVehicles.filter((v) => v.organization_id === organization.id);
    },
    enabled: !!organization?.id
  });

  // Fetch all projects for matching modal
  const { data: allProjects = [] } = useQuery({
    queryKey: ['allProjectsForMatch'],
    queryFn: () => base44.entities.InvestmentProject.list()
  });

  const isCreator = Boolean(
    user && (
      organization?.user_id === user.id ||
      (organization?.contact_email && organization.contact_email.toLowerCase() === user.email?.toLowerCase()) ||
      user.role === 'admin'
    )
  );
  const isAdmin = user?.role === 'admin';

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to remove "${organization.display_name}" from the investment platform? This action cannot be undone.`)) return;
    setDeleting(true);
    try {
      await base44.entities.InvestmentOrganization.delete(organization.id);
      toast({
        title: 'Investor Removed',
        description: 'The institution has been removed from the directory.'
      });
      navigate('/investment-network');
    } catch (err) {
      toast({
        title: 'Delete Failed',
        description: err.message || 'Could not delete institution.',
        variant: 'destructive'
      });
    } finally {
      setDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-500 text-sm">Loading investor profile...</p>
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4">
        <Building2 className="w-16 h-16 text-slate-300 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Investor Institution Not Found</h2>
        <p className="text-slate-500 text-sm">The institution profile you requested does not exist or has been updated.</p>
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
            <div className="flex items-center gap-2 text-xs text-slate-500 truncate max-w-md">
              <Link to="/investment-network" className="hover:underline shrink-0">Funds & Investors</Link>
              <span>/</span>
              <span className="font-semibold text-slate-900 dark:text-white truncate">{organization.display_name}</span>
            </div>
          </div>
        </div>

        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              {/* Profile Card Info */}
              <div className="flex items-start gap-6">
                {/* Logo profile photo square */}
                {(() => {
                  const orgPhoto = !logoError
                    ? (organization?.logo_url || organization?.logo || organization?.image_url || organization?.photo_url || organization?.avatar_url)
                    : null;
                  return (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white dark:bg-slate-800 p-2 shadow-xl shrink-0 flex items-center justify-center overflow-hidden border border-slate-200/20">
                      {orgPhoto ? (
                        <img
                          src={orgPhoto}
                          alt={organization.logo_alt_text || organization.display_name}
                          onError={() => setLogoError(true)}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <Building2 className="w-12 h-12 text-slate-400" />
                      )}
                    </div>
                  );
                })()}

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
                      {organization.organization_type?.replace(/_/g, ' ')}
                    </Badge>
                    {(organization.is_illustrative || organization.id === 'org_cdc_gestion' || organization.id === 'org_blackrock' || organization.id === 'org_kkr_infra') ? (
                      <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs font-bold">
                        ⚠️ Exemple illustratif (Démonstration)
                      </Badge>
                    ) : (
                      <>
                        {organization.verification_status === 'VERIFIED' && (
                          <Badge className="bg-emerald-500 text-white text-xs gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> Verified Institution
                          </Badge>
                        )}
                        {organization.official && (
                          <Badge variant="outline" className="border-white/30 text-white text-xs">
                            Official Partner
                          </Badge>
                        )}
                      </>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                    {organization.display_name}
                  </h1>

                  <p className="text-slate-300 text-sm">{organization.legal_name}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-emerald-400" />
                      {organization.city ? `${organization.city}, ` : ''}{organization.country}
                    </span>
                    {organization.year_founded && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-emerald-400" />
                        Est. {organization.year_founded}
                      </span>
                    )}
                    {organization.website && (
                      <a
                        href={organization.website}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-emerald-300 hover:text-emerald-200 underline"
                      >
                        <Globe className="w-4 h-4" /> Website <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto flex-wrap">
                <Button
                  size="lg"
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold gap-2 shadow-lg shadow-emerald-500/20 whitespace-normal text-center h-auto py-3 px-5"
                  onClick={() => setMatchingOpen(true)}
                >
                  <Sparkles className="w-5 h-5 text-slate-950 shrink-0" /> Find Matching Projects
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                  onClick={() => setInterestOpen(true)}
                >
                  Express Interest
                </Button>
                {isCreator && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 gap-2 font-semibold"
                    onClick={() => setEditOpen(true)}
                  >
                    <Edit3 className="w-4 h-4" /> Edit Profile
                  </Button>
                )}
                {isAdmin && (
                  <Button
                    size="lg"
                    variant="destructive"
                    className="bg-rose-600 hover:bg-rose-700 text-white gap-2 font-semibold"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Details Grid */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Profile Overview, Investment Mandate & Managed Vehicles */}
            <div className="lg:col-span-2 space-y-6">
              {/* About Section */}
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                    <Building2 className="w-5 h-5 text-emerald-600" /> Institution Profile & Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                  <p>{organization.description || 'No detailed description provided.'}</p>

                  {organization.verification_source && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span><strong>Verification Source:</strong> {organization.verification_source}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Investment Mandate Card */}
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                    <Briefcase className="w-5 h-5 text-emerald-600" /> Investment Mandate & Criteria
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                      <div className="text-xs font-semibold text-slate-500 uppercase">Typical Ticket Size</div>
                      <div className="text-lg font-bold text-slate-900 dark:text-white">
                        {organization.minimum_ticket
                          ? `${organization.minimum_ticket}M – ${organization.maximum_ticket}M TND`
                          : 'Not disclosed'}
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1">
                      <div className="text-xs font-semibold text-slate-500 uppercase">Preferred Currencies</div>
                      <div className="text-lg font-bold text-slate-900 dark:text-white">
                        {organization.preferred_currencies?.join(', ') || 'TND, EUR, USD'}
                      </div>
                    </div>
                  </div>

                  {/* Sectors */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Target Sectors</h4>
                    <div className="flex flex-wrap gap-2">
                      {organization.investment_focus?.map((secId) => (
                        <Badge key={secId} className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 px-3 py-1">
                          {secId.replace('sec_', '').toUpperCase()}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Geographic Mandate */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Geographic Reach</h4>
                    <div className="flex flex-wrap gap-2">
                      {organization.geographic_focus?.map((geo) => (
                        <Badge key={geo} variant="outline" className="text-slate-700 dark:text-slate-300 px-3 py-1">
                          🌍 {geo}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Investment Stages */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Investment Stages</h4>
                    <div className="flex flex-wrap gap-2">
                      {organization.investment_stages?.map((stg) => (
                        <Badge key={stg} variant="secondary" className="px-3 py-1">
                          {stg.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Managed Investment Vehicles / Funds */}
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center justify-between text-slate-900 dark:text-white">
                    <span className="flex items-center gap-2">
                      <Landmark className="w-5 h-5 text-emerald-600" /> Managed Investment Vehicles & Funds
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {vehicles.length} Active Vehicles
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {vehicles.length > 0 ? (
                    vehicles.map((v) => (
                      <Link
                        key={v.id}
                        to={`/investment-network/fund/${v.id || v.slug}`}
                        className="block border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 bg-slate-50/50 dark:bg-slate-800/30 hover:border-emerald-500 hover:bg-emerald-50/20 dark:hover:bg-slate-800/60 transition-all cursor-pointer group"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                {v.name}
                              </h4>
                              <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <p className="text-xs text-slate-500">
                              {v.vehicle_type || 'Fund'} • Category: {v.fund_category ? v.fund_category.replace(/_/g, ' ') : 'General'}
                            </p>
                          </div>
                          {v.fund_status && (
                            <Badge className="bg-emerald-500 text-white text-xs">
                              {v.fund_status.replace(/_/g, ' ')}
                            </Badge>
                          )}
                        </div>
                        {v.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                            {v.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-4">
                            <span>Target: <strong className="text-slate-700 dark:text-slate-200">{v.target_size ? `${v.target_size}M ${v.currency || 'TND'}` : 'Undisclosed'}</strong></span>
                            <span>Ticket: <strong className="text-slate-700 dark:text-slate-200">{v.minimum_ticket && v.maximum_ticket ? `${v.minimum_ticket}M – ${v.maximum_ticket}M ${v.currency || 'TND'}` : 'Flexible'}</strong></span>
                          </div>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs group-hover:underline flex items-center gap-1">
                            View Fund Profile &rarr;
                          </span>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="text-slate-500 text-sm italic">No individual funds listed yet for this management company.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Col: Quick Actions & Intelligence Box */}
            <div className="space-y-6">
              {/* Match Callout Card */}
              <Card className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-white">
                    <Sparkles className="w-5 h-5 text-emerald-400" /> Investraders Matching Engine
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-xs text-slate-300">
                  <p>
                    Run the automated deterministic matching algorithm to calculate compatibility scores with published projects on the Investment Map.
                  </p>
                  <Button
                    className="w-full h-auto py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm gap-2.5 whitespace-normal leading-snug shadow-md"
                    onClick={() => setMatchingOpen(true)}
                  >
                    <Sparkles className="w-4 h-4 text-slate-950 shrink-0" />
                    <div className="flex flex-col items-center justify-center text-center">
                      <span>Find Compatible Projects</span>
                      <span className="text-[11px] font-semibold text-slate-900/80">
                        ({allProjects.length} Available)
                      </span>
                    </div>
                  </Button>
                </CardContent>
              </Card>

              {/* Institution Quick Meta */}
              <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500">
                    Institution Quick Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Legal Name</span>
                    <span className="font-semibold text-slate-900 dark:text-white text-right">{organization.legal_name}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">HQ Country</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{organization.country}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Institution Type</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{organization.organization_type}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-slate-500">Verification</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{organization.verification_status}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Matching Modal */}
      <MatchingResultsModal
        open={matchingOpen}
        onClose={() => setMatchingOpen(false)}
        mode="investor-to-projects"
        targetEntity={organization}
        allProjects={allProjects}
      />

      {/* Interest Modal */}
      <InvestorInterestModal
        open={interestOpen}
        onClose={() => setInterestOpen(false)}
        project={{ title: `Connection request with ${organization.display_name}` }}
        mode="interest"
      />

      {/* Edit Profile Modal */}
      {editOpen && (
        <InvestorRegisterModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          orgToEdit={organization}
          onSuccess={() => {
            setEditOpen(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}
