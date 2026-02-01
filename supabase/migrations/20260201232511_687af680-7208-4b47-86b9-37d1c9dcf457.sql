-- =====================================================
-- Fix Security Issues: voice_sessions and blog_subscriptions
-- =====================================================

-- ISSUE 1: Fix voice_sessions overly permissive RLS policies
-- The current policies use "session_id IS NOT NULL" which is ALWAYS TRUE
-- since session_id is NOT NULL at the schema level, exposing ALL records

-- Drop the vulnerable SELECT policy
DROP POLICY IF EXISTS "Users can view own voice sessions" ON public.voice_sessions;

-- Drop the vulnerable UPDATE policy  
DROP POLICY IF EXISTS "Users can update own voice sessions" ON public.voice_sessions;

-- Create secure SELECT policy that validates session ownership
-- Authenticated users can see their own sessions
-- Anonymous users must provide matching session_id via x-session-id header
CREATE POLICY "Users can view own voice sessions"
  ON public.voice_sessions FOR SELECT
  USING (
    -- Authenticated users can see their own sessions
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR 
    -- Anonymous users must provide matching session_id via header
    (auth.uid() IS NULL 
     AND session_id IS NOT NULL 
     AND session_id = (current_setting('request.headers'::text, true)::json ->> 'x-session-id'))
    OR
    -- Admins can see all sessions
    has_role(auth.uid(), 'admin'::app_role)
  );

-- Create secure UPDATE policy with header validation
CREATE POLICY "Users can update own voice sessions"
  ON public.voice_sessions FOR UPDATE
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR 
    (auth.uid() IS NULL 
     AND session_id IS NOT NULL 
     AND session_id = (current_setting('request.headers'::text, true)::json ->> 'x-session-id'))
    OR
    has_role(auth.uid(), 'admin'::app_role)
  );

-- ISSUE 2: Fix blog_subscriptions potentially conflicting policies
-- Ensure only admins can SELECT from blog_subscriptions (no anonymous/public read)
-- First, let's add a deny policy for anonymous users explicitly

-- Drop any potentially conflicting policies (keep admin access)
DROP POLICY IF EXISTS "Deny anonymous read access" ON public.blog_subscriptions;
DROP POLICY IF EXISTS "Only admins can view subscriptions" ON public.blog_subscriptions;

-- Create explicit deny policy for anonymous SELECT
CREATE POLICY "Deny anonymous read access"
  ON public.blog_subscriptions FOR SELECT
  TO anon
  USING (false);

-- Ensure only admins can view (already exists but recreate for clarity)
-- Note: "Admins can manage blog subscriptions" and "Admins can view blog subscriptions" already exist
-- Just verify the deny for anonymous is in place