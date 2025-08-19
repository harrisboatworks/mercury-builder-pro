-- Fix security vulnerability in customer_quotes table
-- Add missing trigger and strengthen access controls

-- First, ensure the trigger exists for customer_quotes table
-- This trigger auto-fills user_id and prevents cross-user quote creation
DROP TRIGGER IF EXISTS enforce_customer_quotes_user_id_trigger ON public.customer_quotes;

CREATE TRIGGER enforce_customer_quotes_user_id_trigger
  BEFORE INSERT OR UPDATE ON public.customer_quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_customer_quotes_user_id();

-- Add admin access policy for legitimate business purposes (customer support)
CREATE POLICY "Admins can access customer quotes for support"
  ON public.customer_quotes
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Ensure no orphaned customer quotes exist without user_id
-- This addresses potential data integrity issues
UPDATE public.customer_quotes 
SET user_id = '00000000-0000-0000-0000-000000000000'::uuid 
WHERE user_id IS NULL;

-- Add constraint to prevent future NULL user_id insertions
-- (This should already be enforced by the column definition, but adds extra protection)
ALTER TABLE public.customer_quotes 
ADD CONSTRAINT customer_quotes_user_id_not_null 
CHECK (user_id IS NOT NULL);