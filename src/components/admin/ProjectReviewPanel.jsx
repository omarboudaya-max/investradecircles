import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Check, X, RotateCcw, Clock, CheckCircle2, XCircle, FolderKanban, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { CACHE } from '@/lib/query-client';
import { formatMTND } from '@/lib/investment';

const STATUS_META = {
  SUBMITTED: { label: 'Awaiting review', cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800', icon: Clock },
  PUBLISHED: { label: 'Live on map', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800', icon: CheckCircle2 },
  REJECTED: { label: 'Rejected', cls: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800', icon: XCircle },
};

const metaFor = (status) =>
  STATUS_META[status] || {
    label: status ? status.replace(/_/g, ' ').toLowerCase() : '—',
    cls: 'bg-muted text-muted-foreground border-border',
    icon: FolderKanban,
  };

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'SUBMITTED', label: 'Awaiting review' },
  { id: 'PUBLISHED', label: 'Live on map' },
  { id: 'REJECTED', label: 'Rejected' },
];

export default function ProjectReviewPanel({ search = '', addAuditLog }) {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['admin-projects-all'],
    queryFn: () => base44.entities.InvestmentProject.list('-created_date', 200),
    staleTime: CACHE.short,
  });
  const { data: governorates = [] } = useQuery({
    queryKey: ['admin-inv-governorates'],
    queryFn: () => base44.entities.Governorate.list('-created_date', 50),
    staleTime: CACHE.medium,
  });
  const { data: sectors = [] } = useQuery({
    queryKey: ['admin-inv-sectors'],
    queryFn: () => base44.entities.Sector.list('-created_date', 50),
    staleTime: CACHE.medium,
  });

  const review = useMutation({
    mutationFn: ({ id, status }) => base44.entities.InvestmentProject.update(id, { project_status: status }),
    onSuccess: (_, vars) => {
      const action =
        vars.status === 'PUBLISHED' ? 'project_approved' : vars.status === 'REJECTED' ? 'project_rejected' : 'project_reopened';
      const verb =
        vars.status === 'PUBLISHED' ? 'Approved' : vars.status === 'REJECTED' ? 'Rejected' : 'Returned to review';
      if (addAuditLog) addAuditLog(action, `${verb} investment project ${vars.id}`);
      queryClient.invalidateQueries({ queryKey: ['admin-projects-all'] });
      queryClient.invalidateQueries({ queryKey: ['investment-projects'] });
    },
  });

  const counts = { all: projects.length, SUBMITTED: 0, PUBLISHED: 0, REJECTED: 0 };
  projects.forEach((p) => {
    if (counts[p.project_status] !== undefined) counts[p.project_status] += 1;
  });

  const q = search.trim().toLowerCase();
  const visible = projects.filter((p) => {
    if (statusFilter !== 'all' && p.project_status !== statusFilter) return false;
    if (q && !`${p.title || ''} ${p.company_name || ''}`.toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setStatusFilter(f.id)}
            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === f.id ? 'border-primary/30 bg-primary/10 text-primary font-bold' : 'bg-card text-muted-foreground hover:text-foreground'
            }`}
          >
            {f.label}
            <span className="rounded-full bg-background/70 px-1.5 text-[11px] font-semibold">{counts[f.id] || 0}</span>
          </button>
        ))}
      </div>

      <div className="bg-card border rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b text-xs text-muted-foreground font-medium">
          {visible.length} of {projects.length} submissions
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : visible.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">No submissions in this view</p>
        ) : (
          <div className="divide-y">
            {visible.map((p) => {
              const meta = metaFor(p.project_status);
              const Icon = meta.icon;
              const gov = governorates.find((g) => g.id === p.governorate_id);
              const sec = sectors.find((s) => s.id === p.sector_id);
              return (
                <div key={p.id} className="flex items-start gap-3 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">{p.title}</p>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${meta.cls}`}>
                        <Icon className="w-3 h-3" /> {meta.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.company_name || '—'} · {sec?.name || '—'} · {gov?.name || '—'} · {formatMTND(p.investment_required)}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      submitted {p.created_date ? format(new Date(p.created_date), 'MMM d, yyyy HH:mm') : '—'}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {p.project_status !== 'PUBLISHED' && (
                      <Button size="sm" className="h-7 text-xs gap-1" disabled={review.isPending}
                        onClick={() => review.mutate({ id: p.id, status: 'PUBLISHED' })}>
                        <Check className="w-3 h-3" /> Approve
                      </Button>
                    )}
                    {p.project_status === 'REJECTED' && (
                      <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" disabled={review.isPending}
                        onClick={() => review.mutate({ id: p.id, status: 'SUBMITTED' })}>
                        <RotateCcw className="w-3 h-3" /> Reopen
                      </Button>
                    )}
                    {p.project_status !== 'REJECTED' && (
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" disabled={review.isPending}
                        onClick={() => review.mutate({ id: p.id, status: 'REJECTED' })}>
                        <X className="w-3 h-3" /> Reject
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
