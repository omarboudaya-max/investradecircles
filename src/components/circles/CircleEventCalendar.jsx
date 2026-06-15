import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CalendarDays, Plus, X, Clock, Radio, CheckCircle, XCircle, CalendarPlus, Video } from 'lucide-react';
import { format, isFuture, isPast, isToday } from 'date-fns';
import LiveSessionModal from '@/components/circles/LiveSessionModal';

const EVENT_TYPE_STYLES = {
  discussion: 'bg-blue-100 text-blue-700',
  meeting: 'bg-purple-100 text-purple-700',
  webinar: 'bg-green-100 text-green-700',
  analysis: 'bg-amber-100 text-amber-700',
};

export default function CircleEventCalendar({ circleId, isMember, isAdmin, isModerator, currentUserId }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', event_date: '', event_type: 'discussion', meet_link: '' });

  const { data: events = [] } = useQuery({
    queryKey: ['circle-events', circleId],
    queryFn: () => supabase.from('CircleEvent').select('*').match({ circle_id: circleId }, 'event_date', 50).then(res => res.data || []),
  });

  const createEvent = useMutation({
    mutationFn: () =>
      supabase.from('CircleEvent').insert({
        ...form,
        circle_id: circleId,
        author_name: user?.full_name || user?.email?.split('@')[0] || 'Member',
        status: isAdmin || isModerator ? 'approved' : 'pending',
        session_active: false,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circle-events', circleId] });
      setForm({ title: '', description: '', event_date: '', event_type: 'discussion', meet_link: '' });
      setShowForm(false);
    },
  });

  const approveEvent = useMutation({
    mutationFn: (id) => supabase.from('CircleEvent').update({ status: 'approved' }).eq('id', id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['circle-events', circleId] }),
  });

  const rejectEvent = useMutation({
    mutationFn: (id) => supabase.from('CircleEvent').delete().eq('id', id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['circle-events', circleId] }),
  });

  const toggleSession = useMutation({
    mutationFn: async ({ id, active, eventTitle }) => {
      let meet_link = undefined;
      if (active) {
        // Auto-generate Jitsi Meet room based on stable event ID
        const roomName = `investraders-${id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)}`;
        meet_link = `https://meet.jit.si/${roomName}`;
      }
      await supabase.from('CircleEvent').update({
        session_active: active,
        ...(meet_link !== undefined && { meet_link }).eq('id', id),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['circle-events', circleId] }),
  });

  const deleteEvent = useMutation({
    mutationFn: (id) => supabase.from('CircleEvent').delete().eq('id', id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['circle-events', circleId] }),
  });

  const approvedEvents = events.filter((e) => e.status === 'approved' || !e.status);
  const pendingEvents = events.filter((e) => e.status === 'pending');
  const upcoming = approvedEvents.filter((e) => isFuture(new Date(e.event_date)) || isToday(new Date(e.event_date)));
  const past = approvedEvents.filter((e) => isPast(new Date(e.event_date)) && !isToday(new Date(e.event_date)));

  const canControl = (event) => isAdmin || isModerator || event.created_by_id === currentUserId;

  const getGoogleCalendarUrl = (event) => {
    const start = new Date(event.event_date);
    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour duration
    const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${fmt(start)}/${fmt(end)}`,
      details: event.description || `${event.event_type} session on Investraders`,
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  function EventItem({ event, isPastItem }) {
    const isLive = event.session_active;
    const canDelete = isAdmin || isModerator || event.created_by_id === currentUserId;

    return (
      <div className={`flex items-start gap-3 p-3 rounded-xl border bg-white hover:shadow-sm transition-shadow ${isPastItem ? 'opacity-50' : ''}`}>
        <div className="relative flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-primary/10 shrink-0">
          <span className="text-[10px] text-primary font-semibold uppercase">
            {format(new Date(event.event_date), 'MMM')}
          </span>
          <span className="text-lg font-bold text-primary leading-none">
            {format(new Date(event.event_date), 'd')}
          </span>
          {isLive && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold">{event.title}</p>
            <div className="flex items-center gap-1.5 shrink-0">
              {isLive && (
                <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-white rounded-full inline-block animate-pulse" /> LIVE
                </span>
              )}
              {canDelete && (
                <button onClick={() => deleteEvent.mutate(event.id)} className="text-muted-foreground hover:text-destructive">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" /> {format(new Date(event.event_date), 'h:mm a')}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${EVENT_TYPE_STYLES[event.event_type] || 'bg-slate-100 text-slate-700'}`}>
              {event.event_type}
            </span>
          </div>

          {event.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
          )}
          <p className="text-[10px] text-muted-foreground mt-1">by {event.author_name}</p>

          {!isPastItem && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <a
                href={getGoogleCalendarUrl(event)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 h-7 px-2.5 text-xs rounded-full border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors font-medium"
              >
                <CalendarPlus className="w-3 h-3" /> Add to Calendar
              </a>
              {event.meet_link && isMember && (
                <a
                  href={event.meet_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 h-7 px-2.5 text-xs rounded-full border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition-colors font-medium"
                >
                  <Video className="w-3 h-3" /> Join Meet
                </a>
              )}
              {isLive && isMember && (
                <Button
                  size="sm"
                  className="h-7 text-xs rounded-full bg-green-600 hover:bg-green-700 gap-1.5"
                  onClick={() => setActiveSession(event)}
                >
                  <Radio className="w-3 h-3 animate-pulse" /> Join Now
                </Button>
              )}
              {canControl(event) && (
                <Button
                  size="sm"
                  variant={isLive ? 'destructive' : 'outline'}
                  className="h-7 text-xs rounded-full"
                  onClick={() => toggleSession.mutate({ id: event.id, active: !isLive, eventTitle: event.title })}
                >
                  {isLive ? 'End Session' : '🎥 Start Video Session'}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {activeSession && (
        <LiveSessionModal
          event={activeSession}
          user={user}
          isAdmin={isAdmin}
          isModerator={isModerator}
          onClose={() => setActiveSession(null)}
        />
      )}

      <div className="px-6 pb-6">
        <div className="border rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" /> Events
            </h3>
            {isMember && (
              <Button size="sm" variant="outline" className="h-7 text-xs rounded-full" onClick={() => setShowForm(!showForm)}>
                <Plus className="w-3 h-3 mr-1" /> Schedule
              </Button>
            )}
          </div>

          <div className="p-4 space-y-4">
            {/* Create Form */}
            {showForm && (
              <div className="border rounded-xl p-4 space-y-3 bg-muted/30">
                <Input
                  placeholder="Event title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="h-9 text-sm"
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="min-h-[60px] text-sm"
                />
                <div className="flex gap-2">
                  <input
                    type="datetime-local"
                    value={form.event_date}
                    onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                    className="flex-1 h-9 text-sm border border-input rounded-md px-3 bg-background"
                  />
                  <select
                    value={form.event_type}
                    onChange={(e) => setForm({ ...form, event_type: e.target.value })}
                    className="h-9 text-sm border border-input rounded-md px-2 bg-background"
                  >
                    <option value="discussion">Discussion</option>
                    <option value="meeting">Meeting</option>
                    <option value="webinar">Webinar</option>
                    <option value="analysis">Analysis</option>
                  </select>
                </div>
                <Input
                  placeholder="Google Meet link (optional)"
                  value={form.meet_link}
                  onChange={(e) => setForm({ ...form, meet_link: e.target.value })}
                  className="h-9 text-sm"
                />
                {!isAdmin && !isModerator && (
                  <p className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg">
                    ⏳ Your event will be visible after admin approval.
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="rounded-full bg-primary"
                    disabled={!form.title.trim() || !form.event_date}
                    onClick={() => createEvent.mutate()}
                  >
                    Create Event
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Pending Approval - admin only */}
            {isAdmin && pendingEvents.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">
                  ⏳ Pending Approval ({pendingEvents.length})
                </p>
                {pendingEvents.map((e) => (
                  <div key={e.id} className="flex items-start gap-3 p-3 rounded-xl border border-amber-200 bg-amber-50">
                    <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-amber-100 shrink-0">
                      <span className="text-[10px] text-amber-700 font-semibold uppercase">
                        {format(new Date(e.event_date), 'MMM')}
                      </span>
                      <span className="text-lg font-bold text-amber-700 leading-none">
                        {format(new Date(e.event_date), 'd')}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{e.title}</p>
                      <p className="text-xs text-muted-foreground">
                        by {e.author_name} · {format(new Date(e.event_date), 'MMM d, h:mm a')}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          className="h-6 text-xs rounded-full bg-green-600 hover:bg-green-700 gap-1"
                          onClick={() => approveEvent.mutate(e.id)}
                        >
                          <CheckCircle className="w-3 h-3" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs rounded-full text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={() => rejectEvent.mutate(e.id)}
                        >
                          <XCircle className="w-3 h-3 mr-1" /> Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upcoming */}
            {upcoming.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Upcoming</p>
                {upcoming.map((e) => <EventItem key={e.id} event={e} isPastItem={false} />)}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No upcoming events. {isMember && 'Schedule one!'}
              </p>
            )}

            {/* Past */}
            {past.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Past</p>
                {past.slice(0, 3).map((e) => <EventItem key={e.id} event={e} isPastItem={true} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}