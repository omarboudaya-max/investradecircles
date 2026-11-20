import { useCallback, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';

const VISIBLE_RATIO = 0.6;
const DWELL_MS = 1500;
const FLUSH_MS = 4000;

const isMissingTable = (error) => error && (error.code === '42P01' || error.code === 'PGRST205' || /PostSeen/.test(error.message || ''));

/**
 * Records which posts the member has actually looked at (on screen for 1.5 s),
 * in batches, so the feed can show unseen posts first next time.
 *
 * Returns:
 *   track(element)  — ref callback for a post wrapper carrying data-post-id
 *   seenThisSession — Set of ids seen since the page opened
 *   flush()         — write pending marks now
 */
export function useSeenPosts(userId) {
  const pending = useRef(new Set());
  const seenThisSession = useRef(new Set());
  const timers = useRef(new Map());
  const disabled = useRef(false);

  const flush = useCallback(async () => {
    if (!userId || disabled.current || pending.current.size === 0) return;
    const ids = [...pending.current];
    pending.current.clear();
    const { error } = await supabase
      .from('PostSeen')
      .upsert(ids.map((post_id) => ({ user_id: userId, post_id })), { onConflict: 'user_id,post_id', ignoreDuplicates: true });
    if (error) {
      if (isMissingTable(error)) disabled.current = true; // migration not applied yet: keep it in-session only
      else ids.forEach((id) => pending.current.add(id)); // retry on the next flush
    }
  }, [userId]);

  useEffect(() => {
    const interval = setInterval(flush, FLUSH_MS);
    const onHide = () => { if (document.visibilityState === 'hidden') flush(); };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onHide);
      flush();
    };
  }, [flush]);

  const observer = useMemo(() => {
    if (typeof IntersectionObserver === 'undefined') return null;
    return new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const id = entry.target.dataset.postId;
        if (!id || seenThisSession.current.has(id)) continue;
        // Tall posts never reach 60 % visibility: half a screen of them counts too.
        const visible = entry.isIntersecting
          && (entry.intersectionRatio >= VISIBLE_RATIO || entry.intersectionRect.height >= window.innerHeight * 0.5);
        if (visible && !timers.current.has(id)) {
          timers.current.set(id, setTimeout(() => {
            timers.current.delete(id);
            seenThisSession.current.add(id);
            pending.current.add(id);
          }, DWELL_MS));
        } else if (!visible && timers.current.has(id)) {
          clearTimeout(timers.current.get(id));
          timers.current.delete(id);
        }
      }
    }, { threshold: [0, 0.3, VISIBLE_RATIO, 1] });
  }, []);

  useEffect(() => () => {
    observer?.disconnect();
    timers.current.forEach(clearTimeout);
    timers.current.clear();
  }, [observer]);

  const track = useCallback((element) => {
    if (element && observer && userId) observer.observe(element);
  }, [observer, userId]);

  return { track, seenThisSession: seenThisSession.current, flush };
}

/** Ids of posts this member has already seen (most recent 2,000). Empty if unavailable. */
export async function loadSeenPostIds(userId) {
  if (!userId) return new Set();
  const { data, error } = await supabase
    .from('PostSeen')
    .select('post_id')
    .eq('user_id', userId)
    .order('seen_at', { ascending: false })
    .limit(2000);
  if (error) return new Set();
  return new Set((data || []).map((row) => row.post_id));
}
