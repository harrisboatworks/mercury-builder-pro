-- Stripe-bound quote rows carry provider identity and notification state. Once
-- a checkout session is bound, ordinary owners must not be able to rewrite or
-- delete that server-managed authority through the Data API. Pre-checkout
-- owner workflows remain unchanged, while existing admin policies and the
-- service-role Edge Functions retain their intended access.

DROP POLICY IF EXISTS "Stripe-bound customer quotes are service-managed on update"
ON public.customer_quotes;
CREATE POLICY "Stripe-bound customer quotes are service-managed on update"
ON public.customer_quotes
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (
  public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  OR COALESCE(quote_data ->> 'stripe_session_id', '') = ''
)
WITH CHECK (
  public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  OR COALESCE(quote_data ->> 'stripe_session_id', '') = ''
);

DROP POLICY IF EXISTS "Stripe-bound customer quotes are service-managed on delete"
ON public.customer_quotes;
CREATE POLICY "Stripe-bound customer quotes are service-managed on delete"
ON public.customer_quotes
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (
  public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  OR COALESCE(quote_data ->> 'stripe_session_id', '') = ''
);

DROP POLICY IF EXISTS "Stripe-bound quotes are service-managed on update"
ON public.quotes;
CREATE POLICY "Stripe-bound quotes are service-managed on update"
ON public.quotes
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (
  public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  OR COALESCE(quote_data ->> 'stripe_session_id', '') = ''
)
WITH CHECK (
  public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  OR COALESCE(quote_data ->> 'stripe_session_id', '') = ''
);

DROP POLICY IF EXISTS "Stripe-bound quotes are service-managed on delete"
ON public.quotes;
CREATE POLICY "Stripe-bound quotes are service-managed on delete"
ON public.quotes
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (
  public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
  OR COALESCE(quote_data ->> 'stripe_session_id', '') = ''
);
