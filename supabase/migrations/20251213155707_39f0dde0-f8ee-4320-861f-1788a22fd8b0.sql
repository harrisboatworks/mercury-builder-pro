-- Create cron job to refresh Mercury catalog data weekly on Sundays at 8am UTC
SELECT cron.schedule(
  'mercury-catalog-data-refresh',
  '0 8 * * 0',
  $$
  SELECT
    net.http_post(
        url:='https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/scrape-mercury-catalog',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1dHNvcWRwanVya25qc3NoeGVzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU1MjQ3MiwiZXhwIjoyMDcwMTI4NDcyfQ.lZp_1_Jzph7CmcOQl3KzFO8_5GxjqjGvVWoJzRXKgIc"}'::jsonb,
        body:='{"batch_size": 150, "background": true}'::jsonb
    ) as request_id;
  $$
);