import React, { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Link } from 'react-router-dom';
import { Users, Plus, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CircleIcon from '@/components/circles/CircleIcon';

const CATEGORY_COLORS = {
  chamber_of_commerce: 'bg-amber-100 text-amber-700',
  stock_market: 'bg-green-100 text-green-700',
  university: 'bg-purple-100 text-purple-700',
  institution: 'bg-cyan-100 text-cyan-700',
  small_business: 'bg-orange-100 text-orange-700',
  individual: 'bg-blue-100 text-blue-700',
  topics: 'bg-gray-100 text-gray-700',
};

export default function CircleDiscovery() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: allCircles = [] } = useQuery({
    queryKey: ['all-circles-discovery'],
    queryFn: () => supabase.from('Circle').select('*').order('created_date', { ascending: false }).limit(50).then(res => res.data || []),
  });

  const { data: userProfile } = useQuery({
    queryKey: ['my-profile', user?.id],
    queryFn: () => supabase.from('profiles').select('*').match({ id: user?.id }).then(res => res.data || []),
    enabled: !!user?.id,
    select: (data) => data?.[0],
  });

  const joinMutation = useMutation({
    mutationFn: async (circle) => {
      const newMembers = [...(circle.member_ids || []), user.id];
      await supabase.from('Circle').update({ member_ids: newMembers }).eq('id', circle.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-circles-discovery'] });
      queryClient.invalidateQueries({ queryKey: ['my-circles-sidebar'] });
    },
  });

  // Filter out circles user is already in, then score by relevance
  const suggestions = useMemo(() => {
    if (!user) return [];

    const notMember = allCircles.filter(
      (c) => !(c.member_ids || []).includes(user.id)
    );

    const userTags = userProfile?.tags || [];
    const userType = userProfile?.user_type;
    const userInterests = userProfile?.interests || [];

    // Map interests to circle categories/tags
    const interestToCategory = {
      stocks: 'stock_market', crypto: 'individual', real_estate: 'individual',
      venture_capital: 'institution', startups: 'small_business', fintech: 'institution',
      blockchain: 'individual', esg: 'institution', private_equity: 'institution',
      commodities: 'stock_market', forex: 'stock_market', derivatives: 'stock_market',
    };

    const typeCategories = {
      investor: ['stock_market', 'individual', 'chamber_of_commerce', 'institution'],
      innovator: ['small_business', 'topics', 'university'],
    };
    const preferredCategories = [
      ...(typeCategories[userType] || []),
      ...userInterests.map((i) => interestToCategory[i]).filter(Boolean),
    ];

    const scored = notMember.map((c) => {
      let score = 0;
      (c.tags || []).forEach((tag) => { if (userTags.includes(tag)) score += 2; });
      if (preferredCategories.includes(c.category)) score += 1;
      // Bonus for interest-direct category match
      userInterests.forEach((interest) => {
        if (c.tags?.includes(interest) || c.category === interestToCategory[interest]) score += 2;
      });
      return { ...c, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 4);
  }, [allCircles, userProfile, user]);



  if (suggestions.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-4 mb-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Circles For You</h3>
            <p className="text-xs text-muted-foreground">Based on your interests</p>
          </div>
        </div>
        <Link to="/my-circles" className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
          See all <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {suggestions.map((circle) => (
          <div
            key={circle.id}
            className="flex flex-col gap-2 p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors"
          >
            {/* Circle avatar */}
            <div className="flex items-center gap-2">
              <div className="relative shrink-0">
                {circle.cover_image ? (
                  <img src={circle.cover_image} alt={circle.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <CircleIcon category={circle.category} size="md" websiteUrl={circle.website_url} />
                )}
                <span className="absolute -bottom-1 -right-1 flex items-center gap-0.5 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm leading-none">
                  <Users className="w-2 h-2" />{(circle.member_ids || []).length}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate">{circle.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {(circle.member_ids || []).length} members
                </p>
              </div>
            </div>

            {circle.category && (
              <Badge className={`text-[10px] px-2 py-0 w-fit capitalize ${CATEGORY_COLORS[circle.category] || CATEGORY_COLORS.topics}`}>
                {circle.category.replace(/_/g, ' ')}
              </Badge>
            )}

            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs rounded-full w-full mt-auto"
              disabled={joinMutation.isPending}
              onClick={() => joinMutation.mutate(circle)}
            >
              <Plus className="w-3 h-3 mr-1" /> Join
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
