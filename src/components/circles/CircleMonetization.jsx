import React from 'react';
import { Lock, Users } from 'lucide-react';

const MILESTONES = [
  {
    tier: 'advertisement',
    title: 'Advertisement Ready',
    description: 'Allow targeted, community-relevant ads and earn revenue.',
    threshold: 25,
    color: '#4A90E2',
    bgColor: '#D1E4FF',
    labelBg: 'bg-[#D1E4FF]',
    iconColor: 'text-[#4A90E2]',
    barColor: 'bg-[#4A90E2]',
    trackColor: 'bg-[#D1E4FF]',
    textColor: 'text-[#4A90E2]',
  },
  {
    tier: 'sponsorship',
    title: 'Brand Sponsorship',
    description: 'Brands sponsor your circle based on topic relevance.',
    threshold: 75,
    color: '#9B51E0',
    bgColor: '#F3E5FF',
    labelBg: 'bg-[#F3E5FF]',
    iconColor: 'text-[#9B51E0]',
    barColor: 'bg-[#9B51E0]',
    trackColor: 'bg-[#F3E5FF]',
    textColor: 'text-[#9B51E0]',
  },
  {
    tier: 'workspace',
    title: 'Professional Workspace',
    description: 'Upgrade to a workspace — sell services, goods, and more.',
    threshold: 200,
    color: '#27AE60',
    bgColor: '#D4F4E4',
    labelBg: 'bg-[#D4F4E4]',
    iconColor: 'text-[#27AE60]',
    barColor: 'bg-[#27AE60]',
    trackColor: 'bg-[#D4F4E4]',
    textColor: 'text-[#27AE60]',
  },
];

function ProgressBar({ current, threshold, barColor, trackColor }) {
  const pct = Math.min((current / threshold) * 100, 100);
  return (
    <div className="space-y-1.5">
      <div className={`h-2 rounded-full overflow-hidden ${trackColor}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
      <p className="text-xs text-[#777777]">
        {current} / {threshold} members
      </p>
    </div>
  );
}

export default function CircleMonetization({ memberCount }) {
  const unlocked = MILESTONES.filter((m) => memberCount >= m.threshold);
  const locked = MILESTONES.filter((m) => memberCount < m.threshold);

  return (
    <div className="rounded-2xl border overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between" style={{ background: '#FFF9F0' }}>
        <div>
          <h3 className="text-sm font-bold text-[#6B4F26] flex items-center gap-1.5">
            💰 Make Money Meanwhile
          </h3>
          <p className="text-xs text-[#8C6D3D] mt-0.5">
            Grow your circle to unlock revenue opportunities
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[11px] text-[#8C6D3D]">Current members</p>
          <p className="text-2xl font-bold text-[#6B4F26]">{memberCount}</p>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white px-5 py-4 space-y-5">
        {locked.map((m) => {
          const remaining = m.threshold - memberCount;
          return (
            <div key={m.tier} className="flex items-start gap-3">
              {/* Lock icon */}
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${m.labelBg}`}>
                <Lock className={`w-4 h-4 ${m.iconColor}`} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{m.title}</p>
                    <p className="text-xs text-[#666666] mt-0.5">{m.description}</p>
                  </div>
                  <span className="text-xs text-[#777777] whitespace-nowrap shrink-0">
                    {remaining} more member{remaining !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="mt-2">
                  <ProgressBar
                    current={memberCount}
                    threshold={m.threshold}
                    barColor={m.barColor}
                    trackColor={m.trackColor}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {unlocked.length > 0 && (
          <div className="space-y-3 border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-[#27AE60] uppercase tracking-wide">
              ✓ Unlocked
            </p>
            {unlocked.map((m) => (
              <div key={m.tier} className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${m.labelBg}`}>
                  <Users className={`w-4 h-4 ${m.iconColor}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{m.title}</p>
                  <p className="text-xs text-[#666666]">{m.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
        <p className="text-xs text-[#6B6B6B] italic text-center">
          Keep engaging your community — your circle is building value ✨
        </p>
      </div>
    </div>
  );
}