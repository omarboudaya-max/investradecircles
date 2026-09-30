import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, MapPin, ShieldCheck, Star, Building2, Coins, TrendingUp, Clock, Users,
  Globe, Target, Check, Lock, Mail, Phone, Bookmark, BookmarkCheck, Share2, Download,
  Send, FileText, Loader2, Landmark, Plus, Sparkles
} from 'lucide-react';
import InvestorInterestModal from '@/components/investment/InvestorInterestModal';
import MatchingResultsModal from '@/components/investment/MatchingResultsModal';
import ProjectSubmitForm from '@/components/investment/ProjectSubmitForm';
import {
  STAGE_LABELS, TYPE_LABELS, SEEKING_LABELS, DOCUMENT_TYPES, formatMTND, formatNumber, sectorIcon,
} from '@/lib/investment';

function Section({ title, children }) {
  return (
    <div className="rounded-2xl border bg-card p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">{title}</h2>
      {children}
    </div>
  );
}

function ProfileRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [project, setProject] = useState(null);
  const [governorate, setGovernorate] = useState(null);
  const [sector, setSector] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [modal, setModal] = useState(null); // 'interest' | 'info' | null
  const [showSubmit, setShowSubmit] = useState(false);
  const [matchingOpen, setMatchingOpen] = useState(false);
  const [allOrgs, setAllOrgs] = useState([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const p = await base44.entities.InvestmentProject.get(id);
        if (!active) return;
        setProject(p);
        const [gov, sec, orgs] = await Promise.all([
          p.governorate_id ? base44.entities.Governorate.get(p.governorate_id).catch(() => null) : null,
          p.sector_id ? base44.entities.Sector.get(p.sector_id).catch(() => null) : null,
          base44.entities.InvestmentOrganization.list().catch(() => [])
        ]);
        if (!active) return;
        setGovernorate(gov);
        setSector(sec);
        setAllOrgs(orgs);
        base44.entities.ProjectView.create({
          project_id: p.id, governorate_id: p.governorate_id, sector_id: p.sector_id, user_id: user?.id, action: 'VIEW',
        }).catch(() => {});
        if (user?.id) {
          const existing = await base44.entities.SavedInvestment.filter({ user_id: user.id, project_id: p.id });
          if (active) setSaved(existing.length > 0);
        }
      } catch (e) {
        // leave project null → not found state
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id, user?.id]);

  const toggleSave = async () => {
    if (!user?.id || !project) return;
    if (saved) {
      const existing = await base44.entities.SavedInvestment.filter({ user_id: user.id, project_id: project.id });
      await Promise.all(existing.map((r) => base44.entities.SavedInvestment.delete(r.id)));
      setSaved(false);
      toast({ title: 'Removed from saved projects' });
    } else {
      await base44.entities.SavedInvestment.create({
        user_id: user.id, project_id: project.id, project_title: project.title,
        governorate_name: governorate?.name, sector_name: sector?.name, investment_required: project.investment_required,
      });
      setSaved(true);
      toast({ title: 'Saved to your projects' });
    }
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Link copied to clipboard' });
    } catch {
      toast({ title: 'Could not copy link' });
    }
  };

  const downloadBrief = () => {
    if (!project) return;
    const lines = [
      `INVESTRADERS — PROJECT BRIEF`,
      ``,
      project.title,
      `${governorate?.name || ''}, Tunisia`,
      ``,
      `Sector: ${sector?.name || '—'}`,
      `Project type: ${TYPE_LABELS[project.project_type] || project.project_type}`,
      `Stage: ${STAGE_LABELS[project.investment_stage] || project.investment_stage}`,
      `Investment required: ${formatMTND(project.investment_required)}`,
      `Equity required: ${formatMTND(project.equity_required)}`,
      `Debt required: ${formatMTND(project.debt_required)}`,
      `Ticket range: ${formatMTND(project.minimum_ticket)} – ${formatMTND(project.maximum_ticket)}`,
      `Expected ROI: ${project.expected_roi || '—'}%`,
      `Duration: ${project.project_duration || '—'} months`,
      `Jobs created: ${formatNumber(project.jobs_created)}`,
      ``,
      `DESCRIPTION`,
      project.description || '',
      ``,
      `This brief is generated from demonstration data and is not a real investment opportunity.`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.project_code || 'project'}-brief.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-2">Project not found</h1>
        <p className="text-muted-foreground mb-6">This project may have been removed or is not published.</p>
        <Link to="/investment-map"><Button>Back to Investment Map</Button></Link>
      </div>
    );
  }

  const Icon = sectorIcon(sector?.icon);
  const color = sector?.color || '#0891b2';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/investment-map" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Investment Map
      </Link>

      {/* Header */}
      <div className="rounded-2xl border bg-card p-6 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18`, border: `1px solid ${color}33` }}>
            <Icon className="w-7 h-7" style={{ color }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {project.is_verified && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified by Investraders
                </span>
              )}
              {project.featured && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> Featured
                </span>
              )}
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                {STAGE_LABELS[project.investment_stage] || project.investment_stage}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{project.title}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
              <span className="inline-flex items-center gap-1.5"><MapPin className="w-4 h-4" />{governorate?.name || 'Tunisia'}</span>
              {sector && <span className="inline-flex items-center gap-1.5"><Building2 className="w-4 h-4" />{sector.name}</span>}
              <span className="font-mono text-xs">{project.project_code}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          <Section title="Investment Profile">
            <div className="grid sm:grid-cols-2 gap-x-8">
              <div>
                <ProfileRow label="Sector" value={sector?.name || '—'} />
                <ProfileRow label="Location" value={governorate?.name || '—'} />
                <ProfileRow label="Project stage" value={STAGE_LABELS[project.investment_stage] || project.investment_stage} />
                <ProfileRow label="Project type" value={TYPE_LABELS[project.project_type] || project.project_type} />
              </div>
              <div>
                <ProfileRow label="Investment required" value={formatMTND(project.investment_required)} />
                <ProfileRow label="Equity required" value={formatMTND(project.equity_required)} />
                <ProfileRow label="Expected ROI" value={project.expected_roi ? `${project.expected_roi}%` : '—'} />
                <ProfileRow label="Expected completion" value={project.project_duration ? `${project.project_duration} months` : '—'} />
              </div>
            </div>
          </Section>

          <Section title="Project Description">
            <p className="text-sm leading-relaxed text-muted-foreground">{project.description}</p>
          </Section>

          <Section title="Investment Opportunity — Seeking">
            <div className="grid sm:grid-cols-2 gap-2.5">
              {Object.entries(SEEKING_LABELS).map(([k, label]) => {
                const active = (project.seeking || []).includes(k);
                return (
                  <div key={k} className={`flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 ${active ? 'border-primary/30 bg-primary/5' : 'opacity-60'}`}>
                    <span className={`w-4 h-4 rounded flex items-center justify-center ${active ? 'bg-primary text-primary-foreground' : 'border'}`}>
                      {active && <Check className="w-3 h-3" />}
                    </span>
                    <span className="text-sm">{label}</span>
                  </div>
                );
              })}
            </div>
          </Section>

          <div className="grid sm:grid-cols-2 gap-6">
            <Section title="Market Opportunity">
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2"><Target className="w-4 h-4 text-primary mt-0.5" />
                  <div><div className="text-muted-foreground">Target markets</div><div className="font-medium">{(project.target_markets || []).join(', ') || '—'}</div></div>
                </div>
                <div className="flex items-start gap-2"><Globe className="w-4 h-4 text-primary mt-0.5" />
                  <div><div className="text-muted-foreground">Export potential</div><div className="font-medium capitalize">{(project.export_potential || '—').toLowerCase()}</div></div>
                </div>
              </div>
            </Section>
            <Section title="Impact & Infrastructure">
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2"><Users className="w-4 h-4 text-primary" /><span>{formatNumber(project.jobs_created)} jobs created</span></div>
                <div className="flex items-center gap-2"><Landmark className="w-4 h-4 text-primary" /><span>Infrastructure: {project.infrastructure_available ? 'Available' : 'To be developed'}</span></div>
                <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /><span>Land: {project.land_available ? 'Available' : 'To be secured'}</span></div>
              </div>
            </Section>
          </div>

          {project.strategic_value && (
            <Section title="Strategic Value">
              <p className="text-sm leading-relaxed text-muted-foreground">{project.strategic_value}</p>
            </Section>
          )}

          <Section title="Project Promoter">
            <ProfileRow label="Company" value={project.company_name || '—'} />
            <ProfileRow label="Promoter" value={project.promoter_name || '—'} />
            {showContact && (
              <>
                <ProfileRow label="Email" value={project.email || '—'} />
                <ProfileRow label="Phone" value={project.phone || '—'} />
                <ProfileRow label="Website" value={project.website || '—'} />
              </>
            )}
            {!showContact && (
              <button onClick={() => setShowContact(true)} className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                <Mail className="w-4 h-4" /> Reveal contact details
              </button>
            )}
          </Section>

          <Section title="Documents">
            <div className="grid sm:grid-cols-2 gap-2">
              {DOCUMENT_TYPES.map((d) => (
                <div key={d} className="flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm flex-1">{d}</span>
                  <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              ))}
            </div>
            <button onClick={() => setModal('info')} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
              <Send className="w-4 h-4" /> Request documents access
            </button>
          </Section>

          <Section title="Verification">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Verified by Investraders</p>
                <p>Verification confirms that the promoter identity, company information, location and submitted documentation have been reviewed. It does not guarantee project profitability or investment returns.</p>
              </div>
            </div>
          </Section>
        </div>

        {/* Action column */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-2xl border bg-card p-6 space-y-4">
            <div>
              <div className="text-xs text-muted-foreground">Investment required</div>
              <div className="text-3xl font-bold text-primary">{formatMTND(project.investment_required)}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border p-3">
                <Coins className="w-4 h-4 text-primary mb-1" />
                <div className="text-sm font-semibold">{formatMTND(project.equity_required)}</div>
                <div className="text-[11px] text-muted-foreground">Equity</div>
              </div>
              <div className="rounded-xl border p-3">
                <TrendingUp className="w-4 h-4 text-primary mb-1" />
                <div className="text-sm font-semibold">{project.expected_roi ? `${project.expected_roi}%` : '—'}</div>
                <div className="text-[11px] text-muted-foreground">Expected ROI</div>
              </div>
              <div className="rounded-xl border p-3">
                <Clock className="w-4 h-4 text-primary mb-1" />
                <div className="text-sm font-semibold">{project.project_duration ? `${project.project_duration} mo` : '—'}</div>
                <div className="text-[11px] text-muted-foreground">Duration</div>
              </div>
              <div className="rounded-xl border p-3">
                <Coins className="w-4 h-4 text-primary mb-1" />
                <div className="text-sm font-semibold">{formatMTND(project.minimum_ticket)}</div>
                <div className="text-[11px] text-muted-foreground">Min. ticket</div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 py-6 shadow-md"
                onClick={() => setMatchingOpen(true)}
              >
                <Sparkles className="w-4 h-4 text-emerald-300" /> Find Matching Investors
              </Button>
              <Button className="w-full" onClick={() => setModal('interest')}>
                <Send className="w-4 h-4 mr-2" /> Express Investor Interest
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setModal('info')}>
                <FileText className="w-4 h-4 mr-2" /> Request More Information
              </Button>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" onClick={toggleSave} title="Save project">
                  {saved ? <BookmarkCheck className="w-4 h-4 text-primary" /> : <Bookmark className="w-4 h-4" />}
                </Button>
                <Button variant="outline" onClick={share} title="Share project">
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button variant="outline" onClick={downloadBrief} title="Download project brief">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground text-center pt-1">
              Demonstration data — not a real investment opportunity.
            </p>

            {governorate && (
              <div className="pt-4 border-t">
                <p className="text-[11px] text-muted-foreground mb-2">
                  Have a project in {sector?.name || 'this sector'}? Submit it for review.
                </p>
                <Button variant="outline" className="w-full" onClick={() => setShowSubmit(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Submit a New Opportunity
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {matchingOpen && (
        <MatchingResultsModal
          open={matchingOpen}
          onClose={() => setMatchingOpen(false)}
          mode="project-to-investors"
          targetEntity={project}
          allOrganizations={allOrgs}
        />
      )}

      <InvestorInterestModal
        open={modal === 'interest'}
        onClose={() => setModal(null)}
        project={project}
        user={user}
        defaultType="EQUITY"
        mode="interest"
      />
      <InvestorInterestModal
        open={modal === 'info'}
        onClose={() => setModal(null)}
        project={project}
        user={user}
        defaultType="INFORMATION_REQUEST"
        mode="info"
      />

      <ProjectSubmitForm
        open={showSubmit}
        onClose={() => setShowSubmit(false)}
        governorate={governorate}
        sector={sector}
      />
    </div>
  );
}
