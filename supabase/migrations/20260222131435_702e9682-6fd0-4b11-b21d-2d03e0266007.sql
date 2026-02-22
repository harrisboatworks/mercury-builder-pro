
-- =====================================================
-- Fix broken RLS policies that use current_setting('request.headers')
-- These policies NEVER work because Supabase RLS cannot access HTTP headers
-- Replace with auth-only policies; anonymous access goes through edge functions
-- =====================================================

-- === VOICE_SESSIONS ===

-- Drop the broken header-based SELECT policy
DROP POLICY IF EXISTS "Users can view own voice sessions" ON public.voice_sessions;

-- Drop the broken header-based UPDATE policy
DROP POLICY IF EXISTS "Users can update own voice sessions" ON public.voice_sessions;

-- New SELECT: authenticated users see own sessions only (anonymous goes through edge function)
CREATE POLICY "Authenticated users can view own voice sessions"
  ON public.voice_sessions FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- New UPDATE: authenticated users can update own sessions only
CREATE POLICY "Authenticated users can update own voice sessions"
  ON public.voice_sessions FOR UPDATE
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- INSERT policy: allow anonymous inserts (session_id required, user_id optional)
-- Keep existing permissive insert for anonymous session creation
DROP POLICY IF EXISTS "Users can create voice sessions" ON public.voice_sessions;
CREATE POLICY "Anyone can create voice sessions"
  ON public.voice_sessions FOR INSERT
  WITH CHECK (
    session_id IS NOT NULL
    AND (
      (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL))
      OR (auth.uid() IS NULL AND user_id IS NULL)
    )
  );

-- === CUSTOMER_QUOTES ===

-- Drop the broken header-based policies
DROP POLICY IF EXISTS "Anonymous users can view quotes by session ID" ON public.customer_quotes;
DROP POLICY IF EXISTS "Anyone can view quotes with valid share token" ON public.customer_quotes;
