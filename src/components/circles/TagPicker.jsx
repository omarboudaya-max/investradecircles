import React from 'react';

export const FINANCE_TAGS = [
  { value: 'stocks', label: '📈 Stocks' },
  { value: 'crypto', label: '₿ Crypto' },
  { value: 'real_estate', label: '🏠 Real Estate' },
  { value: 'etfs', label: '📊 ETFs' },
  { value: 'options', label: '⚡ Options' },
  { value: 'dividends', label: '💰 Dividends' },
  { value: 'bonds', label: '🏦 Bonds' },
  { value: 'forex', label: '💱 Forex' },
  { value: 'commodities', label: '🌾 Commodities' },
  { value: 'startups', label: '🚀 Startups' },
  { value: 'personal_finance', label: '🧾 Personal Finance' },
  { value: 'macro', label: '🌍 Macro' },
];

export const TAG_COLORS = {
  stocks: 'bg-blue-100 text-blue-700 border-blue-200',
  crypto: 'bg-orange-100 text-orange-700 border-orange-200',
  real_estate: 'bg-purple-100 text-purple-700 border-purple-200',
  etfs: 'bg-green-100 text-green-700 border-green-200',
  options: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  dividends: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  bonds: 'bg-slate-100 text-slate-700 border-slate-200',
  forex: 'bg-pink-100 text-pink-700 border-pink-200',
  commodities: 'bg-amber-100 text-amber-700 border-amber-200',
  startups: 'bg-red-100 text-red-700 border-red-200',
  personal_finance: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  macro: 'bg-indigo-100 text-indigo-700 border-indigo-200',
};

export function TagBadge({ tag }) {
  const config = FINANCE_TAGS.find((t) => t.value === tag);
  const color = TAG_COLORS[tag] || 'bg-gray-100 text-gray-700 border-gray-200';
  return (
    <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border ${color}`}>
      {config?.label || tag}
    </span>
  );
}

export default function TagPicker({ selected = [], onChange, max = 5 }) {
  const toggle = (value) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else if (selected.length < max) {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {FINANCE_TAGS.map((tag) => {
        const active = selected.includes(tag.value);
        const disabled = !active && selected.length >= max;
        return (
          <button
            key={tag.value}
            type="button"
            disabled={disabled}
            onClick={() => toggle(tag.value)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
              active
                ? `${TAG_COLORS[tag.value]} ring-2 ring-offset-1 ring-current/30 scale-105`
                : disabled
                ? 'bg-muted/50 text-muted-foreground border-border opacity-50 cursor-not-allowed'
                : 'bg-muted/30 text-muted-foreground border-border hover:bg-muted'
            }`}
          >
            {tag.label}
          </button>
        );
      })}
      {selected.length >= max && (
        <p className="w-full text-xs text-muted-foreground mt-1">Max {max} tags selected</p>
      )}
    </div>
  );
}