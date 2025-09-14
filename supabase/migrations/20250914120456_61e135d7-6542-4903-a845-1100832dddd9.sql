-- Add multi-source data tracking and manual override capabilities to motor_models
ALTER TABLE public.motor_models 
ADD COLUMN data_sources jsonb DEFAULT '{"harris": {"scraped_at": null, "success": false}, "mercury_official": {"scraped_at": null, "success": false}, "manual": {"added_at": null, "user_id": null}}'::jsonb,
ADD COLUMN manual_overrides jsonb DEFAULT '{}'::jsonb,
ADD COLUMN data_quality_score integer DEFAULT 0,
ADD COLUMN last_enriched timestamp with time zone DEFAULT null,
ADD COLUMN source_priority text[] DEFAULT ARRAY['manual', 'mercury_official', 'harris', 'reviews'];

-- Create data source configurations table
CREATE TABLE public.motor_data_sources (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  base_url text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  scrape_config jsonb DEFAULT '{}'::jsonb,
  priority integer NOT NULL DEFAULT 1,
  success_rate numeric DEFAULT 0,
  last_scraped timestamp with time zone DEFAULT null,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert default data sources
INSERT INTO public.motor_data_sources (name, base_url, scrape_config, priority) VALUES
('harris', 'https://harrisboatworks.com', '{"selector_config": {"title": "h1", "price": ".price"}}', 1),
('mercury_official', 'https://www.mercurymarine.com', '{"api_endpoints": [], "selectors": {}}', 2),
('manual', 'admin_interface', '{}', 0),
('reviews', 'https://www.boatingmag.com', '{"search_patterns": ["reviews", "specs"]}', 3);

-- Create motor enrichment log table
CREATE TABLE public.motor_enrichment_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  motor_id uuid NOT NULL,
  source_name text NOT NULL,
  action text NOT NULL, -- 'scraped', 'merged', 'manual_override'
  data_added jsonb DEFAULT '{}'::jsonb,
  conflicts jsonb DEFAULT '{}'::jsonb,
  success boolean NOT NULL DEFAULT true,
  error_message text,
  user_id uuid, -- for manual actions
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.motor_data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motor_enrichment_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for motor_data_sources
CREATE POLICY "Public read access for motor_data_sources" 
ON public.motor_data_sources 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage motor_data_sources" 
ON public.motor_data_sources 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for motor_enrichment_log
CREATE POLICY "Admins can view enrichment logs" 
ON public.motor_enrichment_log 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert enrichment logs" 
ON public.motor_enrichment_log 
FOR INSERT 
WITH CHECK (true);

-- Add trigger for updated_at on motor_data_sources
CREATE TRIGGER update_motor_data_sources_updated_at
BEFORE UPDATE ON public.motor_data_sources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_motor_models_data_quality ON public.motor_models (data_quality_score DESC);
CREATE INDEX idx_motor_models_last_enriched ON public.motor_models (last_enriched);
CREATE INDEX idx_motor_enrichment_log_motor_id ON public.motor_enrichment_log (motor_id);
CREATE INDEX idx_motor_enrichment_log_source ON public.motor_enrichment_log (source_name);
CREATE INDEX idx_motor_data_sources_active ON public.motor_data_sources (is_active, priority);