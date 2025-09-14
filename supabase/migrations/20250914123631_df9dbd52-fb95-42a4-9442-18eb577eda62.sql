-- Create table for motor-specific custom image sources
CREATE TABLE public.motor_custom_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  motor_id UUID NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('direct_url', 'gallery_url', 'dropbox', 'google_drive', 'pdf_url', 'api_endpoint')),
  source_url TEXT NOT NULL,
  source_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 1,
  scrape_config JSONB DEFAULT '{}',
  last_scraped TIMESTAMP WITH TIME ZONE,
  success_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS on motor_custom_sources
ALTER TABLE public.motor_custom_sources ENABLE ROW LEVEL SECURITY;

-- Create policies for motor_custom_sources
CREATE POLICY "Admins can manage motor custom sources"
ON public.motor_custom_sources
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public read access for motor custom sources"
ON public.motor_custom_sources
FOR SELECT
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_motor_custom_sources_updated_at
BEFORE UPDATE ON public.motor_custom_sources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add foreign key constraint (optional, since motor_models doesn't have FK constraints defined)
-- ALTER TABLE public.motor_custom_sources 
-- ADD CONSTRAINT motor_custom_sources_motor_id_fkey 
-- FOREIGN KEY (motor_id) REFERENCES public.motor_models(id) ON DELETE CASCADE;