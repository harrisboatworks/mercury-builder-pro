-- Ensure pgcrypto is available (usually already enabled by Supabase).
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Replace encrypt_sin with a pgcrypto-based implementation that reads its
-- passphrase from Vault. SECURITY DEFINER runs as postgres, which has access
-- to vault.decrypted_secrets and to extensions.pgp_sym_encrypt.
CREATE OR REPLACE FUNCTION public.encrypt_sin(sin_plaintext text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, vault
AS $function$
DECLARE
  passphrase text;
  cipher bytea;
BEGIN
  SELECT decrypted_secret INTO passphrase
  FROM vault.decrypted_secrets
  WHERE name = 'sin-encryption-key'
  LIMIT 1;

  IF passphrase IS NULL OR length(passphrase) = 0 THEN
    RAISE EXCEPTION 'SIN encryption key not configured in Vault';
  END IF;

  cipher := extensions.pgp_sym_encrypt(sin_plaintext, passphrase);
  RETURN encode(cipher, 'base64');
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'SIN encryption failed: %', SQLERRM;
END;
$function$;

-- Same treatment for decrypt_sin. Admin-gated (existing application code
-- enforces this with a Unauthorized check), and we keep that behavior.
CREATE OR REPLACE FUNCTION public.decrypt_sin(sin_encrypted text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, vault
AS $function$
DECLARE
  passphrase text;
  is_admin boolean;
BEGIN
  SELECT public.has_role(auth.uid(), 'admin'::app_role) INTO is_admin;
  IF NOT COALESCE(is_admin, false) THEN
    RAISE EXCEPTION 'Unauthorized: only admins can decrypt SIN data';
  END IF;

  SELECT decrypted_secret INTO passphrase
  FROM vault.decrypted_secrets
  WHERE name = 'sin-encryption-key'
  LIMIT 1;

  IF passphrase IS NULL OR length(passphrase) = 0 THEN
    RAISE EXCEPTION 'SIN encryption key not configured in Vault';
  END IF;

  RETURN extensions.pgp_sym_decrypt(decode(sin_encrypted, 'base64'), passphrase);
END;
$function$;

-- Re-grant EXECUTE so anon and authenticated can call encrypt_sin via PostgREST.
REVOKE ALL ON FUNCTION public.encrypt_sin(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.encrypt_sin(text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.decrypt_sin(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decrypt_sin(text) TO authenticated;