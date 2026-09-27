import React from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { STAGE_LABELS, TYPE_LABELS, SIZE_BANDS } from '@/lib/investment';

const selectCls = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

export default function FilterBar({ filters, setFilters, governorates, sectors, resultCount }) {
  const update = (k, v) => setFilters((f) => ({ ...f, [k]: v }));
  const clear = () => setFilters({
    search: '', governorateId: 'all', sectorId: 'all', sizeBand: 'all', stage: 'all', type: 'all', verifiedOnly: false,
  });
  const active = filters.search || filters.governorateId !== 'all' || filters.sectorId !== 'all'
    || filters.sizeBand !== 'all' || filters.stage !== 'all' || filters.type !== 'all' || filters.verifiedOnly;

  return (
    <div className="rounded-2xl border bg-card p-4 sm:p-5">
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={filters.search}
            onChange={(e) => update('search', e.target.value)}
            placeholder="Search project, company, sector or location..."
            className={`${selectCls} pl-9`}
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap lg:px-2">
          <SlidersHorizontal className="w-4 h-4" /> {resultCount} results
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-3">
        <select value={filters.governorateId} onChange={(e) => update('governorateId', e.target.value)} className={selectCls}>
          <option value="all">All Governorates</option>
          {governorates.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <select value={filters.sectorId} onChange={(e) => update('sectorId', e.target.value)} className={selectCls}>
          <option value="all">All Sectors</option>
          {sectors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={filters.sizeBand} onChange={(e) => update('sizeBand', e.target.value)} className={selectCls}>
          {SIZE_BANDS.map((b) => <option key={b.id} value={b.id}>{b.id === 'all' ? 'Any Investment Size' : b.label}</option>)}
        </select>
        <select value={filters.stage} onChange={(e) => update('stage', e.target.value)} className={selectCls}>
          <option value="all">Any Stage</option>
          {Object.entries(STAGE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={filters.type} onChange={(e) => update('type', e.target.value)} className={selectCls}>
          <option value="all">Any Project Type</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="flex items-center justify-between mt-3">
        <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={filters.verifiedOnly} onChange={(e) => update('verifiedOnly', e.target.checked)} className="rounded border-input" />
          Verified projects only
        </label>
        {active && (
          <button onClick={clear} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-3.5 h-3.5" /> Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
