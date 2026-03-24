-- Add follow-up date to customer_quotes
ALTER TABLE public.customer_quotes 
ADD COLUMN IF NOT EXISTS follow_up_date timestamp with time zone DEFAULT NULL;

-- Create contact log table for CRM-style activity tracking
CREATE TABLE IF NOT EXISTS public.quote_contact_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.customer_quotes(id) ON DELETE CASCADE,
  customer_email text NOT NULL,
  contact_type text NOT NULL DEFAULT 'note',
  notes text,
  contacted_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quote_contact_log ENABLE ROW LEVEL SECURITY;

-- Only admins can manage contact logs
CREATE POLICY "Admins can manage contact logs"
ON public.quote_contact_log
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Index for quick lookups by customer email (for history across quotes)
CREATE INDEX IF NOT EXISTS idx_quote_contact_log_email ON public.quote_contact_log(customer_email);
CREATE INDEX IF NOT EXISTS idx_quote_contact_log_quote ON public.quote_contact_log(quote_id);
CREATE INDEX IF NOT EXISTS idx_customer_quotes_follow_up ON public.customer_quotes(follow_up_date) WHERE follow_up_date IS NOT NULL;