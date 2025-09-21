-- Create table for pending motor matches requiring manual review
CREATE TABLE public.pending_motor_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scraped_motor_data JSONB NOT NULL DEFAULT '{}',
  potential_matches JSONB NOT NULL DEFAULT '[]',
  selected_match_id UUID NULL,
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected', 'no_match')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_by UUID NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE NULL,
  confidence_score NUMERIC NULL,
  sync_run_id UUID NULL
);

-- Create table for confirmed motor match mappings (learning system)
CREATE TABLE public.motor_match_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scraped_pattern TEXT NOT NULL,
  motor_model_id UUID NULL REFERENCES public.motor_models(id) ON DELETE SET NULL,
  confidence_score NUMERIC NOT NULL DEFAULT 0,
  created_by UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS on both tables
ALTER TABLE public.pending_motor_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motor_match_mappings ENABLE ROW LEVEL SECURITY;

-- RLS policies for pending_motor_matches
CREATE POLICY "Admins can manage pending motor matches" 
ON public.pending_motor_matches 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for motor_match_mappings  
CREATE POLICY "Admins can manage motor match mappings"
ON public.motor_match_mappings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_pending_motor_matches_status ON public.pending_motor_matches(review_status);
CREATE INDEX idx_pending_motor_matches_created_at ON public.pending_motor_matches(created_at);
CREATE INDEX idx_motor_match_mappings_pattern ON public.motor_match_mappings(scraped_pattern);
CREATE INDEX idx_motor_match_mappings_active ON public.motor_match_mappings(is_active) WHERE is_active = true;

-- Create trigger for updated_at
CREATE TRIGGER update_pending_motor_matches_updated_at
  BEFORE UPDATE ON public.pending_motor_matches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();