import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  Activity, AlertTriangle, ArrowRight, BarChart3, Building2, Check, CheckCircle2, Copy, Download, Globe2, Info,
  Landmark, Lightbulb, Loader2, MapPin, Maximize2, MessageSquare, Minimize2, PieChart, RefreshCw, Send, Sparkles,
  TrendingDown, TrendingUp, Users, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIntelligence } from '@/hooks/useIntelligence';
import { answerQuestion, briefToText, buildExecutiveBrief } from '@/lib/intelligence/aggregate';
import SentimentBadge, { SentimentMeter } from '@/components/intelligence/SentimentBadge';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'briefing', label: 'Briefing & Q&A', icon: Sparkles },
  { id: 'sentiment', label: 'Sentiment', icon: PieChart },
  { id: 'voice', label: 'Voice of members', icon: MessageSquare },
  { id: 'sectors', label: 'Sectors', icon: Building2 },
  { id: 'regions', label: 'Regions', icon: MapPin },
  { id: 'opportunities', label: 'Opportunities', icon: Zap },
];

const SUGGESTED_QUESTIONS = [
  'What difficulties do members report most?',
  'Which sectors need capital?',
  'Where are investors missing?',
  'Which export markets are targeted?',
  'What should we do next?',
];

const fmtAmount = (m) => {
  const n = Number(m) || 0;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}B TND`;
  if (n >= 1) return `${n.toLocaleString('en-US', { maximumFractionDigits: 1 })}M TND`;
  return n ? `${Math.round(n * 1000)}K TND` : '0 TND';
};

const ALERT_STYLES = {
  risk: { icon: AlertTriangle, cls: 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-100', iconCls: 'text-rose-500' },
  action: { icon: Zap, cls: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100', iconCls: 'text-amber-500' },
  positive: { icon: TrendingUp, cls: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100', iconCls: 'text-emerald-500' },
  info: { icon: Info, cls: 'border-border bg-muted/50 text-foreground', iconCls: 'text-muted-foreground' },
};

const chartTooltip = {
  contentStyle: { background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 10, fontSize: 12, color: 'hsl(var(--popover-foreground))' },
  labelStyle: { color: 'hsl(var(--muted-foreground))', fontWeight: 600 },
};

function Stat({ icon: Icon, label, value, hint, tone = 'text-foreground' }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        <span className="truncate">{label}</span>
      </div>
      <div className={`mt-1.5 text-2xl font-bold tracking-tight ${tone}`}>{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

function Panel({ title, description, icon: Icon, action, children, className = '' }) {
  return (
    <section className={`rounded-2xl border bg-card ${className}`}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-3.5">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            {Icon && <Icon className="h-4 w-4 text-primary" />} {title}
          </h3>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {action}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Empty({ children }) {
  return <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">{children}</p>;
}

function Growth({ change }) {
  if (change === null || change === undefined) return null;
  const up = change >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-0.5 ${up ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
      <Icon className="h-3 w-3" /> {up ? '+' : ''}{change}% vs previous 30 days
    </span>
  );
}

/**
 * Live command center. Every figure is computed from platform records by
 * src/lib/intelligence — nothing on this screen is hard-coded.
 */
export default function CommandCenter({
  title = 'Economic Command Center',
  subtitle = 'Live intelligence computed from the activity of the platform',
  eyebrow = 'Investraders intelligence',
  logo = null,
  circle = null,
  initialFullscreen = false,
  onExitFullscreen,
  toolbar = null,
}) {
  const navigate = useNavigate();
  const { intel, isLoading, isFetching, refetch, updatedAt } = useIntelligence({ circle });
  const [tab, setTab] = useState('overview');
  const [fullscreen, setFullscreen] = useState(Boolean(initialFullscreen));
  const [question, setQuestion] = useState('');
  const [answers, setAnswers] = useState([]);
  const [copied, setCopied] = useState(false);
  const [voiceFilter, setVoiceFilter] = useState('all');
  const [regionId, setRegionId] = useState(null);

  const brief = useMemo(() => (intel ? buildExecutiveBrief(intel) : null), [intel]);

  const toggleFullscreen = useCallback(() => {
    setFullscreen((current) => {
      const next = !current;
      if (next) document.documentElement.requestFullscreen?.().catch(() => {});
      else {
        if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
        onExitFullscreen?.();
      }
      return next;
    });
  }, [onExitFullscreen]);

  useEffect(() => {
    if (initialFullscreen) document.documentElement.requestFullscreen?.().catch(() => {});
  }, [initialFullscreen]);

  useEffect(() => {
    const onChange = () => { if (!document.fullscreenElement) setFullscreen(false); };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  useEffect(() => {
    if (!fullscreen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [fullscreen]);

  // F toggles presentation mode; arrows move between tabs while presenting.
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'f' || e.key === 'F') { e.preventDefault(); toggleFullscreen(); return; }
      if (!fullscreen) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const index = TABS.findIndex((t) => t.id === tab);
        const step = e.key === 'ArrowRight' ? 1 : -1;
        setTab(TABS[(index + step + TABS.length) % TABS.length].id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fullscreen, tab, toggleFullscreen]);

  const ask = (text) => {
    const q = (text ?? question).trim();
    if (!q || !intel) return;
    setAnswers((prev) => [{ question: q, ...answerQuestion(q, intel) }, ...prev].slice(0, 8));
    setQuestion('');
  };

  const copyBrief = async () => {
    if (!brief) return;
    try {
      await navigator.clipboard.writeText(briefToText(brief, `${title} — executive briefing`));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  };

  const downloadBrief = () => {
    if (!brief) return;
    const blob = new Blob([briefToText(brief, `${title} — executive briefing`)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `briefing-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const followAlert = (alert) => {
    if (alert.href) navigate(alert.href);
    else if (alert.tab) setTab(alert.tab);
  };

  const shell = fullscreen
    ? 'fixed inset-0 z-[1000] overflow-y-auto bg-background'
    : 'overflow-hidden rounded-2xl border bg-background shadow-sm';

  const k = intel?.kpis;
  const s = intel?.sentiment;
  const voice = useMemo(() => {
    if (!intel) return [];
    return voiceFilter === 'all' ? intel.voice : intel.voice.filter((v) => v.sentiment.label === voiceFilter);
  }, [intel, voiceFilter]);
  const activeRegions = useMemo(() => (intel ? intel.regions.filter((r) => r.projects || r.members) : []), [intel]);
  const region = activeRegions.find((r) => r.id === regionId) || activeRegions[0] || null;

  return (
    <div className={shell}>
      {/* Header */}
      <div className="border-b bg-card px-5 py-5 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-background">
              {logo ? <img src={logo} alt="" className="h-full w-full object-contain p-1.5" /> : <Landmark className="h-6 w-6 text-primary" />}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">{eyebrow}</p>
              <h1 className="text-xl font-bold leading-tight text-foreground sm:text-2xl">{title}</h1>
              <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{subtitle}</p>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${isFetching ? 'animate-pulse bg-amber-500' : 'bg-emerald-500'}`} />
                  {updatedAt ? `Live data · updated ${formatDistanceToNow(updatedAt, { addSuffix: true })}` : 'Loading live data…'}
                </span>
                {circle && <span>Scope: members of {circle.name}</span>}
                {k && <span>{k.contributions} contributions analysed</span>}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {toolbar}
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={toggleFullscreen} title="Presentation mode (F)">
              {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{fullscreen ? 'Exit' : 'Present'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex overflow-x-auto border-b bg-card px-3 sm:px-6 ${fullscreen ? 'sticky top-0 z-10' : ''}`} role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-3 text-xs font-semibold transition-colors ${
              tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-5 p-4 sm:p-6">
        {isLoading || !intel ? (
          <div className="flex items-center justify-center gap-3 py-24 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" /> Computing intelligence from live data…
          </div>
        ) : (
          <>
            {tab === 'overview' && (
              <>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <Stat icon={Users} label="Members" value={k.members.toLocaleString('en-US')} hint={<>{k.innovators} innovators · {k.investorsMembers} investors</>} />
                  <Stat icon={Lightbulb} label="Published opportunities" value={k.projects} hint={k.pendingProjects ? `${k.pendingProjects} awaiting review` : `${k.jobs.toLocaleString('en-US')} planned jobs`} />
                  <Stat icon={Zap} label="Capital sought" value={fmtAmount(k.capitalDemand)} hint={`${fmtAmount(k.equityDemand)} in equity`} tone="text-emerald-600 dark:text-emerald-400" />
                  <Stat icon={Landmark} label="Investors listed" value={k.investorOrgs} hint={`${k.funds} funds · ${k.verifiedInvestorOrgs} verified`} />
                  <Stat icon={Activity} label="Sentiment index" value={s.index === null ? '—' : `${s.index}/100`} hint={s.index === null ? 'Not enough scorable text' : `${s.scored} scored of ${s.total} contributions`} tone="text-primary" />
                  <Stat icon={Sparkles} label="Economic signals" value={k.signals} hint={`detected in ${k.posts} posts`} />
                  <Stat icon={CheckCircle2} label="Strong investor–project fits" value={k.strongPairs} hint="pairs scoring 75% or more" />
                  <Stat icon={Send} label="Interest expressed" value={k.interests} hint="investor requests on projects" />
                </div>

                <div className="grid gap-5 lg:grid-cols-5">
                  <Panel title="What needs attention" description="Rules evaluated on the current data — each alert states what triggered it" icon={AlertTriangle} className="lg:col-span-3">
                    {intel.alerts.length === 0 ? <Empty>No rule is triggered right now.</Empty> : (
                      <ul className="space-y-2.5">
                        {intel.alerts.map((alert) => {
                          const style = ALERT_STYLES[alert.level] || ALERT_STYLES.info;
                          const Icon = style.icon;
                          const actionable = alert.href || alert.tab;
                          return (
                            <li key={alert.id} className={`flex items-start gap-3 rounded-xl border p-3.5 ${style.cls}`}>
                              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${style.iconCls}`} />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold">{alert.title}</p>
                                <p className="mt-0.5 text-xs opacity-80">{alert.detail}</p>
                                {actionable && alert.action && (
                                  <button onClick={() => followAlert(alert)} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold underline-offset-2 hover:underline">
                                    {alert.action} <ArrowRight className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </Panel>

                  <Panel title="Activity" description="Last 30 days" icon={Activity} className="lg:col-span-2">
                    <dl className="space-y-3 text-sm">
                      <div className="flex items-baseline justify-between gap-3">
                        <dt className="text-muted-foreground">New members</dt>
                        <dd className="text-right font-semibold">{k.newMembers30d}<div className="text-[11px] font-normal"><Growth change={intel.growth.members.changePct} /></div></dd>
                      </div>
                      <div className="flex items-baseline justify-between gap-3">
                        <dt className="text-muted-foreground">Posts published</dt>
                        <dd className="text-right font-semibold">{k.posts30d}<div className="text-[11px] font-normal"><Growth change={intel.growth.posts.changePct} /></div></dd>
                      </div>
                      <div className="flex items-baseline justify-between gap-3">
                        <dt className="text-muted-foreground">Circles</dt>
                        <dd className="font-semibold">{k.circles} <span className="font-normal text-muted-foreground">({k.institutionalCircles} institutional)</span></dd>
                      </div>
                      <div className="flex items-baseline justify-between gap-3">
                        <dt className="text-muted-foreground">Event registrations</dt>
                        <dd className="font-semibold">{k.eventRegistrations}</dd>
                      </div>
                    </dl>
                  </Panel>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                  <Panel title="What members are asking the market for" description="Intent of posts — chosen by the author or detected in the text" icon={Sparkles}>
                    {intel.intents.length === 0 ? <Empty>No post carries a business signal yet.</Empty> : (
                      <ResponsiveContainer width="100%" height={Math.max(160, intel.intents.length * 34)}>
                        <BarChart data={intel.intents} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                          <YAxis type="category" dataKey="label" width={150} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                          <Tooltip {...chartTooltip} cursor={{ fill: 'hsl(var(--muted))' }} />
                          <Bar dataKey="count" name="Posts" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </Panel>
                  <Panel title="Target markets" description="Where projects, posts and investor mandates point" icon={Globe2}>
                    {intel.corridors.length === 0 ? <Empty>No target market mentioned yet.</Empty> : (
                      <ul className="space-y-3">
                        {intel.corridors.slice(0, 6).map((c) => {
                          const max = intel.corridors[0].total || 1;
                          return (
                            <li key={c.id}>
                              <div className="flex items-baseline justify-between gap-3 text-sm">
                                <span className="font-medium text-foreground">{c.label}</span>
                                <span className="text-xs text-muted-foreground">{c.projects} projects · {c.posts} posts · {c.investors} investors</span>
                              </div>
                              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(6, (c.total / max) * 100)}%` }} />
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </Panel>
                </div>
              </>
            )}

            {tab === 'briefing' && brief && (
              <div className="grid gap-5 lg:grid-cols-5">
                <Panel
                  title="Executive briefing"
                  description={brief.date}
                  icon={Sparkles}
                  className="lg:col-span-3"
                  action={(
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={copyBrief}>
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />} {copied ? 'Copied' : 'Copy'}
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={downloadBrief}>
                        <Download className="h-3.5 w-3.5" /> Download
                      </Button>
                    </div>
                  )}
                >
                  <div className="space-y-5 text-sm">
                    {[
                      ['Situation', brief.situation, 'text-foreground'],
                      ['Needs attention', brief.attention, 'text-rose-600 dark:text-rose-400'],
                      ['Opportunities', brief.opportunities, 'text-emerald-600 dark:text-emerald-400'],
                      ['Recommended actions', brief.actions, 'text-primary'],
                    ].map(([heading, lines, tone]) => (
                      <div key={heading}>
                        <h4 className={`mb-2 text-xs font-bold uppercase tracking-wider ${tone}`}>{heading}</h4>
                        <ul className="space-y-1.5">
                          {lines.map((line, i) => (
                            <li key={i} className="flex gap-2 text-foreground/90"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" /><span>{line}</span></li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    <p className="border-t pt-3 text-xs text-muted-foreground">
                      Generated from live platform data ({brief.sampleSize} text contributions analysed). Figures change as members post and projects are published.
                    </p>
                  </div>
                </Panel>

                <Panel title="Ask the data" description="Answers are computed from the same live figures" icon={MessageSquare} className="lg:col-span-2">
                  <form onSubmit={(e) => { e.preventDefault(); ask(); }} className="flex gap-2">
                    <input
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Ask about sectors, regions, sentiment, capital…"
                      className="min-w-0 flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                    <Button type="submit" size="icon" disabled={!question.trim()} aria-label="Ask"><Send className="h-4 w-4" /></Button>
                  </form>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {SUGGESTED_QUESTIONS.map((q) => (
                      <button key={q} onClick={() => ask(q)} className="rounded-full border bg-background px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
                        {q}
                      </button>
                    ))}
                  </div>
                  <div className="mt-4 space-y-3">
                    {answers.length === 0 ? <p className="text-xs text-muted-foreground">Pick a question above or type your own.</p> : answers.map((a, i) => (
                      <div key={`${a.question}-${i}`} className="rounded-xl border bg-muted/40 p-3.5">
                        <p className="text-xs font-medium text-muted-foreground">{a.question}</p>
                        <p className="mt-1.5 text-sm font-semibold text-foreground">{a.title}</p>
                        <ul className="mt-1.5 space-y-1 text-sm text-foreground/90">
                          {a.lines.map((line, j) => <li key={j}>{line}</li>)}
                        </ul>
                        <p className="mt-2 text-[11px] text-muted-foreground">Based on {a.basis}.</p>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>
            )}

            {tab === 'sentiment' && (
              <>
                <div className="grid gap-5 lg:grid-cols-3">
                  <Panel title="Overall sentiment" description={`${s.total} posts, comments and circle answers`} icon={PieChart}>
                    {s.index === null ? <Empty>No contribution contains scorable language yet.</Empty> : (
                      <div className="space-y-4">
                        <div className="flex items-end gap-2">
                          <span className="text-4xl font-bold tracking-tight text-foreground">{s.index}</span>
                          <span className="pb-1 text-sm text-muted-foreground">/ 100 · 50 is neutral</span>
                        </div>
                        <SentimentMeter positive={s.positive} neutral={s.neutral} negative={s.negative} />
                        <p className="text-xs text-muted-foreground">
                          The index averages the {s.scored} contributions that contain sentiment-bearing words. The other {s.total - s.scored} are factual and counted as neutral.
                        </p>
                      </div>
                    )}
                  </Panel>
                  <Panel title="Weekly trend" description="Sentiment index per week" icon={Activity} className="lg:col-span-2">
                    {intel.trend.filter((w) => w.index !== null).length < 2 ? <Empty>At least two weeks of scored contributions are needed to draw a trend.</Empty> : (
                      <ResponsiveContainer width="100%" height={210}>
                        <AreaChart data={intel.trend.filter((w) => w.index !== null)} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
                          <defs>
                            <linearGradient id="sentimentFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                          <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                          <Tooltip {...chartTooltip} formatter={(value, _name, item) => [`${value}/100 (${item.payload.total} contributions)`, 'Index']} />
                          <Area type="monotone" dataKey="index" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#sentimentFill)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </Panel>
                </div>
                <div className="grid gap-5 lg:grid-cols-2">
                  <Panel title="By member type" icon={Users}>
                    <ul className="space-y-4">
                      {intel.segments.map((seg) => (
                        <li key={seg.id}>
                          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                            <span className="font-medium text-foreground">{seg.label} <span className="font-normal text-muted-foreground">· {seg.members} members</span></span>
                            <span className="text-xs text-muted-foreground">{seg.sentiment.index === null ? 'no scored text' : `${seg.sentiment.index}/100`} · n={seg.sentiment.total}</span>
                          </div>
                          <SentimentMeter positive={seg.sentiment.positive} neutral={seg.sentiment.neutral} negative={seg.sentiment.negative} compact />
                        </li>
                      ))}
                    </ul>
                  </Panel>
                  <Panel title="Reported difficulties" description="Topics found in negative contributions" icon={AlertTriangle}>
                    {intel.concerns.length === 0 ? <Empty>No negative contribution maps to a tracked concern area.</Empty> : (
                      <ul className="space-y-3">
                        {intel.concerns.map((c) => (
                          <li key={c.id} className="rounded-xl border p-3.5">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm font-semibold text-foreground">{c.label}</span>
                              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">{c.count} mention{c.count === 1 ? '' : 's'}</span>
                            </div>
                            {c.examples[0] && <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">“{c.examples[0].text}”</p>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </Panel>
                </div>
              </>
            )}

            {tab === 'voice' && (
              <Panel
                title="Voice of members"
                description="Every contribution with its sentiment reading and the words that drove it"
                icon={MessageSquare}
                action={(
                  <div className="flex gap-1 rounded-full bg-muted p-1">
                    {['all', 'positive', 'neutral', 'negative'].map((f) => (
                      <button key={f} onClick={() => setVoiceFilter(f)} className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${voiceFilter === f ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                        {f}{f !== 'all' && ` · ${s[f]}`}
                      </button>
                    ))}
                  </div>
                )}
              >
                {voice.length === 0 ? <Empty>Nothing in this view.</Empty> : (
                  <ul className="divide-y">
                    {voice.slice(0, 60).map((v) => (
                      <li key={v.id} className="py-3.5 first:pt-0 last:pb-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">{v.authorName || 'Member'}</span>
                          <span className="capitalize">· {v.kind === 'response' ? 'circle answer' : v.kind}</span>
                          {v.at && <span>· {formatDistanceToNow(v.at, { addSuffix: true })}</span>}
                          <SentimentBadge sentiment={v.sentiment} showScore />
                          {v.signal?.hasSignal && <span className="rounded-full border px-2 py-0.5 text-[10px] font-medium">{v.signal.intent}</span>}
                        </div>
                        <p className="mt-1.5 line-clamp-3 whitespace-pre-wrap text-sm text-foreground/90">{v.text}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                          {v.sentiment.positives.length > 0 && <span className="text-emerald-600 dark:text-emerald-400">+ {v.sentiment.positives.join(', ')}</span>}
                          {v.sentiment.negatives.length > 0 && <span className="text-rose-600 dark:text-rose-400">− {v.sentiment.negatives.join(', ')}</span>}
                          {v.href && <Link to={v.href} className="font-medium text-primary hover:underline">Open</Link>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {voice.length > 60 && <p className="mt-4 text-center text-xs text-muted-foreground">Showing the 60 most recent of {voice.length}.</p>}
              </Panel>
            )}

            {tab === 'sectors' && (
              <Panel title="Sector intelligence" description="Capital demand from published projects against investor coverage, with what members say about each sector" icon={Building2}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="pb-2.5 pr-4 font-medium">Sector</th>
                        <th className="pb-2.5 pr-4 text-right font-medium">Projects</th>
                        <th className="pb-2.5 pr-4 text-right font-medium">Capital sought</th>
                        <th className="pb-2.5 pr-4 text-right font-medium">Jobs</th>
                        <th className="pb-2.5 pr-4 text-right font-medium">Investors covering</th>
                        <th className="pb-2.5 pr-4 text-right font-medium">Mentions</th>
                        <th className="pb-2.5 font-medium">Sentiment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {intel.sectors.map((row) => (
                        <tr key={row.id}>
                          <td className="py-3 pr-4 font-medium text-foreground">{row.label}</td>
                          <td className="py-3 pr-4 text-right tabular-nums">{row.projects}</td>
                          <td className="py-3 pr-4 text-right tabular-nums">{row.capitalDemand ? fmtAmount(row.capitalDemand) : '—'}</td>
                          <td className="py-3 pr-4 text-right tabular-nums">{row.jobs ? row.jobs.toLocaleString('en-US') : '—'}</td>
                          <td className="py-3 pr-4 text-right tabular-nums">
                            {row.investors}
                            {row.projects > 0 && row.investors === 0 && <span className="ml-2 rounded-full bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">gap</span>}
                          </td>
                          <td className="py-3 pr-4 text-right tabular-nums">{row.mentions}</td>
                          <td className="py-3">
                            {row.sentiment.index === null ? <span className="text-xs text-muted-foreground">no data</span> : (
                              <span className="inline-flex items-center gap-2 text-xs">
                                <span className="font-semibold tabular-nums text-foreground">{row.sentiment.index}</span>
                                <span className="text-muted-foreground">n={row.sentiment.total}</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">“Gap” marks sectors where projects are published but no listed investor mandate covers them.</p>
              </Panel>
            )}

            {tab === 'regions' && (
              activeRegions.length === 0 ? <Empty>No project or member is located in a governorate yet.</Empty> : (
                <div className="grid gap-5 lg:grid-cols-5">
                  <Panel title="Governorates" description="Ranked by published projects" icon={MapPin} className="lg:col-span-2">
                    <ul className="space-y-1.5">
                      {activeRegions.map((r) => (
                        <li key={r.id}>
                          <button
                            onClick={() => setRegionId(r.id)}
                            className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors ${region?.id === r.id ? 'border-primary/40 bg-primary/5' : 'hover:bg-muted/60'}`}
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold text-foreground">{r.name}</span>
                              <span className="block text-[11px] text-muted-foreground">{r.region || 'Tunisia'}</span>
                            </span>
                            <span className="shrink-0 text-right text-xs text-muted-foreground">
                              <span className="block font-semibold text-foreground">{r.projects} project{r.projects === 1 ? '' : 's'}</span>
                              {r.capitalDemand ? fmtAmount(r.capitalDemand) : `${r.members} member${r.members === 1 ? '' : 's'}`}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </Panel>
                  {region && (
                    <Panel title={region.name} description={region.topSector ? `Lead sector: ${region.topSector}` : 'No published project yet'} icon={Landmark} className="lg:col-span-3">
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <Stat label="Projects" value={region.projects} />
                        <Stat label="Capital sought" value={fmtAmount(region.capitalDemand)} />
                        <Stat label="Planned jobs" value={region.jobs.toLocaleString('en-US')} />
                        <Stat label="Located members" value={region.members} />
                      </div>
                      <div className="mt-4 space-y-2">
                        {region.projectList.length === 0 ? <Empty>No published project in this governorate.</Empty> : region.projectList.map((p) => (
                          <Link key={p.id} to={`/investment-project/${p.id}`} className="flex items-center justify-between gap-3 rounded-xl border px-3.5 py-3 transition-colors hover:border-primary/40 hover:bg-muted/40">
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold text-foreground">{p.title}</span>
                              <span className="block truncate text-xs text-muted-foreground">{p.company_name}</span>
                            </span>
                            <span className="shrink-0 text-sm font-semibold text-emerald-600 dark:text-emerald-400">{fmtAmount(p.investment_required)}</span>
                          </Link>
                        ))}
                      </div>
                    </Panel>
                  )}
                </div>
              )
            )}

            {tab === 'opportunities' && (
              <div className="grid gap-5 lg:grid-cols-5">
                <Panel title="Fundable projects and their best investor fit" description="Each published project scored against every listed investor mandate" icon={Zap} className="lg:col-span-3"
                  action={<Button size="sm" className="gap-1.5" onClick={() => navigate('/matchmaker')}><Sparkles className="h-3.5 w-3.5" /> Open matchmaker</Button>}>
                  {intel.opportunities.length === 0 ? <Empty>No published project yet.</Empty> : (
                    <ul className="space-y-3">
                      {intel.opportunities.map((o) => (
                        <li key={o.id} className="rounded-xl border p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <Link to={o.href} className="text-sm font-semibold text-foreground hover:text-primary">{o.title}</Link>
                              <p className="mt-0.5 text-xs text-muted-foreground">{[o.company, o.city, o.sector].filter(Boolean).join(' · ')}</p>
                            </div>
                            <span className="shrink-0 text-sm font-bold text-emerald-600 dark:text-emerald-400">{fmtAmount(o.amount)}</span>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                            {o.bestInvestor ? (
                              <span>Best fit: <Link to={`/investment-network/${o.bestInvestor.slug || o.bestInvestor.id}`} className="font-semibold text-foreground hover:text-primary">{o.bestInvestor.name}</Link> <span className="font-semibold text-primary">{o.bestInvestor.score}%</span></span>
                            ) : <span>No investor listed yet</span>}
                            <span>{o.strongInvestors} strong · {o.goodInvestors} good fits</span>
                            <span>{o.interests ? `${o.interests} interest${o.interests === 1 ? '' : 's'} received` : 'No interest received yet'}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>
                <Panel title="Live signals from members" description="Recent posts expressing a funding, partnership or sourcing need" icon={Sparkles} className="lg:col-span-2">
                  {intel.memberSignals.length === 0 ? <Empty>No recent member signal.</Empty> : (
                    <ul className="space-y-3">
                      {intel.memberSignals.map((v) => (
                        <li key={v.id}>
                          <Link to={v.href} className="block rounded-xl border p-3.5 transition-colors hover:border-primary/40 hover:bg-muted/40">
                            <div className="flex flex-wrap items-center gap-2 text-[11px]">
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">{v.signal.intent}</span>
                              {v.signal.sector && <span className="text-muted-foreground">{v.signal.sector}</span>}
                              {v.signal.targetCountry && <span className="text-muted-foreground">→ {v.signal.targetCountry}</span>}
                            </div>
                            <p className="mt-1.5 line-clamp-2 text-sm text-foreground/90">{v.text}</p>
                            <p className="mt-1 text-[11px] text-muted-foreground">{v.authorName || 'Member'}{v.at ? ` · ${formatDistanceToNow(v.at, { addSuffix: true })}` : ''}</p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
