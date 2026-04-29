
-- 1) Remove public read on motor_custom_sources (admins still have full access via existing policy)
DROP POLICY IF EXISTS "Public read access for motor custom sources" ON public.motor_custom_sources;

-- 2) Restrict payments policies to authenticated role only
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments"
ON public.payments
FOR SELECT
TO authenticated
USING (
  ((customer_email IS NOT NULL) AND (customer_email = (auth.jwt() ->> 'email')))
  OR ((customer_phone IS NOT NULL) AND (normalize_phone(customer_phone) = normalize_phone((auth.jwt() ->> 'phone'))))
);

DROP POLICY IF EXISTS "Users can insert own payments" ON public.payments;
CREATE POLICY "Users can insert own payments"
ON public.payments
FOR INSERT
TO authenticated
WITH CHECK (
  ((customer_email IS NOT NULL) AND (customer_email = (auth.jwt() ->> 'email')))
  OR ((customer_phone IS NOT NULL) AND (normalize_phone(customer_phone) = normalize_phone((auth.jwt() ->> 'phone'))))
);
