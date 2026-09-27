import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, ArrowRight, Users, TrendingUp, Layers, Coins, Plus } from 'lucide-react';
import { formatMTND, formatNumber, sectorIcon } from '@/lib/investment';
import ProjectSubmitForm from '@/components/investment/ProjectSubmitForm';

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border bg-background p-3">
      <Icon className="w-4 h-4 text-primary mb-1.5" />
      <div className="text-lg font-bold leading-tight">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

export default function GovernoratePanel({ governorate, projects = [], sectors = [], onExplore, onClose }) {
  const [showSubmit, setShowSubmit] = useState(false);

  if (!governorate) {
    return (
      <div className="rounded-2xl border bg-card p-6 h-full flex flex-col items-center justify-center text-center min-h-[280px]">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <MapPin className="w-7 h-7 text-primary" />
        </div>
        <h3 className="font-semibold mb-1">Select a governorate</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Open the Tunisia map to see project density by governorate, then click a governorate to explore its investment opportunities.
        </p>
      </div>
    );
  }

  const total = projects.length;
  const totalInv = projects.reduce((s, p) => s + (p.investment_required || 0), 0);
  const avg = total ? totalInv / total : 0;
  const ready = projects.filter((p) => p.investment_stage === 'READY_FOR_INVESTMENT' || p.investment_stage === 'FUNDING_OPEN').length;

  const sectorCounts = {};
  projects.forEach((p) => { sectorCounts[p.sector_id] = (sectorCounts[p.sector_id] || 0) + 1; });
  const sectorRows = sectors
    .map((s) => ({ s, n: sectorCounts[s.id] || 0 }))
    .filter((r) => r.n > 0)
    .sort((a, b) => b.n - a.n);
  const maxN = Math.max(1, ...sectorRows.map((r) => r.n));

  const seeking = { EQUITY_INVESTOR: 0, STRATEGIC_PARTNER: 0, DEBT_FINANCING: 0, JOINT_VENTURE: 0 };
  projects.forEach((p) => (p.seeking || []).forEach((k) => { if (k in seeking) seeking[k] += 1; }));

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border bg-card p-6 h-full flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-primary">{governorate.region}</div>
          <h3 className="text-2xl font-bold">{governorate.name}</h3>
          <div className="text-xs text-muted-foreground mt-0.5">{governorate.name_fr} · {governorate.code}</div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors" aria-label="Close">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <Stat icon={Layers} label="Investment projects" value={formatNumber(total)} />
        <Stat icon={Coins} label="Total investment" value={formatMTND(Math.round(totalInv))} />
        <Stat icon={TrendingUp} label="Avg. project size" value={formatMTND(Math.round(avg))} />
        <Stat icon={MapPin} label="Investment ready" value={formatNumber(ready)} />
      </div>

      {sectorRows.length > 0 && (
        <div className="mb-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Projects by sector</div>
          <div className="space-y-2.5">
            {sectorRows.map(({ s, n }) => {
              const Icon = sectorIcon(s.icon);
              return (
                <div key={s.id} className="flex items-center gap-3">
                  <Icon className="w-4 h-4 flex-shrink-0" style={{ color: s.color }} />
                  <span className="text-sm w-32 truncate">{s.name}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(n / maxN) * 100}%`, background: s.color }} />
                  </div>
                  <span className="text-sm font-semibold w-6 text-right">{n}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mb-5">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Seeking</div>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(seeking).map(([k, v]) => (
            <div key={k} className="flex items-center justify-between rounded-lg border px-3 py-2">
              <span className="text-xs capitalize text-muted-foreground">{k.replace(/_/g, ' ').toLowerCase()}</span>
              <span className="text-sm font-semibold">{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto space-y-2 pt-1">
        <button
          onClick={() => setShowSubmit(true)}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/5 text-primary font-semibold py-3 hover:bg-primary/10 transition-colors"
        >
          <Plus className="w-4 h-4" /> Submit a project here
        </button>
        <button
          onClick={() => onExplore && onExplore(governorate.id)}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-semibold py-3 hover:opacity-90 transition-opacity"
        >
          <Users className="w-4 h-4" /> Explore {total} projects <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <ProjectSubmitForm
        open={showSubmit}
        onClose={() => setShowSubmit(false)}
        governorate={governorate}
        sectors={sectors}
      />
    </motion.div>
  );
}
