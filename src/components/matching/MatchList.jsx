import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, ChevronDown, ChevronUp, FileText, Landmark, Loader2, Send, ShieldCheck, Target, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/AuthContext';
import { requestIntroduction } from '@/api/platform';

export const KIND_META = {
  investor_org: { label: 'Investor', icon: Landmark, group: 'investors' },
  fund: { label: 'Fund', icon: Landmark, group: 'investors' },
  project: { label: 'Project', icon: Target, group: 'projects' },
  post: { label: 'Post', icon: FileText, group: 'posts' },
  member: { label: 'Member', icon: User, group: 'members' },
};

export const TIER_STYLES = {
  strong: 'text-emerald-600 dark:text-emerald-400',
  good: 'text-primary',
  partial: 'text-amber-600 dark:text-amber-400',
  weak: 'text-muted-foreground',
};

export function ScoreRing({ score, tier, size = 56 }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className={`relative shrink-0 ${TIER_STYLES[tier.id]}`} style={{ width: size, height: size }} title={tier.label}>
      <svg viewBox="0 0 52 52" className="-rotate-90" style={{ width: size, height: size }}>
        <circle cx="26" cy="26" r={radius} fill="none" strokeWidth="4" className="stroke-muted" />
        <circle cx="26" cy="26" r={radius} fill="none" strokeWidth="4" strokeLinecap="round" stroke="currentColor"
          strokeDasharray={circumference} strokeDashoffset={circumference * (1 - score / 100)} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{score}</span>
    </div>
  );
}

/**
 * Ranked matches with a transparent score breakdown and a working
 * "request an introduction" flow. Shared by the matchmaker and by circles.
 */
export default function MatchList({ matches, context = {}, compact = false }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(null);
  const [introFor, setIntroFor] = useState(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [requested, setRequested] = useState(() => new Set());

  const openIntro = (match) => {
    if (!user) {
      toast({ title: 'Sign in to request an introduction', description: 'Create a free account so the other party knows who is asking.' });
      navigate('/login');
      return;
    }
    setIntroFor(match);
    setMessage('');
  };

  const send = async () => {
    if (!introFor) return;
    setSending(true);
    try {
      const result = await requestIntroduction({ user, match: introFor, message, context });
      setRequested((prev) => new Set(prev).add(introFor.id));
      toast({
        title: result.duplicate ? 'You already asked for this introduction' : 'Introduction requested',
        description: result.deliveredTo === 'owner'
          ? `${introFor.title} has been notified and can reply to you directly.`
          : 'This listing has no account owner yet, so the Investraders team has been asked to broker the introduction.',
      });
      setIntroFor(null);
    } catch (error) {
      toast({ title: 'Could not send the request', description: error.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <ul className="space-y-3">
        {matches.map((m) => {
          const meta = KIND_META[m.kind];
          const open = expanded === m.id;
          const done = requested.has(m.id);
          return (
            <li key={m.id} className={`rounded-2xl border bg-card transition-shadow hover:shadow-sm ${compact ? 'p-3.5' : 'p-4 sm:p-5'}`}>
              <div className="flex items-start gap-3 sm:gap-4">
                <ScoreRing score={m.matchScore} tier={m.tier} size={compact ? 46 : 56} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={m.href} className={`font-semibold text-foreground hover:text-primary ${compact ? 'text-sm' : 'text-base'}`}>{m.title}</Link>
                    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      <meta.icon className="h-3 w-3" /> {meta.label}
                    </span>
                    {m.verified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <ShieldCheck className="h-3 w-3" /> Verified
                      </span>
                    )}
                    {m.illustrative && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-300" title="Example listing — not yet confirmed by the organisation">
                        Illustrative listing
                      </span>
                    )}
                  </div>
                  {m.subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{m.subtitle}</p>}
                  {m.description && <p className="mt-2 line-clamp-2 text-sm text-foreground/80">{m.description}</p>}
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span className={`text-xs font-semibold ${TIER_STYLES[m.tier.id]}`}>{m.tier.label}</span>
                    {m.ticketLabel && <span className="text-xs text-muted-foreground">{m.ticketLabel}</span>}
                    <button onClick={() => setExpanded(open ? null : m.id)} className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground" aria-expanded={open}>
                      Why this score {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                    <div className="ml-auto flex items-center gap-2">
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => navigate(m.href)}>
                        View <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" className="gap-1.5" disabled={done} onClick={() => openIntro(m)}>
                        {done ? <><Check className="h-3.5 w-3.5" /> Requested</> : <><Send className="h-3.5 w-3.5" /> Request intro</>}
                      </Button>
                    </div>
                  </div>

                  {open && (
                    <div className="mt-4 space-y-2.5 rounded-xl bg-muted/50 p-4">
                      {m.breakdown.map((b) => (
                        <div key={b.key}>
                          <div className="flex items-baseline justify-between gap-3 text-xs">
                            <span className="font-semibold text-foreground">{b.label}</span>
                            <span className="tabular-nums text-muted-foreground">{b.earned} / {b.weight}</span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-background">
                            <div className={`h-full rounded-full ${b.status === 'match' ? 'bg-emerald-500' : b.status === 'partial' ? 'bg-amber-500' : 'bg-rose-400'}`} style={{ width: `${Math.max(3, (b.earned / b.weight) * 100)}%` }} />
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{b.detail}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <Dialog open={Boolean(introFor)} onOpenChange={(isOpen) => !isOpen && setIntroFor(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Request an introduction</DialogTitle>
            <DialogDescription>{introFor?.title}{introFor ? ` · ${introFor.matchScore}% match` : ''}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <Textarea
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={2000}
              placeholder="Introduce yourself in two or three sentences: who you are, what you are looking for and why this is a fit."
            />
            <p className="text-xs text-muted-foreground">
              {introFor?.ownerUserId
                ? 'The owner of this listing is notified and can view your profile and reply.'
                : 'This listing is not yet managed by an account, so the Investraders team will broker the introduction.'}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIntroFor(null)} disabled={sending}><X className="mr-1.5 h-4 w-4" /> Cancel</Button>
            <Button onClick={send} disabled={sending}>
              {sending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />} Send request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
