-- Fix database function security by adding proper search_path settings
-- Using CREATE OR REPLACE without DROP to avoid dependency issues

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$function$;

CREATE OR REPLACE FUNCTION public.validate_user_data_access(_table_name text, _record_id text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
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
$function$;

CREATE OR REPLACE FUNCTION public.audit_orphaned_customer_data()
 RETURNS TABLE(table_name text, record_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  -- Return count of records without user_id for security audit
  RETURN QUERY
  SELECT 'customer_quotes'::text, COUNT(*)::bigint FROM public.customer_quotes WHERE user_id IS NULL
  UNION ALL
  SELECT 'customer_xp'::text, COUNT(*)::bigint FROM public.customer_xp WHERE user_id IS NULL
  UNION ALL  
  SELECT 'quotes'::text, COUNT(*)::bigint FROM public.quotes WHERE user_id IS NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'display_name');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.enforce_customer_quotes_user_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Auto-fill user_id if missing with the current auth uid
    IF NEW.user_id IS NULL THEN
      NEW.user_id := auth.uid();
    END IF;
    -- Ensure user_id matches current user
    IF NEW.user_id != auth.uid() THEN
      RAISE EXCEPTION 'Cannot create quote for another user';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Prevent changing user_id (ownership) after creation
    IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
      RAISE EXCEPTION 'user_id cannot be changed';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.enforce_customer_xp_user_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Auto-fill user_id if missing with the current auth uid
    IF NEW.user_id IS NULL THEN
      NEW.user_id := auth.uid();
    END IF;
    -- Ensure user_id matches current user
    IF NEW.user_id != auth.uid() THEN
      RAISE EXCEPTION 'Cannot create XP record for another user';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Prevent changing user_id (ownership) after creation
    IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
      RAISE EXCEPTION 'user_id cannot be changed';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.enforce_quotes_user_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Auto-fill user_id if missing with the current auth uid
    IF NEW.user_id IS NULL THEN
      NEW.user_id := auth.uid();
    END IF;
    -- Ensure user_id matches current user (unless admin)
    IF NEW.user_id != auth.uid() AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'Cannot create quote for another user';
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Prevent changing user_id (ownership) after creation unless admin
    IF NEW.user_id IS DISTINCT FROM OLD.user_id AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'user_id cannot be changed';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;