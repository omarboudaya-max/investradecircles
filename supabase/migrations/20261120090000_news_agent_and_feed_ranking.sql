-- ============================================================================
-- Investraders — news agent log + per-member "seen posts" for feed ranking
-- ============================================================================
-- WHAT THIS DOES
--   1. AgentNewsItem: what the Investraders_agent has published (or is publishing).
--      • one row per source article, so the same article is never posted twice;
--      • at most one live row per day and slot (morning / afternoon / night), so a
--        retried or duplicated scheduled run can never post twice in a slot.
--      Written only by the agent (service role). Administrators can read it.
--   2. PostSeen: which posts a member has already seen in the home feed, so the
--      feed shows unseen posts first. Each member reads and writes only their own rows.
--
-- The script is idempotent — it is safe to run more than once.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Agent publication log
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public."AgentNewsItem" (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url          TEXT NOT NULL,
  source       TEXT NOT NULL,
  title        TEXT,
  published_at TIMESTAMPTZ,
  slot_date    DATE NOT NULL,
  slot         TEXT NOT NULL CHECK (slot IN ('morning', 'afternoon', 'night')),
  status       TEXT NOT NULL DEFAULT 'posting' CHECK (status IN ('posting', 'posted')),
  post_id      UUID REFERENCES public."Post"(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS agent_news_item_url_key ON public."AgentNewsItem" (url);
CREATE UNIQUE INDEX IF NOT EXISTS agent_news_item_one_per_slot ON public."AgentNewsItem" (slot_date, slot);
CREATE INDEX IF NOT EXISTS agent_news_item_created_idx ON public."AgentNewsItem" (created_at DESC);

ALTER TABLE public."AgentNewsItem" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agent_news_item_admin_read" ON public."AgentNewsItem";
CREATE POLICY "agent_news_item_admin_read" ON public."AgentNewsItem"
  FOR SELECT TO authenticated USING (public.is_admin());

REVOKE ALL ON public."AgentNewsItem" FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public."AgentNewsItem" FROM authenticated;
GRANT SELECT ON public."AgentNewsItem" TO authenticated;

-- ----------------------------------------------------------------------------
-- 2. Posts each member has already seen in the home feed
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public."PostSeen" (
  user_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id  UUID NOT NULL REFERENCES public."Post"(id) ON DELETE CASCADE,
  seen_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS post_seen_user_recent_idx ON public."PostSeen" (user_id, seen_at DESC);

ALTER TABLE public."PostSeen" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "post_seen_select_own" ON public."PostSeen";
DROP POLICY IF EXISTS "post_seen_insert_own" ON public."PostSeen";
DROP POLICY IF EXISTS "post_seen_update_own" ON public."PostSeen";
DROP POLICY IF EXISTS "post_seen_delete_own" ON public."PostSeen";
CREATE POLICY "post_seen_select_own" ON public."PostSeen"
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "post_seen_insert_own" ON public."PostSeen"
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "post_seen_update_own" ON public."PostSeen"
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "post_seen_delete_own" ON public."PostSeen"
  FOR DELETE TO authenticated USING (user_id = auth.uid());

REVOKE ALL ON public."PostSeen" FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."PostSeen" TO authenticated;

NOTIFY pgrst, 'reload schema';
