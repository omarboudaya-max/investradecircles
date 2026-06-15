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
        <h1 className="text-2xl font-bold">All Circles</h1>
        <Link to="/create-circle">
          <button className="h-9 px-4 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
            + New Circle
          </button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search circles by name, category, or tag..."
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
          <h3 className="text-lg font-semibold mb-1">No circles found</h3>
          <p className="text-muted-foreground text-sm">Try a different keyword</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((circle, i) => (
            <motion.div
              key={circle.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              {INSTITUTIONAL_CATEGORIES.includes(circle.category) ? (
                <Link to={`/circle/${circle.id}`} className="block group">
                  <div
                    className="relative rounded-2xl p-[2px] shadow-lg hover:shadow-xl transition-all overflow-hidden"
                    style={{ background: 'linear-gradient(135deg,#f59e0b,#1e3a8a,#0ea5e9)' }}
                  >
                    <div
                      className="rounded-2xl p-5"
                      style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e2d5a 60%,#0c2461 100%)' }}
                    >
                      {/* Top row */}
                      <div className="flex items-start gap-3">
                        <div className="relative shrink-0">
                          <CircleIcon category={circle.category} size="xl" websiteUrl={circle.website_url} />
                          <span className="absolute -bottom-1 -right-1 flex items-center gap-0.5 bg-amber-400 text-slate-900 text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                            <Users className="w-2.5 h-2.5" />
                            {Array.from(new Set([...(circle.member_ids || []), ...(circle.created_by_id ? [circle.created_by_id] : [])])).length}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-bold text-lg truncate text-white group-hover:text-amber-300 transition-colors">
                              {circle.name}
                            </h3>
                          </div>
                          <p className="text-sm text-blue-200/70 line-clamp-2 mb-2">
                            {circle.description || 'Official institutional circle'}
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                              <Landmark className="w-2.5 h-2.5" /> INSTITUTIONAL
                            </span>
                            {circle.is_verified && (
                              <VerifiedBadge
                                label={circle.verified_label || 'Official'}
                                size="sm"
                                dark={true}
                              />
                            )}
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-400/10 text-sky-300 border border-sky-400/20">
                              <Sparkles className="w-2.5 h-2.5" /> AI Finance
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-blue-300/60 group-hover:text-amber-300 transition-colors mt-1 shrink-0" />
                      </div>
                      {/* Decorative bottom line */}
                      <div className="mt-4 h-px w-full rounded-full" style={{ background: 'linear-gradient(90deg,transparent,rgba(245,158,11,0.5),transparent)' }} />
                    </div>
                  </div>
                </Link>
              ) : (
                <Link
                  to={`/circle/${circle.id}`}
                  className="block bg-card rounded-2xl border shadow-sm p-5 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <CircleIcon category={circle.category} size="xl" websiteUrl={circle.website_url} />
                      <span className="absolute -bottom-1 -right-1 flex items-center gap-0.5 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                        <Users className="w-2.5 h-2.5" />{Array.from(new Set([...(circle.member_ids || []), ...(circle.created_by_id ? [circle.created_by_id] : [])])).length}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                          {circle.name}
                        </h3>
                        {circle.is_verified && (
                          <VerifiedBadge label={circle.verified_label || 'Verified'} size="sm" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {circle.description || 'No description'}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
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