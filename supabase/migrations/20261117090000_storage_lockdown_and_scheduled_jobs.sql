-- ============================================================================
-- Investraders — storage lock-down + scheduled housekeeping
-- ============================================================================
-- WHAT THIS DOES
--   1. Removes three old storage rules that the security migration left in place.
--      One of them ("Allow authenticated deletes") let any signed-in member delete
--      any file in the media bucket. The stricter media_* rules stay.
--   2. Adds two housekeeping functions that used to run on the old Base44 backend
--      and were never ported:
--        • cleanup_expired_stories()  — permanently deletes stories that expired
--                                       more than 24 hours ago (they are already
--                                       hidden from everyone at that point);
--        • send_event_reminders()     — notifies circle members once about an
--                                       approved circle event starting within 24h.
--   3. Schedules both with pg_cron when it is available.
--
-- The script is idempotent — it is safe to run more than once.
-- Run it after 20261111120000_security_hardening_and_matchmaking.sql.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Storage — drop the permissive rules superseded by the media_* policies
-- ----------------------------------------------------------------------------
DO $storage$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
    -- Only drop them once their replacements are in place, so uploads and reads never break.
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'media_owner_delete')
       AND EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'media_member_upload')
       AND EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'media_public_read') THEN
      EXECUTE 'DROP POLICY IF EXISTS "Allow authenticated deletes" ON storage.objects';
      EXECUTE 'DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects';
      EXECUTE 'DROP POLICY IF EXISTS "Allow public read" ON storage.objects';
    ELSE
      RAISE NOTICE 'The media_* storage policies are missing: old storage rules were left untouched. Run the security hardening migration first.';
    END IF;
  END IF;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'Storage policies were not changed (insufficient privilege). Remove "Allow authenticated deletes" under Storage > Policies in the dashboard.';
END
$storage$;

-- ----------------------------------------------------------------------------
-- 2. Housekeeping functions (run by the scheduler, never by app users)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_expired_stories()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  removed integer;
BEGIN
  DELETE FROM public."Story"
  WHERE expires_at IS NOT NULL
    AND expires_at < now() - interval '24 hours';
  GET DIAGNOSTICS removed = ROW_COUNT;
  RETURN removed;
END
$$;

CREATE OR REPLACE FUNCTION public.send_event_reminders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sent integer;
BEGIN
  INSERT INTO public."Notification" (user_id, type, message, circle_id, circle_name, target_url, is_read)
  SELECT DISTINCT
    p.id,
    'event_reminder',
    'Reminder: "' || COALESCE(NULLIF(btrim(e.title), ''), 'Circle event') || '" starts '
      || to_char(e.event_date AT TIME ZONE 'Africa/Tunis', 'Dy DD Mon "at" HH24:MI') || ' (Tunis time)',
    c.id,
    c.name,
    -- The event id in the link is what makes a reminder unique per member and event.
    '/circle/' || c.id::text || '?event=' || e.id::text,
    false
  FROM public."CircleEvent" e
  JOIN public."Circle" c ON c.id = e.circle_id
  CROSS JOIN LATERAL unnest(c.member_ids) AS m(member_id)
  JOIN public.profiles p ON p.id::text = m.member_id::text
  WHERE e.event_date > now()
    AND e.event_date <= now() + interval '24 hours'
    AND e.status = 'approved'
    AND NOT EXISTS (
      SELECT 1 FROM public."Notification" n
      WHERE n.user_id = p.id
        AND n.type = 'event_reminder'
        AND n.target_url = '/circle/' || c.id::text || '?event=' || e.id::text
    );
  GET DIAGNOSTICS sent = ROW_COUNT;
  RETURN sent;
END
$$;

REVOKE ALL ON FUNCTION public.cleanup_expired_stories() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.send_event_reminders() FROM PUBLIC, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 3. Schedule them (pg_cron). Without pg_cron the functions still exist and can
--    be run by hand:  SELECT public.cleanup_expired_stories();
-- ----------------------------------------------------------------------------
DO $cron$
BEGIN
  IF to_regproc('cron.schedule') IS NULL THEN
    BEGIN
      CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'pg_cron could not be enabled (%). Enable it under Database > Extensions, then run this file again.', SQLERRM;
    END;
  END IF;

  IF to_regproc('cron.schedule') IS NOT NULL THEN
    -- Named jobs replace themselves, so re-running this file does not create duplicates.
    PERFORM cron.schedule('investraders-cleanup-expired-stories', '15 3 * * *', 'SELECT public.cleanup_expired_stories()');
    PERFORM cron.schedule('investraders-event-reminders', '5 * * * *', 'SELECT public.send_event_reminders()');
  ELSE
    RAISE NOTICE 'No scheduler available: story clean-up and event reminders were NOT scheduled.';
  END IF;
END
$cron$;

NOTIFY pgrst, 'reload schema';
