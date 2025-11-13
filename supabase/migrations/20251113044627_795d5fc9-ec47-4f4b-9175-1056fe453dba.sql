-- CRITICAL SECURITY FIX: Remove anonymous access to financing_applications
-- The previous policies allowed any anonymous user to view all applications with resume tokens
-- This exposed highly sensitive PII including encrypted SINs, emails, phone numbers, employment data

-- Drop the dangerous anonymous SELECT policy
DROP POLICY IF EXISTS "Anonymous users can view via resume token" ON public.financing_applications;

-- Drop anonymous INSERT policy (users must be authenticated to apply for financing)
DROP POLICY IF EXISTS "Anonymous users can create draft applications" ON public.financing_applications;

-- Drop anonymous UPDATE policy (users must be authenticated to update their application)
DROP POLICY IF EXISTS "Anonymous users can update via resume token" ON public.financing_applications;

-- The remaining policies are secure:
-- 1. "Users can view own applications" - authenticated users can only see their own applications OR admins can see all
-- 2. "Users can create own applications" - authenticated users can create applications for themselves
-- 3. "Users can update own draft applications" - authenticated users can only update their own drafts
-- 4. "Admins have full access to applications" - admins can manage all applications

-- Resume functionality will still work for authenticated users via the existing user_id-based policies
-- Users will need to sign in to resume their saved application, which is appropriate given the sensitive nature of the data

COMMENT ON TABLE public.financing_applications IS 'Stores financing applications with encrypted SINs and sensitive PII. Requires authentication for all access to protect customer data.';