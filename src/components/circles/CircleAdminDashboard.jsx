import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { BarChart2, FileText, MessageCircle, Users, Zap } from 'lucide-react';
import { subWeeks, startOfWeek, format, isWithinInterval, endOfWeek } from 'date-fns';

function buildWeeklyData(posts, responses, weeks = 6) {
  const data = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = startOfWeek(subWeeks(new Date(), i));
    const end = endOfWeek(subWeeks(new Date(), i));
    const interval = { start, end };

    data.push({
      week: format(start, 'MMM d'),
      Posts: posts.filter((p) => p.created_date && isWithinInterval(new Date(p.created_date), interval)).length,
      Responses: responses.filter((r) => r.created_date && isWithinInterval(new Date(r.created_date), interval)).length,
    });
  }
  return data;
}

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-white border">
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
      <Icon className="w-4 h-4 text-white" />
    </div>
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  </div>
);

export default function CircleAdminDashboard({ circleId, circle }) {
  const { data: posts = [] } = useQuery({
    queryKey: ['admin-posts', circleId],
    queryFn: () => supabase.from('Post').select('*').match({ circle_id: circleId }).order('created_date', { ascending: false }).limit(100).then(res => res.data || []),
  });

  const { data: responses = [] } = useQuery({
    queryKey: ['admin-responses', circleId],
    queryFn: () => supabase.from('CircleResponse').select('*').match({ circle_id: circleId }).order('created_date', { ascending: false }).limit(100).then(res => res.data || []),
  });

  const weeklyData = buildWeeklyData(posts, responses);
  const totalMembers = Array.from(new Set([
    ...(circle?.member_ids || []),
    ...(circle?.created_by_id ? [circle.created_by_id] : []),
  ])).length;
  const totalPosts = posts.length;
  const totalResponses = responses.length;

  // Posts this week
  const thisWeekStart = startOfWeek(new Date());
  const thisWeekEnd = endOfWeek(new Date());
  const postsThisWeek = posts.filter(
    (p) => p.created_date && isWithinInterval(new Date(p.created_date), { start: thisWeekStart, end: thisWeekEnd })
  ).length;

  return (
    <div className="px-6 pb-6">
      <div className="border rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-indigo-50 to-blue-50 border-b flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Admin Dashboard</h3>
          <span className="ml-auto text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Admin Only</span>
        </div>

        <div className="p-4 space-y-4">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={Users} label="Members" value={totalMembers} color="bg-blue-500" />
            <StatCard icon={FileText} label="Total Posts" value={totalPosts} color="bg-indigo-500" />
            <StatCard icon={Zap} label="Responses" value={totalResponses} color="bg-cyan-500" />
            <StatCard icon={FileText} label="This Week" value={postsThisWeek} color="bg-emerald-500" />
          </div>

          {/* Weekly Chart */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Weekly Engagement (last 6 weeks)
            </p>
            {weeklyData.every((w) => w.Posts === 0 && w.Responses === 0) ? (
              <div className="h-36 flex items-center justify-center text-sm text-muted-foreground bg-muted/30 rounded-xl">
                No activity data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={weeklyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorResponses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="Posts" stroke="#3b82f6" strokeWidth={2} fill="url(#colorPosts)" />
                  <Area type="monotone" dataKey="Responses" stroke="#06b6d4" strokeWidth={2} fill="url(#colorResponses)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}