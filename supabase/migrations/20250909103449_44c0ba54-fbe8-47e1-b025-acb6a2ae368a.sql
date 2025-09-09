-- Create sms_logs table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sms_logs') THEN
    CREATE TABLE public.sms_logs (
      id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
      to_phone text NOT NULL,
      message text NOT NULL,
      status text,
      error text,
      notification_id uuid REFERENCES public.notifications(id) ON DELETE SET NULL,
      created_at timestamp with time zone DEFAULT now()
    );
  END IF;
END $$;

-- Add notification preferences to profiles table if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notification_sms_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS notification_in_app_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS quiet_hours_start time DEFAULT '21:00'::time,
ADD COLUMN IF NOT EXISTS quiet_hours_end time DEFAULT '08:00'::time,
ADD COLUMN IF NOT EXISTS preferred_channel text DEFAULT 'in_app'::text;

-- Enable RLS on sms_logs table
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for sms_logs (admin access for monitoring)
CREATE POLICY "Admins can view all SMS logs" 
ON public.sms_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert SMS logs" 
ON public.sms_logs 
FOR INSERT 
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_logs_notification_id ON public.sms_logs(notification_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON public.sms_logs(status);