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

-- Make quotes.user_id non-nullable for security (skip constraint if exists)
ALTER TABLE public.quotes 
ALTER COLUMN user_id SET NOT NULL;

-- Add indexes for better security query performance
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_action 
ON public.security_audit_log(user_id, action, created_at);

-- Add index for rate limiting queries if metadata column exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'security_audit_log' 
    AND column_name = 'metadata'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_security_audit_log_metadata_identifier 
    ON public.security_audit_log USING GIN((metadata->>'identifier'));
  END IF;
END $$;

-- Ensure customer_quotes user_id is also non-nullable for consistency
ALTER TABLE public.customer_quotes 
ALTER COLUMN user_id SET NOT NULL;