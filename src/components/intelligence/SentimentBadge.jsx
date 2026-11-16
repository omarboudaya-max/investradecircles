import React from 'react';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';

const STYLES = {
  positive: { icon: TrendingUp, label: 'Positive', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900' },
  neutral: { icon: Minus, label: 'Neutral', cls: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700' },
  negative: { icon: TrendingDown, label: 'Negative', cls: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900' },
};

/**
 * Compact sentiment chip.
 * Accepts either an analysis result ({ label, score, confidence }) or a bare label + score.
 */
export default function SentimentBadge({ sentiment, label, score, showScore = false, className = '' }) {
  const resolvedLabel = sentiment?.label || label;
  if (!resolvedLabel) return null;
  const resolvedScore = sentiment?.score ?? score;
  const style = STYLES[resolvedLabel] || STYLES.neutral;
  const Icon = style.icon;
  const title = sentiment?.confidence !== undefined
    ? `Sentiment ${resolvedScore > 0 ? '+' : ''}${Number(resolvedScore).toFixed(2)} · confidence ${Math.round(sentiment.confidence * 100)}%`
    : undefined;
  return (
    <span title={title} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${style.cls} ${className}`}>
      <Icon className="h-3 w-3" /> {style.label}
      {showScore && resolvedScore !== undefined && resolvedScore !== null && Number(resolvedScore) !== 0 && (
        <span className="opacity-70">{resolvedScore > 0 ? '+' : ''}{Number(resolvedScore).toFixed(2)}</span>
      )}
    </span>
  );
}

/** Stacked positive / neutral / negative bar with counts. */
export function SentimentMeter({ positive = 0, neutral = 0, negative = 0, compact = false }) {
  const total = positive + neutral + negative;
  if (!total) return <div className="h-2 rounded-full bg-muted" />;
  const pct = (n) => `${(n / total) * 100}%`;
  return (
    <div>
      <div className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-muted">
        {positive > 0 && <div className="bg-emerald-500 transition-all duration-500" style={{ width: pct(positive) }} />}
        {neutral > 0 && <div className="bg-slate-300 transition-all duration-500 dark:bg-slate-600" style={{ width: pct(neutral) }} />}
        {negative > 0 && <div className="bg-rose-500 transition-all duration-500" style={{ width: pct(negative) }} />}
      </div>
      {!compact && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <span className="font-medium text-emerald-600 dark:text-emerald-400">{positive} positive</span>
          <span className="text-muted-foreground">{neutral} neutral</span>
          <span className="font-medium text-rose-600 dark:text-rose-400">{negative} negative</span>
        </div>
      )}
    </div>
  );
}
