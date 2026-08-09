-- A motor reservation may have only one durable Stripe checkout binding.
-- General deposits intentionally have no saved_quote_id and are unaffected.
CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_quotes_deposit_saved_quote
  ON public.customer_quotes ((quote_data ->> 'saved_quote_id'))
  WHERE lead_source = 'deposit'
    AND coalesce(quote_data ->> 'saved_quote_id', '') <> '';

CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_quotes_deposit_stripe_session
  ON public.customer_quotes ((quote_data ->> 'stripe_session_id'))
  WHERE lead_source = 'deposit'
    AND coalesce(quote_data ->> 'stripe_session_id', '') <> '';
