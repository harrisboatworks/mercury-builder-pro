-- Create cron job for daily promo notifications
-- Runs at 2 PM UTC (10 AM Eastern) every day
SELECT cron.schedule(
  'promo-notifications-daily',
  '0 14 * * *',
  $$
  SELECT net.http_post(
    url := 'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/send-promo-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1dHNvcWRwanVya25qc3NoeGVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NTI0NzIsImV4cCI6MjA3MDEyODQ3Mn0.QsPdm3kQx1XC-epK1MbAQVyaAY1oxGyKdSYzrctGMaU'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);