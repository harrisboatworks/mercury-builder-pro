-- Fix: Remove dangerous "Public read for admin shared quotes" policy that exposes all admin quotes
-- The old policy allowed anyone to SELECT all quotes where is_admin_quote=true, 
-- which leaked customer PII (email, phone, name) from all admin-created quotes

DROP POLICY IF EXISTS "Public read for admin shared quotes" ON public.customer_quotes;

-- Note: Admin quotes should only be accessible via:
-- 1. The admin themselves (covered by "Admins can read all quotes" policy)
-- 2. The quote owner if they're authenticated (covered by "Authenticated users can read their own quotes")
-- 3. Anonymous access via session_id matching (for customers who saved quotes anonymously)

-- Add a policy for anonymous users to view their own quotes by session_id
-- This enables the "unlisted link" functionality securely - customers can only see their OWN quote
CREATE POLICY "Anonymous users can view quotes by session ID"
ON public.customer_quotes
FOR SELECT
TO anon
USING (
  anonymous_session_id IS NOT NULL 
  AND anonymous_session_id = current_setting('request.headers', true)::json->>'x-session-id'
);

-- For the admin shared quote link scenario, we'll rely on:
-- 1. The quote creator getting a direct link with the quote ID
-- 2. When they click the link, they either:
--    a. Are authenticated and it's their quote (covered by existing policies)
--    b. Are anonymous but their session_id matches (covered by new policy above)
--    c. For truly public admin quote links, we should use a share_token pattern instead

-- Add a share_token column for secure sharing of admin quotes
ALTER TABLE public.customer_quotes
ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE;

-- Create index for share_token lookups
CREATE INDEX IF NOT EXISTS idx_customer_quotes_share_token 
ON public.customer_quotes(share_token) 
WHERE share_token IS NOT NULL;

-- Add policy for share_token based access (secure "unlisted" link pattern)
CREATE POLICY "Anyone can view quotes with valid share token"
ON public.customer_quotes
FOR SELECT
TO anon, authenticated
USING (
  share_token IS NOT NULL 
  AND share_token = current_setting('request.headers', true)::json->>'x-share-token'
);