-- Create table for webhook configurations
CREATE TABLE public.webhook_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  webhook_type TEXT NOT NULL CHECK (webhook_type IN ('hot_lead', 'new_lead_summary', 'follow_up_reminder', 'quote_delivery', 'manual_trigger')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  test_payload JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for webhook activity logs
CREATE TABLE public.webhook_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_config_id UUID REFERENCES public.webhook_configurations(id),
  trigger_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  response_details JSONB DEFAULT '{}',
  error_message TEXT,
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.webhook_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for webhook_configurations
CREATE POLICY "Admins can manage webhook configurations" 
ON public.webhook_configurations 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create policies for webhook_activity_logs
CREATE POLICY "Admins can view webhook activity logs" 
ON public.webhook_activity_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert webhook activity logs" 
ON public.webhook_activity_logs 
FOR INSERT 
WITH CHECK (true);

-- Create trigger for webhook_configurations updated_at
CREATE TRIGGER update_webhook_configurations_updated_at
BEFORE UPDATE ON public.webhook_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_webhook_configurations_type ON public.webhook_configurations(webhook_type);
CREATE INDEX idx_webhook_configurations_active ON public.webhook_configurations(is_active);
CREATE INDEX idx_webhook_activity_logs_config_id ON public.webhook_activity_logs(webhook_config_id);
CREATE INDEX idx_webhook_activity_logs_status ON public.webhook_activity_logs(status);
CREATE INDEX idx_webhook_activity_logs_triggered_at ON public.webhook_activity_logs(triggered_at);