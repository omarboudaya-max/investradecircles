import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import PostCard from '@/components/feed/PostCard';
import { Bookmark } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function SavedPosts() {
  const { user } = useAuth();
  const t = useTranslation();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['saved-posts', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('Post').select('*').order('created_date', { ascending: false }).limit(100);
      return data || [];
    },
    select: (d) => d.filter((p) => p.saved_by?.includes(user?.id)),
    enabled: !!user?.id,
  });

  return (
    <div className="max-w-2xl mx-auto py-4">
      <div className="flex items-center gap-2 mb-6">
        <Bookmark className="w-5 h-5 text-primary" />
        <h1 className="text-xl font-bold">{t.savedPosts.title}</h1>
        <span className="text-sm text-muted-foreground ml-auto">{t.savedPosts.savedCount(posts.length)}</span>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array(3).fill(0).map((_, i) => (
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
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Bookmark className="w-8 h-8 text-primary/50" />
          </div>
          <h3 className="text-lg font-semibold mb-1">{t.savedPosts.emptyTitle}</h3>
          <p className="text-sm text-muted-foreground">{t.savedPosts.emptySubtitle}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {posts.map((post) => <PostCard key={post.id} post={post} />)}
        </div>
      )}
    </div>
  );
}
