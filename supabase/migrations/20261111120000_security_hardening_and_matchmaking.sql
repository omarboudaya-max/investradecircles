-- ============================================================================
-- Investraders — security hardening + matchmaking tables
-- ============================================================================
-- WHAT THIS DOES
--   1. Turns Row Level Security ON for every table and defines who may read and
--      write each one. Before this migration every table was readable and
--      writable with nothing but the public (anon) key: private messages,
--      profile emails, event registrations, the audit log.
--   2. Stops privilege escalation: only an administrator can change a profile's
--      role, verify a circle / project / investor, or feature a listing.
--   3. Adds the tables behind introductions, training registrations and post
--      reports, and the columns behind matching preferences and language sync.
--
-- The script is idempotent — it is safe to run more than once.
-- It supersedes supabase_policies.sql / fix_circle_policy.sql and must never be
-- followed by disable_rls.sql.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Columns the application already expects
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS language TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS match_profile JSONB;
ALTER TABLE public."CircleEvent" ADD COLUMN IF NOT EXISTS event_type TEXT;
ALTER TABLE public."CircleEvent" ADD COLUMN IF NOT EXISTS meet_link TEXT;
ALTER TABLE public."Post" ADD COLUMN IF NOT EXISTS intent_category TEXT DEFAULT 'ANNOUNCEMENT';

-- ----------------------------------------------------------------------------
-- 1. Helper functions
-- ----------------------------------------------------------------------------

-- SECURITY DEFINER so the check works regardless of the caller's own access to profiles.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- Creator or moderator of a circle (or a platform administrator).
CREATE OR REPLACE FUNCTION public.is_circle_manager(p_circle_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_admin() OR EXISTS (
    SELECT 1 FROM public."Circle" c
    WHERE c.id = p_circle_id
      AND (auth.uid() = c.created_by_id OR auth.uid() = ANY(COALESCE(c.moderator_ids, '{}')))
  );
$$;

CREATE OR REPLACE FUNCTION public.is_circle_member(p_circle_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_circle_manager(p_circle_id) OR EXISTS (
    SELECT 1 FROM public."Circle" c
    WHERE c.id = p_circle_id AND auth.uid() = ANY(COALESCE(c.member_ids, '{}'))
  );
$$;

-- Content with no circle is public to members of the platform; content inside a
-- private circle is visible to that circle's members only.
CREATE OR REPLACE FUNCTION public.can_view_circle(p_circle_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p_circle_id IS NULL OR EXISTS (
    SELECT 1 FROM public."Circle" c
    WHERE c.id = p_circle_id
      AND (
        lower(COALESCE(c.privacy, 'public')) <> 'private'
        OR auth.uid() = c.created_by_id
        OR auth.uid() = ANY(COALESCE(c.moderator_ids, '{}'))
        OR auth.uid() = ANY(COALESCE(c.member_ids, '{}'))
        OR public.is_admin()
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_circle_manager(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_circle_member(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_circle(uuid) TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 2. profiles
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users or admins can update profile." ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_members" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self_or_admin" ON public.profiles;

-- Profiles (which include email addresses) are for signed-in members only.
CREATE POLICY "profiles_select_members" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert_self" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_self_or_admin" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- Nobody can promote themselves: role and reputation change only through an administrator
-- (or a trusted server-side context, where auth.uid() is null).
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.role := 'user';
    NEW.reputation := 0;
  ELSE
    NEW.role := OLD.role;
    NEW.reputation := OLD.reputation;
    NEW.id := OLD.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_privileged_columns ON public.profiles;
CREATE TRIGGER trg_protect_profile_privileged_columns
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileged_columns();

-- ----------------------------------------------------------------------------
-- 3. Circle
-- ----------------------------------------------------------------------------
ALTER TABLE public."Circle" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Circles are viewable by everyone." ON public."Circle";
DROP POLICY IF EXISTS "Authenticated users can create circles." ON public."Circle";
DROP POLICY IF EXISTS "Creators and moderators can update circle." ON public."Circle";
DROP POLICY IF EXISTS "Authenticated users can update circle." ON public."Circle";
DROP POLICY IF EXISTS "Creators, moderators, joiners or admins can update circle." ON public."Circle";
DROP POLICY IF EXISTS "Creators or admins can delete circle." ON public."Circle";
DROP POLICY IF EXISTS "circle_select_members" ON public."Circle";
DROP POLICY IF EXISTS "circle_insert_self" ON public."Circle";
DROP POLICY IF EXISTS "circle_update_any_member" ON public."Circle";
DROP POLICY IF EXISTS "circle_delete_owner_or_admin" ON public."Circle";

CREATE POLICY "circle_select_members" ON public."Circle"
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "circle_insert_self" ON public."Circle"
  FOR INSERT TO authenticated WITH CHECK (created_by_id = auth.uid());
-- Any member may send an update (that is how joining and leaving work); the trigger
-- below decides which columns a non-manager is actually allowed to change.
CREATE POLICY "circle_update_any_member" ON public."Circle"
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "circle_delete_owner_or_admin" ON public."Circle"
  FOR DELETE TO authenticated USING (auth.uid() = created_by_id OR public.is_admin());

CREATE OR REPLACE FUNCTION public.protect_circle_columns()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  is_owner boolean;
  is_manager boolean;
  added uuid[];
  removed uuid[];
  may_join boolean;
BEGIN
  -- Trusted server-side contexts (migrations, service role, the invite RPC below).
  IF uid IS NULL OR current_setting('app.circle_guard_bypass', true) = 'on' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NOT public.is_admin() THEN
      NEW.is_verified := false;
      NEW.verified_label := NULL;
    END IF;
    RETURN NEW;
  END IF;

  is_owner := (uid = OLD.created_by_id) OR public.is_admin();
  is_manager := is_owner OR uid = ANY(COALESCE(OLD.moderator_ids, '{}'));

  -- Verification is an administrator decision, never the circle's own.
  IF NOT public.is_admin() THEN
    NEW.is_verified := OLD.is_verified;
    NEW.verified_label := OLD.verified_label;
    NEW.created_by_id := OLD.created_by_id;
  END IF;

  -- Only the owner appoints moderators.
  IF NOT is_owner THEN
    NEW.moderator_ids := OLD.moderator_ids;
  END IF;

  IF NOT is_manager THEN
    NEW.name := OLD.name;
    NEW.description := OLD.description;
    NEW.category := OLD.category;
    NEW.privacy := OLD.privacy;
    NEW.tags := OLD.tags;
    NEW.website_url := OLD.website_url;
    NEW.ai_cached_data := OLD.ai_cached_data;

    added := ARRAY(SELECT unnest(COALESCE(NEW.member_ids, '{}')) EXCEPT SELECT unnest(COALESCE(OLD.member_ids, '{}')));
    removed := ARRAY(SELECT unnest(COALESCE(OLD.member_ids, '{}')) EXCEPT SELECT unnest(COALESCE(NEW.member_ids, '{}')));

    -- A private circle is joined by invitation (or by a manager approving a request).
    may_join := lower(COALESCE(OLD.privacy, 'public')) <> 'private' OR EXISTS (
      SELECT 1 FROM public."CircleInvite" i
      WHERE i.circle_id = OLD.id AND i.invitee_id = uid AND i.status IN ('pending', 'accepted')
    );

    IF NOT (
      (cardinality(added) = 0 AND cardinality(removed) = 0)
      OR (added = ARRAY[uid] AND cardinality(removed) = 0 AND may_join)
      OR (removed = ARRAY[uid] AND cardinality(added) = 0)
    ) THEN
      NEW.member_ids := OLD.member_ids;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_circle_columns ON public."Circle";
CREATE TRIGGER trg_protect_circle_columns
  BEFORE INSERT OR UPDATE ON public."Circle"
  FOR EACH ROW EXECUTE FUNCTION public.protect_circle_columns();

-- ----------------------------------------------------------------------------
-- 4. CircleInvite (holds invite tokens)
-- ----------------------------------------------------------------------------
ALTER TABLE public."CircleInvite" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Inviter, invitee or admin can view invite." ON public."CircleInvite";
DROP POLICY IF EXISTS "Inviter can create invite." ON public."CircleInvite";
DROP POLICY IF EXISTS "Invitee can update invite status." ON public."CircleInvite";
DROP POLICY IF EXISTS "Inviter, invitee or admin can delete invite." ON public."CircleInvite";
DROP POLICY IF EXISTS "invite_select_parties" ON public."CircleInvite";
DROP POLICY IF EXISTS "invite_insert_inviter" ON public."CircleInvite";
DROP POLICY IF EXISTS "invite_update_parties" ON public."CircleInvite";
DROP POLICY IF EXISTS "invite_delete_parties" ON public."CircleInvite";

CREATE POLICY "invite_select_parties" ON public."CircleInvite"
  FOR SELECT TO authenticated
  USING (auth.uid() = inviter_id OR auth.uid() = invitee_id OR public.is_circle_manager(circle_id));
CREATE POLICY "invite_insert_inviter" ON public."CircleInvite"
  FOR INSERT TO authenticated
  WITH CHECK (
    inviter_id = auth.uid()
    AND (
      -- a join request addressed to the circle, or an invitation issued by one of its members
      status = 'request' OR public.is_circle_member(circle_id)
    )
  );
CREATE POLICY "invite_update_parties" ON public."CircleInvite"
  FOR UPDATE TO authenticated
  USING (auth.uid() = invitee_id OR public.is_circle_manager(circle_id))
  WITH CHECK (auth.uid() = invitee_id OR public.is_circle_manager(circle_id));
CREATE POLICY "invite_delete_parties" ON public."CircleInvite"
  FOR DELETE TO authenticated
  USING (auth.uid() = inviter_id OR auth.uid() = invitee_id OR public.is_circle_manager(circle_id));

-- Invite links carry a token and no named invitee, so the holder cannot read the row
-- directly. These two functions let a signed-in holder of a valid token see and accept it.
CREATE OR REPLACE FUNCTION public.get_circle_invite_by_token(p_token text)
RETURNS TABLE (id uuid, circle_id uuid, circle_name text, inviter_name text, status text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT i.id, i.circle_id, i.circle_name, i.inviter_name, i.status
  FROM public."CircleInvite" i
  WHERE auth.uid() IS NOT NULL
    AND p_token IS NOT NULL AND length(p_token) >= 8
    AND i.token = p_token
    AND i.status <> 'request'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.accept_circle_invite_by_token(p_token text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  inv record;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Sign in to accept an invitation' USING ERRCODE = '28000';
  END IF;
  SELECT * INTO inv FROM public."CircleInvite"
  WHERE token = p_token AND p_token IS NOT NULL AND length(p_token) >= 8
    AND status NOT IN ('request', 'declined', 'revoked')
  LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'This invitation is not valid any more' USING ERRCODE = 'P0002';
  END IF;
  -- A link addressed to a specific person can only be used by that person.
  IF inv.invitee_id IS NOT NULL AND inv.invitee_id <> uid THEN
    RAISE EXCEPTION 'This invitation was issued to another member' USING ERRCODE = '42501';
  END IF;

  PERFORM set_config('app.circle_guard_bypass', 'on', true);
  UPDATE public."Circle"
     SET member_ids = array_append(COALESCE(member_ids, '{}'), uid)
   WHERE id = inv.circle_id AND NOT (uid = ANY(COALESCE(member_ids, '{}')));
  PERFORM set_config('app.circle_guard_bypass', 'off', true);

  IF inv.invitee_id = uid THEN
    UPDATE public."CircleInvite" SET status = 'accepted' WHERE id = inv.id;
  END IF;
  RETURN inv.circle_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_circle_invite_by_token(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accept_circle_invite_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_circle_invite_by_token(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_circle_invite_by_token(text) TO authenticated;

-- ----------------------------------------------------------------------------
-- 5. CircleEvent
-- ----------------------------------------------------------------------------
ALTER TABLE public."CircleEvent" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Circle events viewable per circle privacy." ON public."CircleEvent";
DROP POLICY IF EXISTS "Authenticated users can create circle events." ON public."CircleEvent";
DROP POLICY IF EXISTS "Creator or admin can update circle event." ON public."CircleEvent";
DROP POLICY IF EXISTS "Creator or admin can delete circle event." ON public."CircleEvent";
DROP POLICY IF EXISTS "event_select_visible" ON public."CircleEvent";
DROP POLICY IF EXISTS "event_insert_member" ON public."CircleEvent";
DROP POLICY IF EXISTS "event_update_author_or_manager" ON public."CircleEvent";
DROP POLICY IF EXISTS "event_delete_author_or_manager" ON public."CircleEvent";

CREATE POLICY "event_select_visible" ON public."CircleEvent"
  FOR SELECT TO authenticated USING (public.can_view_circle(circle_id));
CREATE POLICY "event_insert_member" ON public."CircleEvent"
  FOR INSERT TO authenticated
  WITH CHECK (created_by_id = auth.uid() AND public.is_circle_member(circle_id));
CREATE POLICY "event_update_author_or_manager" ON public."CircleEvent"
  FOR UPDATE TO authenticated
  USING (auth.uid() = created_by_id OR public.is_circle_manager(circle_id))
  WITH CHECK (auth.uid() = created_by_id OR public.is_circle_manager(circle_id));
CREATE POLICY "event_delete_author_or_manager" ON public."CircleEvent"
  FOR DELETE TO authenticated
  USING (auth.uid() = created_by_id OR public.is_circle_manager(circle_id));

-- Members propose events; only a circle manager can approve one or open a live session.
CREATE OR REPLACE FUNCTION public.protect_circle_event_columns()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_circle_manager(NEW.circle_id) THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.status := 'pending';
    NEW.session_active := false;
  ELSE
    NEW.status := OLD.status;
    NEW.session_active := OLD.session_active;
    NEW.circle_id := OLD.circle_id;
    NEW.created_by_id := OLD.created_by_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_circle_event_columns ON public."CircleEvent";
CREATE TRIGGER trg_protect_circle_event_columns
  BEFORE INSERT OR UPDATE ON public."CircleEvent"
  FOR EACH ROW EXECUTE FUNCTION public.protect_circle_event_columns();

-- ----------------------------------------------------------------------------
-- 6. CircleQuestion / CircleResponse
-- ----------------------------------------------------------------------------
ALTER TABLE public."CircleQuestion" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Circle questions viewable per circle privacy." ON public."CircleQuestion";
DROP POLICY IF EXISTS "Authenticated users can create circle questions." ON public."CircleQuestion";
DROP POLICY IF EXISTS "Creator or admin can update circle question." ON public."CircleQuestion";
DROP POLICY IF EXISTS "Creator or admin can delete circle question." ON public."CircleQuestion";
DROP POLICY IF EXISTS "question_select_visible" ON public."CircleQuestion";
DROP POLICY IF EXISTS "question_insert_manager" ON public."CircleQuestion";
DROP POLICY IF EXISTS "question_update_manager" ON public."CircleQuestion";
DROP POLICY IF EXISTS "question_delete_manager" ON public."CircleQuestion";

CREATE POLICY "question_select_visible" ON public."CircleQuestion"
  FOR SELECT TO authenticated USING (public.can_view_circle(circle_id));
CREATE POLICY "question_insert_manager" ON public."CircleQuestion"
  FOR INSERT TO authenticated
  WITH CHECK (created_by_id = auth.uid() AND public.is_circle_manager(circle_id));
CREATE POLICY "question_update_manager" ON public."CircleQuestion"
  FOR UPDATE TO authenticated
  USING (public.is_circle_manager(circle_id)) WITH CHECK (public.is_circle_manager(circle_id));
CREATE POLICY "question_delete_manager" ON public."CircleQuestion"
  FOR DELETE TO authenticated USING (public.is_circle_manager(circle_id));

ALTER TABLE public."CircleResponse" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Circle responses viewable per circle privacy." ON public."CircleResponse";
DROP POLICY IF EXISTS "Authenticated users can create circle responses." ON public."CircleResponse";
DROP POLICY IF EXISTS "Authenticated users can update circle response (voting)." ON public."CircleResponse";
DROP POLICY IF EXISTS "Author or admin can delete circle response." ON public."CircleResponse";
DROP POLICY IF EXISTS "response_select_visible" ON public."CircleResponse";
DROP POLICY IF EXISTS "response_insert_member" ON public."CircleResponse";
DROP POLICY IF EXISTS "response_update_voters" ON public."CircleResponse";
DROP POLICY IF EXISTS "response_delete_author_or_manager" ON public."CircleResponse";

CREATE POLICY "response_select_visible" ON public."CircleResponse"
  FOR SELECT TO authenticated USING (public.can_view_circle(circle_id));
CREATE POLICY "response_insert_member" ON public."CircleResponse"
  FOR INSERT TO authenticated
  WITH CHECK (created_by_id = auth.uid() AND public.is_circle_member(circle_id));
-- Anyone who can see a response may vote on it; the trigger limits them to the vote arrays.
CREATE POLICY "response_update_voters" ON public."CircleResponse"
  FOR UPDATE TO authenticated
  USING (public.can_view_circle(circle_id)) WITH CHECK (public.can_view_circle(circle_id));
CREATE POLICY "response_delete_author_or_manager" ON public."CircleResponse"
  FOR DELETE TO authenticated
  USING (auth.uid() = created_by_id OR public.is_circle_manager(circle_id));

CREATE OR REPLACE FUNCTION public.protect_circle_response_columns()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;
  NEW.question_id := OLD.question_id;
  NEW.circle_id := OLD.circle_id;
  NEW.created_by_id := OLD.created_by_id;
  IF auth.uid() IS DISTINCT FROM OLD.created_by_id THEN
    NEW.response_text := OLD.response_text;
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

-- ----------------------------------------------------------------------------
-- 7. Post / Comment / Story — readable by members, editable by their author,
--    while likes, saves, reactions and views stay open to every member.
-- ----------------------------------------------------------------------------
ALTER TABLE public."Post" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Posts are viewable by everyone." ON public."Post";
DROP POLICY IF EXISTS "Posts viewable per circle privacy." ON public."Post";
DROP POLICY IF EXISTS "Authenticated users can create posts." ON public."Post";
DROP POLICY IF EXISTS "Authenticated users can update posts (for likes/reactions)." ON public."Post";
DROP POLICY IF EXISTS "Authors can delete their own posts." ON public."Post";
DROP POLICY IF EXISTS "Authors or admins can delete their own posts." ON public."Post";
DROP POLICY IF EXISTS "post_select_visible" ON public."Post";
DROP POLICY IF EXISTS "post_insert_author" ON public."Post";
DROP POLICY IF EXISTS "post_update_visible" ON public."Post";
DROP POLICY IF EXISTS "post_delete_author_manager" ON public."Post";

CREATE POLICY "post_select_visible" ON public."Post"
  FOR SELECT TO authenticated USING (public.can_view_circle(circle_id));
CREATE POLICY "post_insert_author" ON public."Post"
  FOR INSERT TO authenticated
  WITH CHECK (created_by_id = auth.uid() AND (circle_id IS NULL OR public.is_circle_member(circle_id)));
CREATE POLICY "post_update_visible" ON public."Post"
  FOR UPDATE TO authenticated
  USING (public.can_view_circle(circle_id)) WITH CHECK (public.can_view_circle(circle_id));
CREATE POLICY "post_delete_author_manager" ON public."Post"
  FOR DELETE TO authenticated
  USING (auth.uid() = created_by_id OR public.is_admin() OR (circle_id IS NOT NULL AND public.is_circle_manager(circle_id)));

CREATE OR REPLACE FUNCTION public.protect_post_content_columns()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;
  NEW.created_by_id := OLD.created_by_id;
  NEW.created_date := OLD.created_date;
  IF auth.uid() IS DISTINCT FROM OLD.created_by_id THEN
    NEW.content := OLD.content;
    NEW.post_type := OLD.post_type;
    NEW.image_url := OLD.image_url;
    NEW.video_url := OLD.video_url;
    NEW.file_url := OLD.file_url;
    NEW.file_name := OLD.file_name;
    NEW.file_type := OLD.file_type;
    NEW.circle_id := OLD.circle_id;
    NEW.visibility := OLD.visibility;
    NEW.author_name := OLD.author_name;
    NEW.author_avatar := OLD.author_avatar;
    NEW.intent_category := OLD.intent_category;
  END IF;
  -- The like counter always mirrors the list of people who liked.
  NEW.likes := COALESCE(cardinality(NEW.liked_by), 0);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_post_content_columns ON public."Post";
CREATE TRIGGER trg_protect_post_content_columns
  BEFORE UPDATE ON public."Post"
  FOR EACH ROW EXECUTE FUNCTION public.protect_post_content_columns();

ALTER TABLE public."Comment" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comments are viewable by everyone." ON public."Comment";
DROP POLICY IF EXISTS "Comments viewable per circle privacy." ON public."Comment";
DROP POLICY IF EXISTS "Authenticated users can create comments." ON public."Comment";
DROP POLICY IF EXISTS "Authenticated users can update comments." ON public."Comment";
DROP POLICY IF EXISTS "Authors can delete their own comments." ON public."Comment";
DROP POLICY IF EXISTS "Authors or admins can delete their own comments." ON public."Comment";
DROP POLICY IF EXISTS "comment_select_visible" ON public."Comment";
DROP POLICY IF EXISTS "comment_insert_author" ON public."Comment";
DROP POLICY IF EXISTS "comment_update_visible" ON public."Comment";
DROP POLICY IF EXISTS "comment_delete_author_manager" ON public."Comment";

CREATE POLICY "comment_select_visible" ON public."Comment"
  FOR SELECT TO authenticated USING (public.can_view_circle(circle_id));
CREATE POLICY "comment_insert_author" ON public."Comment"
  FOR INSERT TO authenticated
  WITH CHECK (created_by_id = auth.uid() AND public.can_view_circle(circle_id));
CREATE POLICY "comment_update_visible" ON public."Comment"
  FOR UPDATE TO authenticated
  USING (public.can_view_circle(circle_id)) WITH CHECK (public.can_view_circle(circle_id));
CREATE POLICY "comment_delete_author_manager" ON public."Comment"
  FOR DELETE TO authenticated
  USING (auth.uid() = created_by_id OR public.is_admin() OR (circle_id IS NOT NULL AND public.is_circle_manager(circle_id)));

CREATE OR REPLACE FUNCTION public.protect_comment_content_columns()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;
  NEW.created_by_id := OLD.created_by_id;
  NEW.post_id := OLD.post_id;
  NEW.circle_id := OLD.circle_id;
  IF auth.uid() IS DISTINCT FROM OLD.created_by_id THEN
    NEW.content := OLD.content;
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

ALTER TABLE public."Story" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Stories are viewable by everyone." ON public."Story";
DROP POLICY IF EXISTS "Authenticated users can create stories." ON public."Story";
DROP POLICY IF EXISTS "Authenticated users can update stories (views/reactions)." ON public."Story";
DROP POLICY IF EXISTS "Author or admin can delete story." ON public."Story";
DROP POLICY IF EXISTS "story_select_members" ON public."Story";
DROP POLICY IF EXISTS "story_insert_author" ON public."Story";
DROP POLICY IF EXISTS "story_update_members" ON public."Story";
DROP POLICY IF EXISTS "story_delete_author_or_admin" ON public."Story";

CREATE POLICY "story_select_members" ON public."Story"
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "story_insert_author" ON public."Story"
  FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid());
CREATE POLICY "story_update_members" ON public."Story"
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "story_delete_author_or_admin" ON public."Story"
  FOR DELETE TO authenticated USING (auth.uid() = author_id OR public.is_admin());

CREATE OR REPLACE FUNCTION public.protect_story_content_columns()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;
  NEW.author_id := OLD.author_id;
  IF auth.uid() IS DISTINCT FROM OLD.author_id THEN
    NEW.text := OLD.text;
    NEW.image_url := OLD.image_url;
    NEW.video_url := OLD.video_url;
    NEW.bg_gradient := OLD.bg_gradient;
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

-- ----------------------------------------------------------------------------
-- 8. DirectMessage — private between the two parties (administrators included:
--    running the platform does not entitle anyone to read private conversations)
-- ----------------------------------------------------------------------------
ALTER TABLE public."DirectMessage" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own messages." ON public."DirectMessage";
DROP POLICY IF EXISTS "Authenticated users can insert messages." ON public."DirectMessage";
DROP POLICY IF EXISTS "Sender can insert own messages." ON public."DirectMessage";
DROP POLICY IF EXISTS "Recipients can update messages." ON public."DirectMessage";
DROP POLICY IF EXISTS "dm_select_parties" ON public."DirectMessage";
DROP POLICY IF EXISTS "dm_insert_sender" ON public."DirectMessage";
DROP POLICY IF EXISTS "dm_update_recipient" ON public."DirectMessage";
DROP POLICY IF EXISTS "dm_delete_sender" ON public."DirectMessage";

CREATE POLICY "dm_select_parties" ON public."DirectMessage"
  FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "dm_insert_sender" ON public."DirectMessage"
  FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());
CREATE POLICY "dm_update_recipient" ON public."DirectMessage"
  FOR UPDATE TO authenticated USING (auth.uid() = recipient_id) WITH CHECK (auth.uid() = recipient_id);
CREATE POLICY "dm_delete_sender" ON public."DirectMessage"
  FOR DELETE TO authenticated USING (auth.uid() = sender_id);

-- The recipient may only flip the read flag.
CREATE OR REPLACE FUNCTION public.protect_direct_message_columns()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  NEW.sender_id := OLD.sender_id;
  NEW.recipient_id := OLD.recipient_id;
  NEW.conversation_id := OLD.conversation_id;
  NEW.content := OLD.content;
  NEW.sender_name := OLD.sender_name;
  NEW.sender_avatar := OLD.sender_avatar;
  NEW.created_date := OLD.created_date;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_direct_message_columns ON public."DirectMessage";
CREATE TRIGGER trg_protect_direct_message_columns
  BEFORE UPDATE ON public."DirectMessage"
  FOR EACH ROW EXECUTE FUNCTION public.protect_direct_message_columns();

-- ----------------------------------------------------------------------------
-- 9. Notification
-- ----------------------------------------------------------------------------
ALTER TABLE public."Notification" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications." ON public."Notification";
DROP POLICY IF EXISTS "Authenticated users can insert notifications." ON public."Notification";
DROP POLICY IF EXISTS "Users can update own notifications." ON public."Notification";
DROP POLICY IF EXISTS "notification_select_own" ON public."Notification";
DROP POLICY IF EXISTS "notification_insert_member" ON public."Notification";
DROP POLICY IF EXISTS "notification_update_own" ON public."Notification";
DROP POLICY IF EXISTS "notification_delete_own" ON public."Notification";

CREATE POLICY "notification_select_own" ON public."Notification"
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
-- Notifications are written by the member whose action triggers them ("A commented
-- on your post" is inserted by A). Links must stay inside the app.
CREATE POLICY "notification_insert_member" ON public."Notification"
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id IS NOT NULL
    AND length(COALESCE(message, '')) <= 1000
    AND (target_url IS NULL OR (target_url LIKE '/%' AND target_url NOT LIKE '//%'))
  );
CREATE POLICY "notification_update_own" ON public."Notification"
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notification_delete_own" ON public."Notification"
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 10. Connection
-- ----------------------------------------------------------------------------
ALTER TABLE public."Connection" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Connections viewable by everyone." ON public."Connection";
DROP POLICY IF EXISTS "Authenticated users can insert connections." ON public."Connection";
DROP POLICY IF EXISTS "Requester can insert own connections." ON public."Connection";
DROP POLICY IF EXISTS "Users can update their connections." ON public."Connection";
DROP POLICY IF EXISTS "connection_select_members" ON public."Connection";
DROP POLICY IF EXISTS "connection_insert_requester" ON public."Connection";
DROP POLICY IF EXISTS "connection_update_parties" ON public."Connection";
DROP POLICY IF EXISTS "connection_delete_parties" ON public."Connection";

CREATE POLICY "connection_select_members" ON public."Connection"
  FOR SELECT TO authenticated USING (true);
-- A request always starts as pending: the recipient is the one who accepts it.
CREATE POLICY "connection_insert_requester" ON public."Connection"
  FOR INSERT TO authenticated
  WITH CHECK (requester_id = auth.uid() AND recipient_id <> auth.uid() AND COALESCE(status, 'pending') = 'pending');
CREATE POLICY "connection_update_parties" ON public."Connection"
  FOR UPDATE TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = requester_id OR auth.uid() = recipient_id);
CREATE POLICY "connection_delete_parties" ON public."Connection"
  FOR DELETE TO authenticated USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE OR REPLACE FUNCTION public.protect_connection_columns()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;
  NEW.requester_id := OLD.requester_id;
  NEW.recipient_id := OLD.recipient_id;
  -- The person who sent the request cannot accept it on the other's behalf.
  IF auth.uid() = OLD.requester_id AND NEW.status = 'accepted' AND OLD.status IS DISTINCT FROM 'accepted' THEN
    NEW.status := OLD.status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_connection_columns ON public."Connection";
CREATE TRIGGER trg_protect_connection_columns
  BEFORE UPDATE ON public."Connection"
  FOR EACH ROW EXECUTE FUNCTION public.protect_connection_columns();

-- ----------------------------------------------------------------------------
-- 11. AuditLog — administrators only, append-only
-- ----------------------------------------------------------------------------
ALTER TABLE public."AuditLog" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view audit log." ON public."AuditLog";
DROP POLICY IF EXISTS "Admins can insert audit log." ON public."AuditLog";
DROP POLICY IF EXISTS "audit_select_admin" ON public."AuditLog";
DROP POLICY IF EXISTS "audit_insert_admin" ON public."AuditLog";

CREATE POLICY "audit_select_admin" ON public."AuditLog"
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "audit_insert_admin" ON public."AuditLog"
  FOR INSERT TO authenticated WITH CHECK (public.is_admin() AND admin_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 12. MarketData — public read; written only with the service role
-- ----------------------------------------------------------------------------
ALTER TABLE public."MarketData" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Market data viewable by everyone." ON public."MarketData";
DROP POLICY IF EXISTS "market_select_all" ON public."MarketData";

CREATE POLICY "market_select_all" ON public."MarketData"
  FOR SELECT TO anon, authenticated USING (true);

-- ----------------------------------------------------------------------------
-- 13. Product comments / saved products / product clicks
-- ----------------------------------------------------------------------------
ALTER TABLE public."ProductComment" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Product comments viewable per circle privacy." ON public."ProductComment";
DROP POLICY IF EXISTS "Authenticated users can create product comments." ON public."ProductComment";
DROP POLICY IF EXISTS "Author or admin can delete product comment." ON public."ProductComment";
DROP POLICY IF EXISTS "product_comment_select_visible" ON public."ProductComment";
DROP POLICY IF EXISTS "product_comment_insert_author" ON public."ProductComment";
DROP POLICY IF EXISTS "product_comment_delete_author_manager" ON public."ProductComment";

CREATE POLICY "product_comment_select_visible" ON public."ProductComment"
  FOR SELECT TO authenticated USING (public.can_view_circle(circle_id));
CREATE POLICY "product_comment_insert_author" ON public."ProductComment"
  FOR INSERT TO authenticated
  WITH CHECK (created_by_id = auth.uid() AND public.can_view_circle(circle_id));
CREATE POLICY "product_comment_delete_author_manager" ON public."ProductComment"
  FOR DELETE TO authenticated
  USING (auth.uid() = created_by_id OR public.is_circle_manager(circle_id));

ALTER TABLE public."SavedProduct" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own saved products." ON public."SavedProduct";
DROP POLICY IF EXISTS "Users can save products." ON public."SavedProduct";
DROP POLICY IF EXISTS "Users can delete own saved products." ON public."SavedProduct";
DROP POLICY IF EXISTS "saved_product_own" ON public."SavedProduct";

CREATE POLICY "saved_product_own" ON public."SavedProduct"
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public."ProductClick" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users or admins can view product clicks." ON public."ProductClick";
DROP POLICY IF EXISTS "Users can log own product clicks." ON public."ProductClick";
DROP POLICY IF EXISTS "product_click_select" ON public."ProductClick";
DROP POLICY IF EXISTS "product_click_insert_own" ON public."ProductClick";

CREATE POLICY "product_click_select" ON public."ProductClick"
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_circle_manager(circle_id));
CREATE POLICY "product_click_insert_own" ON public."ProductClick"
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 14. Investment reference data — public read, administrator write
-- ----------------------------------------------------------------------------
ALTER TABLE public."Governorate" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "governorate_select_all" ON public."Governorate";
DROP POLICY IF EXISTS "governorate_write_admin" ON public."Governorate";
CREATE POLICY "governorate_select_all" ON public."Governorate" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "governorate_write_admin" ON public."Governorate" FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public."Sector" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sector_select_all" ON public."Sector";
DROP POLICY IF EXISTS "sector_write_admin" ON public."Sector";
CREATE POLICY "sector_select_all" ON public."Sector" FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "sector_write_admin" ON public."Sector" FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 15. InvestmentProject — public listing; owned by its promoter
-- ----------------------------------------------------------------------------
ALTER TABLE public."InvestmentProject" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_select_listed" ON public."InvestmentProject";
DROP POLICY IF EXISTS "project_insert_owner" ON public."InvestmentProject";
DROP POLICY IF EXISTS "project_update_owner_or_admin" ON public."InvestmentProject";
DROP POLICY IF EXISTS "project_delete_owner_or_admin" ON public."InvestmentProject";

-- Rejected submissions are visible only to their promoter and to administrators.
CREATE POLICY "project_select_listed" ON public."InvestmentProject"
  FOR SELECT TO anon, authenticated
  USING (project_status IS DISTINCT FROM 'REJECTED' OR user_id = auth.uid()::text OR public.is_admin());
CREATE POLICY "project_insert_owner" ON public."InvestmentProject"
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text OR public.is_admin());
CREATE POLICY "project_update_owner_or_admin" ON public."InvestmentProject"
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()::text OR public.is_admin())
  WITH CHECK (user_id = auth.uid()::text OR public.is_admin());
CREATE POLICY "project_delete_owner_or_admin" ON public."InvestmentProject"
  FOR DELETE TO authenticated USING (user_id = auth.uid()::text OR public.is_admin());

-- "Verified" and "featured" are administrator decisions, and a promoter cannot
-- overturn a rejection by editing the status.
CREATE OR REPLACE FUNCTION public.protect_project_columns()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.is_verified := false;
    NEW.featured := false;
    NEW.user_id := auth.uid()::text;
    IF NEW.project_status IS NULL OR NEW.project_status NOT IN ('PUBLISHED', 'SUBMITTED', 'DRAFT') THEN
      NEW.project_status := 'SUBMITTED';
    END IF;
  ELSE
    NEW.is_verified := OLD.is_verified;
    NEW.featured := OLD.featured;
    NEW.user_id := OLD.user_id;
    NEW.project_code := OLD.project_code;
    IF OLD.project_status = 'REJECTED'
       OR NEW.project_status IS NULL
       OR NEW.project_status NOT IN ('PUBLISHED', 'SUBMITTED', 'DRAFT') THEN
      NEW.project_status := OLD.project_status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_project_columns ON public."InvestmentProject";
CREATE TRIGGER trg_protect_project_columns
  BEFORE INSERT OR UPDATE ON public."InvestmentProject"
  FOR EACH ROW EXECUTE FUNCTION public.protect_project_columns();

-- ----------------------------------------------------------------------------
-- 16. InvestmentOrganization / InvestmentVehicle
-- ----------------------------------------------------------------------------
ALTER TABLE public."InvestmentOrganization" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_select_all" ON public."InvestmentOrganization";
DROP POLICY IF EXISTS "org_insert_owner" ON public."InvestmentOrganization";
DROP POLICY IF EXISTS "org_update_owner_or_admin" ON public."InvestmentOrganization";
DROP POLICY IF EXISTS "org_delete_owner_or_admin" ON public."InvestmentOrganization";

CREATE POLICY "org_select_all" ON public."InvestmentOrganization"
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "org_insert_owner" ON public."InvestmentOrganization"
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text OR public.is_admin());
CREATE POLICY "org_update_owner_or_admin" ON public."InvestmentOrganization"
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()::text OR public.is_admin())
  WITH CHECK (user_id = auth.uid()::text OR public.is_admin());
CREATE POLICY "org_delete_owner_or_admin" ON public."InvestmentOrganization"
  FOR DELETE TO authenticated USING (user_id = auth.uid()::text OR public.is_admin());

-- An investor cannot mark itself verified, official, featured or a partner.
CREATE OR REPLACE FUNCTION public.protect_organization_columns()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.verification_status := 'PENDING';
    NEW.verification_source := NULL;
    NEW.official := false;
    NEW.featured := false;
    NEW.partner := false;
    NEW.is_illustrative := false;
    NEW.user_id := auth.uid()::text;
  ELSE
    NEW.verification_status := OLD.verification_status;
    NEW.verification_source := OLD.verification_source;
    NEW.official := OLD.official;
    NEW.featured := OLD.featured;
    NEW.partner := OLD.partner;
    NEW.is_illustrative := OLD.is_illustrative;
    NEW.user_id := OLD.user_id;
    NEW.slug := OLD.slug;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_organization_columns ON public."InvestmentOrganization";
CREATE TRIGGER trg_protect_organization_columns
  BEFORE INSERT OR UPDATE ON public."InvestmentOrganization"
  FOR EACH ROW EXECUTE FUNCTION public.protect_organization_columns();

CREATE OR REPLACE FUNCTION public.owns_organization(p_org_id text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_admin() OR EXISTS (
    SELECT 1 FROM public."InvestmentOrganization" o
    WHERE o.id = p_org_id AND o.user_id = auth.uid()::text
  );
$$;
GRANT EXECUTE ON FUNCTION public.owns_organization(text) TO anon, authenticated;

ALTER TABLE public."InvestmentVehicle" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vehicle_select_all" ON public."InvestmentVehicle";
DROP POLICY IF EXISTS "vehicle_write_org_owner" ON public."InvestmentVehicle";

CREATE POLICY "vehicle_select_all" ON public."InvestmentVehicle"
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "vehicle_write_org_owner" ON public."InvestmentVehicle"
  FOR ALL TO authenticated
  USING (public.owns_organization(organization_id))
  WITH CHECK (public.owns_organization(organization_id));

-- ----------------------------------------------------------------------------
-- 17. InvestorInterest / SavedInvestment / ProjectView
-- ----------------------------------------------------------------------------
ALTER TABLE public."InvestorInterest" ADD COLUMN IF NOT EXISTS investor_user_id TEXT;
ALTER TABLE public."InvestorInterest" ADD COLUMN IF NOT EXISTS investment_capacity NUMERIC;
ALTER TABLE public."InvestorInterest" ADD COLUMN IF NOT EXISTS preferred_ticket NUMERIC;
ALTER TABLE public."InvestorInterest" ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'NEW';
ALTER TABLE public."InvestorInterest" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "interest_select_parties" ON public."InvestorInterest";
DROP POLICY IF EXISTS "interest_insert_self" ON public."InvestorInterest";
DROP POLICY IF EXISTS "interest_update_promoter_or_admin" ON public."InvestorInterest";
DROP POLICY IF EXISTS "interest_delete_self_or_admin" ON public."InvestorInterest";

-- Visible to the investor who sent it, the promoter of the project, and administrators.
CREATE POLICY "interest_select_parties" ON public."InvestorInterest"
  FOR SELECT TO authenticated
  USING (
    investor_user_id = auth.uid()::text
    OR public.is_admin()
    OR EXISTS (SELECT 1 FROM public."InvestmentProject" p WHERE p.id = project_id AND p.user_id = auth.uid()::text)
  );
CREATE POLICY "interest_insert_self" ON public."InvestorInterest"
  FOR INSERT TO authenticated WITH CHECK (investor_user_id = auth.uid()::text);
CREATE POLICY "interest_update_promoter_or_admin" ON public."InvestorInterest"
  FOR UPDATE TO authenticated
  USING (public.is_admin() OR EXISTS (SELECT 1 FROM public."InvestmentProject" p WHERE p.id = project_id AND p.user_id = auth.uid()::text))
  WITH CHECK (public.is_admin() OR EXISTS (SELECT 1 FROM public."InvestmentProject" p WHERE p.id = project_id AND p.user_id = auth.uid()::text));
CREATE POLICY "interest_delete_self_or_admin" ON public."InvestorInterest"
  FOR DELETE TO authenticated USING (investor_user_id = auth.uid()::text OR public.is_admin());

ALTER TABLE public."SavedInvestment" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "saved_investment_own" ON public."SavedInvestment";
CREATE POLICY "saved_investment_own" ON public."SavedInvestment"
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER TABLE public."ProjectView" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "project_view_insert" ON public."ProjectView";
DROP POLICY IF EXISTS "project_view_select" ON public."ProjectView";

-- View counting works for visitors too, but nobody can attribute a view to someone else.
CREATE POLICY "project_view_insert" ON public."ProjectView"
  FOR INSERT TO anon, authenticated WITH CHECK (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "project_view_select" ON public."ProjectView"
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (SELECT 1 FROM public."InvestmentProject" p WHERE p.id = project_id AND p.user_id = auth.uid()::text)
  );

-- ----------------------------------------------------------------------------
-- 18. Event registrations — written through a function, read by owner / admin
-- ----------------------------------------------------------------------------
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_reg_select_own_or_admin" ON public.event_registrations;
DROP POLICY IF EXISTS "event_reg_update_admin" ON public.event_registrations;
DROP POLICY IF EXISTS "event_reg_delete_admin" ON public.event_registrations;

CREATE POLICY "event_reg_select_own_or_admin" ON public.event_registrations
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "event_reg_update_admin" ON public.event_registrations
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "event_reg_delete_admin" ON public.event_registrations
  FOR DELETE TO authenticated USING (public.is_admin());

-- The public registration form calls this instead of touching the table. It creates
-- the registration (or updates the one already filed under the same email) and hands
-- back the badge — without exposing anybody else's registration.
CREATE OR REPLACE FUNCTION public.register_for_event(
  p_full_name text,
  p_email text,
  p_phone text DEFAULT NULL,
  p_company text DEFAULT NULL,
  p_role text DEFAULT NULL,
  p_sector text DEFAULT NULL,
  p_photo_url text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_email text := lower(trim(COALESCE(p_email, '')));
  v_name text := trim(COALESCE(p_full_name, ''));
  v_member uuid;
  v_row public.event_registrations%ROWTYPE;
BEGIN
  IF v_name = '' OR length(v_name) > 200 THEN
    RAISE EXCEPTION 'A name is required' USING ERRCODE = '22023';
  END IF;
  IF v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR length(v_email) > 320 THEN
    RAISE EXCEPTION 'A valid email address is required' USING ERRCODE = '22023';
  END IF;
  IF length(COALESCE(p_photo_url, '')) > 700000 THEN
    RAISE EXCEPTION 'The photo is too large' USING ERRCODE = '22023';
  END IF;

  -- A signed-in member registers as themselves; a visitor is linked when the email matches an account.
  v_member := auth.uid();
  IF v_member IS NULL THEN
    SELECT id INTO v_member FROM public.profiles WHERE lower(email) = v_email LIMIT 1;
  END IF;

  SELECT * INTO v_row FROM public.event_registrations WHERE lower(email) = v_email LIMIT 1;

  IF FOUND THEN
    UPDATE public.event_registrations SET
      full_name = v_name,
      phone = COALESCE(NULLIF(trim(p_phone), ''), phone),
      company = COALESCE(NULLIF(trim(p_company), ''), company),
      role = COALESCE(NULLIF(trim(p_role), ''), role),
      sector = COALESCE(NULLIF(trim(p_sector), ''), sector),
      photo_url = COALESCE(NULLIF(p_photo_url, ''), photo_url),
      user_id = COALESCE(user_id, v_member),
      is_member = is_member OR v_member IS NOT NULL
    WHERE id = v_row.id
    RETURNING * INTO v_row;
  ELSE
    INSERT INTO public.event_registrations (full_name, email, phone, company, role, sector, photo_url, badge_code, user_id, is_member, status)
    VALUES (
      v_name, v_email, NULLIF(trim(p_phone), ''),
      COALESCE(NULLIF(trim(p_company), ''), 'Independent Partner'),
      COALESCE(NULLIF(trim(p_role), ''), 'Delegate'),
      NULLIF(trim(p_sector), ''), NULLIF(p_photo_url, ''),
      'INVESTRADE1-2027-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
      v_member, v_member IS NOT NULL, 'confirmed'
    )
    RETURNING * INTO v_row;
  END IF;

  -- Echo back what the caller submitted plus the badge; never another person's stored details.
  RETURN jsonb_build_object(
    'id', v_row.id,
    'full_name', v_name,
    'email', v_email,
    'phone', NULLIF(trim(p_phone), ''),
    'company', COALESCE(NULLIF(trim(p_company), ''), v_row.company),
    'role', COALESCE(NULLIF(trim(p_role), ''), v_row.role),
    'sector', COALESCE(NULLIF(trim(p_sector), ''), v_row.sector),
    'photo_url', NULLIF(p_photo_url, ''),
    'badge_code', v_row.badge_code,
    'status', v_row.status,
    'is_member', (auth.uid() IS NOT NULL),
    'created_at', v_row.created_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.register_for_event(text, text, text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_for_event(text, text, text, text, text, text, text) TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 19. New: introductions requested through the matchmaker
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public."IntroRequest" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requester_name TEXT,
  target_kind TEXT NOT NULL CHECK (target_kind IN ('investor_org', 'fund', 'project', 'post', 'member')),
  target_id TEXT NOT NULL,
  target_title TEXT,
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  match_score INTEGER CHECK (match_score BETWEEN 0 AND 100),
  message TEXT CHECK (length(message) <= 2000),
  context JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'IN_PROGRESS', 'INTRODUCED', 'DECLINED')),
  created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (requester_id, target_kind, target_id)
);
CREATE INDEX IF NOT EXISTS idx_intro_request_target_user ON public."IntroRequest"(target_user_id);
CREATE INDEX IF NOT EXISTS idx_intro_request_created ON public."IntroRequest"(created_date DESC);

ALTER TABLE public."IntroRequest" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "intro_select_parties" ON public."IntroRequest";
DROP POLICY IF EXISTS "intro_insert_requester" ON public."IntroRequest";
DROP POLICY IF EXISTS "intro_update_target_or_admin" ON public."IntroRequest";
DROP POLICY IF EXISTS "intro_delete_requester_or_admin" ON public."IntroRequest";

CREATE POLICY "intro_select_parties" ON public."IntroRequest"
  FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR target_user_id = auth.uid() OR public.is_admin());
CREATE POLICY "intro_insert_requester" ON public."IntroRequest"
  FOR INSERT TO authenticated WITH CHECK (requester_id = auth.uid() AND status = 'NEW');
CREATE POLICY "intro_update_target_or_admin" ON public."IntroRequest"
  FOR UPDATE TO authenticated
  USING (target_user_id = auth.uid() OR public.is_admin())
  WITH CHECK (target_user_id = auth.uid() OR public.is_admin());
CREATE POLICY "intro_delete_requester_or_admin" ON public."IntroRequest"
  FOR DELETE TO authenticated USING (requester_id = auth.uid() OR public.is_admin());

-- ----------------------------------------------------------------------------
-- 20. New: training registrations (chamber academies)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public."TrainingRegistration" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID REFERENCES public."Circle"(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  course_title TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'CONTACTED', 'CONFIRMED', 'CANCELLED')),
  created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_training_registration_circle ON public."TrainingRegistration"(circle_id, created_date DESC);

ALTER TABLE public."TrainingRegistration" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "training_select_own_or_manager" ON public."TrainingRegistration";
DROP POLICY IF EXISTS "training_insert_self" ON public."TrainingRegistration";
DROP POLICY IF EXISTS "training_update_manager" ON public."TrainingRegistration";
DROP POLICY IF EXISTS "training_delete_manager" ON public."TrainingRegistration";

CREATE POLICY "training_select_own_or_manager" ON public."TrainingRegistration"
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_circle_manager(circle_id));
CREATE POLICY "training_insert_self" ON public."TrainingRegistration"
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'NEW');
CREATE POLICY "training_update_manager" ON public."TrainingRegistration"
  FOR UPDATE TO authenticated
  USING (public.is_circle_manager(circle_id)) WITH CHECK (public.is_circle_manager(circle_id));
CREATE POLICY "training_delete_manager" ON public."TrainingRegistration"
  FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_circle_manager(circle_id));

-- ----------------------------------------------------------------------------
-- 21. New: post reports
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public."PostReport" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public."Post"(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT CHECK (length(reason) <= 500),
  status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'REVIEWED', 'DISMISSED', 'REMOVED')),
  created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE (post_id, reporter_id)
);

ALTER TABLE public."PostReport" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "report_select_own_or_admin" ON public."PostReport";
DROP POLICY IF EXISTS "report_insert_reporter" ON public."PostReport";
DROP POLICY IF EXISTS "report_update_admin" ON public."PostReport";
DROP POLICY IF EXISTS "report_delete_admin" ON public."PostReport";

CREATE POLICY "report_select_own_or_admin" ON public."PostReport"
  FOR SELECT TO authenticated USING (reporter_id = auth.uid() OR public.is_admin());
CREATE POLICY "report_insert_reporter" ON public."PostReport"
  FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid() AND status = 'NEW');
CREATE POLICY "report_update_admin" ON public."PostReport"
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "report_delete_admin" ON public."PostReport"
  FOR DELETE TO authenticated USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- 22. Table privileges for the new tables (RLS above decides the rows)
-- ----------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public."IntroRequest" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."TrainingRegistration" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public."PostReport" TO authenticated;

DO $grants$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    GRANT ALL ON public."IntroRequest", public."TrainingRegistration", public."PostReport" TO service_role;
  END IF;
END
$grants$;

-- ----------------------------------------------------------------------------
-- 23. Storage — the "media" bucket: public read, members upload, owners manage
-- ----------------------------------------------------------------------------
DO $storage$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
    EXECUTE 'DROP POLICY IF EXISTS "media_public_read" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "media_member_upload" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "media_owner_update" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "media_owner_delete" ON storage.objects';
    EXECUTE $p$CREATE POLICY "media_public_read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'media')$p$;
    EXECUTE $p$CREATE POLICY "media_member_upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media')$p$;
    EXECUTE $p$CREATE POLICY "media_owner_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'media' AND owner = auth.uid()) WITH CHECK (bucket_id = 'media' AND owner = auth.uid())$p$;
    EXECUTE $p$CREATE POLICY "media_owner_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'media' AND owner = auth.uid())$p$;
  END IF;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'Storage policies were not changed (insufficient privilege). Review them under Storage > Policies in the dashboard.';
END
$storage$;

-- ----------------------------------------------------------------------------
-- 24. Tell the API layer about the new tables, columns and functions
-- ----------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
