import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import StoryBar from '@/components/feed/StoryBar';
import CreatePostBox from '@/components/feed/CreatePostBox';
import PostCard from '@/components/feed/PostCard';
import CircleDiscovery from '@/components/feed/CircleDiscovery';
import PendingInvites from '@/components/circles/PendingInvites';
import WeeklyLeaderboard from '@/components/feed/WeeklyLeaderboard';
import UpcomingEventsCalendar from '@/components/feed/UpcomingEventsCalendar';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function Home() {
  const t = useTranslation();
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data } = await supabase.from('Post').select('*').is('circle_id', null).neq('post_type', 'announcement').order('created_date', { ascending: false }).limit(20);
      return data || [];
    },
  });

  return (
    <div className="max-w-2xl mx-auto">
      <StoryBar />
      <CreatePostBox />
      <PendingInvites />
      <WeeklyLeaderboard />
      <UpcomingEventsCalendar />
      <CircleDiscovery />

      <div className="space-y-5">
        {isLoading ? (
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
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-3xl">📝</span>
            </div>
            <h3 className="text-lg font-semibold mb-1">{t.home.noPostsTitle}</h3>
            <p className="text-sm text-muted-foreground">{t.home.noPostsSubtitle}</p>
          </div>
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}
