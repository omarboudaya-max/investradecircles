import React, { useState } from 'react';
import { Bell, Check, MessageCircle, FileText, Zap, UserPlus, Users, HelpCircle, AtSign } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';
// Link removed — navigation handled via useNavigate for programmatic routing
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

export default function NotificationBell() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: () =>
      supabase.from('Notification').select('*').match({ user_id: user?.id }).order('created_date', { ascending: false }).limit(20).then(res => res.data || []),
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAllRead = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter((n) => !n.is_read);
      await Promise.all(unread.map((n) => supabase.from('Notification').update({ is_read: true }).eq('id', n.id)));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] }),
  });

  const markOneRead = useMutation({
    mutationFn: (id) => supabase.from('Notification').update({ is_read: true }).eq('id', id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] }),
  });

  const handleOpen = (isOpen) => {
    setOpen(isOpen);
    if (isOpen && unreadCount > 0) {
      markAllRead.mutate();
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpen}>
      <DropdownMenuTrigger asChild>
        <button className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-secondary transition-colors relative">
          <Bell className="w-4 h-4 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <Check className="w-3 h-3" /> Mark all read
            </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-80 overflow-y-auto divide-y">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            notifications.map((n) => {
              const Icon = TYPE_ICON[n.type] || Bell;
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer ${
                    !n.is_read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    if (!n.is_read) markOneRead.mutate(n.id);
                    setOpen(false);
                    if (n.target_url) { navigate(n.target_url); }
                    else if (n.circle_id) { navigate(`/circle/${n.circle_id}`); }
                    else if (n.type === 'connection_request') { navigate('/profile'); }
                    else if (n.type === 'message') { navigate('/messages'); }
                  }}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    !n.is_read ? 'bg-primary/10' : 'bg-muted'
                  }`}>
                    <Icon className={`w-4 h-4 ${!n.is_read ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!n.is_read ? 'font-medium' : 'text-muted-foreground'}`}>
                      {n.message}
                    </p>
                    {n.circle_name && (
                      <p className="text-xs text-primary mt-0.5">{n.circle_name}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {n.created_date ? formatDistanceToNow(new Date(n.created_date), { addSuffix: true }) : ''}
                    </p>
                  </div>
                  {!n.is_read && (
                    <div className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1.5" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
