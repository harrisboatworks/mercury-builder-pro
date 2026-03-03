
-- Make user_id nullable for guest deposit payments
ALTER TABLE public.customer_quotes ALTER COLUMN user_id DROP NOT NULL;

-- Update anonymous insert policy to allow 'deposit' lead_source
DROP POLICY IF EXISTS "Allow anonymous quote creation with session ID" ON public.customer_quotes;
CREATE POLICY "Allow anonymous quote creation with session ID"
  ON public.customer_quotes
  FOR INSERT
  WITH CHECK (
    (user_id IS NULL) 
    AND (anonymous_session_id IS NOT NULL) 
    AND (lead_source = ANY (ARRAY['pdf_download', 'consultation', 'deposit']))
  );
