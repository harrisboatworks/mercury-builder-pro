-- Ensure pg_cron and pg_net are enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove any prior schedule of this job (idempotent)
DO $$
DECLARE
  jid bigint;
BEGIN
  SELECT jobid INTO jid FROM cron.job WHERE jobname = 'start-abandoned-quote-sequence-daily';
  IF jid IS NOT NULL THEN
    PERFORM cron.unschedule(jid);
  END IF;
END $$;

-- Schedule daily at 14:00 UTC (10:00 ET) — same window as other notification jobs
SELECT cron.schedule(
  'start-abandoned-quote-sequence-daily',
  '0 14 * * *',
  $$
  SELECT net.http_post(
    url := 'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/start-abandoned-quote-sequence',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1dHNvcWRwanVya25qc3NoeGVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NTI0NzIsImV4cCI6MjA3MDEyODQ3Mn0.QsPdm3kQx1XC-epK1MbAQVyaAY1oxGyKdSYzrctGMaU'
    ),
    body := jsonb_build_object('triggered_at', now()::text)
  );
  $$
);