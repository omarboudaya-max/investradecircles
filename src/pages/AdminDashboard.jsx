import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { format, formatDistanceToNow, subDays, isAfter } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  Shield, Users, Trash2, FileText, CircleDot, BarChart2, MessageCircle, TrendingUp, UserCheck, Hash,
  ClipboardList, ShieldCheck, Loader2, Lock, RefreshCw, Flag, ArrowRight,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { listIntroRequests, updateIntroRequestStatus } from '@/api/platform';
import { useIntelligence } from '@/hooks/useIntelligence';
import { CACHE } from '@/lib/query-client';
import VerifiedBadge from '@/components/circles/VerifiedBadge';
import ProjectReviewPanel from '@/components/admin/ProjectReviewPanel';
import SentimentBadge, { SentimentMeter } from '@/components/intelligence/SentimentBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';

const TABS = ['Overview', 'Users', 'Projects', 'Investors', 'Introductions', 'Sentiment', 'Event Regs', 'Posts', 'Circles', 'Audit Log'];
const INTRO_STATUSES = ['NEW', 'IN_PROGRESS', 'INTRODUCED', 'DECLINED'];

const when = (value, pattern = 'MMM d, yyyy') => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? format(date, pattern) : '—';
};
const memberCount = (circle) => new Set([...(circle.member_ids || []), circle.created_by_id].filter(Boolean)).size;
const rowsOf = (promise) => promise.then((res) => { if (res.error) throw new Error(res.error.message); return res.data || []; });

function Card({ children, className = '' }) {
  return <div className={`overflow-hidden rounded-2xl border bg-card ${className}`}>{children}</div>;
}
function CardHeader({ children }) {
  return <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3 text-xs font-medium text-muted-foreground">{children}</div>;
}
function Empty({ children }) {
  return <p className="px-5 py-10 text-center text-sm text-muted-foreground">{children}</p>;
}
function Avatar({ src, name, round = true }) {
  return (
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden bg-primary/10 text-sm font-bold text-primary ${round ? 'rounded-full' : 'rounded-xl'}`}>
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : (name || '?').charAt(0).toUpperCase()}
    </div>
  );
}

function EventRegistrationsPanel({ search }) {
  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ['admin-event-registrations'],
    // photo_url is deliberately left out: it holds an inline image per row and the
    // full table does not come back within the database statement timeout.
    queryFn: () => rowsOf(supabase.from('event_registrations')
      .select('id,user_id,full_name,email,phone,company,role,sector,badge_code,status,is_member,created_at')
      .order('created_at', { ascending: false })),
    staleTime: CACHE.short,
  });
  const q = search.trim().toLowerCase();
  const visible = registrations.filter((r) => !q || `${r.full_name || ''} ${r.email || ''} ${r.company || ''} ${r.role || ''} ${r.badge_code || ''}`.toLowerCase().includes(q));

  return (
    <Card>
      <CardHeader>
        <span>{visible.length} of {registrations.length} event registrations</span>
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">{registrations.filter((r) => r.is_member).length} platform members</span>
      </CardHeader>
      {isLoading ? <Empty>Loading registrations…</Empty> : visible.length === 0 ? <Empty>No event registrations found</Empty> : (
        <ul className="divide-y">
          {visible.map((r) => (
            <li key={r.id || r.badge_code} className="flex items-center gap-3 px-5 py-3.5">
              <Avatar name={r.full_name} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{r.full_name}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${r.is_member ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>
                    {r.is_member ? 'Platform member' : 'Guest'}
                  </span>
                  <span className="rounded bg-muted px-2 py-0.5 font-mono text-[11px] font-semibold text-foreground">{r.badge_code}</span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {[r.email, r.phone, r.company, r.role, r.sector].filter(Boolean).join(' · ')}
                </p>
              </div>
              <span className="shrink-0 text-[11px] text-muted-foreground">{when(r.created_at, 'MMM d, HH:mm')}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function InvestorsPanel({ search, audit }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: orgs = [], isLoading } = useQuery({ queryKey: ['admin-investor-orgs'], queryFn: () => base44.entities.InvestmentOrganization.list() });
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-investor-orgs'] });
    queryClient.invalidateQueries({ queryKey: ['investmentOrganizationsList'] });
    queryClient.invalidateQueries({ queryKey: ['investmentVehiclesList'] });
    queryClient.invalidateQueries({ queryKey: ['intelligence-data'] });
  };
  const onError = (error) => toast({ title: 'Action failed', description: error.message, variant: 'destructive' });
  const isVerified = (org) => ['VERIFIED', 'OFFICIAL'].includes(org.verification_status);

  const toggleVerify = useMutation({
    mutationFn: (org) => base44.entities.InvestmentOrganization.update(org.id, isVerified(org)
      ? { verification_status: 'PENDING', official: false }
      : { verification_status: 'VERIFIED', official: true, is_illustrative: false }),
    onSuccess: (_, org) => { audit(isVerified(org) ? 'investor_unverified' : 'investor_verified', `${org.display_name} (${org.id})`); refresh(); },
    onError,
  });
  const remove = useMutation({
    mutationFn: (org) => base44.entities.InvestmentOrganization.delete(org.id),
    onSuccess: (_, org) => { audit('investor_deleted', `${org.display_name} (${org.id})`); refresh(); },
    onError,
  });

  const q = search.trim().toLowerCase();
  const visible = orgs.filter((o) => !q || `${o.display_name || ''} ${o.legal_name || ''} ${o.country || ''} ${o.organization_type || ''}`.toLowerCase().includes(q));

  return (
    <Card>
      <CardHeader>
        <span>{visible.length} of {orgs.length} investor organisations</span>
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">{orgs.filter(isVerified).length} verified · {orgs.filter((o) => o.is_illustrative).length} illustrative</span>
      </CardHeader>
      {isLoading ? <Empty>Loading investor directory…</Empty> : visible.length === 0 ? <Empty>No investor organisations found</Empty> : (
        <ul className="divide-y">
          {visible.map((org) => (
            <li key={org.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
              <Avatar src={org.logo_url || org.logo} name={org.display_name} round={false} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link to={`/investment-network/${org.slug || org.id}`} className="text-sm font-semibold text-foreground hover:text-primary">{org.display_name}</Link>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{String(org.organization_type || '').replace(/_/g, ' ')}</span>
                  {isVerified(org) && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">Verified</span>}
                  {org.is_illustrative && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">Illustrative</span>}
                  {!org.user_id && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">No account owner</span>}
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {[org.legal_name, [org.city, org.country].filter(Boolean).join(', '), org.minimum_ticket ? `Ticket ${org.minimum_ticket}M–${org.maximum_ticket}M TND` : null].filter(Boolean).join(' · ')}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button size="sm" variant={isVerified(org) ? 'outline' : 'default'} className="h-8 text-xs" disabled={toggleVerify.isPending} onClick={() => toggleVerify.mutate(org)}>
                  {isVerified(org) ? 'Remove verification' : 'Verify'}
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Remove investor" disabled={remove.isPending}
                  onClick={() => window.confirm(`Remove investor "${org.display_name}"? This cannot be undone.`) && remove.mutate(org)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function IntroductionsPanel({ search, audit }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: intro, isLoading } = useQuery({ queryKey: ['admin-intro-requests'], queryFn: () => listIntroRequests(), staleTime: CACHE.short });
  const { data: interests = [] } = useQuery({ queryKey: ['admin-investor-interests'], queryFn: () => base44.entities.InvestorInterest.list(), staleTime: CACHE.short });

  const setStatus = useMutation({
    mutationFn: ({ id, status }) => updateIntroRequestStatus(id, status),
    onSuccess: (_, vars) => { audit('intro_status_changed', `Introduction ${vars.id} → ${vars.status}`); queryClient.invalidateQueries({ queryKey: ['admin-intro-requests'] }); },
    onError: (error) => toast({ title: 'Could not update', description: error.message, variant: 'destructive' }),
  });

  const q = search.trim().toLowerCase();
  const rows = (intro?.rows || []).filter((r) => !q || `${r.requester_name || ''} ${r.target_title || ''} ${r.message || ''}`.toLowerCase().includes(q));
  const open = (intro?.rows || []).filter((r) => r.status === 'NEW').length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <span>Introductions requested through the matchmaker</span>
          <span className="font-semibold text-foreground">{open} awaiting action</span>
        </CardHeader>
        {isLoading ? <Empty>Loading requests…</Empty> : intro && !intro.available ? (
          <Empty>The introductions table does not exist yet. Apply the database migration in <code>supabase/migrations</code>; until then requests reach you as notifications.</Empty>
        ) : rows.length === 0 ? <Empty>No introduction has been requested yet.</Empty> : (
          <ul className="divide-y">
            {rows.map((r) => (
              <li key={r.id} className="space-y-2 px-5 py-4">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Link to={`/profile/${r.requester_id}`} className="font-semibold text-foreground hover:text-primary">{r.requester_name || 'Member'}</Link>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium text-foreground">{r.target_title || r.target_id}</span>
                  <span className="rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground">{String(r.target_kind).replace(/_/g, ' ')}</span>
                  {r.match_score ? <span className="text-xs font-semibold text-primary">{r.match_score}% match</span> : null}
                  {!r.target_user_id && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">Needs brokering</span>}
                </div>
                {r.message && <p className="whitespace-pre-wrap text-sm text-foreground/80">{r.message}</p>}
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>{r.created_date ? formatDistanceToNow(new Date(r.created_date), { addSuffix: true }) : ''}</span>
                  <select
                    value={r.status}
                    disabled={setStatus.isPending}
                    onChange={(e) => setStatus.mutate({ id: r.id, status: e.target.value })}
                    className="rounded-lg border border-input bg-background px-2 py-1 text-xs text-foreground"
                    aria-label="Status"
                  >
                    {INTRO_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ').toLowerCase()}</option>)}
                  </select>
                  {r.target_user_id && <Link to={`/profile/${r.target_user_id}`} className="font-medium text-primary hover:underline">Open the other party</Link>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader><span>Investor interest recorded on projects · {interests.length}</span></CardHeader>
        {interests.length === 0 ? <Empty>No investor has expressed interest in a project yet.</Empty> : (
          <ul className="divide-y">
            {interests.map((i) => (
              <li key={i.id} className="px-5 py-3.5 text-sm">
                <p className="text-foreground">
                  <span className="font-semibold">{i.investor_name}</span> → <Link to={`/investment-project/${i.project_id}`} className="font-medium text-primary hover:underline">{i.project_title || i.project_id}</Link>
                  <span className="ml-2 text-xs text-muted-foreground">{String(i.interest_type || '').replace(/_/g, ' ').toLowerCase()} · {when(i.created_date)}</span>
                </p>
                {i.message && <p className="mt-1 text-xs text-muted-foreground">{i.message}</p>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function SentimentPanel() {
  const { intel, isLoading } = useIntelligence();
  if (isLoading || !intel) return <Card><Empty>Analysing contributions…</Empty></Card>;
  const s = intel.sentiment;
  const negatives = intel.voice.filter((v) => v.sentiment.label === 'negative').slice(0, 15);
  const sectors = intel.sectors.filter((x) => x.sentiment.index !== null);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-medium text-muted-foreground">Sentiment index</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{s.index === null ? '—' : s.index}<span className="text-sm font-normal text-muted-foreground"> / 100</span></p>
          <p className="mt-1 text-xs text-muted-foreground">{s.scored} of {s.total} posts, comments and answers carry sentiment</p>
          <div className="mt-4"><SentimentMeter positive={s.positive} neutral={s.neutral} negative={s.negative} /></div>
        </Card>
        <Card className="p-5 md:col-span-2">
          <p className="mb-3 text-xs font-medium text-muted-foreground">By sector mentioned</p>
          {sectors.length === 0 ? <p className="text-sm text-muted-foreground">Not enough sector-specific text yet.</p> : (
            <ul className="space-y-2.5">
              {sectors.map((x) => (
                <li key={x.id} className="flex items-center gap-3 text-sm">
                  <span className="w-48 shrink-0 truncate text-foreground">{x.label}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${x.sentiment.index}%` }} /></div>
                  <span className="w-20 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{x.sentiment.index} · n={x.sentiment.total}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader>
          <span>Negative contributions · {s.negative}</span>
          <Link to="/intelligence" className="font-semibold text-primary hover:underline">Open the command center</Link>
        </CardHeader>
        {negatives.length === 0 ? <Empty>No negative contribution detected.</Empty> : (
          <ul className="divide-y">
            {negatives.map((v) => (
              <li key={v.id} className="px-5 py-3.5">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{v.authorName || 'Member'}</span>
                  <span>· {v.kind}</span>
                  {v.at && <span>· {formatDistanceToNow(v.at, { addSuffix: true })}</span>}
                  <SentimentBadge sentiment={v.sentiment} showScore />
                </div>
                <p className="mt-1.5 line-clamp-3 whitespace-pre-wrap text-sm text-foreground/90">{v.text}</p>
                <p className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">Triggered by: {v.sentiment.negatives.join(', ')}
                  {v.href && <Link to={v.href} className="ml-3 font-medium text-primary hover:underline">Open</Link>}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {intel.concerns.length > 0 && (
        <Card>
          <CardHeader><span>What the negative contributions are about</span></CardHeader>
          <ul className="divide-y">
            {intel.concerns.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <span className="text-foreground">{c.label}</span>
                <span className="text-xs text-muted-foreground">{c.count} mention{c.count === 1 ? '' : 's'}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { user, isAdmin, profileLoaded, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const tab = TABS.includes(requestedTab) ? requestedTab : 'Overview';
  const [search, setSearch] = useState('');
  const [refreshingMarket, setRefreshingMarket] = useState(false);

  const selectTab = (next) => {
    setSearch('');
    setSearchParams(next === 'Overview' ? {} : { tab: next }, { replace: true });
  };

  const adminQuery = (key, fn, staleTime = CACHE.short) => ({ queryKey: key, queryFn: fn, staleTime, enabled: isAdmin });
  const { data: allUsers = [] } = useQuery(adminQuery(['admin-users'], () => rowsOf(supabase.from('profiles').select('*').order('created_at', { ascending: false }))));
  const { data: allPosts = [] } = useQuery(adminQuery(['admin-posts'], () => rowsOf(supabase.from('Post').select('*').order('created_date', { ascending: false }).limit(300))));
  const { data: allCircles = [] } = useQuery(adminQuery(['admin-circles'], () => rowsOf(supabase.from('Circle').select('*')), CACHE.medium));
  const { data: allComments = [] } = useQuery(adminQuery(['admin-comments'], () => rowsOf(supabase.from('Comment').select('id,created_date').order('created_date', { ascending: false }).limit(500))));
  const { data: auditLogs = [] } = useQuery(adminQuery(['audit-logs'], () => rowsOf(supabase.from('AuditLog').select('*').order('created_date', { ascending: false }).limit(150))));
  const { data: reports = [] } = useQuery(adminQuery(['admin-post-reports'], async () => {
    const { data, error } = await supabase.from('PostReport').select('*').eq('status', 'NEW').order('created_date', { ascending: false });
    return error ? [] : data || [];
  }));

  const audit = async (action, details) => {
    const { error } = await supabase.from('AuditLog').insert({ admin_id: user?.id, admin_name: user?.full_name || user?.email || 'Admin', action, details });
    if (error) console.warn('Audit log write failed:', error.message);
    queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
  };
  const onError = (error) => toast({ title: 'Action failed', description: error.message, variant: 'destructive' });
  const run = (promise) => promise.then(({ error }) => { if (error) throw new Error(error.message); });

  const deletePost = useMutation({
    mutationFn: (post) => run(supabase.from('Post').delete().eq('id', post.id)),
    onSuccess: (_, post) => {
      audit('delete_post', `Deleted post ${post.id} by ${post.author_name || 'unknown'}`);
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-post-reports'] });
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError,
  });
  const dismissReports = useMutation({
    mutationFn: (postId) => run(supabase.from('PostReport').update({ status: 'DISMISSED' }).eq('post_id', postId).eq('status', 'NEW')),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-post-reports'] }),
    onError,
  });
  const deleteCircle = useMutation({
    mutationFn: (circle) => run(supabase.from('Circle').delete().eq('id', circle.id)),
    onSuccess: (_, circle) => { audit('delete_circle', `Deleted circle ${circle.name} (${circle.id})`); queryClient.invalidateQueries({ queryKey: ['admin-circles'] }); },
    onError,
  });
  const changeUserRole = useMutation({
    mutationFn: ({ target, role }) => run(supabase.from('profiles').update({ role }).eq('id', target.id)),
    onSuccess: (_, { target, role }) => { audit('role_change', `Changed ${target.full_name || target.email || target.id} to ${role}`); queryClient.invalidateQueries({ queryKey: ['admin-users'] }); },
    onError,
  });
  const toggleVerified = useMutation({
    mutationFn: ({ circle, is_verified }) => run(supabase.from('Circle').update({
      is_verified,
      verified_label: is_verified ? (circle.verified_label || (['institution', 'chamber_of_commerce'].includes(circle.category) ? 'Official' : 'Verified')) : '',
    }).eq('id', circle.id)),
    onSuccess: (_, { circle, is_verified }) => { audit(is_verified ? 'circle_verified' : 'circle_unverified', `${circle.name} (${circle.id})`); queryClient.invalidateQueries({ queryKey: ['admin-circles'] }); },
    onError,
  });

  const refreshMarketData = async () => {
    if (!window.confirm('Fetch fresh prices from Yahoo Finance, CoinGecko and Ilboursa now?')) return;
    setRefreshingMarket(true);
    try {
      const { data, error } = await supabase.functions.invoke('refresh-market-data', { method: 'POST' });
      if (error) throw error;
      audit('market_data_refresh', `Refreshed ${data?.updated?.length || 0} market assets`);
      queryClient.invalidateQueries({ queryKey: ['market-data'] });
      toast({ title: 'Market data refreshed', description: `${data?.updated?.length || 0} assets updated.` });
    } catch (error) {
      toast({ title: 'Market data refresh failed', description: error.message || 'The refresh function could not be reached.', variant: 'destructive' });
    } finally {
      setRefreshingMarket(false);
    }
  };

  const stats = useMemo(() => {
    const week = subDays(new Date(), 7);
    const month = subDays(new Date(), 30);
    const recent = (items, field, since) => items.filter((i) => i[field] && isAfter(new Date(i[field]), since)).length;
    const posters = {};
    allPosts.forEach((p) => { if (p.author_name) posters[p.author_name] = (posters[p.author_name] || 0) + 1; });
    const daily = Array.from({ length: 7 }, (_, i) => {
      const start = new Date(subDays(new Date(), 6 - i).setHours(0, 0, 0, 0));
      const end = new Date(new Date(start).setHours(23, 59, 59, 999));
      const within = (items) => items.filter((x) => x.created_date && new Date(x.created_date) >= start && new Date(x.created_date) <= end).length;
      return { day: format(start, 'EEE'), Posts: within(allPosts), Comments: within(allComments) };
    });
    return {
      newUsers7: recent(allUsers, 'created_at', week),
      posts7: recent(allPosts, 'created_date', week),
      posts30: recent(allPosts, 'created_date', month),
      avgMembers: allCircles.length ? (allCircles.reduce((sum, c) => sum + memberCount(c), 0) / allCircles.length).toFixed(1) : 0,
      likes: allPosts.reduce((sum, p) => sum + (p.likes || 0), 0),
      topPoster: Object.entries(posters).sort((a, b) => b[1] - a[1])[0],
      topCircle: [...allCircles].sort((a, b) => memberCount(b) - memberCount(a))[0],
      daily,
    };
  }, [allUsers, allPosts, allCircles, allComments]);

  // The role lives on the profile row: wait for it instead of guessing.
  if (!profileLoaded) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary" /> Checking your access…
        <Button variant="outline" size="sm" onClick={refreshProfile}>Retry</Button>
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted"><Lock className="h-6 w-6 text-muted-foreground" /></div>
        <h1 className="text-lg font-semibold text-foreground">Administrators only</h1>
        <p className="text-sm text-muted-foreground">This account ({user?.email}) does not have the administrator role. If it should, ask another administrator to grant it from the Users tab.</p>
        <Button asChild variant="outline"><Link to="/home">Back to the feed</Link></Button>
      </div>
    );
  }

  const q = search.toLowerCase();
  const users = allUsers.filter((u) => `${u.full_name || ''} ${u.email || ''}`.toLowerCase().includes(q));
  const posts = allPosts.filter((p) => `${p.content || ''} ${p.author_name || ''}`.toLowerCase().includes(q));
  const circles = allCircles.filter((c) => (c.name || '').toLowerCase().includes(q));
  const reportedIds = new Set(reports.map((r) => r.post_id));
  const reported = allPosts.filter((p) => reportedIds.has(p.id));

  const statCards = [
    { label: 'Users', value: allUsers.length, sub: `+${stats.newUsers7} this week`, icon: Users },
    { label: 'Posts', value: allPosts.length, sub: `${stats.posts7} this week · ${stats.posts30} in 30 days`, icon: FileText },
    { label: 'Circles', value: allCircles.length, sub: `${stats.avgMembers} members on average`, icon: CircleDot },
    { label: 'Comments', value: allComments.length, sub: 'most recent 500', icon: MessageCircle },
    { label: 'Likes', value: stats.likes, sub: 'across loaded posts', icon: TrendingUp },
    { label: 'Open reports', value: reports.length, sub: reports.length ? 'see the Posts tab' : 'nothing to review', icon: Flag },
  ];

  const renderPost = (p, flagged = false) => (
    <li key={p.id} className="flex items-start gap-3 px-5 py-3">
      <Avatar name={p.author_name} />
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm text-foreground">{p.content}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {p.author_name} · {when(p.created_date)} · {p.likes || 0} likes
          <Link to={`/post/${p.id}`} className="ml-2 font-medium text-primary hover:underline">Open</Link>
        </p>
        {flagged && (
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
            Reported {reports.filter((r) => r.post_id === p.id).length}×{reports.find((r) => r.post_id === p.id && r.reason)?.reason ? `: “${reports.find((r) => r.post_id === p.id && r.reason).reason}”` : ''}
          </p>
        )}
      </div>
      {flagged && <Button size="sm" variant="outline" className="h-7 shrink-0 text-xs" disabled={dismissReports.isPending} onClick={() => dismissReports.mutate(p.id)}>Keep</Button>}
      <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-destructive hover:bg-destructive/10" title="Delete post" disabled={deletePost.isPending}
        onClick={() => window.confirm('Delete this post for everyone? This cannot be undone.') && deletePost.mutate(p)}>
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </li>
  );

  return (
    <div className="mx-auto max-w-5xl py-4">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><Shield className="h-5 w-5 text-primary" /></div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Platform management and oversight</p>
        </div>
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-muted/50 p-1" role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => selectTab(t)}
            className={`shrink-0 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${tab === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            {t}
          </button>
        ))}
      </div>

      {!['Overview', 'Sentiment', 'Audit Log'].includes(tab) && (
        <Input placeholder={`Search ${tab.toLowerCase()}…`} value={search} onChange={(e) => setSearch(e.target.value)} className="mb-4 max-w-sm" />
      )}

      {tab === 'Overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {statCards.map((s) => (
              <Card key={s.label} className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10"><s.icon className="h-5 w-5 text-primary" /></div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="truncate text-xs text-muted-foreground">{s.label}</p>
                  <p className="truncate text-[10px] text-muted-foreground/80">{s.sub}</p>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {stats.topPoster && (
              <Card className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted"><UserCheck className="h-5 w-5 text-muted-foreground" /></div>
                <div><p className="text-xs text-muted-foreground">Most active author</p><p className="text-sm font-semibold text-foreground">{stats.topPoster[0]}</p><p className="text-[10px] text-muted-foreground">{stats.topPoster[1]} posts</p></div>
              </Card>
            )}
            {stats.topCircle && (
              <Card className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted"><Hash className="h-5 w-5 text-muted-foreground" /></div>
                <div className="min-w-0"><p className="text-xs text-muted-foreground">Largest circle</p><p className="truncate text-sm font-semibold text-foreground">{stats.topCircle.name}</p><p className="text-[10px] text-muted-foreground">{memberCount(stats.topCircle)} members · {stats.topCircle.category}</p></div>
              </Card>
            )}
          </div>

          <Card>
            <div className="flex items-center gap-2 border-b px-5 py-3 text-sm font-semibold text-foreground"><BarChart2 className="h-4 w-4 text-primary" /> Daily activity (last 7 days)</div>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={stats.daily} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--popover-foreground))' }} cursor={{ fill: 'hsl(var(--muted))' }} />
                  <Bar dataKey="Posts" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Comments" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <h3 className="flex items-center gap-2 font-semibold text-foreground"><TrendingUp className="h-4 w-4 text-primary" /> Market data</h3>
              <p className="mt-1 text-sm text-muted-foreground">Refresh the scrolling ticker (stocks, forex, crypto) now instead of waiting for the next scheduled run.</p>
            </div>
            <Button onClick={refreshMarketData} disabled={refreshingMarket} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${refreshingMarket ? 'animate-spin' : ''}`} /> {refreshingMarket ? 'Refreshing…' : 'Refresh market data'}
            </Button>
          </Card>
        </div>
      )}

      {tab === 'Users' && (
        <Card>
          <CardHeader><span>{users.length} of {allUsers.length} users</span><span>{allUsers.filter((u) => u.role === 'admin').length} administrators</span></CardHeader>
          <ul className="divide-y">
            {users.map((u) => (
              <li key={u.id} className="flex items-center gap-3 px-5 py-3">
                <Avatar src={u.avatar_url} name={u.full_name || u.email} />
                <div className="min-w-0 flex-1">
                  <Link to={`/profile/${u.id}`} className="text-sm font-medium text-foreground hover:text-primary">{u.full_name || '—'}</Link>
                  <p className="truncate text-xs text-muted-foreground">{[u.email, u.user_type, `joined ${when(u.created_at)}`].filter(Boolean).join(' · ')}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{u.role || 'user'}</span>
                {u.id !== user.id && (
                  <Button size="sm" variant="outline" className="h-7 text-xs" disabled={changeUserRole.isPending}
                    onClick={() => {
                      const role = u.role === 'admin' ? 'user' : 'admin';
                      if (window.confirm(role === 'admin' ? `Give ${u.full_name || u.email} full administrator access?` : `Remove administrator access from ${u.full_name || u.email}?`)) changeUserRole.mutate({ target: u, role });
                    }}>
                    {u.role === 'admin' ? 'Remove admin' : 'Make admin'}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {tab === 'Projects' && <ProjectReviewPanel search={search} addAuditLog={audit} />}
      {tab === 'Investors' && <InvestorsPanel search={search} audit={audit} />}
      {tab === 'Introductions' && <IntroductionsPanel search={search} audit={audit} />}
      {tab === 'Sentiment' && <SentimentPanel />}
      {tab === 'Event Regs' && <EventRegistrationsPanel search={search} />}

      {tab === 'Posts' && (
        <div className="space-y-4">
          {reported.length > 0 && (
            <Card className="border-amber-300 dark:border-amber-800">
              <CardHeader><span className="flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-300"><Flag className="h-3.5 w-3.5" /> Reported by members · {reported.length}</span></CardHeader>
              <ul className="divide-y">{reported.map((p) => renderPost(p, true))}</ul>
            </Card>
          )}
          <Card>
            <CardHeader><span>{posts.length} posts</span></CardHeader>
            {posts.length === 0 ? <Empty>No post matches.</Empty> : <ul className="divide-y">{posts.map((p) => renderPost(p))}</ul>}
          </Card>
        </div>
      )}

      {tab === 'Circles' && (
        <Card>
          <CardHeader>
            <span>{circles.length} circles</span>
            <span className="flex items-center gap-1 text-primary"><ShieldCheck className="h-3.5 w-3.5" /> {allCircles.filter((c) => c.is_verified).length} verified</span>
          </CardHeader>
          <ul className="divide-y">
            {circles.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-5 py-3">
                <Avatar name={c.name} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/circle/${c.id}`} className="truncate text-sm font-medium text-foreground hover:text-primary">{c.name}</Link>
                    {c.is_verified && <VerifiedBadge label={c.verified_label || 'Verified'} size="sm" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{memberCount(c)} members · {(c.category || 'general').replace(/_/g, ' ')} · {c.privacy || 'public'} · created {when(c.created_date)}</p>
                </div>
                <Button size="sm" variant={c.is_verified ? 'default' : 'outline'} className="h-7 shrink-0 gap-1 text-xs" disabled={toggleVerified.isPending}
                  onClick={() => toggleVerified.mutate({ circle: c, is_verified: !c.is_verified })}>
                  <ShieldCheck className="h-3 w-3" /> {c.is_verified ? 'Verified' : 'Verify'}
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-destructive hover:bg-destructive/10" title="Delete circle" disabled={deleteCircle.isPending}
                  onClick={() => window.confirm(`Delete the circle "${c.name}" with all its posts, questions and events? This cannot be undone.`) && deleteCircle.mutate(c)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {tab === 'Audit Log' && (
        <Card>
          <div className="flex items-center gap-2 border-b px-5 py-3 text-sm font-semibold text-foreground"><ClipboardList className="h-4 w-4 text-primary" /> Administrator actions</div>
          {auditLogs.length === 0 ? <Empty>No audit events yet</Empty> : (
            <ul className="max-h-[600px] divide-y overflow-y-auto">
              {auditLogs.map((log) => (
                <li key={log.id} className="flex items-start gap-3 px-5 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10"><Shield className="h-4 w-4 text-primary" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{String(log.action || '').replace(/_/g, ' ')}</p>
                    <p className="break-words text-xs text-muted-foreground">{log.details}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground/70">by {log.admin_name} · {when(log.created_date, 'MMM d, yyyy HH:mm')}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
