-- Create storage bucket for motor images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('motor-images', 'motor-images', true);

-- Create RLS policies for motor images bucket
CREATE POLICY "Public can view motor images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'motor-images');

CREATE POLICY "Authenticated users can upload motor images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'motor-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can update motor images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'motor-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can delete motor images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'motor-images' 
  AND auth.uid() IS NOT NULL
);