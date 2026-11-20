import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { buildIntelligence } from '@/lib/intelligence/aggregate';

const PROFILE_COLUMNS = 'id,full_name,avatar_url,headline,bio,location,user_type,business_type,created_at,is_onboarded';

/** Run a select and return rows, or an empty list when the table is unreadable for this viewer. */
async function rows(query) {
  try {
    const { data, error } = await query;
    return error ? [] : data || [];
  } catch {
    return [];
  }
}

async function loadProfiles() {
  // match_profile is added by a migration; fall back cleanly while it is not there yet.
  const withPrefs = await supabase.from('profiles').select(`${PROFILE_COLUMNS},match_profile`).limit(5000);
  if (!withPrefs.error) return withPrefs.data || [];
  return rows(supabase.from('profiles').select(PROFILE_COLUMNS).limit(5000));
}

export async function loadIntelligenceData() {
  const [posts, comments, responses, profiles, circles, projects, organizations, vehicles, interests, registrations, governorates, sectors] = await Promise.all([
    // The news agent's posts are curated news, not member signals: keep them out of the analysis.
    rows(supabase.from('Post').select('id,circle_id,created_by_id,author_name,author_avatar,visibility,content,likes,liked_by,intent_category,post_type,created_date').order('created_date', { ascending: false }).limit(2000))
      .then((list) => list.filter((p) => p.post_type !== 'agent_news')),
    rows(supabase.from('Comment').select('id,post_id,circle_id,created_by_id,author_name,content,created_date').order('created_date', { ascending: false }).limit(2000)),
    rows(supabase.from('CircleResponse').select('id,circle_id,question_id,created_by_id,author_name,response_text,upvoted_by,created_date').order('created_date', { ascending: false }).limit(2000)),
    loadProfiles(),
    rows(supabase.from('Circle').select('id,name,category,privacy,member_ids,created_by_id,created_date')),
    base44.entities.InvestmentProject.list().catch(() => []),
    base44.entities.InvestmentOrganization.list().catch(() => []),
    base44.entities.InvestmentVehicle.list().catch(() => []),
    base44.entities.InvestorInterest.list().catch(() => []),
    rows(supabase.from('event_registrations').select('id,sector,created_at')),
    base44.entities.Governorate.list().catch(() => []),
    base44.entities.Sector.list().catch(() => []),
  ]);
  return { posts, comments, responses, profiles, circles, projects, organizations, vehicles, interests, registrations, governorates, sectors };
}

/** Restrict community data to one circle: what was said inside it, and what its members say in public. */
function scopeToCircle(data, circle) {
  const members = new Set([...(circle.member_ids || []), circle.created_by_id].filter(Boolean));
  const publicOrInside = (item) => item.circle_id === circle.id || (members.has(item.created_by_id) && (!item.visibility || item.visibility === 'public'));
  return {
    ...data,
    profiles: data.profiles.filter((p) => members.has(p.id)),
    posts: data.posts.filter(publicOrInside),
    comments: data.comments.filter((c) => c.circle_id === circle.id || members.has(c.created_by_id)),
    responses: data.responses.filter((r) => r.circle_id === circle.id),
    circles: data.circles.filter((c) => c.id === circle.id),
  };
}

/**
 * Live platform intelligence.
 * @param {{ circle?: object }} options  Pass a circle to scope community metrics to its members.
 */
export function useIntelligence({ circle = null } = {}) {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['intelligence-data', user?.id || 'anon'],
    queryFn: loadIntelligenceData,
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  const circleKey = circle ? `${circle.id}:${(circle.member_ids || []).length}` : 'platform';
  const intel = useMemo(() => {
    if (!query.data) return null;
    const publicOnly = { ...query.data, posts: query.data.posts.filter((p) => !p.visibility || p.visibility === 'public' || (circle && p.circle_id === circle.id)) };
    return buildIntelligence(circle ? scopeToCircle(publicOnly, circle) : publicOnly);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data, circleKey]);

  return {
    intel,
    raw: query.data || null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
    updatedAt: query.dataUpdatedAt,
  };
}
