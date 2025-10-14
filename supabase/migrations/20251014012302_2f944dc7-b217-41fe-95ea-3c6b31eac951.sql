-- Allow anonymous users to create quotes with session tracking
-- This fixes the "new row violates row-level security policy" error when downloading PDFs

-- Remove overly restrictive blanket deny policy
DROP POLICY IF EXISTS "Deny anonymous access to customer_quotes" ON public.customer_quotes;

-- Allow anonymous quote creation with session ID tracking
CREATE POLICY "Allow anonymous quote creation with session ID"
ON public.customer_quotes
FOR INSERT
TO anon
WITH CHECK (
  user_id IS NULL 
  AND anonymous_session_id IS NOT NULL
  AND lead_source IN ('pdf_download', 'consultation')
);