import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';
import { Trophy } from 'lucide-react';

const MEDAL = ['🥇', '🥈', '🥉'];
const RANK_COLORS = [
  'from-yellow-400 to-amber-500',
  'from-slate-300 to-slate-400',
  'from-orange-300 to-orange-400',
];

export default function CircleLeaderboard({ circleId }) {
  const { data: responses = [] } = useQuery({
    queryKey: ['leaderboard-responses', circleId],
    queryFn: () => supabase.from('CircleResponse').select('*').match({ circle_id: circleId }).then(res => res.data || []),
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['leaderboard-posts', circleId],
    queryFn: () => supabase.from('Post').select('*').match({ circle_id: circleId }).then(res => res.data || []),
  });

  // Tally scores: posts=3pts, responses=2pts, +1 per upvote net on responses
  const scores = {};
  responses.forEach((r) => {
    const id = r.created_by_id;
    if (!id) return;
    const name = r.author_name || 'Unknown';
    if (!scores[id]) scores[id] = { name, score: 0 };
    const voteScore = (r.upvoted_by?.length || 0) - (r.downvoted_by?.length || 0);
    scores[id].score += 2 + Math.max(0, voteScore);
  });
  posts.forEach((p) => {
    const id = p.created_by_id;
    if (!id) return;
    const name = p.author_name || 'Unknown';
    if (!scores[id]) scores[id] = { name, score: 0 };
    scores[id].score += 3;
  });

  const leaderboard = Object.entries(scores)
    .map(([uid, data]) => ({ uid, name: data.name, score: data.score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (leaderboard.length === 0) return null;

  return (
    <div className="px-6 pb-6">
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-100 p-4">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-foreground">
          <Trophy className="w-4 h-4 text-yellow-500" /> Top Members
        </h3>
        <div className="space-y-2">
          {leaderboard.map((entry, i) => (
            <Link key={entry.uid} to={`/profile/${entry.uid}`} className="flex items-center gap-3 hover:bg-white/50 p-1 rounded-xl transition-colors">
              {/* Rank */}
              <span className="text-lg w-6 text-center shrink-0">
                {i < 3 ? MEDAL[i] : <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>}
              </span>

              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full bg-gradient-to-br ${RANK_COLORS[i] || 'from-blue-400 to-cyan-300'} flex items-center justify-center text-white text-xs font-bold shrink-0`}
              >
                {entry.name.charAt(0).toUpperCase()}
              </div>

              {/* Name + bar */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-sm font-medium truncate group-hover:underline">{entry.name}</span>
                  <span className="text-xs font-bold text-primary ml-2 shrink-0">{entry.score} pts</span>
                </div>
                <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${RANK_COLORS[i] || 'from-blue-400 to-cyan-400'}`}
                    style={{ width: `${Math.min(100, (entry.score / (leaderboard[0]?.score || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <p className="text-[10px] text-muted-foreground mt-3 text-center">
          Posts = 3pts · Responses = 2pts + votes
        </p>
      </div>
    </div>
  );
}
