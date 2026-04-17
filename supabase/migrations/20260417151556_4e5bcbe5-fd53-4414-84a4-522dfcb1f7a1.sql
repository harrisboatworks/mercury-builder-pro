-- Schedule hourly check for partial/stalled financing applications
-- Sends an admin digest email when applications past step 4 with contact info
-- have been idle for >6 hours.

DO $$
DECLARE
  existing_jobid integer;
  service_role_key text;
  project_url text := 'https://eutsoqdpjurknjsshxes.supabase.co';
BEGIN
  -- Remove any prior schedule (idempotent)
  SELECT jobid INTO existing_jobid FROM cron.job WHERE jobname = 'check-partial-financing-apps-hourly';
  IF existing_jobid IS NOT NULL THEN
    PERFORM cron.unschedule(existing_jobid);
  END IF;

  -- Try to read service role key from vault
  BEGIN
    SELECT decrypted_secret INTO service_role_key
    FROM vault.decrypted_secrets
    WHERE name = 'service_role_key'
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    service_role_key := NULL;
  END;

  -- Fall back to a placeholder; admin can update via vault if needed.
  -- The function uses SUPABASE_SERVICE_ROLE_KEY env var internally regardless.
  IF service_role_key IS NULL THEN
    RAISE NOTICE 'service_role_key vault secret not found; cron will call function with anon key. Function still uses service role internally via env.';
  END IF;

  -- Schedule: every hour at :15
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
    $job$, project_url, COALESCE(service_role_key, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1dHNvcWRwanVya25qc3NoeGVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NTI0NzIsImV4cCI6MjA3MDEyODQ3Mn0.QsPdm3kQx1XC-epK1MbAQVyaAY1oxGyKdSYzrctGMaU'))
  );
END;
$$;