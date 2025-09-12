-- Only update what doesn't exist yet

-- Make quotes.user_id non-nullable for security
ALTER TABLE public.quotes 
ALTER COLUMN user_id SET NOT NULL;

-- Add indexes for better security query performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_action 
ON public.security_audit_log(user_id, action, created_at);

-- Ensure customer_quotes user_id is also non-nullable for consistency  
ALTER TABLE public.customer_quotes 
ALTER COLUMN user_id SET NOT NULL;