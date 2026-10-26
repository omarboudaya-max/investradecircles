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
  discussion: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  meeting: 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
  webinar: 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  analysis: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
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

const INVESTRADE_1_FLAGSHIP_EVENTS = [
  {
    id: 'flagship-investrade1-day1',
    title: 'Investrade 1: 1st Forum & Exhibition for Investment (Day 1)',
    description: 'Palais des Congrès, Tunis: Opening Plenary, Curated Cap Tables, Precision B2B Matchmaking & VIP Deal Rooms.',
    event_date: '2027-04-20T08:30:00+01:00',
    circle_id: 'flagship-investrade1-circle',
    event_type: 'meeting',
    status: 'approved',
    meet_link: '/event',
    author_name: 'Investraders Platform'
  },
  {
    id: 'flagship-investrade1-day2',
    title: 'Investrade 1: Global Roundtables & MOU Signings (Day 2)',
    description: 'Palais des Congrès, Tunis: Cross-Border Coalitions, FDI Panels, Term Sheet Execution & Official Closing.',
    event_date: '2027-04-21T09:00:00+01:00',
    circle_id: 'flagship-investrade1-circle',
    event_type: 'meeting',
    status: 'approved',
    meet_link: '/event',
    author_name: 'Investraders Platform'
  }
];

export default function UpcomingEventsCalendar() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());

  const { data: circles = [] } = useQuery({
    queryKey: ['my-circles-for-events', user?.id],
    queryFn: () => supabase.from('Circle').select('*').limit(100).then(res => res.data || []),
    staleTime: 5 * 60 * 1000,
  });

  const { data: allEvents = [], isLoading } = useQuery({
    queryKey: ['all-calendar-events'],
    queryFn: async () => {
      try {
        const { data: dbEvents = [] } = await supabase
          .from('CircleEvent')
          .select('*')
          .eq('status', 'approved')
          .order('event_date')
          .limit(50);

        const list = Array.isArray(dbEvents) ? [...dbEvents] : [];
        INVESTRADE_1_FLAGSHIP_EVENTS.forEach(fe => {
          if (!list.some(e => e.id === fe.id || isSameDay(new Date(e.event_date), new Date(fe.event_date)))) {
            list.push(fe);
          }
        });
        return list;
      } catch (err) {
        return [...INVESTRADE_1_FLAGSHIP_EVENTS];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const circleMap = useMemo(() => {
    const map = Object.fromEntries(circles.map((c) => [c.id, c]));
    map['flagship-investrade1-circle'] = {
      id: 'flagship-investrade1-circle',
      name: 'Palais des Congrès, Tunis (Investrade 1)',
    };
    return map;
  }, [circles]);

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

      {/* Featured Flagship Summit Highlight */}
      <div className="mx-4 mt-3.5 p-3 rounded-xl bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-slate-900 border border-cyan-500/30 flex items-center justify-between gap-3 text-left">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Flagship Summit 2027</span>
          </div>
          <p className="text-xs font-bold text-slate-100 truncate mt-0.5">Investrade 1 — Palais des Congrès</p>
          <p className="text-[10px] text-slate-400">April 20–21, 2027 · Tunis, Tunisia</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setCurrentMonth(new Date('2027-04-01T00:00:00'));
              setSelectedDay(new Date('2027-04-20T00:00:00'));
            }}
            className="px-2 py-1 text-[11px] font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            Dates
          </button>
          <a
            href="/event"
            className="px-2.5 py-1 text-[11px] font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-400 hover:opacity-90 rounded-lg shadow-sm transition-all"
          >
            Badge VIP
          </a>
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
                        className={`w-1 h-1 rounded-full ${isSelected ? 'bg-card' : EVENT_TYPE_COLORS[e.event_type] || 'bg-slate-400'}`}
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
                  <div key={event.id} className={`flex items-start gap-3 p-3 rounded-xl border ${EVENT_TYPE_LIGHT[event.event_type] || 'bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'}`}>
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
                          target={event.meet_link.startsWith('http') ? '_blank' : '_self'}
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 h-7 px-2.5 text-xs rounded-full border border-cyan-300 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 transition-colors font-bold"
                        >
                          <Video className="w-3 h-3" /> Participer
                        </a>
                      )}
                      <a
                        href={getGoogleCalendarUrl(event)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 h-7 px-2.5 text-xs rounded-full border bg-white/70 hover:bg-card transition-colors font-medium"
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
