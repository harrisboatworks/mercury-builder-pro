
-- 1) finance_settings: allow anonymous read (matches warranty_pricing pattern; values are non-sensitive rates/terms)
DROP POLICY IF EXISTS "Public read access for finance_settings" ON public.finance_settings;
CREATE POLICY "Public read access for finance_settings"
  ON public.finance_settings FOR SELECT
  TO anon, authenticated
  USING (true);
GRANT SELECT ON public.finance_settings TO anon;

-- 2) payments: tighten INSERT WITH CHECK so users cannot attribute records to another person's contact
DROP POLICY IF EXISTS "Users can insert own payments" ON public.payments;
CREATE POLICY "Users can insert own payments"
  ON public.payments FOR INSERT
  TO authenticated
  WITH CHECK (
    (customer_email IS NULL OR customer_email = (auth.jwt() ->> 'email'))
    AND (customer_phone IS NULL OR normalize_phone(customer_phone) = normalize_phone((auth.jwt() ->> 'phone')))
    AND (
      (customer_email IS NOT NULL AND customer_email = (auth.jwt() ->> 'email'))
      OR (customer_phone IS NOT NULL AND normalize_phone(customer_phone) = normalize_phone((auth.jwt() ->> 'phone')))
    )
  );

-- 3) spec-sheets bucket: add admin DELETE policy on storage.objects
DROP POLICY IF EXISTS "Admins can delete spec sheets" ON storage.objects;
CREATE POLICY "Admins can delete spec sheets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'spec-sheets' AND public.has_role(auth.uid(), 'admin'));
