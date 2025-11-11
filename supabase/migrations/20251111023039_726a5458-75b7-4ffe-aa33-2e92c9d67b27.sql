-- Drop the old get_sin_encryption_key function (no longer needed)
DROP FUNCTION IF EXISTS public.get_sin_encryption_key();

-- Update encrypt_sin to use Vault secret directly
CREATE OR REPLACE FUNCTION public.encrypt_sin(sin_plaintext text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  key_id UUID;
  encrypted_value BYTEA;
BEGIN
  -- Get the encryption key UUID from Vault
  SELECT id INTO key_id
  FROM vault.secrets
  WHERE name = 'sin-encryption-key'
  LIMIT 1;
  
  IF key_id IS NULL THEN
    RAISE EXCEPTION 'SIN encryption key not found in Vault';
  END IF;
  
  -- Encrypt the SIN using deterministic encryption with Vault key
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
$function$;

-- Update decrypt_sin to use Vault secret directly
CREATE OR REPLACE FUNCTION public.decrypt_sin(sin_encrypted text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  
  -- Get the encryption key UUID from Vault
  SELECT id INTO key_id
  FROM vault.secrets
  WHERE name = 'sin-encryption-key'
  LIMIT 1;
  
  IF key_id IS NULL THEN
    RAISE EXCEPTION 'SIN encryption key not found in Vault';
  END IF;
  
  -- Decrypt the SIN using Vault key
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
    -- Log failed decryption (but don't expose error details to non-admins)
    INSERT INTO public.sin_audit_log (user_id, action, created_at)
    VALUES (current_user_id, 'decrypt_failed', now());
    
    RAISE EXCEPTION 'SIN decryption failed: %', SQLERRM;
END;
$function$;