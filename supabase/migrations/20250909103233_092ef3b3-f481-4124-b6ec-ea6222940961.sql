-- Create notifications table
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text DEFAULT 'info'::text,
  title text,
  message text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  channel text DEFAULT 'in_app'::text
);

-- Create sms_logs table
CREATE TABLE public.sms_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  to_phone text NOT NULL,
  message text NOT NULL,
  status text,
  error text,
  notification_id uuid REFERENCES public.notifications(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Add notification preferences to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notification_sms_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS notification_in_app_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS quiet_hours_start time DEFAULT '21:00'::time,
ADD COLUMN IF NOT EXISTS quiet_hours_end time DEFAULT '08:00'::time,
ADD COLUMN IF NOT EXISTS preferred_channel text DEFAULT 'in_app'::text;

-- Enable RLS on new tables
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" 
ON public.notifications 
FOR DELETE 
USING (auth.uid() = user_id);

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
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX idx_sms_logs_notification_id ON public.sms_logs(notification_id);
CREATE INDEX idx_sms_logs_status ON public.sms_logs(status);