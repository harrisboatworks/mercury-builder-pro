
-- Revoke EXECUTE from anon and authenticated on server-only SECURITY DEFINER functions
-- These functions are guarded by a shared gateway/worker secret and are only invoked
-- from backend services (edge functions / internal workers). They should not be
-- exposed via PostgREST to anonymous or signed-in clients.

DO $$
DECLARE
  fn record;
  sig text;
BEGIN
  FOR fn IN
    SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef
      AND p.proname IN (
        'claim_due_hbw_bot_reminders',
        'claim_openclaw_slack_fallback_jobs',
        'cleanup_openclaw_slack_fallback_jobs',
        'complete_hbw_bot_reminder',
        'complete_openclaw_slack_fallback_job',
        'create_hbw_bot_reminder',
        'enqueue_openclaw_slack_fallback_job',
        'fail_hbw_bot_reminder',
        'fail_openclaw_slack_fallback_job',
        'record_hbw_bot_brief_receipt',
        'record_hbw_bot_event',
        'record_hbw_bot_feedback',
        'record_openclaw_worker_heartbeat'
      )
  LOOP
    sig := format('public.%I(%s)', fn.proname, fn.args);
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', sig);
  END LOOP;
END $$;
