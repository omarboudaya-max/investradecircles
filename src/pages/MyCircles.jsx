import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Users, ArrowRight, Plus, Landmark } from 'lucide-react';
import CircleIcon from '@/components/circles/CircleIcon';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TagBadge } from '@/components/circles/TagPicker';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/i18n/useTranslation';

const CATEGORY_COLORS = {
  institution: 'bg-amber-100 text-amber-800',
  individual: 'bg-blue-100 text-blue-700',
};

const INSTITUTIONAL_CATEGORIES = ['chamber_of_commerce', 'institution', 'university', 'stock_market'];

export default function MyCircles() {
  const { user } = useAuth();
  const t = useTranslation();
  const urlParams = new URLSearchParams(window.location.search);
  const showCreatedOnly = urlParams.get('filter') === 'created';

  const { data: circles = [], isLoading } = useQuery({
    queryKey: ['my-circles', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('Circle').select('*').order('created_date', { ascending: false }).limit(100);
      return data || [];
    },
    enabled: !!user?.id,
  });

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/home" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold">{showCreatedOnly ? t.myCircles.yourCreatedCircles || 'Your Created Circles' : t.myCircles.title}</h1>
        </div>
        <Link to="/create-circle">
          <Button className="rounded-full bg-primary gap-2">
            <Plus className="w-4 h-4" /> {t.createCircle.title}
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : (() => {
        const myCircles = circles.filter((c) =>
          showCreatedOnly
            ? c.created_by_id === user?.id
            : c.created_by_id === user?.id || (c.member_ids || []).includes(user?.id)
        );
        if (myCircles.length === 0) return (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{showCreatedOnly ? t.myCircles.emptyCreated : t.myCircles.emptyJoined}</h3>
            <p className="text-muted-foreground mb-4">{showCreatedOnly ? t.myCircles.createOne : t.myCircles.exploreCircles}</p>
            <Link to="/all-circles">
              <Button className="rounded-full bg-primary">{t.allCircles.title}</Button>
            </Link>
          </div>
        );
        return (
        <div className="grid gap-4 md:grid-cols-2">
          {myCircles.map((circle, i) => (
            <motion.div
              key={circle.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="h-full"
            >
              {INSTITUTIONAL_CATEGORIES.includes(circle.category) ? (
                <Link to={`/circle/${circle.id}`} className="block group h-full">
                  <div className="relative rounded-2xl p-[1px] shadow-sm hover:shadow-md transition-all overflow-hidden bg-gradient-to-br from-[#D4AF37] to-transparent dark:from-[#D4AF37]/50 dark:to-transparent flex flex-col h-full">
                    <div className="rounded-2xl p-5 bg-gradient-to-br from-[#FDFBF7] to-[#F4F1EA] dark:from-[#121212] dark:to-[#1E1E1E] flex flex-col flex-1">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="relative shrink-0">
                          <CircleIcon category={circle.category} size="xl" websiteUrl={circle.website_url} />
                          <span className="absolute -bottom-1 -right-1 flex items-center gap-0.5 bg-[#D4AF37] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                            <Users className="w-2.5 h-2.5" />{Array.from(new Set([...(circle.member_ids || []), ...(circle.created_by_id ? [circle.created_by_id] : [])])).length}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col h-full">
                          <h3 className="font-semibold text-lg truncate text-[#2C2A29] dark:text-[#E0E0E0] group-hover:text-[#D4AF37] transition-colors">
                            {circle.name}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">
                          {circle.description || t.myCircles.noDescription}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-auto">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
                              <Landmark className="w-2.5 h-2.5" /> INSTITUTIONAL
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Users className="w-3 h-3" /> {Array.from(new Set([...(circle.member_ids || []), ...(circle.created_by_id ? [circle.created_by_id] : [])])).length} {t.myCircles.members}
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-[#D4AF37] transition-colors mt-1 shrink-0" />
                      </div>
                      <div className="mt-4 h-px w-full rounded-full" style={{ background: 'linear-gradient(90deg,transparent,rgba(212,175,55,0.5),transparent)' }} />
                    </div>
                  </div>
                </Link>
              ) : (
                <Link
                  to={`/circle/${circle.id}`}
                  className="bg-card rounded-2xl border shadow-sm p-5 hover:shadow-md transition-all group flex flex-col h-full"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="relative shrink-0">
                      <CircleIcon category={circle.category} size="xl" websiteUrl={circle.website_url} />
                      <span className="absolute -bottom-1 -right-1 flex items-center gap-0.5 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                        <Users className="w-2.5 h-2.5" />{Array.from(new Set([...(circle.member_ids || []), ...(circle.created_by_id ? [circle.created_by_id] : [])])).length}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col h-full">
                      <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                        {circle.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">
                        {circle.description || t.myCircles.noDescription}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-auto">
                        <Badge className={`capitalize ${CATEGORY_COLORS[circle.category] || 'bg-gray-100 text-gray-700'}`}>
                          {circle.category?.replace(/_/g, ' ') || 'Individual'}
                        </Badge>
                        {(circle.tags || []).map((tag) => (
                          <TagBadge key={tag} tag={tag} />
                        ))}
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                           <Users className="w-3 h-3" /> {Array.from(new Set([...(circle.member_ids || []), ...(circle.created_by_id ? [circle.created_by_id] : [])])).length} {t.myCircles.members}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors mt-1 shrink-0" />
                  </div>
                </Link>
              )}
            </motion.div>
          ))}
        </div>
        );
      })()}
    </div>
  );
}
