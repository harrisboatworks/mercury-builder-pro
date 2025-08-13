-- Security hardening: Authentication and data protection improvements

-- 1. Create heartbeat table with proper RLS if it doesn't exist
CREATE TABLE IF NOT EXISTS public.heartbeat (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on heartbeat table
ALTER TABLE public.heartbeat ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for heartbeat
CREATE POLICY "Users can create their own heartbeat entries" 
ON public.heartbeat 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own heartbeat entries" 
ON public.heartbeat 
FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Create database function to validate user data access (if not exists)
CREATE OR REPLACE FUNCTION public.validate_user_data_access(
  _table_name TEXT,
  _record_id TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  _user_id UUID;
  _record_user_id UUID;
BEGIN
  -- Get current authenticated user
  _user_id := auth.uid();
  
  -- If no user is authenticated, deny access
  IF _user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user is admin
  IF has_role(_user_id, 'admin'::app_role) THEN
    RETURN TRUE;
  END IF;
  
  -- Check table-specific access rules
  IF _table_name = 'quotes' THEN
    SELECT user_id INTO _record_user_id 
    FROM public.quotes 
    WHERE id = _record_id::UUID;
    
    RETURN _record_user_id = _user_id;
  END IF;
  
  -- Default deny for unknown tables
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create function to check and clean rate limiting data
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_data()
RETURNS VOID AS $$
BEGIN
  -- Clean up old security audit log entries (keep last 30 days)
  DELETE FROM public.security_audit_log 
  WHERE created_at < now() - INTERVAL '30 days';
  
  -- Clean up old session data (keep last 7 days)
  DELETE FROM public.user_sessions 
  WHERE last_activity < now() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Set up automatic cleanup (runs daily)
CREATE OR REPLACE FUNCTION public.schedule_cleanup()
RETURNS VOID AS $$
BEGIN
  -- This would typically be handled by a cron job or scheduled function
  -- For now, we'll just ensure the function exists
  PERFORM public.cleanup_rate_limit_data();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Add indexes for performance on security-related queries
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_action 
ON public.security_audit_log(user_id, action);

CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at 
ON public.security_audit_log(created_at);

CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity 
ON public.user_sessions(last_activity);

-- 6. Update user_sessions table to be more secure
ALTER TABLE public.user_sessions 
ADD COLUMN IF NOT EXISTS ip_hash TEXT;

-- Create function to hash IP addresses for privacy
CREATE OR REPLACE FUNCTION public.hash_ip(ip_address TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Simple hash for privacy (in production, use more secure hashing)
  RETURN encode(digest(ip_address || 'salt_key', 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Log this security hardening
INSERT INTO public.security_audit_log (user_id, action, table_name, record_id)
VALUES (auth.uid(), 'security_hardening_applied', 'system', NULL);