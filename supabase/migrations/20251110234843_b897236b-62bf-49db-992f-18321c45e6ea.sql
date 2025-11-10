-- Part 1: SIN Encryption with pgsodium (Fixed)
-- Enable pgsodium extension for encryption
CREATE EXTENSION IF NOT EXISTS pgsodium;

-- Create a function to get or create the SIN encryption key
CREATE OR REPLACE FUNCTION public.get_sin_encryption_key()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  key_id UUID;
BEGIN
  -- Try to get existing key
  SELECT id INTO key_id
  FROM pgsodium.key
  WHERE name = 'sin-encryption-key'
  LIMIT 1;
  
  -- If no key exists, create one
  IF key_id IS NULL THEN
    INSERT INTO pgsodium.key (name, status, key_type, key_context)
    VALUES ('sin-encryption-key', 'valid', 'aead-det', 'public')
    RETURNING id INTO key_id;
  END IF;
  
  RETURN key_id;
END;
$$;

-- Create function to encrypt SIN using pgsodium
CREATE OR REPLACE FUNCTION public.encrypt_sin(sin_plaintext TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  key_id UUID;
  encrypted_value BYTEA;
BEGIN
  -- Get or create the key
  key_id := public.get_sin_encryption_key();
  
  IF key_id IS NULL THEN
    RAISE EXCEPTION 'Failed to get or create SIN encryption key';
  END IF;
  
  -- Encrypt the SIN using deterministic encryption
  encrypted_value := pgsodium.crypto_aead_det_encrypt(
    sin_plaintext::BYTEA,
    NULL, -- No additional data
    key_id
  );
  
  -- Return as base64 encoded string for storage
  RETURN encode(encrypted_value, 'base64');
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'SIN encryption failed: %', SQLERRM;
END;
$$;

-- Create function to decrypt SIN (admin only)
CREATE OR REPLACE FUNCTION public.decrypt_sin(sin_encrypted TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  key_id UUID;
  decrypted_value BYTEA;
BEGIN
  -- Only admins can decrypt SINs
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
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
    NULL, -- No additional data
    key_id
  );
  
  -- Return as text
  RETURN convert_from(decrypted_value, 'UTF8');
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'SIN decryption failed: %', SQLERRM;
END;
$$;

-- Part 3: Performance Optimization - Add Database Indexes
-- Add index on resume_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_financing_applications_resume_token 
ON public.financing_applications(resume_token)
WHERE resume_token IS NOT NULL;

-- Add index on status for admin filters
CREATE INDEX IF NOT EXISTS idx_financing_applications_status 
ON public.financing_applications(status);

-- Add index on user_id for user queries
CREATE INDEX IF NOT EXISTS idx_financing_applications_user_id 
ON public.financing_applications(user_id)
WHERE user_id IS NOT NULL;

-- Add index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_financing_applications_created_at 
ON public.financing_applications(created_at DESC);

-- Add GIN index on applicant_data for email search
CREATE INDEX IF NOT EXISTS idx_financing_applications_applicant_email 
ON public.financing_applications USING GIN ((applicant_data->'email'));

-- Part 5: Admin Enhancements - Add status history tracking
CREATE TABLE IF NOT EXISTS public.financing_application_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.financing_applications(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on status history
ALTER TABLE public.financing_application_status_history ENABLE ROW LEVEL SECURITY;

-- Only admins can view status history
CREATE POLICY "Admins can view status history"
ON public.financing_application_status_history
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert status history
CREATE POLICY "Admins can insert status history"
ON public.financing_application_status_history
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Add index on application_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_status_history_application_id 
ON public.financing_application_status_history(application_id);

-- Create trigger to automatically log status changes
CREATE OR REPLACE FUNCTION public.log_financing_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.financing_application_status_history (
      application_id,
      old_status,
      new_status,
      changed_by,
      notes
    ) VALUES (
      NEW.id,
      OLD.status::TEXT,
      NEW.status::TEXT,
      auth.uid(),
      'Status updated'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on financing_applications table
DROP TRIGGER IF EXISTS financing_status_change_trigger ON public.financing_applications;
CREATE TRIGGER financing_status_change_trigger
  AFTER UPDATE ON public.financing_applications
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.log_financing_status_change();