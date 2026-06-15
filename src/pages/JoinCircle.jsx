import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, Users } from 'lucide-react';

export default function JoinCircle() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const inviteId = urlParams.get('invite'); // direct invite by ID

  const [status, setStatus] = useState('idle'); // idle | joining | done | error | already

  // Fetch invite by token
  const { data: invitesByToken = [], isLoading: loadingToken } = useQuery({
    queryKey: ['invite-by-token', token],
    queryFn: async () => {
      const { data } = await supabase.from('CircleInvite').select('*').eq('token', token);
      return data || [];
    },
    enabled: !!token,
  });

  // Fetch invite by ID
  const { data: invitesById = [], isLoading: loadingId } = useQuery({
    queryKey: ['invite-by-id', inviteId],
    queryFn: async () => {
      const { data } = await supabase.from('CircleInvite').select('*').eq('id', inviteId);
      return data || [];
    },
    enabled: !!inviteId,
  });

  const invite = token ? invitesByToken[0] : invitesById[0];
  const isLoading = token ? loadingToken : loadingId;

  const { data: circles = [] } = useQuery({
    queryKey: ['circle-for-invite', invite?.circle_id],
    queryFn: async () => {
      const { data } = await supabase.from('Circle').select('*').eq('id', invite.circle_id);
      return data || [];
    },
    enabled: !!invite?.circle_id,
    select: (d) => d[0],
  });

  const circle = Array.isArray(circles) ? circles[0] : circles;

  const acceptInvite = useMutation({
    mutationFn: async () => {
      // Add user to circle
      const members = circle?.member_ids || [];
      if (members.includes(user?.id)) {
        setStatus('already');
        return;
      }
      await supabase.from('Circle').update({
        member_ids: [...members, user.id],
      }).eq('id', invite.circle_id);
      // Mark invite as accepted
      await supabase.from('CircleInvite').update({ status: 'accepted' }).eq('id', invite.id);
    },
    onSuccess: () => {
      setStatus('done');
      setTimeout(() => navigate(`/circle/${invite.circle_id}`), 2000);
    },
    onError: () => setStatus('error'),
  });

  const declineInvite = useMutation({
    mutationFn: async () => {
      await supabase.from('CircleInvite').update({ status: 'declined' }).eq('id', invite.id);
    },
    onSuccess: () => navigate('/'),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
          <h2 className="text-lg font-semibold">Invalid invite link</h2>
          <p className="text-muted-foreground text-sm mt-1">This invite may have expired or already been used.</p>
          <Button className="mt-4 rounded-full" onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  if (invite.status === 'accepted') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold">Already accepted</h2>
          <Button className="mt-4 rounded-full" onClick={() => navigate(`/circle/${invite.circle_id}`)}>
            Go to Circle
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="bg-card rounded-2xl border shadow-lg p-8 max-w-sm w-full text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
          {invite.circle_name?.charAt(0) || '?'}
        </div>
        <h2 className="text-xl font-bold mb-1">You're invited!</h2>
        <p className="text-sm text-muted-foreground mb-1">
          <span className="font-medium text-foreground">{invite.inviter_name}</span> invited you to join
        </p>
        <p className="text-lg font-semibold text-primary mb-5">{invite.circle_name}</p>

        {circle && (
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-5">
            <Users className="w-3.5 h-3.5" />
            {circle.member_ids?.length || 0} members
          </div>
        )}

        {status === 'done' && (
          <div className="flex items-center justify-center gap-2 text-green-600 font-medium text-sm mb-4">
            <CheckCircle className="w-5 h-5" /> Joined! Redirecting...
          </div>
        )}

        {status === 'already' && (
          <p className="text-sm text-muted-foreground mb-4">You're already a member of this circle.</p>
        )}

        {status === 'idle' && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 rounded-full"
              onClick={() => declineInvite.mutate()}
              disabled={declineInvite.isPending}
            >
              Decline
            </Button>
            <Button
              className="flex-1 rounded-full bg-primary"
              onClick={() => { setStatus('joining'); acceptInvite.mutate(); }}
              disabled={acceptInvite.isPending}
            >
              {acceptInvite.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Accept & Join'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}