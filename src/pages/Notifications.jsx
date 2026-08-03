import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Check, MessageCircle, FileText, Zap, UserPlus, Users, HelpCircle, AtSign } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

const TYPE_ICON = {
  new_post: FileText,
  new_comment: MessageCircle,
  new_response: Zap,
  connection_request: UserPlus,
  circle_invite: Users,
  message: MessageCircle,
  mention: AtSign,
  circle_question: HelpCircle,
};

export default function Notifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications-page', user?.id],
    queryFn: () =>
      supabase.from('Notification').select('*').match({ user_id: user?.id }).order('created_date', { ascending: false }).limit(50).then(res => res.data || []),
    enabled: !!user?.id,
    refetchInterval: 15000,
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAllRead = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter((n) => !n.is_read);
      await Promise.all(unread.map((n) => supabase.from('Notification').update({ is_read: true }).eq('id', n.id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-page', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  const markOneRead = useMutation({
    mutationFn: (id) => supabase.from('Notification').update({ is_read: true }).eq('id', id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-page', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  return (
    <div className="max-w-2xl mx-auto pb-8">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-muted transition-colors text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">Notifications</h1>
        </div>
        {unreadCount > 0 && (
          <Button
            onClick={() => markAllRead.mutate()}
            variant="outline"
            size="sm"
            className="rounded-full text-xs gap-1.5"
          >
            <Check className="w-3.5 h-3.5" /> Mark all read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl border p-4 animate-pulse flex gap-3 items-center">
              <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="w-3/4 h-4 bg-muted rounded" />
                <div className="w-1/4 h-3 bg-muted rounded" />
              </div>
            </div>
          ))
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border p-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Bell className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold mb-1">No notifications yet</h3>
            <p className="text-sm text-muted-foreground">We will notify you when there is activity on your posts or circles.</p>
          </div>
        ) : (
          notifications.map((n) => {
            const Icon = TYPE_ICON[n.type] || Bell;
            return (
              <div
                key={n.id}
                onClick={() => {
                  if (!n.is_read) markOneRead.mutate(n.id);
                  if (n.target_url) navigate(n.target_url);
                  else if (n.circle_id) navigate(`/circle/${n.circle_id}`);
                  else if (n.type === 'connection_request') navigate('/profile');
                  else if (n.type === 'message') navigate('/messages');
                }}
                className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                  !n.is_read ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 shadow-sm' : 'bg-card border-border hover:border-primary/30'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  !n.is_read ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-snug ${!n.is_read ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                    {n.message}
                  </p>
                  {n.circle_name && (
                    <p className="text-xs text-primary font-medium mt-1">{n.circle_name}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {n.created_date ? formatDistanceToNow(new Date(n.created_date), { addSuffix: true }) : ''}
                  </p>
                </div>

                {!n.is_read && (
                  <div className="w-2.5 h-2.5 bg-blue-600 rounded-full shrink-0 mt-2" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
