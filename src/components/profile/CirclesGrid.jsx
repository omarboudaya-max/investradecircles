import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import CircleIcon from '@/components/circles/CircleIcon';

export default function CirclesGrid({ userId }) {
  const { data: circles = [] } = useQuery({
    queryKey: ['user-circles-grid', userId],
    queryFn: () => supabase.from('Circle').select('*').order('created_date', { ascending: false }).limit(100).then(res => res.data || []),
    enabled: !!userId,
    select: (data) => data.filter(
      (c) => c.created_by_id === userId || (c.member_ids || []).includes(userId)
    ),
  });

  if (circles.length === 0) {
    return <p className="text-sm text-muted-foreground">Not a member of any circles yet.</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {circles.map((circle, i) => (
          <Link
            key={circle.id}
            to={`/circle/${circle.id}`}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className="group-hover:scale-105 transition-transform shadow-sm rounded-full">
              <CircleIcon category={circle.category} size="lg" />
            </div>
            <span className="text-xs text-muted-foreground max-w-[48px] truncate text-center">
              {circle.name}
            </span>
          </Link>
        ))}
      </div>
      <div className="flex justify-end mt-3">
        <Link to="/my-circles" className="text-sm font-medium text-primary hover:underline">
          See all
        </Link>
      </div>
    </div>
  );
}
