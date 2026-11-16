import React, { useMemo } from 'react';
import { Activity, MessageSquare, Sparkles, Users } from 'lucide-react';
import { useIntelligence } from '@/hooks/useIntelligence';
import { SentimentMeter } from '@/components/intelligence/SentimentBadge';

/**
 * A short, factual summary of a circle's activity.
 * Every number is counted from the circle's own members, posts and answers.
 */
export default function CircleInsights({ circle }) {
  const { intel, isLoading } = useIntelligence({ circle });

  const topIntents = useMemo(() => (intel ? intel.intents.slice(0, 3) : []), [intel]);

  if (!circle || isLoading || !intel) return null;
  const { kpis, sentiment } = intel;
  // Nothing to summarise yet — do not render an empty dashboard.
  if (kpis.contributions === 0) return null;

  const stats = [
    { icon: Users, label: 'Members', value: kpis.members },
    { icon: MessageSquare, label: 'Contributions', value: kpis.contributions },
    { icon: Sparkles, label: 'Business signals', value: kpis.signals },
    { icon: Activity, label: 'Sentiment', value: sentiment.index === null ? '—' : `${sentiment.index}/100` },
  ];

  return (
    <section className="mb-4 rounded-2xl border bg-card p-4" aria-label="Circle activity summary">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground"><s.icon className="h-3.5 w-3.5" /> {s.label}</p>
            <p className="mt-0.5 text-lg font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>
      {sentiment.total > 0 && (
        <div className="mt-3">
          <SentimentMeter positive={sentiment.positive} neutral={sentiment.neutral} negative={sentiment.negative} compact />
        </div>
      )}
      {topIntents.length > 0 && (
        <p className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          Members are posting about:
          {topIntents.map((intent) => (
            <span key={intent.id} className="rounded-full border bg-background px-2 py-0.5 font-medium text-foreground">
              {intent.label} · {intent.count}
            </span>
          ))}
        </p>
      )}
    </section>
  );
}
