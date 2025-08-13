-- Phase 1: Critical RLS Policy Fixes

-- Fix customer_quotes table - make user_id NOT NULL and add proper constraints
ALTER TABLE public.customer_quotes 
ALTER COLUMN user_id SET NOT NULL;

-- Add trigger to auto-set user_id for customer_quotes
CREATE OR REPLACE FUNCTION public.enforce_customer_quotes_user_id()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER enforce_customer_quotes_user_id_trigger
  BEFORE INSERT OR UPDATE ON public.customer_quotes
  FOR EACH ROW EXECUTE FUNCTION public.enforce_customer_quotes_user_id();

-- Fix customer_xp table - make user_id NOT NULL
ALTER TABLE public.customer_xp 
ALTER COLUMN user_id SET NOT NULL;

-- Add trigger to auto-set user_id for customer_xp
CREATE OR REPLACE FUNCTION public.enforce_customer_xp_user_id()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER enforce_customer_xp_user_id_trigger
  BEFORE INSERT OR UPDATE ON public.customer_xp
  FOR EACH ROW EXECUTE FUNCTION public.enforce_customer_xp_user_id();

-- Create user roles system for admin access
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" 
ON public.user_roles 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Fix quotes table RLS - allow admin access
DROP POLICY IF EXISTS "No public select on quotes" ON public.quotes;
DROP POLICY IF EXISTS "No public insert on quotes" ON public.quotes;

CREATE POLICY "Admins can access all quotes" 
ON public.quotes 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Fix heartbeat table RLS - allow admin access  
DROP POLICY IF EXISTS "No public select on heartbeat" ON public.heartbeat;
DROP POLICY IF EXISTS "No public insert on heartbeat" ON public.heartbeat;

CREATE POLICY "Admins can access heartbeat" 
ON public.heartbeat 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for user_roles updated_at
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();