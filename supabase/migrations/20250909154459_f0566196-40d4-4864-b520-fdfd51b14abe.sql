-- Create storage bucket for motor spec sheets
INSERT INTO storage.buckets (id, name, public) VALUES ('spec-sheets', 'spec-sheets', true);

-- Create storage policies for spec sheets
CREATE POLICY "Spec sheets are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'spec-sheets');

-- Allow system to upload spec sheets
CREATE POLICY "System can upload spec sheets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'spec-sheets');

-- Allow system to update spec sheets
CREATE POLICY "System can update spec sheets" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'spec-sheets');

-- Add spec_sheet_file_id column to motor_models for tracking generated sheets
ALTER TABLE motor_models ADD COLUMN spec_sheet_file_id TEXT;