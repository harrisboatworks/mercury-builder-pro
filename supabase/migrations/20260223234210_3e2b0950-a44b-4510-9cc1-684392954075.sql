
-- Fix function search path: update_motor_media_summary
ALTER FUNCTION public.update_motor_media_summary()
  SET search_path TO 'public';

-- Fix function search path: get_cron_job_status
ALTER FUNCTION public.get_cron_job_status()
  SET search_path TO 'public';
