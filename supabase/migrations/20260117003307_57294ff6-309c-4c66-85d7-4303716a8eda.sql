-- Remove the old Firecrawl inventory cron job
SELECT cron.unschedule('firecrawl-inventory-agent-weekly');

-- Create daily Google Sheets inventory sync at 6:00 AM UTC
SELECT cron.schedule(
  'google-sheets-inventory-daily',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/sync-google-sheets-inventory',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1dHNvcWRwanVya25qc3NoeGVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NTI0NzIsImV4cCI6MjA3MDEyODQ3Mn0.QsPdm3kQx1XC-epK1MbAQVyaAY1oxGyKdSYzrctGMaU'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);