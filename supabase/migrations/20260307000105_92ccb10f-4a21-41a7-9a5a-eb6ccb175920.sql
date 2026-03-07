-- Fix: Remove the overly permissive "Anyone can read saved quotes by ID" policy
-- that exposes customer email addresses to unauthenticated users.
-- The get-shared-quote edge function uses service_role and handles public access.

DROP POLICY IF EXISTS "Anyone can read saved quotes by ID" ON public.saved_quotes;

-- Add admin read access
CREATE POLICY "Admins can read all saved quotes"
  ON public.saved_quotes
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));