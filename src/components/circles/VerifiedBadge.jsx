import React from 'react';
import { ShieldCheck } from 'lucide-react';

/**
 * Shows a "Verified" badge for official institutional circles.
 * size: 'sm' | 'md' | 'lg'
 * label: optional custom label (e.g. "Chamber of Commerce")
 * dark: true when rendered on dark backgrounds (institutional cards)
 */
export default function VerifiedBadge({ label, size = 'md', dark = false }) {
  const sizeClasses = {
    sm: 'text-[9px] px-1.5 py-0.5 gap-0.5',
    md: 'text-[10px] px-2 py-0.5 gap-1',
    lg: 'text-xs px-3 py-1 gap-1',
  };
  const iconSize = { sm: 10, md: 12, lg: 14 }[size];

  if (dark) {
    return (
      <span
        className={`inline-flex items-center font-bold rounded-full border ${sizeClasses[size]}`}
        style={{
          background: 'rgba(251,191,36,0.15)',
          borderColor: 'rgba(251,191,36,0.4)',
          color: '#fcd34d',
        }}
        title="Verified Official Circle"
      >
        <ShieldCheck style={{ width: iconSize, height: iconSize }} />
        {label || 'Verified'}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full border ${sizeClasses[size]}`}
      style={{
        background: 'linear-gradient(135deg,#eff6ff,#dbeafe)',
        borderColor: '#3b82f6',
        color: '#1d4ed8',
      }}
      title="Verified Official Circle"
    >
      <ShieldCheck style={{ width: iconSize, height: iconSize, color: '#2563eb' }} />
      {label || 'Verified'}
    </span>
  );
}