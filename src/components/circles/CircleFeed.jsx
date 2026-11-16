import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Newspaper } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import PostCard from '@/components/feed/PostCard';
import CreatePostBox from '@/components/feed/CreatePostBox';
import { Skeleton } from '@/components/ui/skeleton';

// Words that make a public post relevant to a kind of circle.
const CATEGORY_KEYWORDS = {
  chamber_of_commerce: ['commerce', 'trade', 'export', 'business', 'economy', 'chamber', 'chambre', 'industry', 'industrie', 'enterprise', 'entreprise'],
  stock_market: ['stocks', 'shares', 'market', 'nasdaq', 'sp500', 'earnings', 'ipo', 'trading', 'equity', 'bourse'],
  university: ['university', 'université', 'education', 'research', 'recherche', 'academic', 'campus', 'scholarship', 'faculty'],
  institution: ['institution', 'finance', 'banking', 'banque', 'regulation', 'governance', 'corporate'],
  small_business: ['small business', 'startup', 'entrepreneur', 'local', 'growth', 'funding', 'pme'],
  individual: ['investor', 'investisseur', 'portfolio', 'savings', 'wealth', 'strategy'],
};

function Section({ title, count, children }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground">· {count}</span>
      </div>
      {children}
    </section>
  );
}

/**
 * A circle's feed: what was posted inside the circle first, then public posts from
 * the wider platform that touch the circle's subject — clearly labelled as such.
 */
export default function CircleFeed({ circle, user }) {
  const circleId = circle?.id;
  const category = circle?.category || 'general';
  const isMember = circle?.member_ids?.includes(user?.id) || circle?.created_by_id === user?.id;

  const { data: circlePosts = [], isLoading } = useQuery({
    queryKey: ['circle-feed-posts', circleId, 'inside'],
    queryFn: () => supabase.from('Post').select('*').eq('circle_id', circleId).order('created_date', { ascending: false }).limit(100).then((res) => res.data || []),
    enabled: Boolean(circleId),
  });

  const { data: publicPosts = [] } = useQuery({
    queryKey: ['circle-feed-posts', circleId, 'related'],
    queryFn: () => supabase.from('Post').select('*').eq('visibility', 'public').order('created_date', { ascending: false }).limit(100).then((res) => res.data || []),
    enabled: Boolean(circleId),
    staleTime: 60000,
  });

  const inside = useMemo(() => circlePosts.filter((p) => p.post_type !== 'announcement'), [circlePosts]);
  const related = useMemo(() => {
    const keywords = CATEGORY_KEYWORDS[category] || [];
    if (!keywords.length) return [];
    return publicPosts
      .filter((p) => p.circle_id !== circleId && keywords.some((kw) => (p.content || '').toLowerCase().includes(kw)))
      .slice(0, 15);
  }, [publicPosts, category, circleId]);

  return (
    <div className="space-y-6 px-4 pb-6 pt-4 sm:px-6">
      {isMember && <CreatePostBox defaultCircle={circle} />}

      {isLoading ? (
        <div className="space-y-3">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      ) : (
        <Section title={`Posted in ${circle?.name || 'this circle'}`} count={inside.length}>
          {inside.length === 0 ? (
            <div className="rounded-xl border border-dashed py-10 text-center text-muted-foreground">
              <Newspaper className="mx-auto mb-2 h-8 w-8 opacity-40" />
              <p className="text-sm">{isMember ? 'Nothing has been posted here yet. Start the conversation above.' : 'Nothing has been posted here yet.'}</p>
            </div>
          ) : (
            <div className="space-y-3">{inside.map((post) => <PostCard key={post.id} post={post} readOnly={!isMember} />)}</div>
          )}
        </Section>
      )}

      {related.length > 0 && (
        <Section title="Related public posts on Investraders" count={related.length}>
          <div className="space-y-3">{related.map((post) => <PostCard key={post.id} post={post} />)}</div>
        </Section>
      )}
    </div>
  );
}
