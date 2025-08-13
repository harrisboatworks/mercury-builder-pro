-- Fix function search path security warnings

-- Update enforce_customer_quotes_user_id function with secure search_path
CREATE OR REPLACE FUNCTION public.enforce_customer_quotes_user_id()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
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
$$;

-- Update enforce_customer_xp_user_id function with secure search_path
CREATE OR REPLACE FUNCTION public.enforce_customer_xp_user_id()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path TO 'public'
AS $$
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
$$;

-- Update has_role function with secure search_path
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;