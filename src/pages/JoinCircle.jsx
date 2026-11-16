import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CheckCircle, Loader2, Users, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { isMissingSchema } from '@/api/platform';
import { Button } from '@/components/ui/button';

/**
 * Look an invitation up either by share-link token or by id.
 * Link invitations name no invitee, so they are resolved through a database function
 * that only answers for a valid token; older databases fall back to a direct read.
 */
async function loadInvite({ token, inviteId }) {
  if (token) {
    const viaFunction = await supabase.rpc('get_circle_invite_by_token', { p_token: token });
    if (!viaFunction.error) return viaFunction.data?.[0] || null;
    if (!isMissingSchema(viaFunction.error) && viaFunction.error.code !== 'PGRST202') return null;
    const { data } = await supabase.from('CircleInvite').select('*').eq('token', token).limit(1);
    return data?.[0] || null;
  }
  if (inviteId) {
    const { data } = await supabase.from('CircleInvite').select('*').eq('id', inviteId).limit(1);
    return data?.[0] || null;
  }
  return null;
}

function Screen({ children }) {
  return <div className="flex min-h-[70vh] items-center justify-center p-4">{children}</div>;
}

export default function JoinCircle() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const inviteId = searchParams.get('invite');
  const [status, setStatus] = useState('idle'); // idle | done | already | error
  const [errorMessage, setErrorMessage] = useState('');

  const { data: invite, isLoading } = useQuery({
    queryKey: ['circle-invite', token, inviteId],
    queryFn: () => loadInvite({ token, inviteId }),
    enabled: Boolean(token || inviteId),
  });

  const { data: circle } = useQuery({
    queryKey: ['circle-for-invite', invite?.circle_id],
    queryFn: async () => {
      const { data } = await supabase.from('Circle').select('id,name,member_ids,created_by_id,privacy').eq('id', invite.circle_id).maybeSingle();
      return data || null;
    },
    enabled: Boolean(invite?.circle_id),
  });

  const acceptInvite = useMutation({
    mutationFn: async () => {
      const members = circle?.member_ids || [];
      if (members.includes(user.id) || circle?.created_by_id === user.id) return 'already';

      if (token) {
        const viaFunction = await supabase.rpc('accept_circle_invite_by_token', { p_token: token });
        if (!viaFunction.error) return 'done';
        if (!isMissingSchema(viaFunction.error) && viaFunction.error.code !== 'PGRST202') throw new Error(viaFunction.error.message);
      }

      const { data, error } = await supabase.from('Circle').update({ member_ids: [...members, user.id] }).eq('id', invite.circle_id).select('member_ids');
      if (error) throw new Error(error.message);
      if (!data?.[0]?.member_ids?.includes(user.id)) throw new Error('This invitation does not allow you to join the circle.');
      if (invite.invitee_id === user.id) {
        await supabase.from('CircleInvite').update({ status: 'accepted' }).eq('id', invite.id);
      }
      return 'done';
    },
    onSuccess: (result) => {
      setStatus(result);
      setTimeout(() => navigate(`/circle/${invite.circle_id}`), result === 'done' ? 1200 : 0);
    },
    onError: (error) => {
      setErrorMessage(error.message);
      setStatus('error');
    },
  });

  const declineInvite = useMutation({
    mutationFn: async () => {
      // Only a personal invitation can be declined; a shared link simply goes unused.
      if (invite.invitee_id === user.id) {
        await supabase.from('CircleInvite').update({ status: 'declined' }).eq('id', invite.id);
      }
    },
    onSettled: () => navigate('/home'),
  });

  if (isLoading) {
    return <Screen><Loader2 className="h-8 w-8 animate-spin text-primary" /></Screen>;
  }

  if (!invite) {
    return (
      <Screen>
        <div className="text-center">
          <XCircle className="mx-auto mb-3 h-12 w-12 text-destructive" />
          <h2 className="text-lg font-semibold text-foreground">This invitation is not valid</h2>
          <p className="mt-1 text-sm text-muted-foreground">It may have expired, or it was issued to a different account.</p>
          <Button className="mt-4 rounded-full" onClick={() => navigate('/home')}>Go to your feed</Button>
        </div>
      </Screen>
    );
  }

  const alreadyAccepted = invite.status === 'accepted' && invite.invitee_id === user?.id;

  return (
    <Screen>
      <div className="w-full max-w-sm rounded-2xl border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
          {invite.circle_name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <h2 className="mb-1 text-xl font-bold text-foreground">{alreadyAccepted ? 'You already joined' : "You're invited"}</h2>
        {invite.inviter_name && !alreadyAccepted && (
          <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">{invite.inviter_name}</span> invited you to join</p>
        )}
        <p className="mb-5 mt-1 text-lg font-semibold text-primary">{invite.circle_name}</p>

        {circle && (
          <p className="mb-5 flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" /> {new Set([...(circle.member_ids || []), circle.created_by_id].filter(Boolean)).size} members
          </p>
        )}

        {status === 'done' && (
          <p className="mb-4 flex items-center justify-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="h-5 w-5" /> Joined — taking you there…
          </p>
        )}
        {status === 'error' && <p className="mb-4 text-sm text-destructive">{errorMessage || 'Something went wrong. Please try again.'}</p>}

        {alreadyAccepted || status === 'already' ? (
          <Button className="w-full rounded-full" onClick={() => navigate(`/circle/${invite.circle_id}`)}>Open the circle</Button>
        ) : status !== 'done' && (
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 rounded-full" onClick={() => declineInvite.mutate()} disabled={declineInvite.isPending || acceptInvite.isPending}>
              Not now
            </Button>
            <Button className="flex-1 rounded-full" onClick={() => acceptInvite.mutate()} disabled={acceptInvite.isPending}>
              {acceptInvite.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Accept & join'}
            </Button>
          </div>
        )}
      </div>
    </Screen>
  );
}
