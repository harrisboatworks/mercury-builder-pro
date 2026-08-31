-- Keep the Dropbox OAuth token encrypted in Supabase Vault and accessible only
-- through service-role Edge Functions. Browser clients never receive the token.

CREATE OR REPLACE FUNCTION public.store_dropbox_oauth_token(p_token jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  existing_id uuid;
BEGIN
  IF p_token IS NULL OR COALESCE(p_token->>'access_token', '') = '' THEN
    RAISE EXCEPTION 'Dropbox access token is required';
  END IF;

  SELECT id INTO existing_id
  FROM vault.secrets
  WHERE name = 'dropbox-oauth-token'
  LIMIT 1;

  IF existing_id IS NULL THEN
    PERFORM vault.create_secret(
      p_token::text,
      'dropbox-oauth-token',
      'Server-side Dropbox OAuth token for HBW admin media imports'
    );
  ELSE
    PERFORM vault.update_secret(
      existing_id,
      p_token::text,
      'dropbox-oauth-token',
      'Server-side Dropbox OAuth token for HBW admin media imports'
    );
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_dropbox_oauth_token()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT decrypted_secret::jsonb
  FROM vault.decrypted_secrets
  WHERE name = 'dropbox-oauth-token'
  LIMIT 1;
$function$;

REVOKE ALL ON FUNCTION public.store_dropbox_oauth_token(jsonb) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_dropbox_oauth_token() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.store_dropbox_oauth_token(jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_dropbox_oauth_token() TO service_role;
