-- Tighten saved_quotes SELECT/UPDATE: prefer user_id ownership; only fall back to email when user_id is NULL
DROP POLICY IF EXISTS "Users can view own saved quotes" ON public.saved_quotes;
DROP POLICY IF EXISTS "Users can update own saved quotes" ON public.saved_quotes;

CREATE POLICY "Users can view own saved quotes"
ON public.saved_quotes
FOR SELECT
TO authenticated
USING (
  (user_id IS NOT NULL AND user_id = auth.uid())
  OR (
    user_id IS NULL
    AND email IS NOT NULL
    AND lower(email) = lower(auth.jwt() ->> 'email')
    AND coalesce((auth.jwt() ->> 'email_verified')::boolean, false) = true
  )
);

CREATE POLICY "Users can update own saved quotes"
ON public.saved_quotes
FOR UPDATE
TO authenticated
USING (
  (user_id IS NOT NULL AND user_id = auth.uid())
  OR (
    user_id IS NULL
    AND email IS NOT NULL
    AND lower(email) = lower(auth.jwt() ->> 'email')
    AND coalesce((auth.jwt() ->> 'email_verified')::boolean, false) = true
  )
);