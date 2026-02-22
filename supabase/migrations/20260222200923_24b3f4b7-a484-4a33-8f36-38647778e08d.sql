-- Schedule weekly quote report cron job for Monday 8 AM EST (13:00 UTC)
SELECT cron.schedule(
  'weekly-quote-activity-report',
  '0 13 * * 1',
  $$
  SELECT net.http_post(
    url:='https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/weekly-quote-report',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1dHNvcWRwanVya25qc3NoeGVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NTI0NzIsImV4cCI6MjA3MDEyODQ3Mn0.QsPdm3kQx1XC-epK1MbAQVyaAY1oxGyKdSYzrctGMaU"}'::jsonb,
    body:='{"scheduled": true}'::jsonb
  ) as request_id;
  $$
);