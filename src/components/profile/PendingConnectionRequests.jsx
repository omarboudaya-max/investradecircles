import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { UserCheck, UserX } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useToast } from '@/components/ui/use-toast';

/**
 * Incoming connection requests with Accept / Decline.
 *
 * `limit` shows a short list with a "Show all" toggle. The home feed uses it so that
 * phones and tablets (where the right-hand panel is hidden) can answer requests too.
 */
export default function PendingConnectionRequests({ limit = 0, className = 'mb-6' }) {
  const { user } = useAuth();
  const t = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);

  const { data: pendingConns = [] } = useQuery({
    queryKey: ['pending-connections', user?.id],
    queryFn: async () => {
      const { data: conns, error } = await supabase
        .from('Connection')
        .select('*')
        .match({ recipient_id: user?.id, status: 'pending' })
        .order('created_date', { ascending: false });

      if (error) throw error;
      if (!conns || conns.length === 0) return [];

      const requesterIds = conns.map((c) => c.requester_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, headline')
        .in('id', requesterIds);

      return conns.map((conn) => ({
        ...conn,
        requesterProfile: profiles?.find((p) => p.id === conn.requester_id) || {},
      }));
    },
    enabled: !!user?.id,
    refetchInterval: 15000,
  });

  const updateRequest = useMutation({
    mutationFn: async ({ id, status }) => {
      const { error } = await supabase.from('Connection').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-connections', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['right-conns-received', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['profile-conns-received', user?.id] });
    },
    onError: (error) => toast({ title: t.connections?.updateFailed || 'Could not update the request', description: error.message, variant: 'destructive' }),
  });

  if (pendingConns.length === 0) return null;

  const visible = limit > 0 && !expanded ? pendingConns.slice(0, limit) : pendingConns;
  const hiddenCount = pendingConns.length - visible.length;

  return (
    <div className={className}>
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center justify-between">
        {t.connections?.requestsTitle || 'Connection Requests'}
        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendingConns.length}</span>
      </h3>
      <div className="space-y-2">
        {visible.map((conn) => {
          const s = conn.requesterProfile;
          const name = s.full_name || 'User';
          return (
            <div key={conn.id} className="flex flex-col gap-2 p-3 bg-blue-50/50 border border-blue-100 dark:bg-blue-950/30 dark:border-blue-900 rounded-xl">
              <div className="flex items-center gap-3">
                <Link to={`/profile/${conn.requester_id}`} className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-sm font-bold overflow-hidden shrink-0">
                  {s.avatar_url
                    ? <img src={s.avatar_url} alt="" className="w-full h-full object-cover" />
                    : name.charAt(0).toUpperCase()}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/profile/${conn.requester_id}`} className="hover:underline">
                    <p className="text-sm font-medium truncate">{name}</p>
                  </Link>
                  {s.headline && <p className="text-xs text-muted-foreground truncate">{s.headline}</p>}
                </div>
              </div>
              <div className="flex gap-2 w-full mt-1">
                <Button
                  size="sm"
                  className="flex-1 h-8 rounded-full bg-primary"
                  disabled={updateRequest.isPending}
                  onClick={() => updateRequest.mutate({ id: conn.id, status: 'accepted' })}
                >
                  <UserCheck className="w-4 h-4 mr-1.5" /> {t.pendingInvites?.accept || 'Accept'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 rounded-full text-destructive border-destructive/30 hover:bg-destructive/10"
                  disabled={updateRequest.isPending}
                  onClick={() => updateRequest.mutate({ id: conn.id, status: 'rejected' })}
                >
                  <UserX className="w-4 h-4 mr-1.5" /> {t.pendingInvites?.decline || 'Decline'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      {(hiddenCount > 0 || (limit > 0 && expanded && pendingConns.length > limit)) && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 w-full text-xs font-semibold text-primary hover:underline py-1.5"
        >
          {expanded
            ? (t.connections?.showFewer || 'Show fewer')
            : (t.connections?.showAll ? t.connections.showAll(pendingConns.length) : `Show all ${pendingConns.length} requests`)}
        </button>
      )}
    </div>
  );
}
