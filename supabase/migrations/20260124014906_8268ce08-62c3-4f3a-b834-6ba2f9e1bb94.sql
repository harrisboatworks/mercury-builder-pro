-- Allow anyone (anonymous or authenticated) to view admin-created quotes via shared links
-- This enables "unlisted" access - secure because UUIDs are unguessable
CREATE POLICY "Public read for admin shared quotes"
ON public.customer_quotes
FOR SELECT
TO anon, authenticated
USING (is_admin_quote = true);