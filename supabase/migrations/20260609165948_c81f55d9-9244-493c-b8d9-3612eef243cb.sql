
-- =========================================================
-- #7: Explicit deny policies on 9 RLS-enabled-no-policy tables
-- (RESTRICTIVE deny-all; service_role bypasses RLS so unaffected)
-- =========================================================
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'customer_contact_overrides','gsc_oauth','hbw_bot_brief_receipts',
    'hbw_bot_events','hbw_bot_feedback','hbw_bot_reminders',
    'hbw_call_transcriptions','openclaw_slack_fallback_jobs','openclaw_worker_heartbeats'
  ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Service role only - deny all client access" ON public.%I', t);
    EXECUTE format(
      'CREATE POLICY "Service role only - deny all client access" ON public.%I AS RESTRICTIVE FOR ALL TO public USING (false) WITH CHECK (false)',
      t
    );
  END LOOP;
END $$;

-- =========================================================
-- #5: Storage - drop broad public/anon SELECT (LIST) policies.
-- Buckets stay public (bucket.public=true) so direct
-- /storage/v1/object/public/... URLs continue to work.
-- Per-user avatar upload/update/delete policies untouched.
-- =========================================================
DROP POLICY IF EXISTS "Users can view all avatars" ON storage.objects;
DROP POLICY IF EXISTS "Hero images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public can view inventory photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view motor images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for motor images" ON storage.objects;
DROP POLICY IF EXISTS "public read motor-images" ON storage.objects;
DROP POLICY IF EXISTS "Spec sheets are publicly accessible" ON storage.objects;

-- =========================================================
-- #6: Revoke EXECUTE on confirmed trigger-only SECURITY DEFINER
-- functions from anon/authenticated. service_role retained.
-- All 12 confirmed RETURNS trigger; they only fire as triggers,
-- so client EXECUTE grants are meaningless.
-- =========================================================
REVOKE EXECUTE ON FUNCTION public.enforce_customer_quotes_user_id()    FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_customer_xp_user_id()         FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_quotes_user_id()              FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                     FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_financing_status_change()         FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.touch_customer_memory()               FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.touch_hbw_bot_reminders()             FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.touch_hbw_call_transcriptions()       FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.touch_openclaw_slack_fallback_jobs()  FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_motor_media_summary()          FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_nudge_variant_stats()          FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_session_activity()             FROM anon, authenticated, PUBLIC;
