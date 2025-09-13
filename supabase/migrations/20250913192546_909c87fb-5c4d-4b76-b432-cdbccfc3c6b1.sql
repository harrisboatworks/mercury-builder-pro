-- Security hardening: Add explicit search_path to functions that don't have it
-- and optimize function security settings

-- Update functions to have explicit search_path for security
CREATE OR REPLACE FUNCTION public.generate_session_id()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 'anon_' || substr(md5(random()::text), 1, 12);
$function$;

-- Enhance user data validation function with better security
CREATE OR REPLACE FUNCTION public.validate_user_data_access(_table_name text, _record_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_owns_record boolean := false;
  current_user_id uuid;
BEGIN
  -- Get current authenticated user
  current_user_id := auth.uid();
  
  -- If no authenticated user, deny access
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Additional validation: ensure record_id is a valid UUID
  IF _record_id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN false;
  END IF;
  
  -- Check ownership based on table name with additional security checks
  CASE _table_name
    WHEN 'quotes' THEN
      SELECT EXISTS(
        SELECT 1 FROM public.quotes 
        WHERE id::text = _record_id AND user_id = current_user_id
      ) INTO user_owns_record;
      
    WHEN 'customer_quotes' THEN
      SELECT EXISTS(
        SELECT 1 FROM public.customer_quotes 
        WHERE id::text = _record_id AND user_id = current_user_id
      ) INTO user_owns_record;
      
    WHEN 'customer_xp' THEN
      SELECT EXISTS(
        SELECT 1 FROM public.customer_xp 
        WHERE id::text = _record_id AND user_id = current_user_id
      ) INTO user_owns_record;
      
    WHEN 'profiles' THEN
      SELECT EXISTS(
        SELECT 1 FROM public.profiles 
        WHERE id::text = _record_id AND user_id = current_user_id
      ) INTO user_owns_record;
      
    ELSE
      -- For unknown tables, deny access by default
      user_owns_record := false;
  END CASE;
  
  RETURN user_owns_record;
END;
$function$;

-- Create enhanced security audit function
CREATE OR REPLACE FUNCTION public.log_security_event(
  _user_id uuid,
  _action text,
  _table_name text,
  _record_id uuid DEFAULT NULL,
  _ip_address inet DEFAULT NULL,
  _user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert security event with validation
  IF _action IS NOT NULL AND _table_name IS NOT NULL THEN
    INSERT INTO public.security_audit_log (
      user_id, action, table_name, record_id, ip_address, user_agent, created_at
    ) VALUES (
      _user_id, _action, _table_name, _record_id, _ip_address, _user_agent, now()
    );
  END IF;
END;
$function$;

-- Enhanced rate limiting function for API security
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _identifier text,
  _action text,
  _max_attempts integer DEFAULT 10,
  _window_minutes integer DEFAULT 15
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  attempt_count integer;
  window_start timestamp with time zone;
BEGIN
  -- Calculate window start time
  window_start := now() - (_window_minutes || ' minutes')::interval;
  
  -- Count attempts in the current window
  SELECT COUNT(*) INTO attempt_count
  FROM public.security_audit_log
  WHERE created_at >= window_start
    AND (user_agent LIKE '%' || _identifier || '%' OR user_id::text = _identifier)
    AND action = _action;
  
  -- Return true if under limit, false if over limit
  RETURN attempt_count < _max_attempts;
END;
$function$;

-- Create session cleanup function for security
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  cleaned_count integer;
BEGIN
  -- Mark sessions as inactive if they haven't been active for 24 hours
  UPDATE public.user_sessions 
  SET is_active = false 
  WHERE is_active = true 
    AND last_activity < (now() - interval '24 hours');
  
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  
  -- Log the cleanup action
  INSERT INTO public.security_audit_log (action, table_name, created_at)
  VALUES ('session_cleanup', 'user_sessions', now());
  
  RETURN cleaned_count;
END;
$function$;

-- Tighten RLS policies for better security

-- Enhanced customer quotes policy to prevent data leaks
DROP POLICY IF EXISTS "Authenticated users can view their own quotes" ON public.customer_quotes;
CREATE POLICY "Secure customer quotes access"
ON public.customer_quotes
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  AND auth.uid() IS NOT NULL
  AND user_id IS NOT NULL
);

-- Enhanced profiles policy
DROP POLICY IF EXISTS "Secure profile view - authenticated users only" ON public.profiles;
CREATE POLICY "Enhanced secure profile access"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  AND auth.uid() IS NOT NULL
  AND user_id IS NOT NULL
);

-- Enhanced user sessions policy
DROP POLICY IF EXISTS "Authenticated users can view their own sessions" ON public.user_sessions;
CREATE POLICY "Secure session access"
ON public.user_sessions
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  AND auth.uid() IS NOT NULL
  AND user_id IS NOT NULL
  AND is_active = true
);

-- Add policy for security audit log access restriction
DROP POLICY IF EXISTS "Admins can access audit logs" ON public.security_audit_log;
CREATE POLICY "Restricted admin audit access"
ON public.security_audit_log
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND auth.uid() IS NOT NULL
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND auth.uid() IS NOT NULL
);

-- Create trigger to auto-update session activity
CREATE OR REPLACE FUNCTION public.update_session_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.last_activity = now();
  RETURN NEW;
END;
$function$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS update_user_sessions_activity ON public.user_sessions;

-- Create trigger for session activity updates
CREATE TRIGGER update_user_sessions_activity
  BEFORE UPDATE ON public.user_sessions
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION public.update_session_activity();

-- Add indexes for better security query performance
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_action 
ON public.security_audit_log(user_id, action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_audit_log_timestamp 
ON public.security_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_sessions_activity 
ON public.user_sessions(user_id, last_activity DESC) WHERE is_active = true;