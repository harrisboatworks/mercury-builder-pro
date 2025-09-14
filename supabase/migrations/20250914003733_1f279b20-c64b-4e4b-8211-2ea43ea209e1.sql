-- Comprehensive security fix for all customer data tables
-- This addresses all remaining security vulnerabilities for customer personal information

-- 1. Fix customer_quotes table - strengthen policies further
DROP POLICY IF EXISTS "Admins can access customer quotes for support" ON public.customer_quotes;
DROP POLICY IF EXISTS "Authenticated users can view their own quotes only" ON public.customer_quotes;
DROP POLICY IF EXISTS "Authenticated users can create their own quotes only" ON public.customer_quotes;
DROP POLICY IF EXISTS "Authenticated users can update their own quotes only" ON public.customer_quotes;
DROP POLICY IF EXISTS "Authenticated users can delete their own quotes only" ON public.customer_quotes;

-- Create ultra-secure policies for customer_quotes with explicit role restrictions
CREATE POLICY "Secure admin access to customer quotes"
ON public.customer_quotes
FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Secure user access to own quotes only"
ON public.customer_quotes
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND user_id IS NOT NULL 
  AND auth.uid() = user_id
  AND NOT has_role(auth.uid(), 'anonymous'::app_role)
);

CREATE POLICY "Secure user quote creation"
ON public.customer_quotes
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
  AND NOT has_role(auth.uid(), 'anonymous'::app_role)
);

CREATE POLICY "Secure user quote updates"
ON public.customer_quotes
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND user_id IS NOT NULL 
  AND auth.uid() = user_id
  AND NOT has_role(auth.uid(), 'anonymous'::app_role)
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
  AND NOT has_role(auth.uid(), 'anonymous'::app_role)
);

CREATE POLICY "Secure user quote deletion"
ON public.customer_quotes
FOR DELETE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND user_id IS NOT NULL 
  AND auth.uid() = user_id
  AND NOT has_role(auth.uid(), 'anonymous'::app_role)
);

-- 2. Strengthen quotes table security
DROP POLICY IF EXISTS "Admins can access all quotes" ON public.quotes;
DROP POLICY IF EXISTS "Authenticated users can view their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Authenticated users can create their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Authenticated users can update their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Authenticated users can delete their own quotes" ON public.quotes;

CREATE POLICY "Secure admin access to all quotes"
ON public.quotes
FOR ALL
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Secure user access to own quotes only"
ON public.quotes
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND user_id IS NOT NULL 
  AND auth.uid() = user_id
);

CREATE POLICY "Secure user quote creation only"
ON public.quotes
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

CREATE POLICY "Secure user quote updates only"
ON public.quotes
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND user_id IS NOT NULL 
  AND auth.uid() = user_id
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

CREATE POLICY "Secure user quote deletion only"
ON public.quotes
FOR DELETE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND user_id IS NOT NULL 
  AND auth.uid() = user_id
);

-- 3. Strengthen profiles table security
DROP POLICY IF EXISTS "Enhanced secure profile access" ON public.profiles;
DROP POLICY IF EXISTS "Secure profile insert - authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Secure profile update - authenticated users only" ON public.profiles;

CREATE POLICY "Ultra secure profile access - own profile only"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND user_id IS NOT NULL 
  AND auth.uid() = user_id
);

CREATE POLICY "Ultra secure profile creation - own profile only"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

CREATE POLICY "Ultra secure profile updates - own profile only"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND user_id IS NOT NULL 
  AND auth.uid() = user_id
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

-- 4. Create security audit function for customer data access
CREATE OR REPLACE FUNCTION public.audit_customer_data_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log any access to customer data for security monitoring
  INSERT INTO public.security_audit_log (
    user_id, 
    action, 
    table_name, 
    record_id,
    created_at
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    now()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Add audit triggers for customer data tables
CREATE TRIGGER audit_customer_quotes_access
  AFTER SELECT OR INSERT OR UPDATE OR DELETE ON public.customer_quotes
  FOR EACH ROW EXECUTE FUNCTION public.audit_customer_data_access();

CREATE TRIGGER audit_quotes_access
  AFTER SELECT OR INSERT OR UPDATE OR DELETE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.audit_customer_data_access();

CREATE TRIGGER audit_profiles_access
  AFTER SELECT OR INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_customer_data_access();