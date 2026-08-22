-- The spec-sheets bucket was used for customer-specific quote PDFs containing
-- contact and pricing details. Keep every historical object intact, but stop
-- bypassing Storage access control through permanent public URLs.
DROP POLICY IF EXISTS "Spec sheets are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public can view spec sheets" ON storage.objects;

UPDATE storage.buckets
SET public = false
WHERE id = 'spec-sheets';
