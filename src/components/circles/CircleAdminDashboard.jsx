import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import CommandCenter from '@/components/intelligence/CommandCenter';

/**
 * What the people who run a circle need: pending join requests, and a command
 * center scoped to their own members.
 */
export default function CircleAdminDashboard({ circleId, circle }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: requests = [] } = useQuery({
    queryKey: ['admin-requests', circleId],
    queryFn: () => supabase.from('CircleInvite').select('*').match({ circle_id: circleId, status: 'request' }).then((res) => res.data || []),
    enabled: Boolean(circleId),
  });

  const handleRequest = useMutation({
    mutationFn: async ({ request, action }) => {
      if (action === 'approve') {
        // Read the current list first so two approvals in a row do not overwrite each other.
        const { data: fresh, error: readError } = await supabase.from('Circle').select('member_ids').eq('id', circleId).single();
        if (readError) throw new Error(readError.message);
        const members = fresh?.member_ids || [];
        if (!members.includes(request.inviter_id)) {
          const { error } = await supabase.from('Circle').update({ member_ids: [...members, request.inviter_id] }).eq('id', circleId);
          if (error) throw new Error(error.message);
        }
      }
      const { error } = await supabase.from('CircleInvite').update({ status: action === 'approve' ? 'accepted' : 'declined' }).eq('id', request.id);
      if (error) throw new Error(error.message);
      if (action === 'approve') {
        await supabase.from('Notification').insert({
          user_id: request.inviter_id, type: 'circle_invite', is_read: false,
          message: `Your request to join ${circle?.name || 'the circle'} was approved`,
          circle_id: circleId, circle_name: circle?.name || null, target_url: `/circle/${circleId}`,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-requests', circleId] });
      queryClient.invalidateQueries({ queryKey: ['circle', circleId] });
    },
    onError: (error) => toast({ title: 'The request could not be updated', description: error.message, variant: 'destructive' }),
  });

  return (
    <div className="space-y-4 p-4 sm:p-5">
      {requests.length > 0 && (
        <section className="rounded-2xl border bg-card">
          <header className="flex items-center gap-2 border-b px-4 py-3 text-sm font-semibold text-foreground">
            <UserPlus className="h-4 w-4 text-primary" /> Join requests · {requests.length}
          </header>
          <ul className="divide-y">
            {requests.map((request) => (
              <li key={request.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <span className="text-sm font-medium text-foreground">{request.inviter_name || 'A member'}</span>
                <span className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={handleRequest.isPending} onClick={() => handleRequest.mutate({ request, action: 'decline' })}>Decline</Button>
                  <Button size="sm" disabled={handleRequest.isPending} onClick={() => handleRequest.mutate({ request, action: 'approve' })}>Approve</Button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <CommandCenter
        circle={circle}
        eyebrow="Circle command center"
        title={circle?.name || 'Your circle'}
        subtitle="What your members say, what they are asking for and how they feel — computed from live activity."
      />
    </div>
  );
}
