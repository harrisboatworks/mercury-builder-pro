-- Fix promo-images deletion permission: allow users to delete their own files
create policy if not exists "Users can delete their own promo images"
on storage.objects
for delete
using (
  bucket_id = 'promo-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);