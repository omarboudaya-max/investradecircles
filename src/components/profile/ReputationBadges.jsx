import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { computeReputation } from '@/lib/reputation';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ShieldCheck } from 'lucide-react';

export default function ReputationBadges({ userId }) {
  const { data: posts = [], isLoading: loadingPosts } = useQuery({
    queryKey: ['rep-posts', userId],
    queryFn: () => supabase.from('Post').select('*').match({ created_by_id: userId }).then(res => res.data || []),
    enabled: !!userId,
  });

  const { data: responses = [], isLoading: loadingResponses } = useQuery({
    queryKey: ['rep-responses', userId],
    queryFn: () => supabase.from('CircleResponse').select('*').match({ created_by_id: userId }).then(res => res.data || []),
    enabled: !!userId,
  });

  const { data: sentConns = [] } = useQuery({
    queryKey: ['rep-conns-sent', userId],
    queryFn: () => supabase.from('Connection').select('*').match({ requester_id: userId }).then(res => res.data || []),
    enabled: !!userId,
  });

  const { data: receivedConns = [] } = useQuery({
    queryKey: ['rep-conns-received', userId],
    queryFn: () => supabase.from('Connection').select('*').match({ recipient_id: userId }).then(res => res.data || []),
    enabled: !!userId,
  });

  const { data: circles = [], isLoading: loadingCircles } = useQuery({
    queryKey: ['rep-circles'],
    queryFn: () => supabase.from('Circle').select('*').then(res => res.data || []),
    enabled: !!userId,
  });

  const isLoading = loadingPosts || loadingResponses || loadingCircles;

  const { earnedBadges, stats } = useMemo(() => {
    if (!userId) return { earnedBadges: [], stats: {} };
    return computeReputation({
      userId,
      posts,
      responses,
      connections: [...sentConns, ...receivedConns],
      circles,
    });
  }, [userId, posts, responses, sentConns, receivedConns, circles]);

  if (isLoading) {
    return (
      <div className="flex gap-2 flex-wrap">
        {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-7 w-28 rounded-full" />)}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          <ShieldCheck className="w-3.5 h-3.5" /> Reputation
        </div>
        <div className="flex flex-wrap gap-2">
          {earnedBadges.length === 0 ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border cursor-default select-none bg-gray-100 text-gray-600 border-gray-300">
                  <span>🔨</span>
                  Building Up
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Keep active to earn your first reputation badge!
              </TooltipContent>
            </Tooltip>
          ) : (
            earnedBadges.map((badge) => (
              <Tooltip key={badge.id}>
                <TooltipTrigger asChild>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border cursor-default select-none ${badge.color}`}
                  >
                    <span>{badge.emoji}</span>
                    {badge.label}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {badge.description}
                </TooltipContent>
              </Tooltip>
            ))
          )}
        </div>

        {/* Mini stats */}
        <div className="flex flex-wrap gap-3 pt-1">
          {[
            { label: 'Posts', value: stats.postCount },
            { label: 'Responses', value: stats.responseCount },
            { label: 'Upvotes', value: stats.totalUpvotes },
            { label: 'Likes received', value: stats.totalLikes },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-sm font-bold text-foreground">{value}</p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}