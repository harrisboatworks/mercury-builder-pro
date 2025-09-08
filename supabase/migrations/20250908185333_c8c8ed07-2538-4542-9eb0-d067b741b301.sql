-- Remove public access to finance_settings (contains sensitive business data)
DROP POLICY IF EXISTS "Public read access for finance_settings" ON public.finance_settings;

-- Add authenticated-only access policy for finance_settings
CREATE POLICY "Authenticated users can read finance_settings" 
ON public.finance_settings 
FOR SELECT 
TO authenticated 
USING (true);

-- Update the cron job to use service role key from secrets instead of hardcoded token
-- Remove any hardcoded JWT tokens and use proper environment variables
SELECT cron.unschedule('invoke-inventory-update');

-- Recreate the cron job with proper authentication using service role from environment
SELECT cron.schedule(
  'invoke-inventory-update',
  '0 2 * * *', -- Daily at 2 AM
  $$
  SELECT net.http_post(
    url := 'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/scrape-inventory',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
    ),
    body := jsonb_build_object('scheduled', true)
  );
  $$
);