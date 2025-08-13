-- Enable pg_cron and pg_net extensions for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a cron job to update inventory daily at 2 AM
SELECT cron.schedule(
  'daily-inventory-update',
  '0 2 * * *', -- Daily at 2 AM
  $$
  SELECT
    net.http_post(
        url:='https://gdhuuqkbhzbnhhlmnilm.supabase.co/functions/v1/scrape-inventory',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkaHV1cWtiaHpibmhobG1uaWxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMzNzM3MzMsImV4cCI6MjA0ODk0OTczM30.jGWI8TF2nN4oS-hMKtRO0hxKU-YuwOIinmg4pJ0KeY8"}'::jsonb,
        body:='{"scheduled": true, "time": "' || now() || '"}'::jsonb
    ) as request_id;
  $$
);

-- Create a table to track inventory update status
CREATE TABLE IF NOT EXISTS public.inventory_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed'
  error_message TEXT,
  motors_updated INTEGER DEFAULT 0,
  is_scheduled BOOLEAN DEFAULT false
);

-- Enable RLS on inventory_updates
ALTER TABLE public.inventory_updates ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing inventory updates (admin only)
CREATE POLICY "Allow admin to view inventory updates" 
ON public.inventory_updates 
FOR SELECT 
USING (auth.jwt() ->> 'email' IN (
  SELECT email FROM auth.users WHERE raw_user_meta_data ->> 'role' = 'admin'
));