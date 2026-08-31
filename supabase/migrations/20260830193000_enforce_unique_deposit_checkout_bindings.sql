-- A motor reservation may have only one durable Stripe checkout binding.
-- This is additive and deliberately fails closed if historical duplicates
-- require owner review; it never deletes or rewrites a customer record.
CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_quotes_deposit_saved_quote
  ON public.customer_quotes ((quote_data ->> 'saved_quote_id'))
  WHERE lead_source = 'deposit'
    AND coalesce(quote_data ->> 'saved_quote_id', '') <> '';

CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_quotes_deposit_stripe_session
  ON public.customer_quotes ((quote_data ->> 'stripe_session_id'))
  WHERE lead_source = 'deposit'
    AND coalesce(quote_data ->> 'stripe_session_id', '') <> '';

-- The Edge Function calls this before any Stripe API. Deploying the function
-- before this migration therefore fails closed instead of opening a race.
CREATE OR REPLACE FUNCTION public.deposit_checkout_binding_authority_ready()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = pg_catalog, public
AS $$
  SELECT
    to_regclass('public.uq_customer_quotes_deposit_saved_quote') IS NOT NULL
    AND to_regclass('public.uq_customer_quotes_deposit_stripe_session') IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.deposit_checkout_binding_authority_ready() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.deposit_checkout_binding_authority_ready() TO service_role;
