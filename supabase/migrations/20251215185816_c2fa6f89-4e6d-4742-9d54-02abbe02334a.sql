-- Schedule weekly price list audit cron job (Sundays at 6:00 AM EST)
SELECT cron.schedule(
  'price-list-weekly-audit',
  '0 11 * * 0',  -- 11:00 UTC = 6:00 AM EST
  $$
  SELECT net.http_post(
    url := 'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/audit-price-list',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1dHNvcWRwanVya25qc3NoeGVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NTI0NzIsImV4cCI6MjA3MDEyODQ3Mn0.QsPdm3kQx1XC-epK1MbAQVyaAY1oxGyKdSYzrctGMaU'
    ),
    body := jsonb_build_object('dryRun', false, 'autoFix', false)
  ) as request_id;
  $$
);