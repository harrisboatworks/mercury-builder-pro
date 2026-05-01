-- =====================================================================
-- POST-ROTATION CRON REWRITE — DRAFT ONLY, DO NOT EXECUTE YET
-- =====================================================================
-- Purpose: After SUPABASE_SERVICE_ROLE_KEY and SUPABASE_ANON_KEY are
-- rotated in the Supabase dashboard, every cron.job row that embeds a
-- bearer JWT in its `command` becomes broken. This script re-embeds the
-- new tokens in a single transaction.
--
-- Job coverage:
--   7 service_role-token cron jobs
--   9 Lightspeed anon-token cron jobs
--   16 total bearer-token cron jobs
--
-- This file is written for psql variable substitution. It will NOT run
-- unchanged in the Supabase SQL Editor because :'NEW_SERVICE_ROLE_JWT'
-- and :'NEW_ANON_JWT' are psql variables, not ordinary SQL placeholders.
--
-- Inputs:
--   :'NEW_SERVICE_ROLE_JWT'  -- new service_role JWT from dashboard
--   :'NEW_ANON_JWT'          -- new anon (publishable) JWT from dashboard
--
-- Exact psql execution shape:
--   psql "$DATABASE_URL" \
--     -v NEW_SERVICE_ROLE_JWT='paste-new-service-role-jwt-here' \
--     -v NEW_ANON_JWT='paste-new-anon-jwt-here' \
--     -f docs/runbooks/post-rotation-cron-rewrite.sql
--
-- If running in Supabase SQL Editor instead, first make a one-off copy of
-- this file and manually replace every :'NEW_SERVICE_ROLE_JWT' and
-- :'NEW_ANON_JWT' token with quoted string literals containing the new JWTs.
--
-- Run as: postgres / supabase_admin (must own cron.job rows or be superuser)
-- Order: run AFTER rotation completes in Supabase dashboard, BEFORE the
-- next cron tick that would fire one of these jobs.
--
-- Strategy: We use cron.schedule(jobname, schedule, command) which
-- upserts by jobname. This preserves jobid + schedule and atomically
-- swaps the command body.
-- =====================================================================

BEGIN;

-- ---- service_role-token jobs (7) -----------------------------------

-- 1. check-partial-financing-apps-hourly  (jobid 36, schedule '15 * * * *')
SELECT cron.schedule(
  'check-partial-financing-apps-hourly',
  '15 * * * *',
  format($cmd$
    SELECT net.http_post(
      url := 'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/check-partial-financing-apps',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer %s'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $cmd$, :'NEW_SERVICE_ROLE_JWT')
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
        'Authorization', 'Bearer %s'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $cmd$, :'NEW_SERVICE_ROLE_JWT')
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
        'Authorization', 'Bearer %s'
      ),
      body := '{"batch_size": 150, "background": true}'::jsonb
    ) AS request_id;
  $cmd$, :'NEW_SERVICE_ROLE_JWT')
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
        'Authorization', 'Bearer %s'
      ),
      body := '{"dryRun": false, "autoFix": true}'::jsonb
    ) AS request_id;
  $cmd$, :'NEW_SERVICE_ROLE_JWT')
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
        'Authorization', 'Bearer %s'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $cmd$, :'NEW_SERVICE_ROLE_JWT')
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
        'Authorization', 'Bearer %s'
      ),
      body := jsonb_build_object('triggered_at', now()::text)
    ) AS request_id;
  $cmd$, :'NEW_SERVICE_ROLE_JWT')
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
        'Authorization', 'Bearer %s'
      ),
      body := '{"scheduled": true}'::jsonb
    ) AS request_id;
  $cmd$, :'NEW_SERVICE_ROLE_JWT')
);

-- ---- anon-token Lightspeed jobs (9) --------------------------------
-- These were not hardened by the prior internal-cron migration. After
-- rotation, the embedded anon JWT becomes invalid. We re-embed the new
-- anon JWT to preserve current behavior. (If you want them upgraded to
-- service_role, swap :'NEW_ANON_JWT' below for :'NEW_SERVICE_ROLE_JWT'.)

-- 8. lightspeed-motor-models-sync-daily  (jobid 19, schedule '15 2 * * *')
SELECT cron.schedule(
  'lightspeed-motor-models-sync-daily',
  '15 2 * * *',
  format($cmd$
    SELECT net.http_post(
      url := 'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/sync-lightspeed-inventory',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer %s'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $cmd$, :'NEW_ANON_JWT')
);

-- 9. lightspeed-sync-customers-daily  (jobid 15, schedule '0 2 * * *')
SELECT cron.schedule(
  'lightspeed-sync-customers-daily',
  '0 2 * * *',
  format($cmd$
    SELECT net.http_post(
      url := 'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/lightspeed-sync?feed=customers',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer %s'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $cmd$, :'NEW_ANON_JWT')
);

-- 10. lightspeed-sync-deals-daily  (jobid 29, schedule '20 2 * * *')
SELECT cron.schedule(
  'lightspeed-sync-deals-daily',
  '20 2 * * *',
  format($cmd$
    SELECT net.http_post(
      url := 'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/lightspeed-sync-new-feeds?feed=deals',
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer %s'),
      body := '{}'::jsonb,
      timeout_milliseconds := 300000
    ) AS request_id;
  $cmd$, :'NEW_ANON_JWT')
);

-- 11. lightspeed-sync-open-ros-daily  (jobid 30, schedule '22 2 * * *')
SELECT cron.schedule(
  'lightspeed-sync-open-ros-daily',
  '22 2 * * *',
  format($cmd$
    SELECT net.http_post(
      url := 'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/lightspeed-sync-new-feeds?feed=open_ros',
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer %s'),
      body := '{}'::jsonb,
      timeout_milliseconds := 300000
    ) AS request_id;
  $cmd$, :'NEW_ANON_JWT')
);

-- 12. lightspeed-sync-open-ros-noon  (jobid 31, schedule '0 12 * * *')
SELECT cron.schedule(
  'lightspeed-sync-open-ros-noon',
  '0 12 * * *',
  format($cmd$
    SELECT net.http_post(
      url := 'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/lightspeed-sync-new-feeds?feed=open_ros',
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer %s'),
      body := '{}'::jsonb,
      timeout_milliseconds := 300000
    ) AS request_id;
  $cmd$, :'NEW_ANON_JWT')
);

-- 13. lightspeed-sync-parts-daily  (jobid 17, schedule '6 2 * * *')
SELECT cron.schedule(
  'lightspeed-sync-parts-daily',
  '6 2 * * *',
  format($cmd$
    SELECT net.http_post(
      url := 'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/lightspeed-sync?feed=parts',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer %s'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $cmd$, :'NEW_ANON_JWT')
);

-- 14. lightspeed-sync-parts-invoices-daily  (jobid 32, schedule '25 2 * * *')
SELECT cron.schedule(
  'lightspeed-sync-parts-invoices-daily',
  '25 2 * * *',
  format($cmd$
    SELECT net.http_post(
      url := 'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/lightspeed-sync-new-feeds?feed=parts_invoices&days_back=90',
      headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer %s'),
      body := '{}'::jsonb,
      timeout_milliseconds := 300000
    ) AS request_id;
  $cmd$, :'NEW_ANON_JWT')
);

-- 15. lightspeed-sync-service-daily  (jobid 18, schedule '10 2 * * *')
SELECT cron.schedule(
  'lightspeed-sync-service-daily',
  '10 2 * * *',
  format($cmd$
    SELECT net.http_post(
      url := 'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/lightspeed-sync-service?days_back=60&top=500',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer %s'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $cmd$, :'NEW_ANON_JWT')
);

-- 16. lightspeed-sync-units-daily  (jobid 16, schedule '3 2 * * *')
SELECT cron.schedule(
  'lightspeed-sync-units-daily',
  '3 2 * * *',
  format($cmd$
    SELECT net.http_post(
      url := 'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/lightspeed-sync?feed=units',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer %s'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $cmd$, :'NEW_ANON_JWT')
);

-- ---- Jobs intentionally NOT touched -------------------------------
-- hbw-review-monitor (jobid 21)        — no Authorization header, not affected
-- sms-ai-weekly-review (jobid 22)      — no Authorization header, not affected
-- (verify_jwt=false on those functions; no rewrite needed)

-- ---- Verification (run inside the same transaction before COMMIT) --
-- Expect 0 rows: no command should still contain the OLD JWT signatures.
-- Replace OLD_*_SUFFIX with the last ~20 chars of the rotated tokens.
-- SELECT jobid, jobname FROM cron.job
--   WHERE command LIKE '%OLD_SERVICE_ROLE_SUFFIX%'
--      OR command LIKE '%OLD_ANON_SUFFIX%';

-- Expect 16 rows:
-- SELECT jobid, jobname FROM cron.job
--   WHERE jobname IN (
--     'check-partial-financing-apps-hourly','google-sheets-inventory-daily',
--     'mercury-catalog-data-refresh','price-list-weekly-audit',
--     'promo-notifications-daily','start-abandoned-quote-sequence-daily',
--     'weekly-quote-activity-report','lightspeed-motor-models-sync-daily',
--     'lightspeed-sync-customers-daily','lightspeed-sync-deals-daily',
--     'lightspeed-sync-open-ros-daily','lightspeed-sync-open-ros-noon',
--     'lightspeed-sync-parts-daily','lightspeed-sync-parts-invoices-daily',
--     'lightspeed-sync-service-daily','lightspeed-sync-units-daily'
--   ) ORDER BY jobname;

COMMIT;
-- ROLLBACK;  -- use this instead of COMMIT to dry-run
