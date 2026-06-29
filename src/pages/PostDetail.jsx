import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import PostCard from '@/components/feed/PostCard';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function PostDetail() {
  const { id } = useParams();
  const t = useTranslation();
  const { isArabic } = useLanguage();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['post-detail', id],
    queryFn: async () => {
      const { data } = await supabase.from('Post').select('*').eq('id', id);
      return data || [];
    },
    enabled: !!id,
  });

  const post = posts[0];

  return (
    <div className="max-w-2xl mx-auto py-4">
      {post && (
        <Helmet>
          <title>{`${post.author_name}'s Post - Investraders`}</title>
          <meta name="description" content={post.content?.substring(0, 150)} />
          <meta property="og:title" content={`${post.author_name}'s Post`} />
          <meta property="og:description" content={post.content?.substring(0, 150)} />
          {post.image_url && <meta property="og:image" content={post.image_url} />}
        </Helmet>
      )}

      <Link to="/home" className={`flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors ${isArabic ? 'flex-row-reverse' : ''}`}>
        <ArrowLeft className={`w-4 h-4 ${isArabic ? 'rotate-180' : ''}`} /> {t.postDetail.backToFeed}
      </Link>

      {isLoading ? (
        <div className="bg-card rounded-2xl border p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="w-11 h-11 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="w-32 h-4" />
              <Skeleton className="w-16 h-3" />
            </div>
          </div>
          <Skeleton className="w-full h-24" />
        </div>
      ) : !post ? (
        <div className="text-center py-20">
          <p className="text-lg font-semibold">{t.postDetail.notFoundTitle}</p>
          <p className="text-sm text-muted-foreground mt-1">{t.postDetail.notFoundSubtitle}</p>
          <Link to="/home" className="mt-4 inline-block text-primary hover:underline text-sm">{t.postDetail.goHome}</Link>
        </div>
      ) : (
        <PostCard post={post} />
      )}
    </div>
  );
}
