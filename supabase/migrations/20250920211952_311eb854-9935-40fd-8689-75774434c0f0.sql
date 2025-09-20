-- Clean up existing conflicting cron jobs and create safe Mercury inventory automation

-- First, remove any existing conflicting cron jobs
SELECT cron.unschedule('invoke-function-every-minute');
SELECT cron.unschedule('mercury-inventory-sync');
SELECT cron.unschedule('daily-inventory-sync');

-- Create new daily Mercury inventory sync job at 8 AM EST (13:00 UTC)
SELECT cron.schedule(
  'mercury-daily-inventory-sync',
  '0 13 * * *', -- Daily at 8 AM EST (13:00 UTC)
  $$
  SELECT
    net.http_post(
        url:='https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/sync-mercury-inventory',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1dHNvcWRwanVya25qc3NoeGVzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDU1MjQ3MiwiZXhwIjoyMDcwMTI4NDcyfQ.lZp_1_Jzph7CmcOQl3KzFO8_5GxjqjGvVWoJzRXKgIc"}'::jsonb,
        body:=concat('{"scheduled": true, "trigger_time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Add monitoring table for cron job runs
CREATE TABLE IF NOT EXISTS cron_job_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_name text NOT NULL,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  status text NOT NULL DEFAULT 'running',
  result jsonb DEFAULT '{}',
  error_message text,
  motors_found integer DEFAULT 0,
  motors_updated integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on cron job logs
ALTER TABLE cron_job_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access to cron logs
CREATE POLICY "Admins can manage cron logs" ON cron_job_logs
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create function to get current cron job status
CREATE OR REPLACE FUNCTION get_cron_job_status()
RETURNS TABLE(
  jobname text,
  schedule text,
  active boolean,
  last_run timestamp with time zone,
  next_run timestamp with time zone
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    cron.job.jobname,
    cron.job.schedule,
    cron.job.active,
    cron.job_run_details.start_time as last_run,
    cron.job.schedule::text as next_run
  FROM cron.job
  LEFT JOIN cron.job_run_details ON cron.job.jobid = cron.job_run_details.jobid
  WHERE cron.job.jobname = 'mercury-daily-inventory-sync'
  ORDER BY cron.job_run_details.start_time DESC
  LIMIT 1;
$$;