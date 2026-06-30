import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, MessageCircle, ArrowLeft, Search } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

function makeConversationId(a, b) {
  return [a, b].sort().join('_');
}

function formatMsgDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMM d');
}

function Avatar({ src, name, size = 'md' }) {
  const sz = size === 'sm' ? 'w-7 h-7 text-xs' : size === 'lg' ? 'w-11 h-11 text-base' : 'w-10 h-10 text-sm';
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold overflow-hidden shrink-0`}>
      {src ? <img src={src} alt={name} className="w-full h-full object-cover" /> : (name?.charAt(0)?.toUpperCase() || '?')}
    </div>
  );
}

export default function Messages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const urlParams = new URLSearchParams(window.location.search);
  const initWithId = urlParams.get('with');

  const [activeConvId, setActiveConvId] = useState(null);
  const [activeParticipant, setActiveParticipant] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [search, setSearch] = useState('');

  const { data: sentMessages = [] } = useQuery({
    queryKey: ['dms', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('DirectMessage').select('*').eq('sender_id', user?.id);
      return data || [];
    },
    enabled: !!user?.id,
    refetchInterval: 2000,
  });

  const { data: receivedMessages = [] } = useQuery({
    queryKey: ['dms-received', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('DirectMessage').select('*').eq('recipient_id', user?.id);
      return data || [];
    },
    enabled: !!user?.id,
    refetchInterval: 2000,
  });

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase.channel('direct_messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'DirectMessage' }, (payload) => {
        const eventData = payload.new || payload.old;
        if (eventData && (eventData.sender_id === user.id || eventData.recipient_id === user.id)) {
          queryClient.invalidateQueries({ queryKey: ['dms', user.id] });
          queryClient.invalidateQueries({ queryKey: ['dms-received', user.id] });
          queryClient.invalidateQueries({ queryKey: ['unread-messages', user.id] });
        }
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users-dm'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*');
      return data || [];
    },
    enabled: !!user?.id,
  });

  const getUserById = (id) => allUsers.find((u) => u.id === id);

  const conversations = useMemo(() => {
    const combined = [...sentMessages, ...receivedMessages];
    const convMap = {};
    combined.forEach((msg) => {
      const otherId = msg.sender_id === user?.id ? msg.recipient_id : msg.sender_id;
      const convId = msg.conversation_id;
      if (!convMap[convId] || new Date(msg.created_date) > new Date(convMap[convId].lastDate)) {
        const other = getUserById(otherId);
        convMap[convId] = {
          convId,
          otherId,
          otherName: other?.full_name || msg.sender_name || 'User',
          otherAvatar: other?.avatar_url || msg.sender_avatar,
          lastMessage: msg.content,
          lastDate: msg.created_date,
          isMine: msg.sender_id === user?.id,
          unreadCount: combined.filter(
            (m) => m.conversation_id === convId && m.recipient_id === user?.id && !m.is_read
          ).length,
        };
      }
    });
    return Object.values(convMap).sort((a, b) => new Date(b.lastDate) - new Date(a.lastDate));
  }, [sentMessages, receivedMessages, allUsers]);

  const filteredConversations = useMemo(() => {
    const term = search.toLowerCase();
    const existing = conversations.filter((c) => c.otherName.toLowerCase().includes(term));

    if (term) {
      const existingIds = new Set(conversations.map(c => c.otherId));
      const matchingUsers = allUsers.filter(u => 
        u.id !== user?.id && 
        !existingIds.has(u.id) && 
        (u.full_name?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term))
      );
      
      const newConvs = matchingUsers.map(u => ({
        convId: makeConversationId(user?.id, u.id),
        otherId: u.id,
        otherName: u.full_name || u.email?.split('@')[0],
        otherAvatar: u.avatar_url,
        lastMessage: 'Start a conversation',
        lastDate: new Date().toISOString(),
        isMine: false,
        unreadCount: 0,
        isNewUser: true
      }));
      
      return [...existing, ...newConvs];
    }
    return existing;
  }, [conversations, search, allUsers, user?.id]);

  useEffect(() => {
    if (!initWithId || !user?.id || allUsers.length === 0) return;
    const other = getUserById(initWithId);
    setActiveConvId(makeConversationId(user.id, initWithId));
    setActiveParticipant({ id: initWithId, name: other?.full_name || 'User', avatar: other?.avatar_url || null });
  }, [initWithId, user?.id, allUsers.length]);

  const convMessages = useMemo(() => {
    const combined = [...sentMessages, ...receivedMessages];
    return combined
      .filter((m) => m.conversation_id === activeConvId)
      .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
  }, [sentMessages, receivedMessages, activeConvId]);

  const markRead = useMutation({
    mutationFn: async (msgs) => {
      await Promise.all(
        msgs.filter((m) => m.recipient_id === user?.id && !m.is_read)
          .map((m) => supabase.from('DirectMessage').update({ is_read: true }).eq('id', m.id))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dms', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['dms-received', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['unread-messages', user?.id] });
    },
  });

  useEffect(() => {
    if (convMessages.length > 0) markRead.mutate(convMessages);
  }, [activeConvId, convMessages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [convMessages]);

  useEffect(() => {
    if (activeConvId) inputRef.current?.focus();
  }, [activeConvId]);

  const sendMessage = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('DirectMessage').insert({
        conversation_id: activeConvId,
        sender_id: user.id,
        recipient_id: activeParticipant.id,
        content: newMessage.trim(),
        sender_name: user.full_name || user.email?.split('@')[0],
        sender_avatar: user.avatar_url || null,
        is_read: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['dms', user?.id] });
    },
  });

  const openConversation = (conv) => {
    const other = getUserById(conv.otherId);
    setActiveConvId(conv.convId);
    setActiveParticipant({ id: conv.otherId, name: conv.otherName, avatar: other?.avatar_url || conv.otherAvatar });
  };

  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0);

  const groupedMessages = useMemo(() => {
    const groups = [];
    let lastDate = null;
    convMessages.forEach((msg) => {
      const d = msg.created_date ? new Date(msg.created_date) : null;
      const dateKey = d ? format(d, 'yyyy-MM-dd') : 'unknown';
      if (dateKey !== lastDate) {
        lastDate = dateKey;
        const label = d ? (isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'MMMM d, yyyy')) : '';
        groups.push({ type: 'date', label, key: `date-${dateKey}` });
      }
      groups.push({ type: 'msg', msg });
    });
    return groups;
  }, [convMessages]);

  return (
    <div className="max-w-5xl mx-auto px-2 md:px-0">
      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden flex" style={{ height: 'calc(100vh - 6rem)' }}>

        {/* Sidebar */}
        <div className={`w-full md:w-80 lg:w-96 border-r flex flex-col shrink-0 ${activeConvId ? 'hidden md:flex' : 'flex'}`}>
          <div className="px-4 pt-5 pb-3 border-b">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">Messages</h2>
              {totalUnread > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">{totalUnread}</span>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="pl-9 h-9 rounded-xl bg-muted/50 border-0 focus-visible:ring-1"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 gap-3">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                  <MessageCircle className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">No conversations yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Visit a member's profile to start chatting</p>
                </div>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.convId}
                  onClick={() => openConversation(conv)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/60 transition-colors text-left ${activeConvId === conv.convId ? 'bg-primary/5 border-r-2 border-primary' : ''}`}
                >
                  <div className="relative">
                    <Avatar src={conv.otherAvatar} name={conv.otherName} />
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-card" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-semibold' : 'font-medium text-foreground/80'}`}>
                        {conv.otherName}
                      </p>
                      <span className="text-[10px] text-muted-foreground shrink-0">{formatMsgDate(conv.lastDate)}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <p className={`text-xs truncate flex-1 ${conv.unreadCount > 0 ? 'text-foreground/70 font-medium' : 'text-muted-foreground'}`}>
                        {conv.isMine ? 'You: ' : ''}{conv.lastMessage}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="bg-primary text-primary-foreground text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold shrink-0">
                          {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat panel */}
        <div className={`flex-1 flex flex-col min-w-0 ${activeConvId ? 'flex' : 'hidden md:flex'}`}>
          {!activeConvId ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 gap-4">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500/10 to-cyan-400/10 flex items-center justify-center">
                <MessageCircle className="w-10 h-10 text-primary/40" />
              </div>
              <div>
                <p className="text-base font-semibold text-foreground/70">Select a conversation</p>
                <p className="text-sm text-muted-foreground mt-1">or visit a profile to start a new one</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-4 py-3 border-b flex items-center gap-3 bg-card/80">
                <button
                  onClick={() => { setActiveConvId(null); setActiveParticipant(null); }}
                  className="md:hidden p-1.5 rounded-full hover:bg-muted transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <Avatar src={activeParticipant?.avatar} name={activeParticipant?.name} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{activeParticipant?.name}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1" style={{ background: 'hsl(var(--muted) / 0.2)' }}>
                {convMessages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-12">
                    <Avatar src={activeParticipant?.avatar} name={activeParticipant?.name} size="lg" />
                    <p className="text-sm font-medium">{activeParticipant?.name}</p>
                    <p className="text-xs text-muted-foreground">Say hello! 👋</p>
                  </div>
                )}
                {groupedMessages.map((item, idx) => {
                  if (item.type === 'date') {
                    return (
                      <div key={item.key} className="flex items-center gap-3 py-3">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-[10px] text-muted-foreground font-medium px-2 shrink-0">{item.label}</span>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                    );
                  }
                  const msg = item.msg;
                  const isMine = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                      {!isMine && <Avatar src={msg.sender_avatar} name={msg.sender_name} size="sm" />}
                      <div className={`max-w-[72%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                        <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm ${isMine ? 'bg-blue-600 text-white rounded-br-md' : 'bg-card text-foreground rounded-bl-md border'}`}>
                          <p className="leading-relaxed break-words">{msg.content}</p>
                        </div>
                        <p className="text-[10px] mt-1 px-1 text-muted-foreground">
                          {msg.created_date ? format(new Date(msg.created_date), 'HH:mm') : ''}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t bg-card flex items-center gap-2">
                <Input
                  ref={inputRef}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Message ${activeParticipant?.name}...`}
                  className="rounded-full flex-1 h-10 bg-muted/50 border-muted focus-visible:ring-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && newMessage.trim()) {
                      e.preventDefault();
                      sendMessage.mutate();
                    }
                  }}
                />
                <Button
                  size="icon"
                  className="rounded-full h-10 w-10 bg-blue-600 hover:bg-blue-700 shrink-0"
                  disabled={!newMessage.trim() || sendMessage.isPending}
                  onClick={() => sendMessage.mutate()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
