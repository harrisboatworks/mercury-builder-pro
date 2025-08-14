-- Create the missing validate_user_data_access function referenced in security middleware
CREATE OR REPLACE FUNCTION public.validate_user_data_access(
  _table_name text,
  _record_id text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
  
  -- Check ownership based on table name
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
$$;

-- Fix database function security by adding proper search_path settings
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- Update existing functions to have proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name');
  RETURN NEW;
END;
$$;

-- Add a function to clean up orphaned customer data (data without user_id)
CREATE OR REPLACE FUNCTION public.audit_orphaned_customer_data()
RETURNS TABLE(table_name text, record_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Return count of records without user_id for security audit
  RETURN QUERY
  SELECT 'customer_quotes'::text, COUNT(*)::bigint FROM public.customer_quotes WHERE user_id IS NULL
  UNION ALL
  SELECT 'customer_xp'::text, COUNT(*)::bigint FROM public.customer_xp WHERE user_id IS NULL
  UNION ALL  
  SELECT 'quotes'::text, COUNT(*)::bigint FROM public.quotes WHERE user_id IS NULL;
END;
$$;