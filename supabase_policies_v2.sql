-- ==========================================================================
-- Investraders — Row Level Security hardening (v2)
-- ==========================================================================
-- WHY THIS FILE EXISTS
-- Live testing against the production Supabase REST API (using only the
-- public anon key, no login) confirmed that DirectMessage contents,
-- AuditLog entries, CircleInvite tokens, and profile emails were all
-- readable by anyone on the internet. Root cause: supabase_schema.sql
-- disables RLS on ALL 17 tables, and supabase_policies.sql only ever
-- re-enabled it on 7 of them. This file supersedes supabase_policies.sql
-- and covers every table, plus closes a privilege-escalation hole where
-- any logged-in user could set their own profiles.role to 'admin'.
--
-- HOW TO APPLY
-- 1. Read it once — it changes access rules for your live data.
-- 2. Run the whole file in the Supabase SQL editor (Project > SQL Editor).
--    It is idempotent (safe to re-run).
-- 3. Do NOT run disable_rls.sql again — delete it from the repo once this
--    is applied, it exists only to turn all of this back off.
-- 4. After applying, re-test the app: create/edit a post, like a post,
--    join a circle, send a DM, open the admin dashboard as an admin and
--    as a normal user. See the "MANUAL FOLLOW-UPS" note at the bottom.
-- ==========================================================================

-- --------------------------------------------------------------------------
-- 0. Helper functions
-- --------------------------------------------------------------------------

-- Is the calling user an admin? SECURITY DEFINER so it can read profiles.role
-- even though profiles RLS will restrict what a normal SELECT can see.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- Can the calling user see content that belongs to a given circle?
-- Public/no-circle content: always visible. Private circle content:
-- only creator, moderators, members, or admins.
CREATE OR REPLACE FUNCTION public.can_view_circle(p_circle_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p_circle_id IS NULL OR EXISTS (
    SELECT 1 FROM public."Circle" c
    WHERE c.id = p_circle_id
      AND (
        c.privacy IS DISTINCT FROM 'private'
        OR auth.uid() = c.created_by_id
        OR auth.uid() = ANY(c.moderator_ids)
        OR auth.uid() = ANY(c.member_ids)
        OR public.is_admin()
      )
  );
$$;
GRANT EXECUTE ON FUNCTION public.can_view_circle(uuid) TO authenticated, anon;

-- --------------------------------------------------------------------------
-- 1. profiles
-- --------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users or admins can update profile." ON public.profiles;

CREATE POLICY "Profiles are viewable by everyone." ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Any authenticated user may update their own row, and admins may update
-- any row (needed for the admin dashboard's role management). The trigger
-- below stops a non-admin from setting their own role/reputation.
CREATE POLICY "Users or admins can update profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin());

CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    NEW.role := OLD.role;
    NEW.reputation := OLD.reputation;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_privileged_columns ON public.profiles;
CREATE TRIGGER trg_protect_profile_privileged_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileged_columns();

-- --------------------------------------------------------------------------
-- 2. Circle
-- --------------------------------------------------------------------------
ALTER TABLE public."Circle" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Circles are viewable by everyone." ON public."Circle";
DROP POLICY IF EXISTS "Authenticated users can create circles." ON public."Circle";
DROP POLICY IF EXISTS "Creators and moderators can update circle." ON public."Circle";
DROP POLICY IF EXISTS "Authenticated users can update circle." ON public."Circle";
DROP POLICY IF EXISTS "Creators, moderators, joiners or admins can update circle." ON public."Circle";
DROP POLICY IF EXISTS "Creators or admins can delete circle." ON public."Circle";

CREATE POLICY "Circles are viewable by everyone." ON public."Circle"
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create circles." ON public."Circle"
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND created_by_id = auth.uid());

-- Any authenticated user can attempt an update (e.g. to join by adding
-- themselves to member_ids); the trigger below restricts what actually
-- changes unless the caller is the creator, a moderator, or an admin.
CREATE POLICY "Creators, moderators, joiners or admins can update circle." ON public."Circle"
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Creators or admins can delete circle." ON public."Circle"
  FOR DELETE USING (auth.uid() = created_by_id OR public.is_admin());

CREATE OR REPLACE FUNCTION public.protect_circle_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  is_privileged boolean;
  added_ids uuid[];
  removed_ids uuid[];
BEGIN
  is_privileged := (uid = OLD.created_by_id OR uid = ANY(OLD.moderator_ids) OR public.is_admin());

  IF NOT is_privileged THEN
    NEW.name := OLD.name;
    NEW.description := OLD.description;
    NEW.category := OLD.category;
    NEW.privacy := OLD.privacy;
    NEW.tags := OLD.tags;
    NEW.website_url := OLD.website_url;
    NEW.is_verified := OLD.is_verified;
    NEW.verified_label := OLD.verified_label;
    NEW.moderator_ids := OLD.moderator_ids;
    NEW.created_by_id := OLD.created_by_id;
    NEW.ai_cached_data := OLD.ai_cached_data;

    -- member_ids may only change by the caller adding or removing themself
    added_ids := COALESCE(ARRAY(SELECT unnest(NEW.member_ids) EXCEPT SELECT unnest(OLD.member_ids)), ARRAY[]::uuid[]);
    removed_ids := COALESCE(ARRAY(SELECT unnest(OLD.member_ids) EXCEPT SELECT unnest(NEW.member_ids)), ARRAY[]::uuid[]);

    IF NOT (
      (added_ids = ARRAY[uid]::uuid[] AND removed_ids = ARRAY[]::uuid[]) OR
      (removed_ids = ARRAY[uid]::uuid[] AND added_ids = ARRAY[]::uuid[]) OR
      (added_ids = ARRAY[]::uuid[] AND removed_ids = ARRAY[]::uuid[])
    ) THEN
      NEW.member_ids := OLD.member_ids;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_circle_columns ON public."Circle";
CREATE TRIGGER trg_protect_circle_columns
  BEFORE UPDATE ON public."Circle"
  FOR EACH ROW EXECUTE FUNCTION public.protect_circle_columns();

-- --------------------------------------------------------------------------
-- 3. CircleInvite (contains invite tokens — must stay private)
-- --------------------------------------------------------------------------
ALTER TABLE public."CircleInvite" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Inviter, invitee or admin can view invite." ON public."CircleInvite";
DROP POLICY IF EXISTS "Inviter can create invite." ON public."CircleInvite";
DROP POLICY IF EXISTS "Invitee can update invite status." ON public."CircleInvite";
DROP POLICY IF EXISTS "Inviter, invitee or admin can delete invite." ON public."CircleInvite";

CREATE POLICY "Inviter, invitee or admin can view invite." ON public."CircleInvite"
  FOR SELECT USING (auth.uid() = inviter_id OR auth.uid() = invitee_id OR public.is_admin());

CREATE POLICY "Inviter can create invite." ON public."CircleInvite"
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND inviter_id = auth.uid());

CREATE POLICY "Invitee can update invite status." ON public."CircleInvite"
  FOR UPDATE USING (auth.uid() = invitee_id OR public.is_admin());

CREATE POLICY "Inviter, invitee or admin can delete invite." ON public."CircleInvite"
  FOR DELETE USING (auth.uid() = inviter_id OR auth.uid() = invitee_id OR public.is_admin());

-- --------------------------------------------------------------------------
-- 4. CircleEvent
-- --------------------------------------------------------------------------
ALTER TABLE public."CircleEvent" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Circle events viewable per circle privacy." ON public."CircleEvent";
DROP POLICY IF EXISTS "Authenticated users can create circle events." ON public."CircleEvent";
DROP POLICY IF EXISTS "Creator or admin can update circle event." ON public."CircleEvent";
DROP POLICY IF EXISTS "Creator or admin can delete circle event." ON public."CircleEvent";

CREATE POLICY "Circle events viewable per circle privacy." ON public."CircleEvent"
  FOR SELECT USING (public.can_view_circle(circle_id));

CREATE POLICY "Authenticated users can create circle events." ON public."CircleEvent"
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND created_by_id = auth.uid());

CREATE POLICY "Creator or admin can update circle event." ON public."CircleEvent"
  FOR UPDATE USING (auth.uid() = created_by_id OR public.is_admin());

CREATE POLICY "Creator or admin can delete circle event." ON public."CircleEvent"
  FOR DELETE USING (auth.uid() = created_by_id OR public.is_admin());

-- --------------------------------------------------------------------------
-- 5. CircleQuestion
-- --------------------------------------------------------------------------
ALTER TABLE public."CircleQuestion" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Circle questions viewable per circle privacy." ON public."CircleQuestion";
DROP POLICY IF EXISTS "Authenticated users can create circle questions." ON public."CircleQuestion";
DROP POLICY IF EXISTS "Creator or admin can update circle question." ON public."CircleQuestion";
DROP POLICY IF EXISTS "Creator or admin can delete circle question." ON public."CircleQuestion";

CREATE POLICY "Circle questions viewable per circle privacy." ON public."CircleQuestion"
  FOR SELECT USING (public.can_view_circle(circle_id));

CREATE POLICY "Authenticated users can create circle questions." ON public."CircleQuestion"
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND created_by_id = auth.uid());

CREATE POLICY "Creator or admin can update circle question." ON public."CircleQuestion"
  FOR UPDATE USING (auth.uid() = created_by_id OR public.is_admin());

CREATE POLICY "Creator or admin can delete circle question." ON public."CircleQuestion"
  FOR DELETE USING (auth.uid() = created_by_id OR public.is_admin());

-- --------------------------------------------------------------------------
-- 6. CircleResponse (has upvoted_by/downvoted_by arrays anyone can toggle)
-- --------------------------------------------------------------------------
ALTER TABLE public."CircleResponse" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Circle responses viewable per circle privacy." ON public."CircleResponse";
DROP POLICY IF EXISTS "Authenticated users can create circle responses." ON public."CircleResponse";
DROP POLICY IF EXISTS "Authenticated users can update circle response (voting)." ON public."CircleResponse";
DROP POLICY IF EXISTS "Author or admin can delete circle response." ON public."CircleResponse";

CREATE POLICY "Circle responses viewable per circle privacy." ON public."CircleResponse"
  FOR SELECT USING (public.can_view_circle(circle_id));

CREATE POLICY "Authenticated users can create circle responses." ON public."CircleResponse"
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND created_by_id = auth.uid());

-- Any authenticated user can vote; the trigger below stops them changing
-- anything except the vote arrays unless they are the author or an admin.
CREATE POLICY "Authenticated users can update circle response (voting)." ON public."CircleResponse"
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Author or admin can delete circle response." ON public."CircleResponse"
  FOR DELETE USING (auth.uid() = created_by_id OR public.is_admin());

CREATE OR REPLACE FUNCTION public.protect_circle_response_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM OLD.created_by_id AND NOT public.is_admin() THEN
    NEW.response_text := OLD.response_text;
    NEW.question_id := OLD.question_id;
    NEW.circle_id := OLD.circle_id;
    NEW.created_by_id := OLD.created_by_id;
    NEW.author_name := OLD.author_name;
    NEW.author_avatar := OLD.author_avatar;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_circle_response_columns ON public."CircleResponse";
CREATE TRIGGER trg_protect_circle_response_columns
  BEFORE UPDATE ON public."CircleResponse"
  FOR EACH ROW EXECUTE FUNCTION public.protect_circle_response_columns();

-- --------------------------------------------------------------------------
-- 7. Post (has likes/liked_by/saved_by/reactions anyone can toggle)
-- --------------------------------------------------------------------------
ALTER TABLE public."Post" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Posts are viewable by everyone." ON public."Post";
DROP POLICY IF EXISTS "Posts viewable per circle privacy." ON public."Post";
DROP POLICY IF EXISTS "Authenticated users can create posts." ON public."Post";
DROP POLICY IF EXISTS "Authenticated users can update posts (for likes/reactions)." ON public."Post";
DROP POLICY IF EXISTS "Authors can delete their own posts." ON public."Post";
DROP POLICY IF EXISTS "Authors or admins can delete their own posts." ON public."Post";

CREATE POLICY "Posts viewable per circle privacy." ON public."Post"
  FOR SELECT USING (public.can_view_circle(circle_id));

CREATE POLICY "Authenticated users can create posts." ON public."Post"
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND created_by_id = auth.uid());

-- Any authenticated user can attempt an update (needed so anyone can like /
-- save / react); the trigger below stops them touching anything else
-- unless they are the author or an admin.
CREATE POLICY "Authenticated users can update posts (for likes/reactions)." ON public."Post"
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authors or admins can delete their own posts." ON public."Post"
  FOR DELETE USING (auth.uid() = created_by_id OR public.is_admin());

CREATE OR REPLACE FUNCTION public.protect_post_content_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM OLD.created_by_id AND NOT public.is_admin() THEN
    NEW.content := OLD.content;
    NEW.post_type := OLD.post_type;
    NEW.image_url := OLD.image_url;
    NEW.video_url := OLD.video_url;
    NEW.file_url := OLD.file_url;
    NEW.file_name := OLD.file_name;
    NEW.file_type := OLD.file_type;
    NEW.circle_id := OLD.circle_id;
    NEW.created_by_id := OLD.created_by_id;
    NEW.visibility := OLD.visibility;
    NEW.author_name := OLD.author_name;
    NEW.author_avatar := OLD.author_avatar;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_post_content_columns ON public."Post";
CREATE TRIGGER trg_protect_post_content_columns
  BEFORE UPDATE ON public."Post"
  FOR EACH ROW EXECUTE FUNCTION public.protect_post_content_columns();

-- --------------------------------------------------------------------------
-- 8. Comment (same "anyone can react" shape as Post)
-- --------------------------------------------------------------------------
ALTER TABLE public."Comment" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comments are viewable by everyone." ON public."Comment";
DROP POLICY IF EXISTS "Comments viewable per circle privacy." ON public."Comment";
DROP POLICY IF EXISTS "Authenticated users can create comments." ON public."Comment";
DROP POLICY IF EXISTS "Authenticated users can update comments." ON public."Comment";
DROP POLICY IF EXISTS "Authors can delete their own comments." ON public."Comment";
DROP POLICY IF EXISTS "Authors or admins can delete their own comments." ON public."Comment";

CREATE POLICY "Comments viewable per circle privacy." ON public."Comment"
  FOR SELECT USING (public.can_view_circle(circle_id));

CREATE POLICY "Authenticated users can create comments." ON public."Comment"
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND created_by_id = auth.uid());

CREATE POLICY "Authenticated users can update comments." ON public."Comment"
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authors or admins can delete their own comments." ON public."Comment"
  FOR DELETE USING (auth.uid() = created_by_id OR public.is_admin());

CREATE OR REPLACE FUNCTION public.protect_comment_content_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM OLD.created_by_id AND NOT public.is_admin() THEN
    NEW.content := OLD.content;
    NEW.post_id := OLD.post_id;
    NEW.circle_id := OLD.circle_id;
    NEW.created_by_id := OLD.created_by_id;
    NEW.author_name := OLD.author_name;
    NEW.author_avatar := OLD.author_avatar;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_comment_content_columns ON public."Comment";
CREATE TRIGGER trg_protect_comment_content_columns
  BEFORE UPDATE ON public."Comment"
  FOR EACH ROW EXECUTE FUNCTION public.protect_comment_content_columns();

-- --------------------------------------------------------------------------
-- 9. Story (ephemeral; viewed_by/reactions toggled by any viewer)
-- --------------------------------------------------------------------------
ALTER TABLE public."Story" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Stories are viewable by everyone." ON public."Story";
DROP POLICY IF EXISTS "Authenticated users can create stories." ON public."Story";
DROP POLICY IF EXISTS "Authenticated users can update stories (views/reactions)." ON public."Story";
DROP POLICY IF EXISTS "Author or admin can delete story." ON public."Story";

CREATE POLICY "Stories are viewable by everyone." ON public."Story"
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create stories." ON public."Story"
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND author_id = auth.uid());

CREATE POLICY "Authenticated users can update stories (views/reactions)." ON public."Story"
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Author or admin can delete story." ON public."Story"
  FOR DELETE USING (auth.uid() = author_id OR public.is_admin());

CREATE OR REPLACE FUNCTION public.protect_story_content_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM OLD.author_id AND NOT public.is_admin() THEN
    NEW.text := OLD.text;
    NEW.image_url := OLD.image_url;
    NEW.video_url := OLD.video_url;
    NEW.bg_gradient := OLD.bg_gradient;
    NEW.author_id := OLD.author_id;
    NEW.author_name := OLD.author_name;
    NEW.author_avatar := OLD.author_avatar;
    NEW.expires_at := OLD.expires_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_story_content_columns ON public."Story";
CREATE TRIGGER trg_protect_story_content_columns
  BEFORE UPDATE ON public."Story"
  FOR EACH ROW EXECUTE FUNCTION public.protect_story_content_columns();

-- --------------------------------------------------------------------------
-- 10. DirectMessage — private by definition
-- --------------------------------------------------------------------------
ALTER TABLE public."DirectMessage" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own messages." ON public."DirectMessage";
DROP POLICY IF EXISTS "Authenticated users can insert messages." ON public."DirectMessage";
DROP POLICY IF EXISTS "Sender can insert own messages." ON public."DirectMessage";
DROP POLICY IF EXISTS "Recipients can update messages." ON public."DirectMessage";

CREATE POLICY "Users can view own messages." ON public."DirectMessage"
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id OR public.is_admin());

CREATE POLICY "Sender can insert own messages." ON public."DirectMessage"
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND sender_id = auth.uid());

CREATE POLICY "Recipients can update messages." ON public."DirectMessage"
  FOR UPDATE USING (auth.uid() = recipient_id OR public.is_admin());

-- --------------------------------------------------------------------------
-- 11. Notification
-- --------------------------------------------------------------------------
ALTER TABLE public."Notification" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications." ON public."Notification";
DROP POLICY IF EXISTS "Authenticated users can insert notifications." ON public."Notification";
DROP POLICY IF EXISTS "Users can update own notifications." ON public."Notification";

CREATE POLICY "Users can view own notifications." ON public."Notification"
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

-- NOTE: notifications are written client-side by the actor (e.g. "user A
-- liked your post" is inserted by A's browser with user_id = B), so this
-- can't be tightened to user_id = auth.uid() without breaking that flow.
-- It stays open to any authenticated caller — see MANUAL FOLLOW-UPS below
-- for the real fix (move this to a DB trigger/RPC).
CREATE POLICY "Authenticated users can insert notifications." ON public."Notification"
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own notifications." ON public."Notification"
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

-- --------------------------------------------------------------------------
-- 12. Connection
-- --------------------------------------------------------------------------
ALTER TABLE public."Connection" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Connections viewable by everyone." ON public."Connection";
DROP POLICY IF EXISTS "Authenticated users can insert connections." ON public."Connection";
DROP POLICY IF EXISTS "Requester can insert own connections." ON public."Connection";
DROP POLICY IF EXISTS "Users can update their connections." ON public."Connection";

CREATE POLICY "Connections viewable by everyone." ON public."Connection"
  FOR SELECT USING (true);

CREATE POLICY "Requester can insert own connections." ON public."Connection"
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND requester_id = auth.uid());

CREATE POLICY "Users can update their connections." ON public."Connection"
  FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = recipient_id OR public.is_admin());

-- --------------------------------------------------------------------------
-- 13. AuditLog — admin only, immutable (no UPDATE/DELETE policy at all)
-- --------------------------------------------------------------------------
ALTER TABLE public."AuditLog" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view audit log." ON public."AuditLog";
DROP POLICY IF EXISTS "Admins can insert audit log." ON public."AuditLog";

CREATE POLICY "Admins can view audit log." ON public."AuditLog"
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins can insert audit log." ON public."AuditLog"
  FOR INSERT WITH CHECK (public.is_admin() AND admin_id = auth.uid());

-- --------------------------------------------------------------------------
-- 14. MarketData — public read, no client writes (refresh-market-data
--     edge function uses the service role key, which bypasses RLS)
-- --------------------------------------------------------------------------
ALTER TABLE public."MarketData" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Market data viewable by everyone." ON public."MarketData";

CREATE POLICY "Market data viewable by everyone." ON public."MarketData"
  FOR SELECT USING (true);

-- --------------------------------------------------------------------------
-- 15. ProductComment
-- --------------------------------------------------------------------------
ALTER TABLE public."ProductComment" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Product comments viewable per circle privacy." ON public."ProductComment";
DROP POLICY IF EXISTS "Authenticated users can create product comments." ON public."ProductComment";
DROP POLICY IF EXISTS "Author or admin can delete product comment." ON public."ProductComment";

CREATE POLICY "Product comments viewable per circle privacy." ON public."ProductComment"
  FOR SELECT USING (public.can_view_circle(circle_id));

CREATE POLICY "Authenticated users can create product comments." ON public."ProductComment"
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND created_by_id = auth.uid());

CREATE POLICY "Author or admin can delete product comment." ON public."ProductComment"
  FOR DELETE USING (auth.uid() = created_by_id OR public.is_admin());

-- --------------------------------------------------------------------------
-- 16. SavedProduct — personal scrapbook
-- --------------------------------------------------------------------------
ALTER TABLE public."SavedProduct" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own saved products." ON public."SavedProduct";
DROP POLICY IF EXISTS "Users can save products." ON public."SavedProduct";
DROP POLICY IF EXISTS "Users can delete own saved products." ON public."SavedProduct";

CREATE POLICY "Users can view own saved products." ON public."SavedProduct"
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can save products." ON public."SavedProduct"
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

CREATE POLICY "Users can delete own saved products." ON public."SavedProduct"
  FOR DELETE USING (auth.uid() = user_id);

-- --------------------------------------------------------------------------
-- 17. ProductClick — personal analytics event
-- --------------------------------------------------------------------------
ALTER TABLE public."ProductClick" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users or admins can view product clicks." ON public."ProductClick";
DROP POLICY IF EXISTS "Users can log own product clicks." ON public."ProductClick";

CREATE POLICY "Users or admins can view product clicks." ON public."ProductClick"
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can log own product clicks." ON public."ProductClick"
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND user_id = auth.uid());

-- ==========================================================================
-- MANUAL FOLLOW-UPS (can't be done safely from a SQL script alone)
-- ==========================================================================
-- 1. Remove the hardcoded admin auto-promote in src/lib/AuthContext.jsx
--    (lines ~10-13, the omarboudaya1@gmail.com check). Grant that account
--    admin once, directly:
--      UPDATE public.profiles SET role = 'admin' WHERE email = 'omarboudaya1@gmail.com';
--    then delete the client-side code — it's dead weight now and it was
--    visible to anyone reading the JS bundle.
--
-- 2. Notification spam/spoofing: any authenticated user can still insert a
--    Notification row for any user_id (see comment on policy #11 above).
--    The proper fix is to stop the client from inserting notifications for
--    OTHER users at all, and instead create them server-side via a trigger
--    (e.g. AFTER INSERT ON "Comment" -> notify the post author) or a
--    SECURITY DEFINER RPC that validates the relationship (e.g. the caller
--    really did comment on that post) before writing the notification.
--
-- 3. Rotate GROQ_API_KEY as routine hygiene (it was reviewed in plaintext
--    during this audit). It is not exposed to the browser bundle since it
--    lacks the VITE_ prefix, so this is precautionary, not urgent.
--
-- 4. Because DMs and emails were confirmed readable by an unauthenticated
--    request before this fix was applied, treat this as an actual data
--    exposure window, not just a theoretical gap, and decide whether any
--    user notification obligations apply once you've confirmed how long
--    the exposure was live.
-- ==========================================================================
