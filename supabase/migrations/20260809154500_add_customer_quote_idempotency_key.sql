ALTER TABLE public.customer_quotes
  ADD COLUMN IF NOT EXISTS idempotency_key text;

-- PostgreSQL UNIQUE indexes allow multiple NULL values, so existing and
-- non-idempotent lead paths remain unchanged while one explicit business key
-- can create at most one CRM row.
CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_quotes_idempotency_key
  ON public.customer_quotes (idempotency_key);
