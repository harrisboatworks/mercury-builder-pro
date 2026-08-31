-- Guest quote saves are created before magic-link authentication, so link
-- confirmed rows to the authenticated account before My Quotes reads them.
-- Verify the email against auth.users rather than relying on a non-standard
-- email_verified JWT claim.
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

  -- A single conditional update is idempotent and race-safe. Repeated or
  -- concurrent calls can only claim rows that are still unowned.
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

REVOKE ALL ON FUNCTION public.claim_saved_quotes_for_current_user()
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_saved_quotes_for_current_user() TO authenticated;

-- Match the claim predicate so reconciliation does not scan historical owned
-- or soft-lead rows as saved_quotes grows.
CREATE INDEX IF NOT EXISTS idx_saved_quotes_claimable_email
ON public.saved_quotes (pg_catalog.lower(email))
WHERE user_id IS NULL
  AND COALESCE(is_soft_lead, false) IS FALSE;

-- Keep the existing public saved-quote creation path, including its current
-- soft-lead behavior, but never let a public caller assign a row to another
-- account. This restrictive policy composes with PR #283's permissive insert
-- policy regardless of landing order; service-role operations still bypass RLS.
DROP POLICY IF EXISTS "Saved quote inserts cannot assign another user" ON public.saved_quotes;
CREATE POLICY "Saved quote inserts cannot assign another user"
ON public.saved_quotes
AS RESTRICTIVE
FOR INSERT
TO public
WITH CHECK (user_id IS NULL OR user_id = (SELECT auth.uid()));

-- This is the expand-compatible phase. Do not replace the historical
-- saved_quotes SELECT/UPDATE policies here: cached clients from before this
-- RPC still use the direct guest-row UPDATE during their OAuth callback.
-- Owner-only SELECT/UPDATE tightening belongs in a separately staged migration
-- after those clients have aged out and the RPC-enabled bundle is established.

COMMENT ON FUNCTION public.claim_saved_quotes_for_current_user() IS
  'Claims non-soft saved quotes whose confirmed auth.users email matches the current user; returns only the claimed row count.';
