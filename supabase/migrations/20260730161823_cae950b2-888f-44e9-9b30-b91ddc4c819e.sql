ALTER VIEW public.open_service_board SET (security_invoker = on);

DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments"
ON public.payments
FOR SELECT
TO authenticated
USING (
  (
    customer_email IS NOT NULL
    AND lower(customer_email) = lower(auth.jwt() ->> 'email')
    AND COALESCE((auth.jwt() ->> 'email_verified')::boolean, false) = true
  )
  OR (
    customer_phone IS NOT NULL
    AND normalize_phone(customer_phone) = normalize_phone(auth.jwt() ->> 'phone')
    AND COALESCE((auth.jwt() ->> 'phone_verified')::boolean, false) = true
  )
);

DROP POLICY IF EXISTS "Users can insert own payments" ON public.payments;
CREATE POLICY "Users can insert own payments"
ON public.payments
FOR INSERT
TO authenticated
WITH CHECK (
  (
    customer_email IS NULL
    OR (
      lower(customer_email) = lower(auth.jwt() ->> 'email')
      AND COALESCE((auth.jwt() ->> 'email_verified')::boolean, false) = true
    )
  )
  AND (
    customer_phone IS NULL
    OR (
      normalize_phone(customer_phone) = normalize_phone(auth.jwt() ->> 'phone')
      AND COALESCE((auth.jwt() ->> 'phone_verified')::boolean, false) = true
    )
  )
  AND (
    (
      customer_email IS NOT NULL
      AND lower(customer_email) = lower(auth.jwt() ->> 'email')
      AND COALESCE((auth.jwt() ->> 'email_verified')::boolean, false) = true
    )
    OR (
      customer_phone IS NOT NULL
      AND normalize_phone(customer_phone) = normalize_phone(auth.jwt() ->> 'phone')
      AND COALESCE((auth.jwt() ->> 'phone_verified')::boolean, false) = true
    )
  )
);