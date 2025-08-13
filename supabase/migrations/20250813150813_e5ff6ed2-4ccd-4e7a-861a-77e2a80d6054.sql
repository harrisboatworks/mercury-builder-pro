-- Fix security vulnerability in quotes table
-- Add user_id column to associate quotes with users
ALTER TABLE public.quotes ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing quotes to have a user_id (set to NULL for now, will need manual assignment)
-- In production, you'd want to assign these to appropriate users

-- Drop the existing overly broad admin policy and create secure policies
DROP POLICY IF EXISTS "Admins can access all quotes" ON public.quotes;

-- Create secure RLS policies
CREATE POLICY "Users can view their own quotes" 
ON public.quotes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quotes" 
ON public.quotes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quotes" 
ON public.quotes 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quotes" 
ON public.quotes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Admin access policy (recreate with proper permissions)
CREATE POLICY "Admins can access all quotes" 
ON public.quotes 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger to auto-assign user_id on insert
CREATE OR REPLACE FUNCTION public.enforce_quotes_user_id()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER enforce_quotes_user_id_trigger
  BEFORE INSERT OR UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.enforce_quotes_user_id();

-- Add index for performance on user_id lookups
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON public.quotes(user_id);

-- Log this security fix
INSERT INTO public.security_audit_log (user_id, action, table_name, record_id)
VALUES (auth.uid(), 'security_fix_applied', 'quotes', NULL);