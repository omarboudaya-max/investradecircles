import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { useIntelligence } from '@/hooks/useIntelligence';
import { OBJECTIVES, REGION_OPTIONS, findMatches, suggestCriteriaForUser } from '@/lib/intelligence/matching';
import { SECTORS } from '@/lib/intelligence/signals';
import MatchList from '@/components/matching/MatchList';

const selectCls = 'w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring';
const label = 'mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground';

/**
 * Business matchmaking inside a circle: the circle's own members and what they
 * have posted come first, followed by projects and investors from the wider platform.
 */
export default function CircleMatchmaking({ circle, onPostNeed }) {
  const { user } = useAuth();
  const { raw, isLoading } = useIntelligence();
  const suggestion = useMemo(() => suggestCriteriaForUser(user), [user]);
  const [criteria, setCriteria] = useState(() => ({
    objective: suggestion.objective && suggestion.objective !== 'INVESTMENT' ? suggestion.objective : 'PARTNER',
    sectors: (suggestion.sectors || []).slice(0, 1),
    region: suggestion.region || 'Global',
    ticket: 'any',
  }));
  const [scope, setScope] = useState('circle');

  const memberIds = useMemo(() => new Set([...(circle?.member_ids || []), circle?.created_by_id].filter(Boolean)), [circle]);

  const { inCircle, platform } = useMemo(() => {
    if (!raw) return { inCircle: [], platform: [] };
    const all = findMatches(criteria, { ...raw, currentUserId: user?.id });
    const belongs = (m) => (m.kind === 'member' && memberIds.has(m.entity.id))
      || (m.kind === 'post' && (m.entity.circle_id === circle?.id || memberIds.has(m.entity.created_by_id)))
      || ((m.kind === 'project' || m.kind === 'investor_org' || m.kind === 'fund') && m.ownerUserId && memberIds.has(m.ownerUserId));
    return { inCircle: all.filter(belongs), platform: all.filter((m) => !belongs(m)) };
  }, [raw, criteria, user?.id, memberIds, circle?.id]);

  const shown = (scope === 'circle' ? inCircle : platform).slice(0, 8);
  const update = (patch) => setCriteria((prev) => ({ ...prev, ...patch }));

  return (
    <div className="space-y-4 p-4 sm:p-5">
      <div>
        <h3 className="flex items-center gap-2 text-base font-bold text-foreground"><Briefcase className="h-5 w-5 text-primary" /> Business matchmaking</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Find partners, buyers and capital among the {memberIds.size} members of {circle?.name || 'this circle'} — ranked on what they actually posted and declared.
        </p>
      </div>

      <div className="grid gap-3 rounded-2xl border bg-card p-4 sm:grid-cols-3">
        <label>
          <span className={label}>I want to</span>
          <select className={selectCls} value={criteria.objective} onChange={(e) => update({ objective: e.target.value })}>
            {OBJECTIVES.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </label>
        <label>
          <span className={label}>Sector</span>
          <select className={selectCls} value={criteria.sectors[0] || ''} onChange={(e) => update({ sectors: e.target.value ? [e.target.value] : [] })}>
            <option value="">Any sector</option>
            {SECTORS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
        <label>
          <span className={label}>Market</span>
          <select className={selectCls} value={criteria.region} onChange={(e) => update({ region: e.target.value })}>
            {REGION_OPTIONS.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 rounded-full bg-muted p-1">
          {[['circle', `In this circle · ${inCircle.length}`], ['platform', `Rest of Investraders · ${platform.length}`]].map(([id, text]) => (
            <button key={id} onClick={() => setScope(id)} className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${scope === id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              {text}
            </button>
          ))}
        </div>
        <Link to={`/matchmaker?objective=${criteria.objective}${criteria.sectors[0] ? `&sectors=${criteria.sectors[0]}` : ''}&region=${criteria.region}`} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
          Open the full matchmaker <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-3 rounded-2xl border bg-card py-12 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" /> Reading members and opportunities…
        </div>
      ) : shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card px-6 py-10 text-center">
          <p className="text-sm font-semibold text-foreground">
            {scope === 'circle' ? 'No member of this circle matches these criteria yet' : 'Nothing else on the platform matches these criteria'}
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Matches come from what members post and declare. Publish your own need so that others can find you.
          </p>
          {onPostNeed && <Button className="mt-4 rounded-full" onClick={onPostNeed}>Post a need or an offer</Button>}
        </div>
      ) : (
        <MatchList matches={shown} compact context={{ objective: criteria.objective, sectors: criteria.sectors, region: criteria.region, circle_id: circle?.id }} />
      )}

      {onPostNeed && shown.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Not finding it? <button onClick={onPostNeed} className="font-semibold text-primary hover:underline">Post your need to the circle</button> — it becomes matchable immediately.
        </p>
      )}
    </div>
  );
}
