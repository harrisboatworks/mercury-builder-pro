-- Fix SMS logs RLS policy - replace overly permissive policy
DROP POLICY IF EXISTS "System can insert SMS logs" ON public.sms_logs;

-- Create more secure SMS logs policy that requires authentication or service role
CREATE POLICY "Authenticated system can insert SMS logs" 
ON public.sms_logs 
FOR INSERT 
WITH CHECK (
  -- Allow service role (for edge functions) or authenticated users
  current_setting('role') = 'service_role' OR auth.uid() IS NOT NULL
);

-- Make quotes.user_id non-nullable for security
-- First, update any existing quotes with null user_id (should be none based on triggers, but safety first)
UPDATE public.quotes 
SET user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'admin@example.com' 
  LIMIT 1
) 
WHERE user_id IS NULL;

-- Now make the column non-nullable
ALTER TABLE public.quotes 
ALTER COLUMN user_id SET NOT NULL;

-- Add database constraint to ensure quotes are always associated with users
ALTER TABLE public.quotes 
ADD CONSTRAINT quotes_user_id_not_null 
CHECK (user_id IS NOT NULL);

-- Enhance security audit logging - add metadata column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'security_audit_log' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.security_audit_log 
    ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add index for better performance on security queries
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_action 
ON public.security_audit_log(user_id, action, created_at);

-- Add index for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_security_audit_log_metadata_identifier 
ON public.security_audit_log USING GIN((metadata->>'identifier'));

-- Ensure customer_quotes user_id is also non-nullable for consistency
ALTER TABLE public.customer_quotes 
ALTER COLUMN user_id SET NOT NULL;