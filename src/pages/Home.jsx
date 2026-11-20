import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import StoryBar from '@/components/feed/StoryBar';
import CreatePostBox from '@/components/feed/CreatePostBox';
import PostCard from '@/components/feed/PostCard';
import CircleDiscovery from '@/components/feed/CircleDiscovery';
import PendingInvites from '@/components/circles/PendingInvites';
import PendingConnectionRequests from '@/components/profile/PendingConnectionRequests';
import MatchProfileNudge from '@/components/matching/MatchProfileNudge';
import WeeklyLeaderboard from '@/components/feed/WeeklyLeaderboard';
import UpcomingEventsCalendar from '@/components/feed/UpcomingEventsCalendar';
import PullToRefresh from '@/components/ui/PullToRefresh';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { rankFeed } from '@/lib/feedRanking';
import { useSeenPosts, loadSeenPostIds } from '@/hooks/useSeenPosts';

const FEED_SIZE = 150;
const PAGE = 15;

export default function Home() {
  const t = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { track, seenThisSession, flush } = useSeenPosts(user?.id);

  const { data: posts = [], isLoading, refetch } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data } = await supabase.from('Post').select('*').is('circle_id', null).neq('post_type', 'announcement').order('created_date', { ascending: false }).limit(FEED_SIZE);
      return data || [];
    },
  });

  const { data: commentCounts, isFetched: countsReady, refetch: refetchCounts } = useQuery({
    queryKey: ['feed-comment-counts'],
    queryFn: async () => {
      const { data } = await supabase.from('Comment').select('post_id').not('post_id', 'is', null).order('created_date', { ascending: false }).limit(5000);
      const counts = {};
      for (const row of data || []) counts[row.post_id] = (counts[row.post_id] || 0) + 1;
      return counts;
    },
    staleTime: 60_000,
  });

  const { data: seenIds, isFetched: seenReady, refetch: refetchSeen } = useQuery({
    queryKey: ['post-seen', user?.id],
    queryFn: () => loadSeenPostIds(user?.id),
    enabled: Boolean(user?.id),
    staleTime: Infinity,
  });

  // The order is decided once per visit (and on pull-to-refresh) so posts never jump
  // around while the member scrolls, even as likes and comments update live.
  const [order, setOrder] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PAGE);
  const ready = !isLoading && countsReady && (seenReady || !user?.id);

  useEffect(() => {
    if (!ready || order !== null) return;
    const seen = new Set([...(seenIds || []), ...seenThisSession]);
    setOrder(rankFeed(posts, { commentCounts: commentCounts || {}, seenIds: seen }));
  }, [ready, order, posts, commentCounts, seenIds, seenThisSession]);

  const orderedPosts = useMemo(() => {
    if (!order) return [];
    const byId = new Map(posts.map((p) => [p.id, p]));
    const known = new Set(order);
    // Posts that arrived after the order was set (including the member's own) go first.
    const arrivals = posts.filter((p) => !known.has(p.id));
    return [...arrivals, ...order.map((id) => byId.get(id)).filter(Boolean)];
  }, [order, posts]);

  const handleRefresh = async () => {
    await flush();
    await Promise.all([
      refetch(),
      refetchCounts(),
      user?.id ? refetchSeen() : Promise.resolve(),
      queryClient.invalidateQueries({ queryKey: ['stories'] }),
      queryClient.invalidateQueries({ queryKey: ['circle-feed-posts'] }),
    ]);
    setVisibleCount(PAGE);
    setOrder(null);
  };

  const showSkeleton = isLoading || (posts.length > 0 && order === null);

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="max-w-2xl mx-auto pb-6">
        <StoryBar />
        <CreatePostBox />
        <MatchProfileNudge />
        {/* The right-hand panel that also lists these is only shown on very wide screens. */}
        <PendingConnectionRequests limit={3} className="xl:hidden mb-5 bg-card rounded-2xl border p-4" />
        <PendingInvites />
        <WeeklyLeaderboard />
        <UpcomingEventsCalendar />
        <CircleDiscovery />

        <div className="space-y-5">
          {showSkeleton ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="bg-card rounded-2xl border p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-11 h-11 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="w-32 h-4" />
                    <Skeleton className="w-16 h-3" />
                  </div>
                </div>
                <Skeleton className="w-full h-20" />
              </div>
            ))
          ) : orderedPosts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-3xl">📝</span>
              </div>
              <h3 className="text-lg font-semibold mb-1">{t.home?.noPostsTitle || t.home?.noPostsYet || 'No posts yet'}</h3>
              <p className="text-sm text-muted-foreground">{t.home?.noPostsSubtitle || t.home?.beFirstToPost || 'Be the first to share something with your circles!'}</p>
            </div>
          ) : (
            <>
              {orderedPosts.slice(0, visibleCount).map((post) => (
                <div key={post.id} data-post-id={post.id} ref={track}>
                  <PostCard post={post} />
                </div>
              ))}
              {orderedPosts.length > visibleCount && (
                <Button variant="outline" className="w-full rounded-full" onClick={() => setVisibleCount((n) => n + PAGE)}>
                  {t.home?.loadMore || 'Load more posts'}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </PullToRefresh>
  );
}
