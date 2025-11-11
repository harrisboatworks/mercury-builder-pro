-- Phase D.5: Security Hardening - Fix database function search paths
-- Add explicit search_path to all security-sensitive functions

-- Fix format_horsepower function
CREATE OR REPLACE FUNCTION public.format_horsepower(hp numeric)
RETURNS text
LANGUAGE sql
IMMUTABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN hp = trunc(hp) THEN trunc(hp)::text
    ELSE hp::text
  END;
$$;

-- Fix format_motor_display_name function
CREATE OR REPLACE FUNCTION public.format_motor_display_name(model_name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF model_name IS NULL OR trim(model_name) = '' THEN
    RETURN '';
  END IF;
  
  RETURN regexp_replace(
    trim(model_name),
    '(\d+(?:\.\d+)?)(MH|MLH|MXLH|MXL|MXXL|ELH|ELPT|ELHPT|EXLPT|EH|XL|XXL|CT|DTS|L|CL|M|JPO)\M',
    '\1 \2',
    'g'
  );
END;
$$;

-- Fix get_motor_operating_specs function
CREATE OR REPLACE FUNCTION public.get_motor_operating_specs(hp numeric, motor_type text DEFAULT 'Outboard'::text, specifications jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  RETURN jsonb_build_object(
    'fuelConsumption', 
    COALESCE(
      specifications->>'fuelConsumption',
      CASE 
        WHEN hp <= 6 THEN '0.5-1.0 gal/hr @ cruise'
        WHEN hp <= 15 THEN '1.0-2.0 gal/hr @ cruise'
        WHEN hp <= 30 THEN '2.0-3.5 gal/hr @ cruise'
        WHEN hp <= 60 THEN '4.0-6.0 gal/hr @ cruise'
        WHEN hp <= 90 THEN '6.5-9.0 gal/hr @ cruise'
        WHEN hp <= 115 THEN '8.5-11.0 gal/hr @ cruise'
        WHEN hp <= 150 THEN '11.0-15.0 gal/hr @ cruise'
        ELSE '15+ gal/hr @ cruise'
      END
    ),
    'soundLevel',
    COALESCE(
      specifications->>'soundLevel',
      CASE
        WHEN hp <= 6 THEN '55 dB @ idle, 75 dB @ WOT'
        WHEN hp <= 15 THEN '58 dB @ idle, 78 dB @ WOT'
        WHEN hp <= 30 THEN '60 dB @ idle, 80 dB @ WOT'
        WHEN hp <= 60 THEN '62 dB @ idle, 82 dB @ WOT'
        WHEN hp <= 90 THEN '64 dB @ idle, 84 dB @ WOT'
        WHEN hp <= 115 THEN '66 dB @ idle, 86 dB @ WOT'
        WHEN hp <= 150 THEN '68 dB @ idle, 88 dB @ WOT'
        ELSE '70 dB @ idle, 90 dB @ WOT'
      END
    ),
    'recommendedBoatSize',
    COALESCE(
      specifications->>'recommendedBoatSize',
      CASE
        WHEN hp <= 6 THEN 'Up to 12 ft'
        WHEN hp <= 15 THEN '12-16 ft'
        WHEN hp <= 30 THEN '14-18 ft'
        WHEN hp <= 60 THEN '16-20 ft'
        WHEN hp <= 90 THEN '18-22 ft'
        WHEN hp <= 115 THEN '20-24 ft'
        WHEN hp <= 150 THEN '22-26 ft'
        WHEN hp <= 200 THEN '24-28 ft'
        ELSE '26+ ft'
      END
    ),
    'maxBoatWeight',
    COALESCE(
      specifications->>'maxBoatWeight',
      CASE
        WHEN hp <= 6 THEN '1,200 lbs'
        WHEN hp <= 15 THEN '2,500 lbs'
        WHEN hp <= 30 THEN '3,500 lbs'
        WHEN hp <= 60 THEN '5,000 lbs'
        WHEN hp <= 90 THEN '6,500 lbs'
        WHEN hp <= 115 THEN '8,000 lbs'
        WHEN hp <= 150 THEN '10,000 lbs'
        WHEN hp <= 200 THEN '12,000 lbs'
        ELSE '15,000+ lbs'
      END
    )
  );
END;
$$;

-- Fix validate_mercury_model_number function
CREATE OR REPLACE FUNCTION public.validate_mercury_model_number(model_number text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE 
    WHEN model_number IS NULL THEN false
    WHEN model_number ~ '^1[A-C][0-9A-Z]+[A-Z]K$' THEN true
    ELSE false
  END;
$$;

-- Fix validate_customer_data_ownership function
CREATE OR REPLACE FUNCTION public.validate_customer_data_ownership(table_name text, record_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    auth.uid() IS NOT NULL AND
    record_user_id IS NOT NULL AND
    (auth.uid() = record_user_id OR has_role(auth.uid(), 'admin'::app_role))
  );
END;
$$;

-- Fix validate_customer_quote_access function
CREATE OR REPLACE FUNCTION public.validate_customer_quote_access(quote_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  quote_owner uuid;
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  SELECT user_id INTO quote_owner 
  FROM public.customer_quotes 
  WHERE id = quote_id;
  
  RETURN (
    quote_owner = current_user_id OR 
    has_role(current_user_id, 'admin'::app_role)
  );
END;
$$;

-- Add audit logging for SIN decryption attempts
CREATE TABLE IF NOT EXISTS public.sin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL, -- 'decrypt_attempt', 'decrypt_success', 'decrypt_denied'
  application_id uuid,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on sin_audit_log
ALTER TABLE public.sin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view SIN audit logs
CREATE POLICY "Admins can view SIN audit logs"
ON public.sin_audit_log
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert SIN audit logs
CREATE POLICY "System can insert SIN audit logs"
ON public.sin_audit_log
FOR INSERT
WITH CHECK (true);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_sin_audit_log_user_id ON public.sin_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_sin_audit_log_created_at ON public.sin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sin_audit_log_application_id ON public.sin_audit_log(application_id);

-- Update decrypt_sin function to add audit logging
CREATE OR REPLACE FUNCTION public.decrypt_sin(sin_encrypted text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  key_id UUID;
  decrypted_value BYTEA;
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  -- Log decrypt attempt
  INSERT INTO public.sin_audit_log (user_id, action, created_at)
  VALUES (current_user_id, 'decrypt_attempt', now());
  
  -- Only admins can decrypt SINs
  IF NOT public.has_role(current_user_id, 'admin'::app_role) THEN
    -- Log denied attempt
    INSERT INTO public.sin_audit_log (user_id, action, created_at)
    VALUES (current_user_id, 'decrypt_denied', now());
    
    RAISE EXCEPTION 'Unauthorized: Only admins can decrypt SIN data';
  END IF;
  
  -- Get the key ID
  key_id := public.get_sin_encryption_key();
  
  IF key_id IS NULL THEN
    RAISE EXCEPTION 'SIN encryption key not found';
  END IF;
  
  -- Decrypt the SIN
  decrypted_value := pgsodium.crypto_aead_det_decrypt(
    decode(sin_encrypted, 'base64'),
    NULL,
    key_id
  );
  
  -- Log successful decryption
  INSERT INTO public.sin_audit_log (user_id, action, created_at)
  VALUES (current_user_id, 'decrypt_success', now());
  
  -- Return as text
  RETURN convert_from(decrypted_value, 'UTF8');
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'SIN decryption failed: %', SQLERRM;
END;
$$;

-- Add data retention policy tracking
CREATE TABLE IF NOT EXISTS public.data_retention_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL UNIQUE,
  retention_days integer NOT NULL,
  description text,
  enabled boolean NOT NULL DEFAULT true,
  last_cleanup_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.data_retention_policies ENABLE ROW LEVEL SECURITY;

-- Only admins can manage retention policies
CREATE POLICY "Admins can manage retention policies"
ON public.data_retention_policies
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default retention policies
INSERT INTO public.data_retention_policies (table_name, retention_days, description)
VALUES 
  ('financing_applications', 2555, 'Keep financing applications for 7 years per financial regulations'),
  ('security_audit_log', 2555, 'Keep security logs for 7 years for compliance'),
  ('sin_audit_log', 2555, 'Keep SIN access logs for 7 years for PIPEDA compliance'),
  ('customer_quotes', 1095, 'Keep customer quotes for 3 years'),
  ('contact_inquiries', 730, 'Keep contact inquiries for 2 years')
ON CONFLICT (table_name) DO NOTHING;

-- Function to cleanup old data based on retention policies
CREATE OR REPLACE FUNCTION public.cleanup_old_data()
RETURNS TABLE(table_name text, records_deleted integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  policy RECORD;
  deleted_count integer;
  cutoff_date timestamptz;
BEGIN
  FOR policy IN 
    SELECT * FROM public.data_retention_policies WHERE enabled = true
  LOOP
    deleted_count := 0;
    cutoff_date := now() - (policy.retention_days || ' days')::interval;
    
    CASE policy.table_name
      WHEN 'financing_applications' THEN
        DELETE FROM public.financing_applications 
        WHERE created_at < cutoff_date 
          AND status IN ('declined', 'withdrawn')
          AND deleted_at IS NOT NULL;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        
      WHEN 'security_audit_log' THEN
        DELETE FROM public.security_audit_log 
        WHERE created_at < cutoff_date;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        
      WHEN 'sin_audit_log' THEN
        DELETE FROM public.sin_audit_log 
        WHERE created_at < cutoff_date;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        
      WHEN 'customer_quotes' THEN
        DELETE FROM public.customer_quotes 
        WHERE created_at < cutoff_date
          AND lead_status IN ('lost', 'inactive');
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        
      WHEN 'contact_inquiries' THEN
        DELETE FROM public.contact_inquiries 
        WHERE created_at < cutoff_date
          AND status = 'resolved';
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
    END CASE;
    
    -- Update last cleanup timestamp
    UPDATE public.data_retention_policies 
    SET last_cleanup_at = now() 
    WHERE id = policy.id;
    
    RETURN QUERY SELECT policy.table_name, deleted_count;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.cleanup_old_data() IS 'Automatically cleanup old data based on retention policies. Run via cron job.';
