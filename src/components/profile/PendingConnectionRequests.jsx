import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { UserCheck, UserX } from 'lucide-react';

export default function PendingConnectionRequests() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: pendingConns = [] } = useQuery({
    queryKey: ['pending-connections', user?.id],
    queryFn: async () => {
      const { data: conns, error } = await supabase
        .from('Connection')
        .select('*')
        .match({ recipient_id: user?.id, status: 'pending' });
      
      if (error) throw error;
      if (!conns || conns.length === 0) return [];

      const requesterIds = conns.map(c => c.requester_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', requesterIds);

      return conns.map(conn => ({
        ...conn,
        requesterProfile: profiles?.find(p => p.id === conn.requester_id) || {}
      }));
    },
    enabled: !!user?.id,
    refetchInterval: 15000,
  });

  const updateRequest = useMutation({
    mutationFn: ({ id, status }) => supabase.from('Connection').update({ status }).eq('id', id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-connections', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['right-conns-received', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['profile-conns-received', user?.id] });
    },
  });

  if (pendingConns.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center justify-between">
        Connection Requests
        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendingConns.length}</span>
      </h3>
      <div className="space-y-2">
        {pendingConns.map((conn) => {
          const s = conn.requesterProfile;
          return (
            <div key={conn.id} className="flex flex-col gap-2 p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
              <div className="flex items-center gap-3">
                <Link to={`/profile/${s.id}`} className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                  {s.avatar_url
                    ? <img src={s.avatar_url} alt="" className="w-full h-full object-cover" />
                    : (s.full_name || s.email || '?').charAt(0).toUpperCase()
                  }
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/profile/${s.id}`} className="hover:underline">
                    <p className="text-sm font-medium truncate">{s.full_name || s.email?.split('@')[0] || 'User'}</p>
                  </Link>
                  {s.headline && <p className="text-xs text-muted-foreground truncate">{s.headline}</p>}
                </div>
              </div>
              <div className="flex gap-2 w-full mt-1">
                <Button
                  size="sm"
                  className="flex-1 h-8 rounded-full bg-primary"
                  onClick={() => updateRequest.mutate({ id: conn.id, status: 'accepted' })}
                >
                  <UserCheck className="w-4 h-4 mr-1.5" /> Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 rounded-full text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => updateRequest.mutate({ id: conn.id, status: 'rejected' })}
                >
                  <UserX className="w-4 h-4 mr-1.5" /> Decline
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
