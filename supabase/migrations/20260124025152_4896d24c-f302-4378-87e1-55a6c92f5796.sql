-- Create quote_change_log table for audit trail
CREATE TABLE public.quote_change_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_id uuid REFERENCES public.customer_quotes(id) ON DELETE CASCADE NOT NULL,
    changed_by uuid NOT NULL,
    change_type text NOT NULL CHECK (change_type IN ('created', 'updated', 'status', 'discount', 'notes')),
    changes jsonb NOT NULL DEFAULT '{}',
    notes text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for fast lookups by quote
CREATE INDEX idx_quote_change_log_quote_id ON public.quote_change_log(quote_id);
CREATE INDEX idx_quote_change_log_created_at ON public.quote_change_log(created_at DESC);

-- Enable RLS
ALTER TABLE public.quote_change_log ENABLE ROW LEVEL SECURITY;

-- RLS policies - only admins can read/write
CREATE POLICY "Admins can view quote change logs"
ON public.quote_change_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert quote change logs"
ON public.quote_change_log
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));