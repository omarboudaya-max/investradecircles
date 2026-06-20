import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck, Clock, UserX } from 'lucide-react';

export default function ConnectionButton({ currentUserId, targetUserId }) {
  const queryClient = useQueryClient();

  const { data: sentConns = [] } = useQuery({
    queryKey: ['conns-sent', currentUserId],
    queryFn: () => supabase.from('Connection').select('*').match({ requester_id: currentUserId }).then(res => res.data || []),
    enabled: !!currentUserId && !!targetUserId && currentUserId !== targetUserId,
  });

  const { data: receivedConns = [] } = useQuery({
    queryKey: ['conns-received', currentUserId],
    queryFn: () => supabase.from('Connection').select('*').match({ recipient_id: currentUserId }).then(res => res.data || []),
    enabled: !!currentUserId && !!targetUserId && currentUserId !== targetUserId,
  });

  const sentConn = sentConns.find((c) => c.recipient_id === targetUserId);
  const receivedConn = receivedConns.find((c) => c.requester_id === targetUserId);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['conns-sent', currentUserId] });
    queryClient.invalidateQueries({ queryKey: ['conns-received', currentUserId] });
  };

  const { data: currentUserData = [] } = useQuery({
    queryKey: ['user-profile-for-conn', currentUserId],
    queryFn: () => supabase.from('profiles').select('*').match({ id: currentUserId }).then(res => res.data || []),
    enabled: !!currentUserId,
    select: (d) => d?.[0],
  });

  const sendRequest = useMutation({
    mutationFn: async () => {
      await supabase.from('Connection').insert({
        requester_id: currentUserId,
        recipient_id: targetUserId,
        status: 'pending',
      });
      // Notify the recipient
      const senderName = currentUserData?.full_name || 'Someone';
      await supabase.from('Notification').insert({
        user_id: targetUserId,
        type: 'connection_request',
        message: `${senderName} sent you a connection request`,
        is_read: false,
      });
    },
    onSuccess: invalidate,
  });

  const updateRequest = useMutation({
    mutationFn: ({ id, status }) => supabase.from('Connection').update({ status }).eq('id', id),
    onSuccess: invalidate,
  });

  const cancelRequest = useMutation({
    mutationFn: (id) => supabase.from('Connection').delete().eq('id', id),
    onSuccess: invalidate,
  });

  if (!currentUserId || !targetUserId || currentUserId === targetUserId) return null;

  if (sentConn?.status === 'accepted' || receivedConn?.status === 'accepted') {
    return (
      <Button variant="outline" size="sm" className="rounded-full gap-2 text-green-700 border-green-200 hover:bg-green-50">
        <UserCheck className="w-4 h-4" /> Connected
      </Button>
    );
  }

  if (sentConn?.status === 'pending') {
    return (
      <Button
        variant="outline"
        size="sm"
        className="rounded-full gap-2 text-muted-foreground"
        onClick={() => cancelRequest.mutate(sentConn.id)}
      >
        <Clock className="w-4 h-4" /> Pending
      </Button>
    );
  }

  if (receivedConn?.status === 'pending') {
    return (
      <div className="flex gap-2">
        <Button
          size="sm"
          className="rounded-full gap-2 bg-primary"
          onClick={() => updateRequest.mutate({ id: receivedConn.id, status: 'accepted' })}
        >
          <UserCheck className="w-4 h-4" /> Accept
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
          onClick={() => updateRequest.mutate({ id: receivedConn.id, status: 'rejected' })}
        >
          <UserX className="w-4 h-4" /> Decline
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      className="rounded-full gap-2 bg-primary"
      onClick={() => sendRequest.mutate()}
    >
      <UserPlus className="w-4 h-4" /> Connect
    </Button>
  );
}
