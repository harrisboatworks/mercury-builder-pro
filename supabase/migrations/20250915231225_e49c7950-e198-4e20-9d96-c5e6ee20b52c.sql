-- Create hero-images storage bucket for motor hero images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('hero-images', 'hero-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for hero-images bucket
CREATE POLICY "Hero images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'hero-images');

CREATE POLICY "Admins can upload hero images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'hero-images' AND auth.role() = 'service_role');

CREATE POLICY "Admins can update hero images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'hero-images' AND auth.role() = 'service_role');