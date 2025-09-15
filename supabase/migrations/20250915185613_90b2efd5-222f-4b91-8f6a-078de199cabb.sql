-- Ensure motor-images bucket exists as public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('motor-images', 'motor-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Public read access for motor images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload hero images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload inventory images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update motor images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete motor images" ON storage.objects;

-- Create RLS policies for motor-images bucket with folder-based access
-- Public read access for all motor images
CREATE POLICY "Public read access for motor images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'motor-images');

-- Authenticated users can upload hero images to mercury/heroes/
CREATE POLICY "Authenticated users can upload hero images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'motor-images' 
  AND auth.uid() IS NOT NULL
  AND name LIKE 'mercury/heroes/%'
);

-- Authenticated users can upload inventory images to mercury/inventory/
CREATE POLICY "Authenticated users can upload inventory images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'motor-images' 
  AND auth.uid() IS NOT NULL
  AND name LIKE 'mercury/inventory/%'
);

-- Authenticated users can update motor images
CREATE POLICY "Authenticated users can update motor images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'motor-images' 
  AND auth.uid() IS NOT NULL
  AND (name LIKE 'mercury/heroes/%' OR name LIKE 'mercury/inventory/%')
);

-- Authenticated users can delete motor images
CREATE POLICY "Authenticated users can delete motor images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'motor-images' 
  AND auth.uid() IS NOT NULL
  AND (name LIKE 'mercury/heroes/%' OR name LIKE 'mercury/inventory/%')
);