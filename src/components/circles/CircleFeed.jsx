import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Newspaper, TrendingUp } from 'lucide-react';
import PostCard from '@/components/feed/PostCard';
import { Skeleton } from '@/components/ui/skeleton';

// Maps circle category to relevant keywords/tags used in post filtering
const CATEGORY_KEYWORDS = {
  chamber_of_commerce: ['commerce', 'trade', 'business', 'economy', 'chamber', 'industry', 'enterprise'],
  stock_market: ['stocks', 'shares', 'market', 'nasdaq', 'sp500', 'earnings', 'ipo', 'trading', 'equity'],
  university: ['university', 'education', 'research', 'academic', 'campus', 'scholarship', 'faculty'],
  institution: ['institution', 'finance', 'banking', 'regulation', 'governance', 'corporate'],
  small_business: ['small business', 'startup', 'entrepreneur', 'local', 'growth', 'funding'],
  individual: ['investor', 'portfolio', 'savings', 'wealth', 'personal', 'strategy'],
  topics: [],
};

function scorePost(post, category, circleId) {
  let score = 0;
  // Posts explicitly tied to this circle rank highest
  if (post.circle_id === circleId) score += 10;
  // Posts with public visibility
  if (post.visibility === 'public') score += 1;
  // Keyword match in content
  const keywords = CATEGORY_KEYWORDS[category] || [];
  const content = (post.content || '').toLowerCase();
  keywords.forEach((kw) => { if (content.includes(kw)) score += 2; });
  return score;
}

export default function CircleFeed({ circle, user }) {
  const circleId = circle?.id;
  const category = circle?.category || 'general';

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['circle-feed-posts', circleId, category],
    queryFn: () => supabase.from('Post').select('*').order('created_date', { ascending: false }).limit(100).then(res => res.data || []),
    enabled: !!circleId,
  });

  // Filter: circle posts + public posts that match category keywords; exclude private posts of other circles
  const filteredPosts = posts
    .filter((p) => {
      if (p.post_type === 'announcement') return false;
      if (p.circle_id === circleId) return true;
      if (p.visibility === 'private') return false;
      if (p.visibility === 'circle' && p.circle_id !== circleId) return false;
      if (category === 'general') return p.visibility === 'public';
      const keywords = CATEGORY_KEYWORDS[category] || [];
      const content = (p.content || '').toLowerCase();
      return keywords.some((kw) => content.includes(kw));
    })
    .map((p) => ({ ...p, _score: scorePost(p, category, circleId) }))
    .sort((a, b) => b._score - a._score || new Date(b.created_date) - new Date(a.created_date));

  return (
    <div className="px-6 pb-6 space-y-4">
      <div className="flex items-center gap-2 pt-4 pb-1">
        <TrendingUp className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">
          {category === 'topics' ? 'Circle Feed' : `${category.replace(/_/g, ' ')} Feed`}
        </h3>
        <span className="ml-auto text-xs text-muted-foreground">{filteredPosts.length} posts</span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <Newspaper className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No posts yet for this topic. Be the first to share!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
