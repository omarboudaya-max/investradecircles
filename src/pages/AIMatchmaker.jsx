import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Building2, Check, Globe, Landmark, Loader2, Rocket, Save, Sparkles, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/AuthContext';
import { useIntelligence } from '@/hooks/useIntelligence';
import { OBJECTIVES, REGION_OPTIONS as REGIONS, TICKET_BANDS, findMatches, suggestCriteriaForUser } from '@/lib/intelligence/matching';
import { SECTORS, SECTOR_BY_ID } from '@/lib/intelligence/signals';
import { saveMatchProfile } from '@/api/platform';
import MatchList, { KIND_META } from '@/components/matching/MatchList';

const ROLES = [
  { id: 'STARTUP', label: 'Startup / innovator', icon: Rocket },
  { id: 'COMPANY', label: 'Company / SME', icon: Building2 },
  { id: 'PROJECT_OWNER', label: 'Project promoter', icon: Target },
  { id: 'INVESTOR', label: 'Investor / fund', icon: Landmark },
  { id: 'INSTITUTION', label: 'Institution / chamber', icon: Globe },
];

const STAGES = [
  { id: '', label: 'Any stage' },
  { id: 'SEED', label: 'Seed' },
  { id: 'EARLY_STAGE', label: 'Early stage' },
  { id: 'GROWTH', label: 'Growth' },
  { id: 'EXPANSION', label: 'Expansion' },
  { id: 'GREENFIELD', label: 'Greenfield' },
  { id: 'R_AND_D', label: 'R&D / innovation' },
];

const GROUPS = [
  { id: 'all', label: 'All' },
  { id: 'investors', label: 'Investors & funds' },
  { id: 'projects', label: 'Projects' },
  { id: 'members', label: 'Members' },
  { id: 'posts', label: 'Posts' },
];

const STORAGE_KEY = 'investraders_matchmaker_criteria';
const DEFAULTS = { role: 'STARTUP', objective: 'INVESTMENT', sectors: [], region: 'Global', ticket: 'any', stage: '' };

function loadStored() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
}

/** Criteria passed in the URL (for example from a post's "Find related matches" link). */
function fromQuery(params) {
  const out = {};
  const objective = params.get('objective');
  if (OBJECTIVES.some((o) => o.id === objective)) out.objective = objective;
  const sectors = (params.get('sectors') || '').split(',').filter((id) => SECTOR_BY_ID[id]);
  if (sectors.length) out.sectors = sectors.slice(0, 3);
  const region = params.get('region');
  if (REGIONS.some((r) => r.id === region)) out.region = region;
  return out;
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
      }`}
    >
      {active && <Check className="h-3 w-3" />} {children}
    </button>
  );
}

const fieldLabel = 'mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground';
const selectCls = 'w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring';

export default function AIMatchmaker() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, refreshProfile } = useAuth();
  const { raw, isLoading } = useIntelligence();
  const [searchParams] = useSearchParams();

  const [criteria, setCriteria] = useState(() => {
    const query = fromQuery(searchParams);
    return { ...DEFAULTS, ...(loadStored() || {}), ...query };
  });
  const [touched, setTouched] = useState(() => Boolean(loadStored()) || Object.keys(fromQuery(searchParams)).length > 0);
  const [group, setGroup] = useState('all');
  const [visible, setVisible] = useState(12);
  const [saving, setSaving] = useState(false);

  // First visit: start from what the member's profile already tells us.
  useEffect(() => {
    if (touched || !user) return;
    const suggestion = suggestCriteriaForUser(user);
    const clean = Object.fromEntries(Object.entries(suggestion).filter(([key, value]) => key in DEFAULTS && value !== undefined && value !== null));
    if (Object.keys(clean).length) setCriteria((prev) => ({ ...prev, ...clean }));
  }, [user, touched]);

  const update = (patch) => {
    setTouched(true);
    setVisible(12);
    setCriteria((prev) => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
      return next;
    });
  };

  const toggleSector = (id) => update({
    sectors: criteria.sectors.includes(id) ? criteria.sectors.filter((s) => s !== id) : [...criteria.sectors, id].slice(-3),
  });

  const objective = OBJECTIVES.find((o) => o.id === criteria.objective) || OBJECTIVES[0];
  const showsTicket = objective.seeks !== 'partners';

  const matches = useMemo(() => {
    if (!raw) return [];
    // Members and their posts are part of the community; visitors only see public listings.
    const data = user ? raw : { ...raw, profiles: [], posts: [] };
    return findMatches(criteria, { ...data, currentUserId: user?.id });
  }, [raw, criteria, user]);

  const counts = useMemo(() => {
    const c = { all: matches.length, investors: 0, projects: 0, members: 0, posts: 0 };
    for (const m of matches) c[KIND_META[m.kind].group] += 1;
    return c;
  }, [matches]);

  const shown = group === 'all' ? matches : matches.filter((m) => KIND_META[m.kind].group === group);
  const strong = matches.filter((m) => m.matchScore >= 75).length;

  const savePreferences = async () => {
    if (!user) { navigate('/login'); return; }
    setSaving(true);
    try {
      await saveMatchProfile(user, criteria);
      await refreshProfile();
      toast({ title: 'Matching preferences saved', description: 'Other members can now be matched with you on these criteria.' });
    } catch (error) {
      toast({ title: 'Could not save', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      <Helmet>
        <title>Matchmaker — Investraders</title>
        <meta name="description" content="Match innovators with investors: real investor mandates, funds, projects and members ranked against what you are looking for, with a transparent score." />
      </Helmet>

      <header className="rounded-2xl border bg-card p-5 sm:p-7">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Matchmaker
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Find who you should be talking to</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Tell us what you are looking for. We rank the investors, funds, projects and members that are actually on Investraders
          against it, and show exactly why each one scores the way it does.
        </p>
      </header>

      <section className="space-y-6 rounded-2xl border bg-card p-5 sm:p-7">
        <div>
          <span className={fieldLabel}>I am</span>
          <div className="flex flex-wrap gap-2">
            {ROLES.map((role) => (
              <Chip key={role.id} active={criteria.role === role.id} onClick={() => update({ role: role.id })}>
                <role.icon className="h-3.5 w-3.5" /> {role.label}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <span className={fieldLabel}>I want to</span>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {OBJECTIVES.map((o) => {
              const active = criteria.objective === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => update({ objective: o.id })}
                  className={`rounded-xl border p-3.5 text-left transition-colors ${active ? 'border-primary bg-primary/5' : 'bg-background hover:border-primary/40'}`}
                >
                  <span className={`block text-sm font-semibold ${active ? 'text-primary' : 'text-foreground'}`}>{o.label}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{o.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className={fieldLabel}>Sector <span className="font-normal normal-case tracking-normal">· up to three</span></span>
          <div className="flex flex-wrap gap-2">
            {SECTORS.map((sector) => (
              <Chip key={sector.id} active={criteria.sectors.includes(sector.id)} onClick={() => toggleSector(sector.id)}>{sector.label}</Chip>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label>
            <span className={fieldLabel}>{objective.seeks === 'partners' ? 'Target market' : 'Geography'}</span>
            <select className={selectCls} value={criteria.region} onChange={(e) => update({ region: e.target.value })}>
              {REGIONS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </label>
          {showsTicket && (
            <label>
              <span className={fieldLabel}>{objective.seeks === 'investors' ? 'Amount sought' : 'Ticket size'}</span>
              <select className={selectCls} value={criteria.ticket} onChange={(e) => update({ ticket: e.target.value })}>
                {TICKET_BANDS.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
              </select>
            </label>
          )}
          {showsTicket && (
            <label>
              <span className={fieldLabel}>Stage</span>
              <select className={selectCls} value={criteria.stage} onChange={(e) => update({ stage: e.target.value })}>
                {STAGES.map((st) => <option key={st.id} value={st.id}>{st.label}</option>)}
              </select>
            </label>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
          <p className="text-xs text-muted-foreground">
            Results update as you change the criteria. Save them so investors and innovators can be matched with you too.
          </p>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={savePreferences} disabled={saving}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {user ? 'Save as my matching profile' : 'Sign in to save'}
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {isLoading ? 'Loading the network…' : `${matches.length} match${matches.length === 1 ? '' : 'es'}`}
            </h2>
            {!isLoading && (
              <p className="text-xs text-muted-foreground">
                {strong} strong (75%+) · scored on {objective.seeks === 'partners' ? 'need, sector, market and recency' : 'sector, ticket, stage, geography and asset type'}
                {criteria.sectors.length === 0 && ' · pick a sector for sharper results'}
                {!user && ' · sign in to also match with members'}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-1 rounded-full bg-muted p-1">
            {GROUPS.filter((g) => g.id === 'all' || counts[g.id] > 0).map((g) => (
              <button key={g.id} onClick={() => { setGroup(g.id); setVisible(12); }}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${group === g.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                {g.label} · {counts[g.id]}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-3 rounded-2xl border bg-card py-16 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" /> Reading investors, projects and members…
          </div>
        ) : shown.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card px-6 py-14 text-center">
            <p className="text-sm font-semibold text-foreground">Nothing on the platform fits these criteria yet</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Try widening the geography or ticket size, or remove a sector. You can also save your criteria — new investors and projects are matched against saved profiles.
            </p>
          </div>
        ) : (
          <MatchList
            matches={shown.slice(0, visible)}
            context={{ objective: criteria.objective, sectors: criteria.sectors, region: criteria.region, ticket: criteria.ticket, stage: criteria.stage }}
          />
        )}

        {shown.length > visible && (
          <div className="text-center">
            <Button variant="outline" onClick={() => setVisible((v) => v + 12)}>Show more ({shown.length - visible} remaining)</Button>
          </div>
        )}
      </section>
    </div>
  );
}
