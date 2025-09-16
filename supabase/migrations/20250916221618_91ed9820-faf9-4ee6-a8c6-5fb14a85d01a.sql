-- Create comprehensive motor media management system

-- Create motor_media table for all media types
CREATE TABLE public.motor_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  motor_id UUID REFERENCES public.motor_models(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'pdf', 'video', 'url', 'document')),
  media_category TEXT NOT NULL DEFAULT 'general' CHECK (media_category IN ('hero', 'gallery', 'specs', 'manual', 'brochure', 'video', 'general')),
  media_url TEXT NOT NULL,
  original_filename TEXT,
  file_size BIGINT,
  mime_type TEXT,
  title TEXT,
  description TEXT,
  alt_text TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  dropbox_path TEXT,
  dropbox_sync_status TEXT DEFAULT 'none' CHECK (dropbox_sync_status IN ('none', 'syncing', 'synced', 'error')),
  assignment_type TEXT NOT NULL DEFAULT 'individual' CHECK (assignment_type IN ('individual', 'bulk_rule', 'smart_match')),
  assignment_rules JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for performance
CREATE INDEX idx_motor_media_motor_id ON public.motor_media(motor_id);
CREATE INDEX idx_motor_media_type_category ON public.motor_media(media_type, media_category);
CREATE INDEX idx_motor_media_assignment ON public.motor_media(assignment_type);
CREATE INDEX idx_motor_media_dropbox ON public.motor_media(dropbox_path) WHERE dropbox_path IS NOT NULL;

-- Enable RLS
ALTER TABLE public.motor_media ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public read access for motor_media" 
  ON public.motor_media FOR SELECT 
  USING (true);

CREATE POLICY "Admins can manage motor_media" 
  ON public.motor_media FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create bulk assignment rules table
CREATE TABLE public.motor_media_assignment_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_name TEXT NOT NULL UNIQUE,
  description TEXT,
  conditions JSONB NOT NULL DEFAULT '{}', -- HP ranges, model families, etc.
  media_assignments JSONB NOT NULL DEFAULT '[]', -- Array of media to assign
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS for assignment rules
ALTER TABLE public.motor_media_assignment_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for assignment_rules" 
  ON public.motor_media_assignment_rules FOR SELECT 
  USING (true);

CREATE POLICY "Admins can manage assignment_rules" 
  ON public.motor_media_assignment_rules FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create Dropbox sync configuration table
CREATE TABLE public.dropbox_sync_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  folder_path TEXT NOT NULL UNIQUE,
  motor_assignment_rule TEXT, -- How to assign files to motors
  auto_categorize BOOLEAN DEFAULT true,
  sync_enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'idle' CHECK (sync_status IN ('idle', 'syncing', 'error')),
  error_message TEXT,
  files_synced INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for Dropbox config
ALTER TABLE public.dropbox_sync_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage dropbox_sync_config" 
  ON public.dropbox_sync_config FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add media tracking columns to motor_models
ALTER TABLE public.motor_models 
ADD COLUMN IF NOT EXISTS media_summary JSONB DEFAULT '{"images": 0, "pdfs": 0, "videos": 0, "urls": 0, "documents": 0}',
ADD COLUMN IF NOT EXISTS hero_media_id UUID REFERENCES public.motor_media(id),
ADD COLUMN IF NOT EXISTS media_last_updated TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create function to update media summary
CREATE OR REPLACE FUNCTION public.update_motor_media_summary()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the motor's media summary when media is added/removed/updated
  UPDATE public.motor_models 
  SET 
    media_summary = (
      SELECT jsonb_build_object(
        'images', COALESCE(SUM(CASE WHEN media_type = 'image' THEN 1 ELSE 0 END), 0),
        'pdfs', COALESCE(SUM(CASE WHEN media_type = 'pdf' THEN 1 ELSE 0 END), 0),
        'videos', COALESCE(SUM(CASE WHEN media_type = 'video' THEN 1 ELSE 0 END), 0),
        'urls', COALESCE(SUM(CASE WHEN media_type = 'url' THEN 1 ELSE 0 END), 0),
        'documents', COALESCE(SUM(CASE WHEN media_type = 'document' THEN 1 ELSE 0 END), 0)
      )
      FROM public.motor_media 
      WHERE motor_id = COALESCE(NEW.motor_id, OLD.motor_id)
        AND is_active = true
    ),
    media_last_updated = now()
  WHERE id = COALESCE(NEW.motor_id, OLD.motor_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for media summary updates
CREATE TRIGGER trigger_update_motor_media_summary_insert
  AFTER INSERT ON public.motor_media
  FOR EACH ROW EXECUTE FUNCTION public.update_motor_media_summary();

CREATE TRIGGER trigger_update_motor_media_summary_update
  AFTER UPDATE ON public.motor_media
  FOR EACH ROW EXECUTE FUNCTION public.update_motor_media_summary();

CREATE TRIGGER trigger_update_motor_media_summary_delete
  AFTER DELETE ON public.motor_media
  FOR EACH ROW EXECUTE FUNCTION public.update_motor_media_summary();

-- Create updated_at trigger for motor_media
CREATE TRIGGER update_motor_media_updated_at
  BEFORE UPDATE ON public.motor_media
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for assignment rules
CREATE TRIGGER update_assignment_rules_updated_at
  BEFORE UPDATE ON public.motor_media_assignment_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create updated_at trigger for dropbox config
CREATE TRIGGER update_dropbox_config_updated_at
  BEFORE UPDATE ON public.dropbox_sync_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();