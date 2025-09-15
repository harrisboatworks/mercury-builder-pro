-- Enable pg_cron extension for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a scheduled job to run full inventory scraping daily at 5:00 AM EST
SELECT cron.schedule(
  'daily-inventory-scrape',
  '0 5 * * *', -- 5:00 AM daily (EST/UTC-5, adjust for your timezone)
  $$
  SELECT
    net.http_post(
        url:='https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/scrape-inventory-v2',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1dHNvcWRwanVya25qc3NoeGVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NTI0NzIsImV4cCI6MjA3MDEyODQ3Mn0.QsPdm3kQx1XC-epK1MbAQVyaAY1oxGyKdSYzrctGMaU"}'::jsonb,
        body:='{"mode":"full","batch_size":20,"concurrency":4}'::jsonb
    ) as request_id;
  $$
);