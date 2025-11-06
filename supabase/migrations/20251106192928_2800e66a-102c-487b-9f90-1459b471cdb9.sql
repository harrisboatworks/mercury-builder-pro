-- Create table for Google Sheets sync configuration
CREATE TABLE IF NOT EXISTS public.google_sheets_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_url TEXT NOT NULL,
  last_sync TIMESTAMP WITH TIME ZONE,
  auto_sync_enabled BOOLEAN NOT NULL DEFAULT true,
  sync_frequency TEXT NOT NULL DEFAULT 'daily',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.google_sheets_config ENABLE ROW LEVEL SECURITY;

-- Admin full access policy
CREATE POLICY "Admins can manage google_sheets_config"
ON public.google_sheets_config
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));