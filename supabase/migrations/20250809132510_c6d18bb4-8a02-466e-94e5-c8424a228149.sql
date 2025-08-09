-- Enable required extensions for scheduling HTTP jobs
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Schedule daily scrape of Harris Boat Works inventory via edge function
-- Note: 06:00 ET (EDT = UTC-4) corresponds to 10:00 UTC
select
  cron.schedule(
    'daily-scrape-inventory-6am-et',
    '0 10 * * *',
    $$
    select
      net.http_post(
        url := 'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/scrape-inventory',
        headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1dHNvcWRwanVya25qc3NoeGVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NTI0NzIsImV4cCI6MjA3MDEyODQ3Mn0.QsPdm3kQx1XC-epK1MbAQVyaAY1oxGyKdSYzrctGMaU"}'::jsonb,
        body := jsonb_build_object('source','cron','scheduled_at', now())
      ) as request_id;
    $$
  );