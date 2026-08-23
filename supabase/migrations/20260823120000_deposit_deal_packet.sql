-- Deposit deal packet: promote customer identity/address and Stripe join
-- columns, and track per-audience confirmation email deliveries. Historical
-- rows stay nullable; completeness is enforced at the application boundary.

ALTER TABLE public.saved_quotes
  ADD COLUMN IF NOT EXISTS customer_full_name text,
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS customer_address_line1 text,
  ADD COLUMN IF NOT EXISTS customer_address_line2 text,
  ADD COLUMN IF NOT EXISTS customer_city text,
  ADD COLUMN IF NOT EXISTS customer_region text,
  ADD COLUMN IF NOT EXISTS customer_postal_code text,
  ADD COLUMN IF NOT EXISTS customer_country text;

COMMENT ON COLUMN public.saved_quotes.customer_full_name IS
  'Submitted customer full name collected before Stripe checkout.';
COMMENT ON COLUMN public.saved_quotes.customer_address_line1 IS
  'Submitted contact address line 1. Authoritative over Stripe billing.';
COMMENT ON COLUMN public.saved_quotes.customer_country IS
  'Submitted contact country. UI defaults to Canada; other countries remain valid.';

ALTER TABLE public.customer_quotes
  ADD COLUMN IF NOT EXISTS saved_quote_id uuid REFERENCES public.saved_quotes(id),
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS payment_status text,
  ADD COLUMN IF NOT EXISTS payment_paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS customer_address_line1 text,
  ADD COLUMN IF NOT EXISTS customer_address_line2 text,
  ADD COLUMN IF NOT EXISTS customer_city text,
  ADD COLUMN IF NOT EXISTS customer_region text,
  ADD COLUMN IF NOT EXISTS customer_postal_code text,
  ADD COLUMN IF NOT EXISTS customer_country text,
  ADD COLUMN IF NOT EXISTS stripe_billing_address jsonb;

COMMENT ON COLUMN public.customer_quotes.saved_quote_id IS
  'Stable deal-packet join to saved_quotes.id for motor deposits.';
COMMENT ON COLUMN public.customer_quotes.stripe_billing_address IS
  'Stripe Checkout billing address stored as labelled payment context only.';
COMMENT ON COLUMN public.customer_quotes.payment_status IS
  'Server-authoritative deposit payment state after Stripe webhook or admin recovery. Not backfilled from customer-editable quote_data.';

CREATE UNIQUE INDEX IF NOT EXISTS customer_quotes_one_deposit_per_saved_quote
  ON public.customer_quotes (saved_quote_id)
  WHERE saved_quote_id IS NOT NULL AND lead_source = 'deposit';

CREATE UNIQUE INDEX IF NOT EXISTS customer_quotes_one_row_per_checkout_session
  ON public.customer_quotes (stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS customer_quotes_saved_quote_id_idx
  ON public.customer_quotes (saved_quote_id)
  WHERE saved_quote_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.deposit_email_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_quote_id uuid NOT NULL REFERENCES public.customer_quotes(id) ON DELETE CASCADE,
  saved_quote_id uuid NOT NULL REFERENCES public.saved_quotes(id) ON DELETE CASCADE,
  audience text NOT NULL CHECK (audience IN ('customer', 'hbw', 'grok_bot')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
  provider_id text,
  attempt_count integer NOT NULL DEFAULT 0,
  last_error text,
  last_attempted_at timestamptz,
  sent_at timestamptz,
  claim_token uuid,
  claim_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (customer_quote_id, audience)
);

COMMENT ON TABLE public.deposit_email_deliveries IS
  'Per-audience Resend delivery state for a paid motor deposit. Service-role writes only.';

CREATE INDEX IF NOT EXISTS deposit_email_deliveries_saved_quote_id_idx
  ON public.deposit_email_deliveries (saved_quote_id);

ALTER TABLE public.deposit_email_deliveries ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.deposit_email_deliveries FROM PUBLIC, anon;
GRANT SELECT ON TABLE public.deposit_email_deliveries TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.deposit_email_deliveries TO service_role;

DROP POLICY IF EXISTS "Admins can read deposit email deliveries"
  ON public.deposit_email_deliveries;
CREATE POLICY "Admins can read deposit email deliveries"
  ON public.deposit_email_deliveries
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX IF NOT EXISTS deposit_email_deliveries_sending_claim_idx
  ON public.deposit_email_deliveries (claim_expires_at)
  WHERE status = 'sending';

CREATE OR REPLACE FUNCTION public.claim_deposit_email_delivery(
  p_customer_quote_id uuid,
  p_audience text,
  p_claim_token uuid,
  p_lease_seconds integer DEFAULT 120
)
RETURNS public.deposit_email_deliveries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  claimed public.deposit_email_deliveries;
  lease_seconds integer;
BEGIN
  IF p_audience NOT IN ('customer', 'hbw', 'grok_bot') THEN
    RAISE EXCEPTION 'invalid deposit email audience';
  END IF;
  IF p_claim_token IS NULL THEN
    RAISE EXCEPTION 'claim token is required';
  END IF;
  lease_seconds := pg_catalog.greatest(pg_catalog.coalesce(p_lease_seconds, 120), 15);

  UPDATE public.deposit_email_deliveries AS d
  SET
    status = 'sending',
    claim_token = p_claim_token,
    claim_expires_at = pg_catalog.now() + pg_catalog.make_interval(secs => lease_seconds),
    last_attempted_at = pg_catalog.now(),
    attempt_count = d.attempt_count + 1,
    updated_at = pg_catalog.now()
  WHERE d.customer_quote_id = p_customer_quote_id
    AND d.audience = p_audience
    AND (
      d.status IN ('pending', 'failed')
      OR (
        d.status = 'sending'
        AND (d.claim_expires_at IS NULL OR d.claim_expires_at <= pg_catalog.now())
      )
    )
  RETURNING * INTO claimed;

  RETURN claimed;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_deposit_email_delivery(
  p_customer_quote_id uuid,
  p_audience text,
  p_claim_token uuid,
  p_provider_id text
)
RETURNS public.deposit_email_deliveries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  completed public.deposit_email_deliveries;
BEGIN
  UPDATE public.deposit_email_deliveries AS d
  SET
    status = 'sent',
    provider_id = pg_catalog.nullif(p_provider_id, ''),
    last_error = NULL,
    sent_at = pg_catalog.now(),
    claim_token = NULL,
    claim_expires_at = NULL,
    updated_at = pg_catalog.now()
  WHERE d.customer_quote_id = p_customer_quote_id
    AND d.audience = p_audience
    AND d.status = 'sending'
    AND d.claim_token = p_claim_token
  RETURNING * INTO completed;

  RETURN completed;
END;
$$;

CREATE OR REPLACE FUNCTION public.fail_deposit_email_delivery(
  p_customer_quote_id uuid,
  p_audience text,
  p_claim_token uuid,
  p_last_error text
)
RETURNS public.deposit_email_deliveries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  failed public.deposit_email_deliveries;
BEGIN
  UPDATE public.deposit_email_deliveries AS d
  SET
    status = 'failed',
    last_error = pg_catalog.left(pg_catalog.coalesce(pg_catalog.nullif(p_last_error, ''), 'delivery_failed'), 180),
    sent_at = NULL,
    claim_token = NULL,
    claim_expires_at = NULL,
    updated_at = pg_catalog.now()
  WHERE d.customer_quote_id = p_customer_quote_id
    AND d.audience = p_audience
    AND d.status = 'sending'
    AND d.claim_token = p_claim_token
  RETURNING * INTO failed;

  RETURN failed;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_deposit_email_delivery(uuid, text, uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_deposit_email_delivery(uuid, text, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fail_deposit_email_delivery(uuid, text, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_deposit_email_delivery(uuid, text, uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_deposit_email_delivery(uuid, text, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.fail_deposit_email_delivery(uuid, text, uuid, text) TO service_role;

-- Promote unambiguous historical deposit joins/Stripe IDs from quote_data.
-- Never guess billing addresses, never overwrite conflicting columns, never
-- promote paid state from customer-editable JSON, and never insert
-- deposit_email_deliveries for historical rows. A syntactically valid orphan
-- UUID must not abort the migration on the saved_quotes FK.
UPDATE public.customer_quotes AS cq
SET saved_quote_id = (cq.quote_data->>'saved_quote_id')::uuid
WHERE cq.lead_source = 'deposit'
  AND cq.saved_quote_id IS NULL
  AND (cq.quote_data->>'saved_quote_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  AND EXISTS (
    SELECT 1
    FROM public.saved_quotes AS sq
    WHERE sq.id = (cq.quote_data->>'saved_quote_id')::uuid
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.customer_quotes AS other
    WHERE other.id <> cq.id
      AND (
        other.saved_quote_id = (cq.quote_data->>'saved_quote_id')::uuid
        OR (
          other.lead_source = 'deposit'
          AND other.saved_quote_id IS NULL
          AND other.quote_data->>'saved_quote_id' = cq.quote_data->>'saved_quote_id'
        )
      )
  );

UPDATE public.customer_quotes AS cq
SET stripe_checkout_session_id = cq.quote_data->>'stripe_session_id'
WHERE cq.lead_source = 'deposit'
  AND cq.stripe_checkout_session_id IS NULL
  AND (cq.quote_data->>'stripe_session_id') ~ '^cs_(test_|live_)?[A-Za-z0-9]+$'
  AND NOT EXISTS (
    SELECT 1
    FROM public.customer_quotes AS other
    WHERE other.id <> cq.id
      AND (
        other.stripe_checkout_session_id = cq.quote_data->>'stripe_session_id'
        OR (
          other.lead_source = 'deposit'
          AND other.stripe_checkout_session_id IS NULL
          AND other.quote_data->>'stripe_session_id' = cq.quote_data->>'stripe_session_id'
        )
      )
  );

UPDATE public.customer_quotes AS cq
SET stripe_payment_intent_id = COALESCE(
  cq.quote_data->>'stripe_payment_intent',
  cq.quote_data->>'payment_intent_id'
)
WHERE cq.lead_source = 'deposit'
  AND cq.stripe_payment_intent_id IS NULL
  AND COALESCE(cq.quote_data->>'stripe_payment_intent', cq.quote_data->>'payment_intent_id')
    ~ '^pi_(test_|live_)?[A-Za-z0-9]+$';

CREATE OR REPLACE FUNCTION public.deposit_authority_caller()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = pg_catalog
AS $$
  SELECT
    auth.role() IS NOT DISTINCT FROM 'service_role'
    OR public.has_role(auth.uid(), 'admin'::public.app_role);
$$;

CREATE OR REPLACE FUNCTION public.deposit_quote_data_authority_changed(old_data jsonb, new_data jsonb)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = pg_catalog
AS $$
  SELECT
    COALESCE(old_data->>'payment_status', '') IS DISTINCT FROM COALESCE(new_data->>'payment_status', '')
    OR COALESCE(old_data->>'stripe_session_id', '') IS DISTINCT FROM COALESCE(new_data->>'stripe_session_id', '')
    OR COALESCE(old_data->>'stripe_payment_intent', '') IS DISTINCT FROM COALESCE(new_data->>'stripe_payment_intent', '')
    OR COALESCE(old_data->>'payment_intent_id', '') IS DISTINCT FROM COALESCE(new_data->>'payment_intent_id', '')
    OR COALESCE(old_data->>'saved_quote_id', '') IS DISTINCT FROM COALESCE(new_data->>'saved_quote_id', '')
    OR COALESCE(old_data->>'payment_type', '') IS DISTINCT FROM COALESCE(new_data->>'payment_type', '')
    OR COALESCE(old_data->>'deposit_amount', '') IS DISTINCT FROM COALESCE(new_data->>'deposit_amount', '')
    OR old_data->'motor_info' IS DISTINCT FROM new_data->'motor_info'
    OR old_data->'quote_snapshot' IS DISTINCT FROM new_data->'quote_snapshot'
    OR COALESCE(old_data->>'deposit_outbox_schema', '') IS DISTINCT FROM COALESCE(new_data->>'deposit_outbox_schema', '')
    OR COALESCE(old_data->>'notification_status', '') IS DISTINCT FROM COALESCE(new_data->>'notification_status', '')
    OR COALESCE(old_data->>'notification_event_id', '') IS DISTINCT FROM COALESCE(new_data->>'notification_event_id', '')
    OR COALESCE(old_data->>'notification_lease_expires_at', '') IS DISTINCT FROM COALESCE(new_data->>'notification_lease_expires_at', '')
    OR COALESCE(old_data->>'notification_completed_at', '') IS DISTINCT FROM COALESCE(new_data->>'notification_completed_at', '')
    OR COALESCE(old_data->>'sms_notification_status', '') IS DISTINCT FROM COALESCE(new_data->>'sms_notification_status', '');
$$;

CREATE OR REPLACE FUNCTION public.enforce_customer_quotes_deposit_authority()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
DECLARE
  is_deposit boolean;
BEGIN
  IF public.deposit_authority_caller() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.saved_quote_id IS NOT NULL
      OR NEW.stripe_checkout_session_id IS NOT NULL
      OR NEW.stripe_payment_intent_id IS NOT NULL
      OR NEW.payment_status IS NOT NULL
      OR NEW.payment_paid_at IS NOT NULL
      OR NEW.stripe_billing_address IS NOT NULL
    THEN
      RAISE EXCEPTION 'deposit payment fields are service-managed'
        USING ERRCODE = '42501';
    END IF;
    IF NEW.lead_source IS NOT DISTINCT FROM 'deposit' THEN
      RAISE EXCEPTION 'deposit records are service-managed'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.saved_quote_id IS DISTINCT FROM OLD.saved_quote_id
    OR NEW.stripe_checkout_session_id IS DISTINCT FROM OLD.stripe_checkout_session_id
    OR NEW.stripe_payment_intent_id IS DISTINCT FROM OLD.stripe_payment_intent_id
    OR NEW.payment_status IS DISTINCT FROM OLD.payment_status
    OR NEW.payment_paid_at IS DISTINCT FROM OLD.payment_paid_at
    OR NEW.stripe_billing_address IS DISTINCT FROM OLD.stripe_billing_address
  THEN
    RAISE EXCEPTION 'deposit payment fields are service-managed'
      USING ERRCODE = '42501';
  END IF;

  is_deposit :=
    COALESCE(OLD.lead_source, '') = 'deposit'
    OR COALESCE(NEW.lead_source, '') = 'deposit';
  IF is_deposit AND (
    NEW.lead_source IS DISTINCT FROM OLD.lead_source
    OR public.deposit_quote_data_authority_changed(OLD.quote_data, NEW.quote_data)
  ) THEN
    RAISE EXCEPTION 'deposit payment fields are service-managed'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_customer_quotes_deposit_delete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  IF public.deposit_authority_caller() THEN
    RETURN OLD;
  END IF;
  IF OLD.lead_source IS NOT DISTINCT FROM 'deposit' THEN
    RAISE EXCEPTION 'deposit records are service-managed'
      USING ERRCODE = '42501';
  END IF;
  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_saved_quotes_deposit_authority()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  IF public.deposit_authority_caller() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.deposit_status IS NOT NULL AND NEW.deposit_status IS DISTINCT FROM 'pending' THEN
      RAISE EXCEPTION 'saved quote deposit status must be pending or unset'
        USING ERRCODE = '42501';
    END IF;
    IF NEW.deposit_paid_at IS NOT NULL THEN
      RAISE EXCEPTION 'saved quote deposit paid time is service-managed'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.deposit_status IS DISTINCT FROM OLD.deposit_status
    OR NEW.deposit_amount IS DISTINCT FROM OLD.deposit_amount
    OR NEW.deposit_paid_at IS DISTINCT FROM OLD.deposit_paid_at
  THEN
    RAISE EXCEPTION 'saved quote deposit fields are service-managed'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_saved_quote_bound_identity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  IF public.deposit_authority_caller() THEN
    RETURN NEW;
  END IF;
  IF OLD.quote_pdf_path IS NULL AND OLD.quote_pdf_sha256 IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.quote_state IS DISTINCT FROM OLD.quote_state
    OR NEW.email IS DISTINCT FROM OLD.email
    OR NEW.customer_full_name IS DISTINCT FROM OLD.customer_full_name
    OR NEW.customer_phone IS DISTINCT FROM OLD.customer_phone
    OR NEW.customer_address_line1 IS DISTINCT FROM OLD.customer_address_line1
    OR NEW.customer_address_line2 IS DISTINCT FROM OLD.customer_address_line2
    OR NEW.customer_city IS DISTINCT FROM OLD.customer_city
    OR NEW.customer_region IS DISTINCT FROM OLD.customer_region
    OR NEW.customer_postal_code IS DISTINCT FROM OLD.customer_postal_code
    OR NEW.customer_country IS DISTINCT FROM OLD.customer_country
  THEN
    RAISE EXCEPTION 'bound saved quote identity is immutable'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.deposit_authority_caller() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.deposit_quote_data_authority_changed(jsonb, jsonb) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.enforce_customer_quotes_deposit_authority() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_customer_quotes_deposit_delete() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_saved_quotes_deposit_authority() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_saved_quote_bound_identity() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.deposit_authority_caller() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.deposit_quote_data_authority_changed(jsonb, jsonb) TO anon, authenticated, service_role;

DROP TRIGGER IF EXISTS enforce_customer_quotes_deposit_authority
  ON public.customer_quotes;
CREATE TRIGGER enforce_customer_quotes_deposit_authority
  BEFORE INSERT OR UPDATE ON public.customer_quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_customer_quotes_deposit_authority();

DROP TRIGGER IF EXISTS enforce_customer_quotes_deposit_delete
  ON public.customer_quotes;
CREATE TRIGGER enforce_customer_quotes_deposit_delete
  BEFORE DELETE ON public.customer_quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_customer_quotes_deposit_delete();

DROP TRIGGER IF EXISTS enforce_saved_quotes_deposit_authority
  ON public.saved_quotes;
CREATE TRIGGER enforce_saved_quotes_deposit_authority
  BEFORE INSERT OR UPDATE OF deposit_status, deposit_amount, deposit_paid_at
  ON public.saved_quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_saved_quotes_deposit_authority();

DROP TRIGGER IF EXISTS enforce_saved_quote_bound_identity
  ON public.saved_quotes;
CREATE TRIGGER enforce_saved_quote_bound_identity
  BEFORE UPDATE OF quote_state, email, customer_full_name, customer_phone,
    customer_address_line1, customer_address_line2, customer_city,
    customer_region, customer_postal_code, customer_country
  ON public.saved_quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_saved_quote_bound_identity();
