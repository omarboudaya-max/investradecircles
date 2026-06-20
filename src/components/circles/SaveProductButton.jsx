import React, { useState } from 'react';
import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function SaveProductButton({ userId, circleId, productCategory, brandName, priceRange }) {
  const queryClient = useQueryClient();

  const { data: saved = [] } = useQuery({
    queryKey: ['saved-products', userId, circleId, productCategory],
    queryFn: () => supabase.from('SavedProduct').select('*').match({ user_id: userId, circle_id: circleId, product_category: productCategory }).then(res => res.data || []),
    enabled: !!userId,
  });

  const isSaved = saved.length > 0;

  // Parse minimum price from a range string like "$40–$120" or "$99.99"
  function parseMinPrice(range) {
    if (!range) return null;
    const nums = range.replace(/[^\d.]/g, ' ').trim().split(/\s+/).map(Number).filter(n => n > 0);
    return nums.length > 0 ? Math.min(...nums) : null;
  }

  const saveMutation = useMutation({
    mutationFn: () => supabase.from('SavedProduct').insert({
      user_id: userId,
      circle_id: circleId,
      product_category: productCategory,
      brand_name: brandName || '',
      last_known_price: priceRange || '',
      last_known_price_min: parseMinPrice(priceRange),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-products', userId, circleId, productCategory] });
      toast.success('Product saved! You\'ll be notified if the price drops.');
    },
  });

  const unsaveMutation = useMutation({
    mutationFn: () => supabase.from('SavedProduct').delete().eq('id', saved[0].id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-products', userId, circleId, productCategory] });
      toast.info('Product removed from saved list.');
    },
  });

  if (!userId) return null;

  const isPending = saveMutation.isPending || unsaveMutation.isPending;

  return (
    <button
      onClick={() => isSaved ? unsaveMutation.mutate() : saveMutation.mutate()}
      disabled={isPending}
      title={isSaved ? 'Remove from saved' : 'Save for price drop alerts'}
      className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-all"
      style={isSaved
        ? { background: 'rgba(245,158,11,0.18)', borderColor: 'rgba(245,158,11,0.5)', color: '#fbbf24' }
        : { background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(147,197,253,0.7)' }
      }
    >
      {isPending
        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
        : isSaved
          ? <BookmarkCheck className="w-3.5 h-3.5" />
          : <Bookmark className="w-3.5 h-3.5" />
      }
      {isSaved ? 'Saved' : 'Save'}
    </button>
  );
}
