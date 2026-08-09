-- Guest quote saves are created before magic-link authentication, so link
-- confirmed rows to the authenticated account before My Quotes reads them.
-- Verify the email against auth.users rather than user-editable JWT metadata.
CREATE OR REPLACE FUNCTION public.claim_saved_quotes_for_current_user()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  requester_id uuid := auth.uid();
  requester_email text;
  claimed_count integer := 0;
BEGIN
  IF requester_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT pg_catalog.lower(user_record.email)
  INTO requester_email
  FROM auth.users AS user_record
  WHERE user_record.id = requester_id
    AND user_record.email_confirmed_at IS NOT NULL;

  IF requester_email IS NULL THEN
    RETURN 0;
  END IF;

  UPDATE public.saved_quotes
  SET
    user_id = requester_id,
    updated_at = pg_catalog.now()
  WHERE user_id IS NULL
    AND COALESCE(is_soft_lead, false) IS FALSE
    AND pg_catalog.lower(email) = requester_email;

  GET DIAGNOSTICS claimed_count = ROW_COUNT;
  RETURN claimed_count;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_saved_quotes_for_current_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_saved_quotes_for_current_user() TO authenticated;

-- Keep the existing public saved-quote creation path, including its current
-- soft-lead behavior, but never let an anonymous caller assign a row to an
-- arbitrary account. A restrictive policy composes with the soft-lead RPC
-- migration regardless of merge order instead of replacing its permissive
-- INSERT policy.
DROP POLICY IF EXISTS "Saved quote inserts cannot assign another user" ON public.saved_quotes;
CREATE POLICY "Saved quote inserts cannot assign another user"
ON public.saved_quotes
AS RESTRICTIVE
FOR INSERT
TO public
WITH CHECK (user_id IS NULL OR user_id = (SELECT auth.uid()));

-- Ownership is now materialized as user_id by the claim function. Remove the
-- non-functional email_verified JWT fallback and keep ordinary reads/updates
-- fail-closed on explicit ownership.
DROP POLICY IF EXISTS "Users can view own saved quotes" ON public.saved_quotes;
DROP POLICY IF EXISTS "Users can update own saved quotes" ON public.saved_quotes;

CREATE POLICY "Users can view own saved quotes"
ON public.saved_quotes
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own saved quotes"
ON public.saved_quotes
FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

COMMENT ON FUNCTION public.claim_saved_quotes_for_current_user() IS
  'Claims non-soft saved quotes whose confirmed auth.users email matches the current user; returns only the claimed row count.';
