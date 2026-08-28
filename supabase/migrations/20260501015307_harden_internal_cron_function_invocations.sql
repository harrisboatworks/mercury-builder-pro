-- Reschedule internal-only Edge Function cron jobs so they call with a
-- server-side credential instead of the public anon key.
--
-- This migration intentionally does not embed any API key. It reuses the
-- service-role bearer already present in the live cron table (if available),
-- falling back to Vault when a service_role_key secret exists there.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
DECLARE
  service_role_key text;
  project_url text := 'https://eutsoqdpjurknjsshxes.supabase.co';
BEGIN
  SELECT substring(command from 'Bearer ([A-Za-z0-9_-]+[.][A-Za-z0-9_-]+[.][A-Za-z0-9_-]+)')
  INTO service_role_key
  FROM cron.job
  WHERE jobname = 'mercury-catalog-data-refresh'
  LIMIT 1;

  IF service_role_key IS NULL THEN
    BEGIN
      SELECT decrypted_secret INTO service_role_key
      FROM vault.decrypted_secrets
      WHERE name = 'service_role_key'
        AND decrypted_secret IS NOT NULL
      LIMIT 1;
    EXCEPTION WHEN OTHERS THEN
      service_role_key := NULL;
    END;
  END IF;

  IF service_role_key IS NULL OR length(service_role_key) < 40 THEN
    RAISE EXCEPTION 'No service-role credential available to reschedule protected cron jobs';
  END IF;

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'google-sheets-inventory-daily') THEN
    PERFORM cron.unschedule('google-sheets-inventory-daily');
  END IF;
  PERFORM cron.schedule(
    'google-sheets-inventory-daily',
    '0 6 * * *',
    format($job$
      SELECT net.http_post(
        url := '%s/functions/v1/sync-google-sheets-inventory',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer %s'
        ),
        body := '{}'::jsonb
      ) AS request_id;
    $job$, project_url, service_role_key)
  );

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'weekly-quote-activity-report') THEN
    PERFORM cron.unschedule('weekly-quote-activity-report');
  END IF;
  PERFORM cron.schedule(
    'weekly-quote-activity-report',
    '0 7 * * 1',
    format($job$
      SELECT net.http_post(
        url := '%s/functions/v1/weekly-quote-report',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer %s'
        ),
        body := '{"scheduled": true}'::jsonb
      ) AS request_id;
    $job$, project_url, service_role_key)
  );

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'start-abandoned-quote-sequence-daily') THEN
    PERFORM cron.unschedule('start-abandoned-quote-sequence-daily');
  END IF;
  PERFORM cron.schedule(
    'start-abandoned-quote-sequence-daily',
    '0 14 * * *',
    format($job$
      SELECT net.http_post(
        url := '%s/functions/v1/start-abandoned-quote-sequence',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer %s'
        ),
        body := jsonb_build_object('triggered_at', now()::text)
      ) AS request_id;
    $job$, project_url, service_role_key)
  );

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'check-partial-financing-apps-hourly') THEN
    PERFORM cron.unschedule('check-partial-financing-apps-hourly');
  END IF;
  PERFORM cron.schedule(
    'check-partial-financing-apps-hourly',
    '15 * * * *',
    format($job$
      SELECT net.http_post(
        url := '%s/functions/v1/check-partial-financing-apps',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer %s'
        ),
        body := '{}'::jsonb
      ) AS request_id;
    $job$, project_url, service_role_key)
  );

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'promo-notifications-daily') THEN
    PERFORM cron.unschedule('promo-notifications-daily');
  END IF;
  PERFORM cron.schedule(
    'promo-notifications-daily',
    '0 14 * * *',
    format($job$
      SELECT net.http_post(
        url := '%s/functions/v1/send-promo-notifications',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer %s'
        ),
        body := '{}'::jsonb
      ) AS request_id;
    $job$, project_url, service_role_key)
  );

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'price-list-weekly-audit') THEN
    PERFORM cron.unschedule('price-list-weekly-audit');
  END IF;
  PERFORM cron.schedule(
    'price-list-weekly-audit',
    '0 11 * * 0',
    format($job$
      SELECT net.http_post(
        url := '%s/functions/v1/audit-price-list',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer %s'
        ),
        body := '{"dryRun": false, "autoFix": true}'::jsonb
      ) AS request_id;
    $job$, project_url, service_role_key)
  );
END;
$$;
