-- Create public read policy for motor-images bucket
CREATE POLICY "public read motor-images"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'motor-images');