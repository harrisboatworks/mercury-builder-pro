-- Schedule daily scan for promos expiring within 7 days.
-- Sends an email digest to ADMIN_EMAIL via the check-expiring-promotions edge function.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Drop any prior schedule with this name (safe on first run)
DO $$
BEGIN
  PERFORM cron.unschedule('check-expiring-promotions-daily');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'check-expiring-promotions-daily',
  '0 13 * * *', -- 13:00 UTC daily (~9am ET)
  $$
  SELECT net.http_post(
    url := 'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/check-expiring-promotions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1dHNvcWRwanVya25qc3NoeGVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NTI0NzIsImV4cCI6MjA3MDEyODQ3Mn0.QsPdm3kQx1XC-epK1MbAQVyaAY1oxGyKdSYzrctGMaU'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);