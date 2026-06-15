import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Subscribes to new posts and responses in a circle and creates
 * notifications for all circle members (except the author).
 */
export function useCircleNotifications({ circle, user }) {
  useEffect(() => {
    if (!circle || !user) return;

    const notifyMembers = async (message, type) => {
      const memberIds = circle.member_ids || [];
      const recipients = memberIds.filter((id) => id !== user.id);
      if (recipients.length === 0) return;

      await Promise.all(
        recipients.map((userId) =>
          supabase.from('Notification').insert({
            user_id: userId,
            type,
            message,
            circle_id: circle.id,
            circle_name: circle.name,
            is_read: false,
          })
        )
      );
    };

    const channel = supabase.channel(`circle_${circle.id}_notifications`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Post', filter: `circle_id=eq.${circle.id}` }, (payload) => {
        const author = payload.new.author_name || 'Someone';
        notifyMembers(`${author} posted in ${circle.name}`, 'new_post');
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'CircleResponse', filter: `circle_id=eq.${circle.id}` }, (payload) => {
        const author = payload.new.author_name || 'Someone';
        notifyMembers(`${author} responded to a question in ${circle.name}`, 'new_response');
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'Comment', filter: `circle_id=eq.${circle.id}` }, (payload) => {
        const author = payload.new.author_name || 'Someone';
        notifyMembers(`${author} commented in ${circle.name}`, 'new_comment');
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [circle?.id, user?.id]);
}