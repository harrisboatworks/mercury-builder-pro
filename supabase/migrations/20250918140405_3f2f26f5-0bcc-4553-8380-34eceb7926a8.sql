-- CRITICAL SECURITY FIX: Remove anonymous access to sensitive customer data
-- This migration addresses multiple ERROR-level security findings
-- Handles existing policies properly

-- Check and fix customer_quotes table security
DO $$
BEGIN
    -- Drop existing policies if they exist
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_quotes' AND policyname = 'Admin full access to customer quotes') THEN
        DROP POLICY "Admin full access to customer quotes" ON public.customer_quotes;
    END IF;
    
    -- Create explicit DENY policy for anonymous users first
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customer_quotes' AND policyname = 'Deny anonymous access to customer_quotes') THEN
        CREATE POLICY "Deny anonymous access to customer_quotes"
        ON public.customer_quotes
        FOR ALL
        TO anon
        USING (false);
    END IF;
END$$;

-- Fix profiles table - add explicit anonymous denial
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Deny anonymous access to profiles') THEN
        CREATE POLICY "Deny anonymous access to profiles"
        ON public.profiles
        FOR ALL
        TO anon
        USING (false);
    END IF;
END$$;

-- Fix notifications table - add explicit anonymous denial  
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Deny anonymous access to notifications') THEN
        CREATE POLICY "Deny anonymous access to notifications"
        ON public.notifications
        FOR ALL
        TO anon
        USING (false);
    END IF;
END$$;

-- Fix sms_logs table - add explicit anonymous denial
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sms_logs' AND policyname = 'Deny anonymous access to sms_logs') THEN
        CREATE POLICY "Deny anonymous access to sms_logs"
        ON public.sms_logs
        FOR ALL
        TO anon
        USING (false);
    END IF;
END$$;

-- Fix user_sessions table - add explicit anonymous denial
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_sessions' AND policyname = 'Deny anonymous access to user_sessions') THEN
        CREATE POLICY "Deny anonymous access to user_sessions"
        ON public.user_sessions
        FOR ALL
        TO anon
        USING (false);
    END IF;
END$$;

-- Ensure RLS is enabled on all sensitive tables
ALTER TABLE public.customer_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Log security fix
INSERT INTO public.security_audit_log (action, table_name, created_at)
VALUES ('security_fix_anonymous_access_denied', 'multiple_tables', now());