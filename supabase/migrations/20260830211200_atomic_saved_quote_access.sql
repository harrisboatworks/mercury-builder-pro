-- Public share reads use the service role, but the counter still needs a
-- single database statement so concurrent opens cannot overwrite each other.
CREATE OR REPLACE FUNCTION public.increment_saved_quote_access(p_quote_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  UPDATE public.saved_quotes
  SET
    access_count = COALESCE(access_count, 0) + 1,
    last_accessed = now()
  WHERE id = p_quote_id
    AND COALESCE(is_soft_lead, false) = false
    AND expires_at > now();
$$;

REVOKE ALL ON FUNCTION public.increment_saved_quote_access(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_saved_quote_access(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.increment_saved_quote_access(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.increment_saved_quote_access(uuid) TO service_role;
