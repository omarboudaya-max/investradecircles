import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

/**
 * Admin-only shortcut showing how many investment projects are waiting for review.
 */
export default function PendingReviewAlert() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const { data: count = 0 } = useQuery({
    queryKey: ['admin-pending-projects-count'],
    queryFn: async () => {
      const all = await base44.entities.InvestmentProject.list();
      return all.filter((p) => p.project_status === 'SUBMITTED').length;
    },
    enabled: isAdmin,
    refetchInterval: 60000,
    staleTime: 30000,
  });

  if (!isAdmin) return null;

  return (
    <button
      onClick={() => navigate('/admin?tab=Projects')}
      title="Projects awaiting your review"
      aria-label={`${count} projects awaiting review`}
      className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors relative cursor-pointer"
    >
      <ClipboardList className="w-4 h-4 text-white" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-amber-400 text-slate-900 text-[10px] rounded-full flex items-center justify-center font-bold">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
}
