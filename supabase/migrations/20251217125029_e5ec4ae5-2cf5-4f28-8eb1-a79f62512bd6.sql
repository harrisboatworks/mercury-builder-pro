-- Create email sequence queue table for tracking drip campaigns
CREATE TABLE public.email_sequence_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.customer_quotes(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  customer_name TEXT,
  sequence_type TEXT NOT NULL DEFAULT 'repower_guide',
  current_step INTEGER NOT NULL DEFAULT 1,
  next_send_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'unsubscribed', 'paused')),
  emails_sent INTEGER NOT NULL DEFAULT 1,
  last_sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  unsubscribe_token TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.email_sequence_queue ENABLE ROW LEVEL SECURITY;

-- Admin-only access policy
CREATE POLICY "Admins can manage email sequences"
ON public.email_sequence_queue
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Public policy for unsubscribe (by token)
CREATE POLICY "Anyone can unsubscribe with valid token"
ON public.email_sequence_queue
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Index for efficient cron processing
CREATE INDEX idx_email_sequence_queue_next_send 
ON public.email_sequence_queue(next_send_at) 
WHERE status = 'active';

-- Index for unsubscribe lookups
CREATE INDEX idx_email_sequence_queue_unsubscribe 
ON public.email_sequence_queue(unsubscribe_token);

-- Trigger for updated_at
CREATE TRIGGER update_email_sequence_queue_updated_at
BEFORE UPDATE ON public.email_sequence_queue
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();