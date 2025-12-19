-- Schedule weekly Firecrawl inventory agent sync (Sundays at 7:00 AM EST = 12:00 UTC)
SELECT cron.schedule(
  'firecrawl-inventory-agent-weekly',
  '0 12 * * 0',
  $$
  SELECT net.http_post(
    url := 'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/firecrawl-inventory-agent',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1dHNvcWRwanVya25qc3NoeGVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NTI0NzIsImV4cCI6MjA3MDEyODQ3Mn0.QsPdm3kQx1XC-epK1MbAQVyaAY1oxGyKdSYzrctGMaU'
    ),
    body := '{"syncToDb": true}'::jsonb
  ) AS request_id;
  $$
);