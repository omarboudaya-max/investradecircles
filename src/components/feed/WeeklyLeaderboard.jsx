import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/useTranslation';

const RANK_STYLES = [
  'bg-yellow-400 text-white',
  'bg-gray-300 text-gray-800',
  'bg-amber-600 text-white',
];

function getWeekAgo() {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
}

function scoreUser({ posts, responses }) {
  const postScore = posts.length * 3;
  const responseScore = responses.length * 2;
  // Use liked_by.length as the source of truth (always synced with likes number)
  const upvoteScore = responses.reduce((s, r) => s + (r.upvoted_by?.length || 0), 0);
  const likeScore = posts.reduce((s, p) => s + (p.liked_by?.length || p.likes || 0), 0);
  return postScore + responseScore + upvoteScore + likeScore;
}

export default function WeeklyLeaderboard() {
  const t = useTranslation();
  // Include date in query key so data auto-refreshes when the week window slides
  const weekKey = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${Math.floor(d.getHours() / 6)}`;
  }, []);

  const weekAgo = useMemo(() => getWeekAgo(), [weekKey]);

  const { data: weeklyPosts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['leaderboard-posts', weekKey],
    queryFn: () => supabase.from('Post').select('*').order('created_date', { ascending: false }).limit(500).then(res => res.data || []),
    select: (d) => d.filter((p) => p.created_date >= weekAgo),
    staleTime: 15 * 60 * 1000,
  });

  const { data: weeklyResponses = [], isLoading: responsesLoading } = useQuery({
    queryKey: ['leaderboard-responses', weekKey],
    queryFn: () => supabase.from('CircleResponse').select('*').order('created_date', { ascending: false }).limit(500).then(res => res.data || []),
    select: (d) => d.filter((r) => r.created_date >= weekAgo),
    staleTime: 15 * 60 * 1000,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['leaderboard-users'],
    queryFn: () => supabase.from('profiles').select('*').then(res => res.data || []),
    staleTime: 30 * 60 * 1000,
  });

  // Aggregate scores per user
  const userMap = {};
  for (const post of weeklyPosts) {
    const uid = post.created_by_id;
    if (!uid) continue;
    if (!userMap[uid]) userMap[uid] = { posts: [], responses: [] };
    userMap[uid].posts.push(post);
  }
  for (const resp of weeklyResponses) {
    const uid = resp.created_by_id;
    if (!uid) continue;
    if (!userMap[uid]) userMap[uid] = { posts: [], responses: [] };
    userMap[uid].responses.push(resp);
  }

  const ranked = Object.entries(userMap)
    .map(([uid, data]) => ({
      uid,
      score: scoreUser(data),
      postCount: data.posts.length,
      responseCount: data.responses.length,
      user: allUsers.find((u) => u.id === uid),
    }))
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const isLoading = postsLoading || responsesLoading;

  if (isLoading && ranked.length === 0) {
    return (
      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden mb-5">
        <div className="px-5 py-4 border-b flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-500" />
          <h3 className="font-semibold text-sm">{t.leaderboard.title}</h3>
        </div>
        <div className="px-5 py-8 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (ranked.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl border shadow-sm overflow-hidden mb-5">
      <div className="px-5 py-4 border-b flex items-center gap-2">
        <Trophy className="w-4 h-4 text-yellow-500" />
        <h3 className="font-semibold text-sm">{t.leaderboard.title}</h3>
        <span className="ml-auto text-xs text-muted-foreground">{t.leaderboard.topContributors}</span>
      </div>
      <div className="divide-y">
        {ranked.map((entry, i) => {
          const name = entry.user?.full_name || entry.user?.email?.split('@')[0] || 'User';
          const avatar = entry.user?.avatar_url;
          return (
            <Link
              key={entry.uid}
              to={`/profile/${entry.uid}`}
              className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40 transition-colors"
            >
              {/* Rank */}
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${RANK_STYLES[i] || 'bg-muted text-muted-foreground'}`}>
                {i + 1}
              </div>

              {/* Avatar */}
              <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-cyan-300 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {avatar
                  ? <img src={avatar} alt={name} className="w-full h-full object-cover" />
                  : name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{name}</p>
                <p className="text-xs text-muted-foreground">
                  {t.leaderboard.posts(entry.postCount)} · {t.leaderboard.responses(entry.responseCount)}
                </p>
              </div>

              {/* Score */}
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-primary">{entry.score}</p>
                <p className="text-[10px] text-muted-foreground">{t.leaderboard.pts}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
