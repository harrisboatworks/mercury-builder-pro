-- =====================================================================
-- PRE-MIGRATION CRON REWRITE — DRAFT ONLY, DO NOT EXECUTE YET
-- =====================================================================
-- Purpose: Move the 7 internal service_role cron jobs OFF the embedded
-- legacy HS256 service_role JWT and ONTO an `x-internal-secret` header.
-- Once this runs successfully, those 7 jobs become immune to any
-- future Supabase JWT Signing Keys rotation.
--
-- Scope (intentional):
--   * 7 service_role cron jobs are rewritten.
--   * 9 Lightspeed anon cron jobs are NOT touched. They keep using
--     legacy anon JWT for now and will be handled separately by
--     post-rotation-cron-rewrite.sql AFTER the JWT migration.
--   * 2 cron jobs with no Authorization header (hbw-review-monitor,
--     sms-ai-weekly-review) are NOT touched.
--
-- Authentication contract (verified against supabase/functions/_shared/admin-auth.ts):
--   requireAdmin() short-circuits with `userId: 'internal'` when the
--   request carries header `x-internal-secret` whose value equals
--   either Deno.env.get('EDGE_INTERNAL_SECRET') OR
--   Deno.env.get('CRON_SECRET'). All 7 target functions import
--   requireAdmin from that shared file. No function code change is
--   needed for this rewrite.
--
-- Pre-flight (do BEFORE executing this script):
--   1. Add `EDGE_INTERNAL_SECRET` to Supabase Edge Function secrets
--      (Project Settings → Edge Functions → Secrets). Generate a
--      32+ character random string. Do NOT commit it.
--   2. Confirm none of the 7 target functions has been modified to
--      bypass requireAdmin.
--   3. Snapshot cron.job to a CSV for rollback reference.
--
-- Inputs:
--   :'EDGE_INTERNAL_SECRET'  -- the new internal cron secret value
--                               (must EXACTLY match the value stored
--                                in Supabase Edge Function secrets)
--
-- ---------------------------------------------------------------------
-- HOW TO RUN
-- ---------------------------------------------------------------------
--
-- Option A — psql (recommended, no value lands in scrollback if you
-- read from a file or env var):
--
--   psql "$DATABASE_URL" \
--     -v EDGE_INTERNAL_SECRET="$(cat /secure/path/edge-internal-secret.txt)" \
--     -f docs/runbooks/pre-migration-cron-internal-secret-rewrite.sql
--
--   Or, less safely:
--
--   psql "$DATABASE_URL" \
--     -v EDGE_INTERNAL_SECRET='paste-secret-here' \
--     -f docs/runbooks/pre-migration-cron-internal-secret-rewrite.sql
--
-- Option B — Supabase SQL Editor (the dashboard UI):
--   The Supabase SQL Editor does NOT understand psql `:'VARNAME'`
--   substitution. Before pasting:
--     1. Make a one-off COPY of this file (do not commit the copy).
--     2. In the copy, find every occurrence of
--          :'EDGE_INTERNAL_SECRET'
--        and replace it with a properly quoted SQL string literal:
--          'your-actual-secret-value'
--     3. Paste the modified copy into the SQL Editor and run.
--     4. Discard the modified copy (do not commit).
--
-- Run as: postgres / supabase_admin (must own cron.job rows or be
-- superuser).
--
-- Order: this script is intended to run BEFORE clicking
-- "Migrate JWT secret" in the Supabase dashboard. It is a no-op for
-- behaviour today (cron still authenticates) and a hardening step
-- for tomorrow (cron survives JWT rotation).
--
-- Strategy: cron.schedule(jobname, schedule, command) upserts by
-- jobname, preserving jobid + schedule, atomically swapping the
-- command body.
-- =====================================================================

BEGIN;

-- ---- 7 service_role-token jobs → x-internal-secret -----------------

-- 1. check-partial-financing-apps-hourly  (jobid 36, schedule '15 * * * *')
SELECT cron.schedule(
  'check-partial-financing-apps-hourly',
  '15 * * * *',
  format($cmd$
    SELECT net.http_post(
      url := 'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/check-partial-financing-apps',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-internal-secret', %L
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $cmd$, :'EDGE_INTERNAL_SECRET')
);

-- 2. google-sheets-inventory-daily  (jobid 33, schedule '0 6 * * *')
SELECT cron.schedule(
  'google-sheets-inventory-daily',
  '0 6 * * *',
  format($cmd$
    SELECT net.http_post(
      url := 'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/sync-google-sheets-inventory',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-internal-secret', %L
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $cmd$, :'EDGE_INTERNAL_SECRET')
);

-- 3. mercury-catalog-data-refresh  (jobid 7, schedule '0 8 * * 0')
SELECT cron.schedule(
  'mercury-catalog-data-refresh',
  '0 8 * * 0',
  format($cmd$
    SELECT net.http_post(
      url := 'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/scrape-mercury-catalog',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-internal-secret', %L
      ),
      body := '{"batch_size": 150, "background": true}'::jsonb
    ) AS request_id;
  $cmd$, :'EDGE_INTERNAL_SECRET')
);

-- 4. price-list-weekly-audit  (jobid 38, schedule '0 11 * * 0')
SELECT cron.schedule(
  'price-list-weekly-audit',
  '0 11 * * 0',
  format($cmd$
    SELECT net.http_post(
      url := 'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/audit-price-list',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-internal-secret', %L
      ),
      body := '{"dryRun": false, "autoFix": true}'::jsonb
    ) AS request_id;
  $cmd$, :'EDGE_INTERNAL_SECRET')
);

-- 5. promo-notifications-daily  (jobid 37, schedule '0 14 * * *')
SELECT cron.schedule(
  'promo-notifications-daily',
  '0 14 * * *',
  format($cmd$
    SELECT net.http_post(
      url := 'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/send-promo-notifications',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-internal-secret', %L
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $cmd$, :'EDGE_INTERNAL_SECRET')
);

-- 6. start-abandoned-quote-sequence-daily  (jobid 35, schedule '0 14 * * *')
SELECT cron.schedule(
  'start-abandoned-quote-sequence-daily',
  '0 14 * * *',
  format($cmd$
    SELECT net.http_post(
      url := 'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/start-abandoned-quote-sequence',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-internal-secret', %L
      ),
      body := jsonb_build_object('triggered_at', now()::text)
    ) AS request_id;
  $cmd$, :'EDGE_INTERNAL_SECRET')
);

-- 7. weekly-quote-activity-report  (jobid 34, schedule '0 7 * * 1')
SELECT cron.schedule(
  'weekly-quote-activity-report',
  '0 7 * * 1',
  format($cmd$
    SELECT net.http_post(
      url := 'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/weekly-quote-report',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-internal-secret', %L
      ),
      body := '{"scheduled": true}'::jsonb
    ) AS request_id;
  $cmd$, :'EDGE_INTERNAL_SECRET')
);

-- =====================================================================
-- VERIFICATION (run inside the same transaction BEFORE COMMIT)
-- =====================================================================
-- A. None of the 7 service_role jobs should still contain "Bearer eyJ".
--    Expect 0 rows:
SELECT jobid, jobname
FROM cron.job
WHERE jobname IN (
  'check-partial-financing-apps-hourly',
  'google-sheets-inventory-daily',
  'mercury-catalog-data-refresh',
  'price-list-weekly-audit',
  'promo-notifications-daily',
  'start-abandoned-quote-sequence-daily',
  'weekly-quote-activity-report'
)
  AND command LIKE '%Bearer eyJ%';

-- B. All 7 service_role jobs should now contain 'x-internal-secret'.
--    Expect 7 rows:
SELECT jobid, jobname
FROM cron.job
WHERE jobname IN (
  'check-partial-financing-apps-hourly',
  'google-sheets-inventory-daily',
  'mercury-catalog-data-refresh',
  'price-list-weekly-audit',
  'promo-notifications-daily',
  'start-abandoned-quote-sequence-daily',
  'weekly-quote-activity-report'
)
  AND command LIKE '%x-internal-secret%'
ORDER BY jobname;

-- C. Lightspeed jobs MUST be unchanged (still carrying anon Bearer JWT).
--    Expect 9 rows, all still containing 'Bearer eyJ':
SELECT jobid, jobname
FROM cron.job
WHERE jobname LIKE 'lightspeed-%'
  AND command LIKE '%Bearer eyJ%'
ORDER BY jobname;

-- D. Schedules preserved. Spot-check matches the original 7 schedules:
--    15 * * * *, 0 6 * * *, 0 8 * * 0, 0 11 * * 0,
--    0 14 * * *, 0 14 * * *, 0 7 * * 1
SELECT jobname, schedule
FROM cron.job
WHERE jobname IN (
  'check-partial-financing-apps-hourly',
  'google-sheets-inventory-daily',
  'mercury-catalog-data-refresh',
  'price-list-weekly-audit',
  'promo-notifications-daily',
  'start-abandoned-quote-sequence-daily',
  'weekly-quote-activity-report'
)
ORDER BY jobname;

-- =====================================================================
-- COMMIT or ROLLBACK
-- =====================================================================
-- If A returns 0 rows AND B returns 7 rows AND C returns 9 rows AND D
-- shows the expected schedules: COMMIT.
-- Otherwise: ROLLBACK and investigate.
COMMIT;
-- ROLLBACK;

-- =====================================================================
-- POST-EXECUTION SMOKE TEST (run AFTER COMMIT, outside this script)
-- =====================================================================
-- 1. Wait for the next scheduled run (e.g. check-partial-financing-apps-hourly
--    at :15 of the next hour) and inspect cron.job_run_details:
--      SELECT jobid, status, return_message, start_time
--      FROM cron.job_run_details
--      WHERE jobid IN (
--        SELECT jobid FROM cron.job
--        WHERE jobname IN (
--          'check-partial-financing-apps-hourly','google-sheets-inventory-daily',
--          'mercury-catalog-data-refresh','price-list-weekly-audit',
--          'promo-notifications-daily','start-abandoned-quote-sequence-daily',
--          'weekly-quote-activity-report'
--        )
--      )
--      ORDER BY start_time DESC
--      LIMIT 20;
--    Expect status='succeeded' and return_message empty.
--
-- 2. Anonymous POST (no headers) to each of the 7 functions should
--    still return 401 (admin gate intact).
--
-- 3. Edge Function logs for each of the 7 functions should show no
--    new 401/403 spike for cron callers.
--
-- ROLLBACK PLAN (if a job fails after commit):
--   The original commands are reproduced (with their legacy JWTs) in
--   docs/runbooks/post-rotation-cron-rewrite.sql. Until JWT rotation
--   actually happens, those legacy JWTs are still valid and can be
--   re-applied by re-running the relevant cron.schedule(...) blocks
--   from that file.
