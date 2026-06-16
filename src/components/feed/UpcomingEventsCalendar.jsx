import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { CalendarDays, ChevronLeft, ChevronRight, CalendarPlus, Clock, Users, Video } from 'lucide-react';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isFuture } from 'date-fns';
import { Button } from '@/components/ui/button';

const EVENT_TYPE_COLORS = {
  discussion: 'bg-blue-500',
  meeting: 'bg-purple-500',
  webinar: 'bg-green-500',
  analysis: 'bg-amber-500',
};

const EVENT_TYPE_LIGHT = {
  discussion: 'bg-blue-50 text-blue-700 border-blue-100',
  meeting: 'bg-purple-50 text-purple-700 border-purple-100',
  webinar: 'bg-green-50 text-green-700 border-green-100',
  analysis: 'bg-amber-50 text-amber-700 border-amber-100',
};

function getGoogleCalendarUrl(event) {
  const start = new Date(event.event_date);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const fmt = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: event.description || `${event.event_type} session on Investraders`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default function UpcomingEventsCalendar() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());

  const { data: circles = [] } = useQuery({
    queryKey: ['my-circles-for-events', user?.id],
    queryFn: () => supabase.from('Circle').select('*').contains('member_ids', [user?.id]).then(res => res.data || []),
    enabled: !!user?.id,
  });

  const circleIds = circles.map((c) => c.id);

  const { data: allEvents = [], isLoading } = useQuery({
    queryKey: ['all-circle-events', circleIds.join(',')],
    queryFn: async () => {
      if (circleIds.length === 0) return [];
      const results = await Promise.all(
        circleIds.map((id) => supabase.from('CircleEvent').select('*').eq('circle_id', id).eq('status', 'approved').order('event_date').limit(20).then(res => res.data || []))
      );
      return results.flat().filter((e) => isFuture(new Date(e.event_date)));
    },
    enabled: circleIds.length > 0,
  });

  const circleMap = useMemo(() => Object.fromEntries(circles.map((c) => [c.id, c])), [circles]);

  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });

  const eventsOnDay = (day) => allEvents.filter((e) => isSameDay(new Date(e.event_date), day));
  const selectedDayEvents = eventsOnDay(selectedDay);

  const startDayOfWeek = startOfMonth(currentMonth).getDay();

  return (
    <div className="bg-card rounded-2xl border shadow-sm mb-5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b bg-gradient-to-r from-blue-50 to-cyan-50">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-primary" />
          Upcoming Events
        </h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs font-semibold text-foreground w-24 text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-4">
        {/* Day labels */}
        <div className="grid grid-cols-7 mb-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-y-1">
          {Array(startDayOfWeek).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
          {days.map((day) => {
            const dayEvents = eventsOnDay(day);
            const isSelected = isSameDay(day, selectedDay);
            const isCurrentDay = isToday(day);
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(day)}
                className={`relative flex flex-col items-center py-1.5 rounded-lg transition-all mx-0.5 ${
                  isSelected ? 'bg-primary text-primary-foreground' :
                  isCurrentDay ? 'bg-primary/10 text-primary font-bold' :
                  'hover:bg-muted text-foreground'
                }`}
              >
                <span className="text-xs font-medium">{format(day, 'd')}</span>
                {dayEvents.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayEvents.slice(0, 3).map((e, i) => (
                      <span
                        key={i}
                        className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : EVENT_TYPE_COLORS[e.event_type] || 'bg-slate-400'}`}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected day events */}
        <div className="mt-4 border-t pt-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {isToday(selectedDay) ? 'Today' : format(selectedDay, 'EEEE, MMM d')}
            {selectedDayEvents.length > 0 && ` · ${selectedDayEvents.length} event${selectedDayEvents.length > 1 ? 's' : ''}`}
          </p>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}
            </div>
          ) : selectedDayEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-3">No events on this day.</p>
          ) : (
            <div className="space-y-2">
              {selectedDayEvents.map((event) => {
                const circle = circleMap[event.circle_id];
                return (
                  <div key={event.id} className={`flex items-start gap-3 p-3 rounded-xl border ${EVENT_TYPE_LIGHT[event.event_type] || 'bg-slate-50 text-slate-700 border-slate-100'}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{event.title}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 text-xs opacity-80">
                          <Clock className="w-3 h-3" /> {format(new Date(event.event_date), 'h:mm a')}
                        </span>
                        {circle && (
                          <span className="flex items-center gap-1 text-xs opacity-80">
                            <Users className="w-3 h-3" /> {circle.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {event.meet_link && (
                        <a
                          href={event.meet_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 h-7 px-2.5 text-xs rounded-full border border-green-300 bg-green-50 text-green-700 hover:bg-green-100 transition-colors font-medium"
                        >
                          <Video className="w-3 h-3" /> Join
                        </a>
                      )}
                      <a
                        href={getGoogleCalendarUrl(event)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 h-7 px-2.5 text-xs rounded-full border bg-white/70 hover:bg-white transition-colors font-medium"
                      >
                        <CalendarPlus className="w-3 h-3" /> Add
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}