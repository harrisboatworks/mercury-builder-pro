-- Remove sensitive personal information columns from customer_xp table
-- This addresses the security finding by eliminating unnecessary PII storage

-- Drop the email and phone columns that contain sensitive personal information
ALTER TABLE public.customer_xp 
DROP COLUMN IF EXISTS email,
DROP COLUMN IF EXISTS phone;

-- Add a comment to document the security improvement
COMMENT ON TABLE public.customer_xp IS 'Customer XP tracking table - PII columns removed for security compliance';