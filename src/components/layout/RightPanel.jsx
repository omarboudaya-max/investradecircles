import React, { useMemo } from 'react';
import { MessageCircle, ArrowRight, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import PendingConnectionRequests from '@/components/profile/PendingConnectionRequests';

export default function RightPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Recent conversations
  const { data: recentMsgs = [] } = useQuery({
    queryKey: ['right-panel-msgs', user?.id],
    queryFn: () => supabase.from('DirectMessage').select('*').match({ recipient_id: user?.id }).order('created_date', { ascending: false }).limit(30).then(res => res.data || []),
    enabled: !!user?.id,
    refetchInterval: 15000,
  });

  // Get unique recent conversations (last message per person)
  const recentConvs = React.useMemo(() => {
    const seen = {};
    for (const msg of recentMsgs) {
      if (!seen[msg.sender_id]) seen[msg.sender_id] = msg;
    }
    return Object.values(seen).slice(0, 4);
  }, [recentMsgs]);

  // Suggested: real users not yet connected to current user
  const { data: allUsers = [] } = useQuery({
    queryKey: ['right-panel-users'],
    queryFn: () => supabase.from('profiles').select('*').order('created_date', { ascending: false }).limit(50).then(res => res.data || []),
    enabled: !!user?.id,
  });

  const { data: sentConns = [] } = useQuery({
    queryKey: ['right-conns-sent', user?.id],
    queryFn: () => supabase.from('Connection').select('*').match({ requester_id: user?.id }).then(res => res.data || []),
    enabled: !!user?.id,
  });
  const { data: receivedConns = [] } = useQuery({
    queryKey: ['right-conns-received', user?.id],
    queryFn: () => supabase.from('Connection').select('*').match({ recipient_id: user?.id }).then(res => res.data || []),
    enabled: !!user?.id,
  });

  const connectedIds = new Set([
    ...sentConns.map((c) => c.recipient_id),
    ...receivedConns.map((c) => c.requester_id),
    user?.id,
  ]);

  const suggestions = allUsers.filter((u) => !connectedIds.has(u.id)).slice(0, 4);

  const sendRequest = useMutation({
    mutationFn: async (targetId) => {
      await supabase.from('Connection').insert({
        requester_id: user.id,
        recipient_id: targetId,
        status: 'pending',
      });
      await supabase.from('Notification').insert({
        user_id: targetId,
        type: 'connection_request',
        message: `${user.full_name || 'Someone'} sent you a connection request`,
        is_read: false,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['right-conns-sent', user?.id] });
    },
  });

  const pendingIds = new Set(sentConns.filter((c) => c.status === 'pending').map((c) => c.recipient_id));

  return (
    <aside className="hidden xl:block w-72 shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto p-4 space-y-6">
      {/* Recent Messages */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Recent Messages</h3>
        </div>
        <div className="space-y-2">
          {recentConvs.length === 0 ? (
            <p className="text-xs text-muted-foreground px-2">No messages yet</p>
          ) : (
            recentConvs.map((msg) => (
              <div
                key={msg.id}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted transition-colors cursor-pointer"
                onClick={() => navigate(`/messages?with=${msg.sender_id}`)}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                  {msg.sender_avatar
                    ? <img src={msg.sender_avatar} alt="" className="w-full h-full object-cover" />
                    : (msg.sender_name || '?').charAt(0).toUpperCase()
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{msg.sender_name || 'User'}</p>
                  <p className="text-xs text-muted-foreground truncate">{msg.content}</p>
                </div>
                {!msg.is_read && (
                  <span className="w-2 h-2 bg-red-500 rounded-full shrink-0" />
                )}
                <MessageCircle className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
            ))
          )}
        </div>
        <Link to="/messages" className="flex items-center gap-1 mt-2 text-sm text-primary hover:underline font-medium">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Suggested to Connect */}
      <div>
        <PendingConnectionRequests />
        <h3 className="text-sm font-semibold text-foreground mb-3">People You May Know</h3>
        <div className="space-y-2">
          {suggestions.length === 0 ? (
            <p className="text-xs text-muted-foreground px-2">No suggestions right now</p>
          ) : (
            suggestions.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-2 rounded-xl">
                <Link to={`/profile/${s.id}`} className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                  {s.avatar_url
                    ? <img src={s.avatar_url} alt="" className="w-full h-full object-cover" />
                    : (s.full_name || s.email || '?').charAt(0).toUpperCase()
                  }
                </Link>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.full_name || s.email?.split('@')[0] || 'User'}</p>
                  {s.headline && <p className="text-xs text-muted-foreground truncate">{s.headline}</p>}
                </div>
                <Button
                  size="sm"
                  className="h-7 text-xs rounded-full px-2 bg-primary text-primary-foreground"
                  disabled={pendingIds.has(s.id) || sendRequest.isPending}
                  onClick={() => sendRequest.mutate(s.id)}
                >
                  {pendingIds.has(s.id) ? '⏳' : <><UserPlus className="w-3 h-3 mr-1" /> Add</>}
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
