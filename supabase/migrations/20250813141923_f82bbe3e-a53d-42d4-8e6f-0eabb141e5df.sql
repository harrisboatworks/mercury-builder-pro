-- Comprehensive Security Fixes for Critical Vulnerabilities

-- 1. Add proper RLS triggers for user_id enforcement on customer_quotes
CREATE TRIGGER enforce_customer_quotes_user_id_trigger
  BEFORE INSERT OR UPDATE ON public.customer_quotes
  FOR EACH ROW EXECUTE FUNCTION public.enforce_customer_quotes_user_id();

-- 2. Add proper RLS triggers for user_id enforcement on customer_xp
CREATE TRIGGER enforce_customer_xp_user_id_trigger
  BEFORE INSERT OR UPDATE ON public.customer_xp
  FOR EACH ROW EXECUTE FUNCTION public.enforce_customer_xp_user_id();

-- 3. Create security audit log table for monitoring data access
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can access audit logs
CREATE POLICY "Admins can access audit logs" 
  ON public.security_audit_log 
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Create audit function for sensitive data access
CREATE OR REPLACE FUNCTION public.log_data_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log SELECT operations on sensitive tables
  IF TG_OP = 'SELECT' AND TG_TABLE_NAME IN ('customer_quotes', 'customer_xp', 'quotes') THEN
    INSERT INTO public.security_audit_log (
      user_id,
      action,
      table_name,
      record_id
    ) VALUES (
      auth.uid(),
      'SELECT',
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id)
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 5. Create session timeout tracking table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_activity timestamp with time zone NOT NULL DEFAULT now(),
  ip_address inet,
  user_agent text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on user sessions
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sessions
CREATE POLICY "Users can view their own sessions" 
  ON public.user_sessions 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" 
  ON public.user_sessions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions" 
  ON public.user_sessions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Admins can see all sessions
CREATE POLICY "Admins can access all sessions" 
  ON public.user_sessions 
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 6. Create function to check for inactive sessions
CREATE OR REPLACE FUNCTION public.cleanup_inactive_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Mark sessions inactive after 24 hours of inactivity
  UPDATE public.user_sessions 
  SET is_active = false 
  WHERE last_activity < (now() - interval '24 hours') 
    AND is_active = true;
END;
$$;

-- 7. Add indexes for performance on security-related queries
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON public.security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON public.security_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON public.user_sessions(last_activity);

-- 8. Create function to validate user data isolation
CREATE OR REPLACE FUNCTION public.validate_user_data_access(_table_name text, _record_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  record_user_id uuid;
  current_user_id uuid := auth.uid();
BEGIN
  -- Get the current user
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user is admin
  IF has_role(current_user_id, 'admin'::app_role) THEN
    RETURN true;
  END IF;
  
  -- Get the user_id from the specific table
  CASE _table_name
    WHEN 'customer_quotes' THEN
      SELECT user_id INTO record_user_id FROM public.customer_quotes WHERE id = _record_id;
    WHEN 'customer_xp' THEN
      SELECT user_id INTO record_user_id FROM public.customer_xp WHERE id = _record_id;
    ELSE
      RETURN false;
  END CASE;
  
  -- Check if the record belongs to the current user
  RETURN record_user_id = current_user_id;
END;
$$;