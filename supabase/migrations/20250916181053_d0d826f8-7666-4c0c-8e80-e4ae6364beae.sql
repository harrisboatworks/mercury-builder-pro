-- Add dealer_price_live field for real-time inventory pricing
ALTER TABLE public.motor_models 
ADD COLUMN dealer_price_live numeric DEFAULT NULL;

-- Add index for stock-related queries optimization
CREATE INDEX IF NOT EXISTS idx_motor_models_stock_status 
ON public.motor_models (in_stock, is_brochure, last_stock_check);

-- Create sync_logs table for tracking automated syncs
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_type text NOT NULL DEFAULT 'inventory',
  status text NOT NULL DEFAULT 'running',
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  motors_processed integer DEFAULT 0,
  motors_in_stock integer DEFAULT 0,
  error_message text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on sync_logs
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for sync_logs (admins only)
CREATE POLICY "Admins can manage sync logs" ON public.sync_logs
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));