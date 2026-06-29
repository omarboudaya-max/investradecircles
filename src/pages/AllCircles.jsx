import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Search, Users, ArrowRight, Landmark, Sparkles } from 'lucide-react';
import CircleIcon from '@/components/circles/CircleIcon';
import VerifiedBadge from '@/components/circles/VerifiedBadge';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/i18n/useTranslation';

const CATEGORY_COLORS = {
  chamber_of_commerce: 'bg-amber-100 text-amber-800',
  stock_market: 'bg-green-100 text-green-700',
  university: 'bg-purple-100 text-purple-700',
  institution: 'bg-cyan-100 text-cyan-700',
  small_business: 'bg-orange-100 text-orange-700',
  individual: 'bg-blue-100 text-blue-700',
  topics: 'bg-gray-100 text-gray-700',
};

const INSTITUTIONAL_CATEGORIES = ['chamber_of_commerce', 'institution', 'university', 'stock_market'];

export default function AllCircles() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const t = useTranslation();

  const { data: circles = [], isLoading } = useQuery({
    queryKey: ['all-circles-browse'],
    queryFn: () => supabase.from('Circle').select('*').order('created_date', { ascending: false }).limit(100).then(res => res.data || []),
  });

  const filtered = circles
    .filter((c) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        c.name?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q) ||
        (c.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    })
    // Sort by most popular (member count desc)
    .sort((a, b) => (b.member_ids?.length || 0) - (a.member_ids?.length || 0));

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t.allCircles.title}</h1>
        <Link to="/create-circle">
          <button className="h-9 px-4 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
            + {t.allCircles.createCircle}
          </button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t.allCircles.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-11 rounded-xl"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-semibold mb-1">{t.allCircles.noCircles}</h3>
          <p className="text-muted-foreground text-sm">{t.allCircles.noResults}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((circle, i) => (
            <motion.div
              key={circle.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="h-full"
            >
              {INSTITUTIONAL_CATEGORIES.includes(circle.category) ? (
                <Link to={`/circle/${circle.id}`} className="block group h-full">
                  <div
                    className="relative rounded-2xl p-[1px] shadow-sm hover:shadow-md transition-all overflow-hidden bg-gradient-to-br from-[#D4AF37] to-transparent dark:from-[#D4AF37]/50 dark:to-transparent flex flex-col h-full"
                  >
                    <div
                      className="rounded-2xl p-5 bg-gradient-to-br from-[#FDFBF7] to-[#F4F1EA] dark:from-[#121212] dark:to-[#1E1E1E] flex flex-col flex-1"
                    >
                      {/* Top row */}
                      <div className="flex items-start gap-3 flex-1">
                        <div className="relative shrink-0">
                          <CircleIcon category={circle.category} size="xl" websiteUrl={circle.website_url} />
                          <span className="absolute -bottom-1 -right-1 flex items-center gap-0.5 bg-[#D4AF37] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                            <Users className="w-2.5 h-2.5" />
                            {Array.from(new Set([...(circle.member_ids || []), ...(circle.created_by_id ? [circle.created_by_id] : [])])).length}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col h-full">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-bold text-lg truncate text-[#2C2A29] dark:text-[#E0E0E0] group-hover:text-[#D4AF37] transition-colors">
                              {circle.name}
                            </h3>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2 flex-1">
                            {circle.description || 'Official institutional circle'}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-auto">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
                              <Landmark className="w-2.5 h-2.5" /> {t.allCircles.institutional}
                            </span>
                            {circle.is_verified && (
                              <VerifiedBadge
                                label={circle.verified_label || t.allCircles.official}
                                size="sm"
                              />
                            )}
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-[#D4AF37] transition-colors mt-1 shrink-0" />
                      </div>
                      {/* Decorative bottom line */}
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
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                          {circle.name}
                        </h3>
                        {circle.is_verified && (
                          <VerifiedBadge label={circle.verified_label || 'Verified'} size="sm" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2 flex-1">
                        {circle.description || t.allCircles.noCircles}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-auto">
                        <Badge className={`capitalize ${CATEGORY_COLORS[circle.category] || CATEGORY_COLORS.topics}`}>
                          {circle.category?.replace(/_/g, ' ') || 'Topics'}
                        </Badge>
                        {(() => {
                          const cnt = Array.from(new Set([...(circle.member_ids || []), ...(circle.created_by_id ? [circle.created_by_id] : [])])).length;
                          return cnt > 0 ? (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Users className="w-3 h-3" /> {cnt} members
                            </span>
                          ) : null;
                        })()}
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors mt-1 shrink-0" />
                  </div>
                </Link>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
