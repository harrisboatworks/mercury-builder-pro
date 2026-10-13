-- Native UCP reservation-deposit rail. Source-only and default-off at the Edge.
-- Service role writes intents and attempts. Buyer approval is inserted only by
-- record_native_deposit_buyer_approval, which is not granted to anon or
-- authenticated and is not an HTTP route. Paid authority is a separate RPC
-- from the hosted Checkout claim and never writes a cs_ session id.
-- The owned buyer review endpoint records approval through a one-use challenge.

BEGIN;

CREATE TABLE public.native_deposit_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id text NOT NULL UNIQUE CHECK (child_id ~ '^ndc_[0-9a-f]{32}$'),
  parent_session_id text NOT NULL CHECK (parent_session_id ~ '^chk_[A-Za-z0-9._-]{1,120}$'),
  saved_quote_id uuid NOT NULL UNIQUE REFERENCES public.saved_quotes (id),
  owner_user_id uuid,
  motor_id uuid NOT NULL,
  amount_cents integer NOT NULL CHECK (amount_cents IN (10000, 20000, 50000, 100000)),
  currency text NOT NULL CHECK (currency = 'CAD'),
  merchandise_cents integer NOT NULL CHECK (merchandise_cents > amount_cents),
  document_sha256 text NOT NULL CHECK (document_sha256 ~ '^[0-9a-f]{64}$'),
  document_path text NOT NULL CHECK (document_path ~ '^saved-quotes/[0-9a-f-]{36}/quote[.]pdf$'),
  policy_version text NOT NULL CHECK (policy_version = 'deposit-policy/v1'),
  policy_code text NOT NULL CHECK (policy_code IN ('in_stock_refundable', 'special_order_until_written_approval')),
  terms_version text NOT NULL CHECK (terms_version = 'hbw-reservation-terms/2026-04-08'),
  catalog_model_number text NOT NULL CHECK (char_length(catalog_model_number) BETWEEN 1 AND 64),
  horsepower numeric NOT NULL CHECK (horsepower > 0 AND horsepower <= 1000),
  express_verified boolean NOT NULL DEFAULT false,
  status text NOT NULL CHECK (status IN (
    'requires_escalation',
    'approved',
    'attempt_claimed',
    'requires_action',
    'processing',
    'failed',
    'unknown',
    'expired',
    'revoked',
    'paid',
    'canceled'
  )),
  receipt_reconciliation_required boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.native_deposit_intents IS
  'Server-derived native reservation deposit. No resume token, raw SPT, buyer email, or PDF URL.';

CREATE TABLE public.native_deposit_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_id uuid NOT NULL UNIQUE REFERENCES public.native_deposit_intents (id),
  child_id text NOT NULL,
  saved_quote_id uuid NOT NULL,
  motor_id uuid NOT NULL,
  amount_cents integer NOT NULL,
  currency text NOT NULL CHECK (currency = 'CAD'),
  document_sha256 text NOT NULL CHECK (document_sha256 ~ '^[0-9a-f]{64}$'),
  policy_version text NOT NULL,
  policy_code text NOT NULL,
  terms_version text NOT NULL,
  expires_at timestamptz NOT NULL,
  approved_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expires_at > approved_at)
);

COMMENT ON TABLE public.native_deposit_approvals IS
  'Durable trusted-review record. Direct inserts are rejected; only the service function may write.';

CREATE TABLE public.native_deposit_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_id uuid NOT NULL UNIQUE REFERENCES public.native_deposit_intents (id),
  idempotency_key text NOT NULL UNIQUE CHECK (idempotency_key ~ '^native-deposit-pi:[0-9a-f-]{36}$'),
  token_fingerprint text NOT NULL UNIQUE CHECK (token_fingerprint ~ '^[0-9a-f]{64}$'),
  processor_params_hash text NOT NULL CHECK (processor_params_hash ~ '^[0-9a-f]{64}$'),
  amount_cents integer NOT NULL,
  currency text NOT NULL CHECK (currency = 'CAD'),
  seller_account_id text NOT NULL CHECK (seller_account_id ~ '^acct_[A-Za-z0-9]+$'),
  livemode boolean NOT NULL,
  observed_payment_intent_id text CHECK (observed_payment_intent_id IS NULL OR observed_payment_intent_id ~ '^pi_(test_|live_)?[A-Za-z0-9]+$'),
  stripe_payment_intent_id text UNIQUE CHECK (
    stripe_payment_intent_id IS NULL
    OR stripe_payment_intent_id ~ '^pi_(test_|live_)?[A-Za-z0-9]+$'
  ),
  submitted_at timestamptz,
  status text NOT NULL CHECK (status IN (
    'claimed',
    'submitted',
    'requires_action',
    'processing',
    'succeeded',
    'failed',
    'unknown'
  )),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.native_deposit_attempts IS
  'One pre-call attempt per intent. Stores a token fingerprint, never the Shared Payment Token.';

ALTER TABLE public.native_deposit_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.native_deposit_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.native_deposit_attempts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.native_deposit_intents FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.native_deposit_approvals FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON TABLE public.native_deposit_attempts FROM PUBLIC, anon, authenticated, service_role;

GRANT SELECT ON TABLE public.native_deposit_intents TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.native_deposit_intents TO service_role;
GRANT SELECT ON TABLE public.native_deposit_approvals TO service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.native_deposit_attempts TO service_role;

DROP POLICY IF EXISTS "Owners read their native deposit intents" ON public.native_deposit_intents;
CREATE POLICY "Owners read their native deposit intents"
  ON public.native_deposit_intents
  FOR SELECT
  TO authenticated
  USING (owner_user_id IS NOT NULL AND owner_user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.enforce_native_deposit_intent_bindings()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM 1 FROM public.saved_quotes AS sq WHERE sq.id = NEW.saved_quote_id
      AND sq.user_id IS NOT DISTINCT FROM NEW.owner_user_id
      AND sq.quote_pdf_path = NEW.document_path AND sq.quote_pdf_sha256 = NEW.document_sha256
      AND sq.deposit_amount * 100 = NEW.amount_cents AND sq.deposit_status = 'pending'
      AND sq.quote_state -> 'motor' ->> 'id' = NEW.motor_id::text
      AND sq.is_soft_lead IS NOT TRUE AND sq.expires_at > now()
      AND NULLIF(btrim(sq.email),'') IS NOT NULL
      AND NULLIF(btrim(sq.customer_full_name),'') IS NOT NULL
      AND NULLIF(btrim(sq.customer_phone),'') IS NOT NULL
      AND NULLIF(btrim(sq.customer_address_line1),'') IS NOT NULL
      AND NULLIF(btrim(sq.customer_city),'') IS NOT NULL
      AND NULLIF(btrim(sq.customer_region),'') IS NOT NULL
      AND NULLIF(btrim(sq.customer_postal_code),'') IS NOT NULL
      AND NULLIF(btrim(sq.customer_country),'') IS NOT NULL
      FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'native canonical quote binding mismatch' USING ERRCODE = '23514'; END IF;
    IF NEW.status IS DISTINCT FROM 'requires_escalation' THEN
      RAISE EXCEPTION 'native deposit intents start without approval'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.child_id IS DISTINCT FROM OLD.child_id
    OR NEW.parent_session_id IS DISTINCT FROM OLD.parent_session_id
    OR NEW.saved_quote_id IS DISTINCT FROM OLD.saved_quote_id
    OR NEW.owner_user_id IS DISTINCT FROM OLD.owner_user_id
    OR NEW.motor_id IS DISTINCT FROM OLD.motor_id
    OR NEW.amount_cents IS DISTINCT FROM OLD.amount_cents
    OR NEW.currency IS DISTINCT FROM OLD.currency
    OR NEW.merchandise_cents IS DISTINCT FROM OLD.merchandise_cents
    OR NEW.document_sha256 IS DISTINCT FROM OLD.document_sha256
    OR NEW.document_path IS DISTINCT FROM OLD.document_path
    OR NEW.policy_version IS DISTINCT FROM OLD.policy_version
    OR NEW.policy_code IS DISTINCT FROM OLD.policy_code
    OR NEW.terms_version IS DISTINCT FROM OLD.terms_version
    OR NEW.catalog_model_number IS DISTINCT FROM OLD.catalog_model_number
    OR NEW.horsepower IS DISTINCT FROM OLD.horsepower
    OR NEW.express_verified IS DISTINCT FROM OLD.express_verified
    OR NEW.expires_at IS DISTINCT FROM OLD.expires_at
    OR NEW.created_at IS DISTINCT FROM OLD.created_at
  THEN
    RAISE EXCEPTION 'native deposit bindings are immutable'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.status = 'paid' AND OLD.status IS DISTINCT FROM 'paid'
    AND current_setting('native_deposit.claim', true) IS DISTINCT FROM 'on'
  THEN
    RAISE EXCEPTION 'native deposit paid status requires the paid claim'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved'
    AND current_setting('native_deposit.approval', true) IS DISTINCT FROM 'on'
  THEN
    RAISE EXCEPTION 'native deposit approval requires the service recorder'
      USING ERRCODE = '42501';
  END IF;

  NEW.updated_at := pg_catalog.now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_native_deposit_intent_bindings ON public.native_deposit_intents;
CREATE TRIGGER enforce_native_deposit_intent_bindings
  BEFORE INSERT OR UPDATE ON public.native_deposit_intents
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_native_deposit_intent_bindings();

CREATE OR REPLACE FUNCTION public.enforce_native_deposit_approval_writer()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_intent public.native_deposit_intents%ROWTYPE;
BEGIN
  IF current_setting('native_deposit.approval', true) IS DISTINCT FROM 'on' THEN
    RAISE EXCEPTION 'native deposit approval is service-recorded only'
      USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_intent
  FROM public.native_deposit_intents
  WHERE id = NEW.intent_id;

  IF NOT FOUND
    OR v_intent.child_id IS DISTINCT FROM NEW.child_id
    OR v_intent.saved_quote_id IS DISTINCT FROM NEW.saved_quote_id
    OR v_intent.motor_id IS DISTINCT FROM NEW.motor_id
    OR v_intent.amount_cents IS DISTINCT FROM NEW.amount_cents
    OR v_intent.currency IS DISTINCT FROM NEW.currency
    OR v_intent.document_sha256 IS DISTINCT FROM NEW.document_sha256
    OR v_intent.policy_version IS DISTINCT FROM NEW.policy_version
    OR v_intent.policy_code IS DISTINCT FROM NEW.policy_code
    OR v_intent.terms_version IS DISTINCT FROM NEW.terms_version
    OR NEW.expires_at > v_intent.expires_at
  THEN
    RAISE EXCEPTION 'native deposit approval does not match the intent'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_native_deposit_approval_writer ON public.native_deposit_approvals;
CREATE TRIGGER enforce_native_deposit_approval_writer
  BEFORE INSERT ON public.native_deposit_approvals
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_native_deposit_approval_writer();

CREATE OR REPLACE FUNCTION public.enforce_native_deposit_attempt_bindings()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.intent_id IS DISTINCT FROM OLD.intent_id
      OR NEW.idempotency_key IS DISTINCT FROM OLD.idempotency_key
      OR NEW.token_fingerprint IS DISTINCT FROM OLD.token_fingerprint
      OR NEW.processor_params_hash IS DISTINCT FROM OLD.processor_params_hash
      OR NEW.amount_cents IS DISTINCT FROM OLD.amount_cents
      OR NEW.currency IS DISTINCT FROM OLD.currency
      OR NEW.seller_account_id IS DISTINCT FROM OLD.seller_account_id
      OR NEW.livemode IS DISTINCT FROM OLD.livemode
      OR NEW.created_at IS DISTINCT FROM OLD.created_at
    THEN
      RAISE EXCEPTION 'native deposit attempt bindings are immutable'
        USING ERRCODE = '23514';
    END IF;
    IF OLD.submitted_at IS NOT NULL AND NEW.submitted_at IS DISTINCT FROM OLD.submitted_at THEN
      RAISE EXCEPTION 'original native submission timestamp is immutable' USING ERRCODE = '23514';
    END IF;
    IF OLD.status = 'succeeded' AND NEW.status IS DISTINCT FROM 'succeeded' THEN
      RAISE EXCEPTION 'verified native success cannot regress' USING ERRCODE = '23514';
    END IF;
    IF OLD.stripe_payment_intent_id IS NOT NULL
      AND NEW.stripe_payment_intent_id IS DISTINCT FROM OLD.stripe_payment_intent_id
    THEN
      RAISE EXCEPTION 'native payment intent binding is immutable'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  IF NEW.stripe_payment_intent_id IS NOT NULL
    AND NEW.stripe_payment_intent_id ~ '^cs_'
  THEN
    RAISE EXCEPTION 'native deposit cannot use a Checkout session id'
      USING ERRCODE = '23514';
  END IF;

  IF TG_OP = 'UPDATE' THEN
    NEW.updated_at := pg_catalog.now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_native_deposit_attempt_bindings ON public.native_deposit_attempts;
CREATE TRIGGER enforce_native_deposit_attempt_bindings
  BEFORE INSERT OR UPDATE ON public.native_deposit_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_native_deposit_attempt_bindings();

CREATE OR REPLACE FUNCTION public.native_deposit_attempt_blocks_quote(p_saved_quote_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.native_deposit_intents AS i
    LEFT JOIN public.native_deposit_attempts AS a ON a.intent_id = i.id
    WHERE i.saved_quote_id = p_saved_quote_id
      AND (
        i.status = 'paid'
        OR a.stripe_payment_intent_id IS NOT NULL
        OR a.status IN ('claimed', 'submitted', 'requires_action', 'processing', 'unknown', 'succeeded')
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.native_deposit_blocks_hosted_checkout(p_saved_quote_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
  SELECT public.native_deposit_attempt_blocks_quote(p_saved_quote_id);
$$;

CREATE OR REPLACE FUNCTION public.enforce_native_deposit_canonical_freeze()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.native_deposit_intents WHERE saved_quote_id = NEW.id) THEN
    RETURN NEW;
  END IF;
  IF NEW.quote_pdf_path IS DISTINCT FROM OLD.quote_pdf_path
    OR NEW.quote_pdf_sha256 IS DISTINCT FROM OLD.quote_pdf_sha256
    OR NEW.deposit_amount IS DISTINCT FROM OLD.deposit_amount
    OR NEW.quote_state IS DISTINCT FROM OLD.quote_state
    OR NEW.email IS DISTINCT FROM OLD.email
    OR NEW.customer_full_name IS DISTINCT FROM OLD.customer_full_name
    OR NEW.customer_phone IS DISTINCT FROM OLD.customer_phone
    OR NEW.customer_address_line1 IS DISTINCT FROM OLD.customer_address_line1
    OR NEW.customer_address_line2 IS DISTINCT FROM OLD.customer_address_line2
    OR NEW.customer_city IS DISTINCT FROM OLD.customer_city
    OR NEW.customer_region IS DISTINCT FROM OLD.customer_region
    OR NEW.customer_postal_code IS DISTINCT FROM OLD.customer_postal_code
    OR NEW.customer_country IS DISTINCT FROM OLD.customer_country
    OR NEW.resume_token IS DISTINCT FROM OLD.resume_token
    OR NEW.expires_at IS DISTINCT FROM OLD.expires_at
    OR NEW.user_id IS DISTINCT FROM OLD.user_id
  THEN
    RAISE EXCEPTION 'canonical deposit authority is frozen during a native payment attempt'
      USING ERRCODE = '40001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_native_deposit_canonical_freeze ON public.saved_quotes;
CREATE TRIGGER enforce_native_deposit_canonical_freeze
  BEFORE UPDATE ON public.saved_quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_native_deposit_canonical_freeze();

CREATE OR REPLACE FUNCTION public.enforce_native_deposit_hosted_exclusion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NEW.saved_quote_id IS NOT NULL
    AND NEW.lead_source = 'deposit'
    AND NEW.stripe_checkout_session_id IS NOT NULL
    AND public.native_deposit_attempt_blocks_quote(NEW.saved_quote_id)
  THEN
    RAISE EXCEPTION 'hosted checkout cannot claim a saved quote with an active native deposit'
      USING ERRCODE = '40001';
  END IF;
  IF NEW.lead_source = 'deposit'
    AND NEW.stripe_checkout_session_id IS NOT NULL
    AND COALESCE(NEW.quote_data ->> 'payment_channel', '') = 'native_spt'
  THEN
    RAISE EXCEPTION 'native deposit cannot store a Checkout session id'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_native_deposit_hosted_exclusion ON public.customer_quotes;
CREATE TRIGGER enforce_native_deposit_hosted_exclusion
  BEFORE INSERT OR UPDATE OF stripe_checkout_session_id, quote_data, saved_quote_id, lead_source
  ON public.customer_quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_native_deposit_hosted_exclusion();

-- Durable cross-rail claim precedes any external payment call. No timeout unlock:
-- ambiguous processor results require reconciliation, even with feature disabled.
CREATE TABLE public.deposit_payment_rails (
  saved_quote_id uuid PRIMARY KEY REFERENCES public.saved_quotes(id),
  rail text NOT NULL CHECK (rail IN ('hosted', 'native')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.deposit_payment_rails ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.deposit_payment_rails FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON public.deposit_payment_rails TO service_role;
CREATE FUNCTION public.claim_hosted_deposit_rail(p_saved_quote_id uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE v_rail text;
BEGIN
  PERFORM 1 FROM public.saved_quotes WHERE id = p_saved_quote_id AND deposit_status = 'pending' FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  IF public.native_deposit_attempt_blocks_quote(p_saved_quote_id) THEN RETURN false; END IF;
  INSERT INTO public.deposit_payment_rails(saved_quote_id, rail) VALUES(p_saved_quote_id, 'hosted') ON CONFLICT DO NOTHING;
  SELECT rail INTO v_rail FROM public.deposit_payment_rails WHERE saved_quote_id = p_saved_quote_id;
  RETURN v_rail = 'hosted';
END;
$$;
REVOKE ALL ON FUNCTION public.claim_hosted_deposit_rail(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_hosted_deposit_rail(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.record_native_deposit_buyer_approval(
  p_intent_id uuid,
  p_child_id text,
  p_saved_quote_id uuid,
  p_motor_id uuid,
  p_amount_cents integer,
  p_document_sha256 text,
  p_policy_version text,
  p_policy_code text,
  p_terms_version text,
  p_expires_at timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_intent public.native_deposit_intents%ROWTYPE;
  v_saved_hash text;
  v_saved_amount numeric;
  v_saved_motor text;
  v_saved_status text;
  v_saved_expires timestamptz;
  v_saved_soft boolean;
BEGIN
  IF p_expires_at IS NULL OR p_expires_at <= pg_catalog.now() THEN
    RETURN false;
  END IF;

  PERFORM 1 FROM public.saved_quotes WHERE id = p_saved_quote_id FOR UPDATE;

  SELECT * INTO v_intent
  FROM public.native_deposit_intents
  WHERE id = p_intent_id
  FOR UPDATE;

  IF NOT FOUND
    OR v_intent.status IS DISTINCT FROM 'requires_escalation'
    OR v_intent.child_id IS DISTINCT FROM p_child_id
    OR v_intent.saved_quote_id IS DISTINCT FROM p_saved_quote_id
    OR v_intent.motor_id IS DISTINCT FROM p_motor_id
    OR v_intent.amount_cents IS DISTINCT FROM p_amount_cents
    OR v_intent.document_sha256 IS DISTINCT FROM p_document_sha256
    OR v_intent.policy_version IS DISTINCT FROM p_policy_version
    OR v_intent.policy_code IS DISTINCT FROM p_policy_code
    OR v_intent.terms_version IS DISTINCT FROM p_terms_version
    OR p_expires_at > v_intent.expires_at
    OR v_intent.expires_at <= pg_catalog.now()
  THEN
    RETURN false;
  END IF;

  SELECT
    sq.quote_pdf_sha256,
    sq.deposit_amount,
    sq.quote_state -> 'motor' ->> 'id',
    sq.deposit_status,
    sq.expires_at,
    sq.is_soft_lead
  INTO
    v_saved_hash,
    v_saved_amount,
    v_saved_motor,
    v_saved_status,
    v_saved_expires,
    v_saved_soft
  FROM public.saved_quotes AS sq
  WHERE sq.id = p_saved_quote_id
  FOR UPDATE;

  IF NOT FOUND
    OR v_saved_soft IS TRUE
    OR v_saved_status IS DISTINCT FROM 'pending'
    OR v_saved_expires IS NULL
    OR v_saved_expires <= pg_catalog.now()
    OR v_saved_hash IS DISTINCT FROM p_document_sha256
    OR v_saved_motor IS DISTINCT FROM p_motor_id::text
    OR v_saved_amount IS NULL
    OR v_saved_amount * 100 IS DISTINCT FROM p_amount_cents::numeric
  THEN
    RETURN false;
  END IF;

  PERFORM pg_catalog.set_config('native_deposit.approval', 'on', true);

  INSERT INTO public.native_deposit_approvals (
    intent_id,
    child_id,
    saved_quote_id,
    motor_id,
    amount_cents,
    currency,
    document_sha256,
    policy_version,
    policy_code,
    terms_version,
    expires_at
  ) VALUES (
    p_intent_id,
    p_child_id,
    p_saved_quote_id,
    p_motor_id,
    p_amount_cents,
    'CAD',
    p_document_sha256,
    p_policy_version,
    p_policy_code,
    p_terms_version,
    p_expires_at
  );

  UPDATE public.native_deposit_intents
  SET status = 'approved'
  WHERE id = p_intent_id
    AND status = 'requires_escalation';

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_native_deposit_attempt(
  p_intent_id uuid,
  p_token_fingerprint text,
  p_processor_params_hash text,
  p_amount_cents integer,
  p_seller_account_id text,
  p_livemode boolean
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_saved_quote_id uuid;
  v_intent public.native_deposit_intents%ROWTYPE;
  v_approval public.native_deposit_approvals%ROWTYPE;
  v_attempt public.native_deposit_attempts%ROWTYPE;
  v_saved_hash text;
  v_saved_amount numeric;
  v_saved_motor text;
  v_saved_status text;
  v_saved_expires timestamptz;
  v_saved_soft boolean;
  v_hosted text;
  v_hosted_paid text;
  v_saved public.saved_quotes%ROWTYPE;
  v_channel text;
  v_key text;
  v_rail text;
BEGIN
  SELECT saved_quote_id INTO v_saved_quote_id
  FROM public.native_deposit_intents
  WHERE id = p_intent_id;

  IF v_saved_quote_id IS NULL THEN
    RETURN jsonb_build_object('result', 'refused', 'reason', 'missing_intent');
  END IF;

  PERFORM 1
  FROM public.customer_quotes AS cq
  WHERE cq.saved_quote_id = v_saved_quote_id
    AND cq.lead_source = 'deposit'
  FOR UPDATE;

  SELECT cq.stripe_checkout_session_id, cq.payment_status, cq.quote_data ->> 'payment_channel'
  INTO v_hosted, v_hosted_paid, v_channel
  FROM public.customer_quotes AS cq
  WHERE cq.saved_quote_id = v_saved_quote_id
    AND cq.lead_source = 'deposit';

  IF FOUND AND (v_hosted IS NOT NULL OR v_hosted_paid = 'paid' OR v_channel IS DISTINCT FROM 'native_spt') THEN
    RETURN jsonb_build_object('result', 'refused', 'reason', 'hosted_rail');
  END IF;

  SELECT
    sq.quote_pdf_sha256,
    sq.deposit_amount,
    sq.quote_state -> 'motor' ->> 'id',
    sq.deposit_status,
    sq.expires_at,
    sq.is_soft_lead
  INTO
    v_saved_hash,
    v_saved_amount,
    v_saved_motor,
    v_saved_status,
    v_saved_expires,
    v_saved_soft
  FROM public.saved_quotes AS sq
  WHERE sq.id = v_saved_quote_id
  FOR UPDATE;

  SELECT * INTO v_saved FROM public.saved_quotes WHERE id = v_saved_quote_id;

  SELECT * INTO v_intent
  FROM public.native_deposit_intents
  WHERE id = p_intent_id
  FOR UPDATE;

  SELECT * INTO v_approval
  FROM public.native_deposit_approvals
  WHERE intent_id = p_intent_id
  FOR UPDATE;

  v_key := 'native-deposit-pi:' || p_intent_id::text;

  SELECT * INTO v_attempt
  FROM public.native_deposit_attempts
  WHERE intent_id = p_intent_id
  FOR UPDATE;

  IF p_token_fingerprint IS NULL
    OR p_token_fingerprint !~ '^[0-9a-f]{64}$'
    OR p_processor_params_hash IS NULL
    OR p_processor_params_hash !~ '^[0-9a-f]{64}$'
    OR p_seller_account_id IS NULL
    OR p_seller_account_id !~ '^acct_[A-Za-z0-9]+$'
    OR v_intent.id IS NULL
    OR p_amount_cents IS DISTINCT FROM v_intent.amount_cents
  THEN
    RETURN jsonb_build_object('result', 'refused', 'reason', 'binding');
  END IF;

  -- An existing attempt is reconciled even after the intent or approval
  -- expires. A different token never starts a second charge.
  IF FOUND THEN
    IF v_attempt.token_fingerprint IS DISTINCT FROM p_token_fingerprint
      OR v_attempt.processor_params_hash IS DISTINCT FROM p_processor_params_hash
      OR v_attempt.amount_cents IS DISTINCT FROM p_amount_cents
      OR v_attempt.seller_account_id IS DISTINCT FROM p_seller_account_id
      OR v_attempt.livemode IS DISTINCT FROM p_livemode
      OR v_attempt.idempotency_key IS DISTINCT FROM v_key
    THEN
      RETURN jsonb_build_object(
        'result', 'conflict',
        'reason', 'attempt_bound',
        'attempt_id', v_attempt.id,
        'idempotency_key', v_attempt.idempotency_key,
        'status', v_attempt.status,
        'stripe_payment_intent_id', v_attempt.stripe_payment_intent_id,
        'submitted_at', v_attempt.submitted_at
      );
    END IF;
    IF v_attempt.status = 'failed' AND v_attempt.stripe_payment_intent_id IS NULL THEN
      RETURN jsonb_build_object(
        'result', 'refused',
        'reason', 'attempt_failed',
        'attempt_id', v_attempt.id,
        'idempotency_key', v_attempt.idempotency_key,
        'status', v_attempt.status
      );
    END IF;
    IF v_attempt.status = 'succeeded' OR v_attempt.stripe_payment_intent_id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'result', 'reconcile',
        'attempt_id', v_attempt.id,
        'idempotency_key', v_attempt.idempotency_key,
        'status', v_attempt.status,
        'stripe_payment_intent_id', v_attempt.stripe_payment_intent_id,
        'submitted_at', v_attempt.submitted_at
      );
    END IF;
    RETURN jsonb_build_object(
      'result', 'retry',
      'attempt_id', v_attempt.id,
      'idempotency_key', v_attempt.idempotency_key,
      'status', v_attempt.status,
      'stripe_payment_intent_id', v_attempt.stripe_payment_intent_id,
        'submitted_at', v_attempt.submitted_at
    );
  END IF;

  IF v_saved.user_id IS DISTINCT FROM v_intent.owner_user_id
    OR v_saved.quote_pdf_path IS DISTINCT FROM v_intent.document_path
    OR NULLIF(btrim(v_saved.email),'') IS NULL
    OR NULLIF(btrim(v_saved.customer_full_name),'') IS NULL
    OR NULLIF(btrim(v_saved.customer_phone),'') IS NULL
    OR NULLIF(btrim(v_saved.customer_address_line1),'') IS NULL
    OR NULLIF(btrim(v_saved.customer_city),'') IS NULL
    OR NULLIF(btrim(v_saved.customer_region),'') IS NULL
    OR NULLIF(btrim(v_saved.customer_postal_code),'') IS NULL
    OR NULLIF(btrim(v_saved.customer_country),'') IS NULL
    OR v_approval.id IS NULL
    OR v_intent.status IS DISTINCT FROM 'approved'
    OR v_approval.expires_at <= pg_catalog.now()
    OR v_intent.expires_at <= pg_catalog.now()
    OR v_saved_soft IS TRUE
    OR v_saved_status IS DISTINCT FROM 'pending'
    OR v_saved_expires IS NULL
    OR v_saved_expires <= pg_catalog.now()
    OR v_saved_hash IS DISTINCT FROM v_intent.document_sha256
    OR v_saved_motor IS DISTINCT FROM v_intent.motor_id::text
    OR v_saved_amount * 100 IS DISTINCT FROM v_intent.amount_cents::numeric
    OR v_approval.child_id IS DISTINCT FROM v_intent.child_id
    OR v_approval.saved_quote_id IS DISTINCT FROM v_intent.saved_quote_id
    OR v_approval.motor_id IS DISTINCT FROM v_intent.motor_id
    OR v_approval.amount_cents IS DISTINCT FROM v_intent.amount_cents
    OR v_approval.document_sha256 IS DISTINCT FROM v_intent.document_sha256
    OR v_approval.policy_version IS DISTINCT FROM v_intent.policy_version
    OR v_approval.policy_code IS DISTINCT FROM v_intent.policy_code
    OR v_approval.terms_version IS DISTINCT FROM v_intent.terms_version
  THEN
    RETURN jsonb_build_object('result', 'refused', 'reason', 'binding');
  END IF;

  INSERT INTO public.deposit_payment_rails(saved_quote_id, rail) VALUES(v_saved_quote_id, 'native') ON CONFLICT DO NOTHING;
  SELECT rail INTO v_rail FROM public.deposit_payment_rails WHERE saved_quote_id = v_saved_quote_id;
  IF v_rail IS DISTINCT FROM 'native' THEN RETURN jsonb_build_object('result', 'refused', 'reason', 'hosted_rail'); END IF;

  INSERT INTO public.native_deposit_attempts (
    intent_id,
    idempotency_key,
    token_fingerprint,
    processor_params_hash,
    amount_cents,
    currency,
    seller_account_id,
    livemode,
    status
  ) VALUES (
    p_intent_id,
    v_key,
    p_token_fingerprint,
    p_processor_params_hash,
    p_amount_cents,
    'CAD',
    p_seller_account_id,
    p_livemode,
    'claimed'
  )
  RETURNING * INTO v_attempt;

  UPDATE public.native_deposit_intents
  SET status = 'attempt_claimed'
  WHERE id = p_intent_id
    AND status = 'approved';

  RETURN jsonb_build_object(
    'result', 'claimed',
    'attempt_id', v_attempt.id,
    'idempotency_key', v_attempt.idempotency_key,
    'status', v_attempt.status,
    'stripe_payment_intent_id', NULL
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.bind_native_deposit_payment_intent(
  p_attempt_id uuid,
  p_payment_intent_id text,
  p_status text
)
RETURNS boolean
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_attempt public.native_deposit_attempts%ROWTYPE;
BEGIN
  IF p_status NOT IN ('claimed', 'submitted', 'requires_action', 'processing', 'succeeded', 'failed', 'unknown') THEN
    RETURN false;
  END IF;
  IF p_payment_intent_id IS NOT NULL
    AND p_payment_intent_id !~ '^pi_(test_|live_)?[A-Za-z0-9]+$'
  THEN
    RETURN false;
  END IF;

  PERFORM 1 FROM public.native_deposit_intents WHERE id = (SELECT intent_id FROM public.native_deposit_attempts WHERE id = p_attempt_id) FOR UPDATE;

  SELECT * INTO v_attempt
  FROM public.native_deposit_attempts
  WHERE id = p_attempt_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;
  IF v_attempt.stripe_payment_intent_id IS NOT NULL
    AND p_payment_intent_id IS NOT NULL
    AND p_payment_intent_id IS DISTINCT FROM v_attempt.stripe_payment_intent_id
  THEN
    RETURN false;
  END IF;

  IF p_status = 'succeeded' AND v_attempt.submitted_at IS NULL THEN RETURN false; END IF;
  IF v_attempt.status = 'succeeded' THEN RETURN true; END IF;

  UPDATE public.native_deposit_attempts
  SET
    stripe_payment_intent_id = COALESCE(p_payment_intent_id, stripe_payment_intent_id),
    status = p_status,
    submitted_at = CASE WHEN p_status = 'submitted' THEN COALESCE(submitted_at, now()) ELSE submitted_at END
  WHERE id = p_attempt_id;

  UPDATE public.native_deposit_intents
  SET status = CASE p_status
    WHEN 'requires_action' THEN 'requires_action'
    WHEN 'processing' THEN 'processing'
    WHEN 'failed' THEN 'failed'
    WHEN 'unknown' THEN 'unknown'
    WHEN 'succeeded' THEN 'processing'
    ELSE status
  END
  WHERE id = v_attempt.intent_id
    AND status IS DISTINCT FROM 'paid';

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_native_motor_deposit_paid(
  p_intent_id uuid,
  p_attempt_id uuid,
  p_saved_quote_id uuid,
  p_payment_intent_id text,
  p_amount_cents integer,
  p_document_sha256 text,
  p_motor_id uuid,
  p_terms_version text,
  p_policy_version text,
  p_policy_code text,
  p_notification_event_id text,
  p_deposit_paid_at timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
VOLATILE
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_quote public.customer_quotes%ROWTYPE;
  v_saved public.saved_quotes%ROWTYPE;
  v_intent public.native_deposit_intents%ROWTYPE;
  v_attempt public.native_deposit_attempts%ROWTYPE;
  v_approval public.native_deposit_approvals%ROWTYPE;
  v_quote_id uuid;
  v_amount numeric;
  v_motor_model text;
  v_motor_hp numeric;
  v_policy jsonb;
  v_quote_data jsonb;
  v_lease text;
BEGIN
  IF p_payment_intent_id IS NULL
    OR p_payment_intent_id !~ '^pi_(test_|live_)?[A-Za-z0-9]+$'
    OR p_payment_intent_id ~ '^cs_'
    OR p_amount_cents IS NULL
    OR p_amount_cents NOT IN (10000, 20000, 50000, 100000)
    OR p_document_sha256 !~ '^[0-9a-f]{64}$'
    OR p_notification_event_id IS NULL
    OR btrim(p_notification_event_id) = ''
    OR p_deposit_paid_at IS NULL
    OR p_terms_version IS DISTINCT FROM 'hbw-reservation-terms/2026-04-08'
    OR p_policy_version IS DISTINCT FROM 'deposit-policy/v1'
  THEN
    RETURN false;
  END IF;

  SELECT * INTO v_quote
  FROM public.customer_quotes AS cq
  WHERE cq.saved_quote_id = p_saved_quote_id
    AND cq.lead_source = 'deposit'
  FOR UPDATE;

  IF FOUND AND (
    v_quote.stripe_checkout_session_id IS NOT NULL
    OR COALESCE(v_quote.quote_data ->> 'stripe_session_id', '') <> ''
    OR COALESCE(v_quote.quote_data ->> 'stripe_session_id', '') <> ''
    OR (v_quote.quote_data ->> 'payment_channel') IS DISTINCT FROM 'native_spt'
    OR (v_quote.stripe_payment_intent_id IS NOT NULL AND v_quote.stripe_payment_intent_id IS DISTINCT FROM p_payment_intent_id)
  ) THEN
    RETURN false;
  END IF;

  SELECT * INTO v_saved
  FROM public.saved_quotes AS sq
  WHERE sq.id = p_saved_quote_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- A concurrent winner may insert the initially absent customer row while we
  -- wait for the saved-row lock. Refresh it without acquiring a reverse-order
  -- row lock; an idempotent paid return makes no customer-row mutation.
  SELECT * INTO v_quote FROM public.customer_quotes AS cq
    WHERE cq.saved_quote_id = p_saved_quote_id AND cq.lead_source = 'deposit';

  IF v_quote.id IS NOT NULL AND (
    v_quote.stripe_checkout_session_id IS NOT NULL
    OR (v_quote.quote_data ->> 'payment_channel') IS DISTINCT FROM 'native_spt'
  ) THEN RETURN false; END IF;

  SELECT * INTO v_intent
  FROM public.native_deposit_intents
  WHERE id = p_intent_id
  FOR UPDATE;

  SELECT * INTO v_attempt
  FROM public.native_deposit_attempts
  WHERE id = p_attempt_id
    AND intent_id = p_intent_id
  FOR UPDATE;

  SELECT * INTO v_approval
  FROM public.native_deposit_approvals
  WHERE intent_id = p_intent_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  v_amount := p_amount_cents::numeric / 100;
  IF v_intent.saved_quote_id IS DISTINCT FROM p_saved_quote_id
    OR v_intent.motor_id IS DISTINCT FROM p_motor_id
    OR v_intent.amount_cents IS DISTINCT FROM p_amount_cents
    OR v_intent.currency IS DISTINCT FROM 'CAD'
    OR v_intent.document_sha256 IS DISTINCT FROM p_document_sha256
    OR v_intent.terms_version IS DISTINCT FROM p_terms_version
    OR v_intent.policy_version IS DISTINCT FROM p_policy_version
    OR v_intent.policy_code IS DISTINCT FROM p_policy_code
    OR v_attempt.amount_cents IS DISTINCT FROM p_amount_cents
    OR v_attempt.currency IS DISTINCT FROM 'CAD'
    OR v_attempt.stripe_payment_intent_id IS DISTINCT FROM p_payment_intent_id
    OR v_attempt.status IS DISTINCT FROM 'succeeded'
    OR v_attempt.submitted_at IS NULL
    OR v_attempt.submitted_at < v_approval.approved_at
    OR v_attempt.submitted_at > v_approval.expires_at
    OR v_attempt.submitted_at > v_intent.expires_at
    OR v_attempt.submitted_at > v_saved.expires_at
    OR v_attempt.submitted_at > now()
    OR v_approval.saved_quote_id IS DISTINCT FROM p_saved_quote_id
    OR v_approval.motor_id IS DISTINCT FROM p_motor_id
    OR v_approval.amount_cents IS DISTINCT FROM p_amount_cents
    OR v_approval.currency IS DISTINCT FROM 'CAD'
    OR v_approval.document_sha256 IS DISTINCT FROM p_document_sha256
    OR v_approval.terms_version IS DISTINCT FROM p_terms_version
    OR v_approval.policy_version IS DISTINCT FROM p_policy_version
    OR v_approval.policy_code IS DISTINCT FROM p_policy_code
    OR v_approval.child_id IS DISTINCT FROM v_intent.child_id
    OR v_saved.quote_pdf_sha256 IS DISTINCT FROM p_document_sha256
    OR v_saved.quote_pdf_path IS DISTINCT FROM v_intent.document_path
    OR (v_saved.quote_state -> 'motor' ->> 'id') IS DISTINCT FROM p_motor_id::text
    OR v_saved.deposit_amount IS DISTINCT FROM v_amount
    OR v_saved.user_id IS DISTINCT FROM v_intent.owner_user_id
    OR v_saved.is_soft_lead IS TRUE
    OR v_saved.email IS NULL
    OR btrim(v_saved.email) = ''
    OR v_saved.customer_full_name IS NULL
    OR btrim(v_saved.customer_full_name) = ''
    OR NULLIF(btrim(v_saved.customer_address_line1),'') IS NULL
    OR NULLIF(btrim(v_saved.customer_city),'') IS NULL
    OR NULLIF(btrim(v_saved.customer_region),'') IS NULL
    OR NULLIF(btrim(v_saved.customer_postal_code),'') IS NULL
    OR NULLIF(btrim(v_saved.customer_country),'') IS NULL
    OR v_saved.customer_phone IS NULL
    OR btrim(v_saved.customer_phone) = ''
    OR v_saved.deposit_status NOT IN ('pending', 'paid')
  THEN
    RETURN false;
  END IF;

  IF v_saved.deposit_status = 'paid' THEN
    IF v_quote.id IS NULL
      OR v_quote.payment_status IS DISTINCT FROM 'paid'
      OR v_quote.stripe_payment_intent_id IS DISTINCT FROM p_payment_intent_id
      OR v_intent.status IS DISTINCT FROM 'paid'
    THEN
      RETURN false;
    END IF;
    RETURN true;
  END IF;

  v_motor_model := COALESCE(
    v_saved.quote_state -> 'motor' ->> 'model_display',
    v_saved.quote_state -> 'motor' ->> 'model',
    'Mercury motor'
  );
  v_motor_hp := v_intent.horsepower;
  v_policy := v_saved.quote_state -> 'depositPolicySnapshot';
  v_lease := (p_deposit_paid_at + interval '5 minutes')::text;
  v_quote_data := jsonb_build_object(
    'deposit_amount', trim(to_char(v_amount, 'FM999999990.##')),
    'payment_type', 'motor_deposit',
    'payment_channel', 'native_spt',
    'payment_status', 'paid',
    'stripe_payment_intent', p_payment_intent_id,
    'saved_quote_id', p_saved_quote_id::text,
    'motor_id', p_motor_id::text,
    'motor_info', jsonb_build_object('model', v_motor_model, 'hp', v_motor_hp),
    'native_child_id', v_intent.child_id,
    'native_intent_id', v_intent.id::text,
    'notification_status', 'processing',
    'notification_event_id', p_notification_event_id,
    'notification_lease_expires_at', v_lease,
    'deposit_outbox_schema', 1
  );
  IF jsonb_typeof(v_policy) = 'object' THEN
    v_quote_data := v_quote_data || jsonb_build_object('deposit_policy', v_policy);
  END IF;
  IF v_quote_data ? 'stripe_session_id' THEN
    RETURN false;
  END IF;

  PERFORM pg_catalog.set_config('native_deposit.claim', 'on', true);

  UPDATE public.saved_quotes
  SET
    deposit_status = 'paid',
    deposit_amount = v_amount,
    deposit_paid_at = p_deposit_paid_at
  WHERE id = p_saved_quote_id
    AND deposit_status = 'pending';

  IF v_quote.id IS NULL THEN
    INSERT INTO public.customer_quotes (
      customer_name,
      customer_email,
      customer_phone,
      customer_address_line1,
      customer_address_line2,
      customer_city,
      customer_region,
      customer_postal_code,
      customer_country,
      user_id,
      saved_quote_id,
      stripe_checkout_session_id,
      stripe_payment_intent_id,
      payment_status,
      payment_paid_at,
      deposit_amount,
      base_price,
      final_price,
      total_cost,
      loan_amount,
      monthly_payment,
      term_months,
      penalty_applied,
      lead_source,
      lead_status,
      motor_model_id,
      quote_data
    ) VALUES (
      v_saved.customer_full_name,
      v_saved.email,
      v_saved.customer_phone,
      v_saved.customer_address_line1,
      v_saved.customer_address_line2,
      v_saved.customer_city,
      v_saved.customer_region,
      v_saved.customer_postal_code,
      v_saved.customer_country,
      v_saved.user_id,
      p_saved_quote_id,
      NULL,
      p_payment_intent_id,
      'paid',
      p_deposit_paid_at,
      v_amount,
      0,
      0,
      0,
      0,
      0,
      0,
      false,
      'deposit',
      'scheduled',
      p_motor_id,
      v_quote_data
    )
    RETURNING id INTO v_quote_id;
  ELSE
    UPDATE public.customer_quotes
    SET
      stripe_checkout_session_id = NULL,
      stripe_payment_intent_id = p_payment_intent_id,
      payment_status = 'paid',
      payment_paid_at = p_deposit_paid_at,
      deposit_amount = v_amount,
      lead_status = 'scheduled',
      motor_model_id = p_motor_id,
      quote_data = v_quote_data
    WHERE id = v_quote.id
      AND lead_source = 'deposit'
      AND stripe_checkout_session_id IS NULL
      AND COALESCE(quote_data ->> 'stripe_session_id', '') = ''
      AND quote_data ->> 'payment_channel' = 'native_spt'
      AND (stripe_payment_intent_id IS NULL OR stripe_payment_intent_id = p_payment_intent_id)
    RETURNING id INTO v_quote_id;
    IF v_quote_id IS NULL THEN
      -- An exception rolls back saved/attempt/intent/outbox changes too. Returning
      -- false here would commit a partially paid pair.
      RAISE EXCEPTION 'native customer paid claim lost ownership' USING ERRCODE = '40001';
    END IF;
  END IF;

  UPDATE public.native_deposit_attempts
  SET status = 'succeeded'
  WHERE id = p_attempt_id;

  UPDATE public.native_deposit_intents
  SET status = 'paid', receipt_reconciliation_required = false
  WHERE id = p_intent_id;

  INSERT INTO public.deposit_email_deliveries (customer_quote_id, saved_quote_id, audience)
  SELECT v_quote_id, p_saved_quote_id, audience
  FROM (VALUES ('customer'), ('hbw'), ('grok_bot')) AS audiences(audience)
  ON CONFLICT (customer_quote_id, audience) DO NOTHING;

  RETURN true;
END;
$$;

-- Diagnostic observation never authorizes payment or changes the verified PI.
CREATE FUNCTION public.observe_native_deposit_payment_intent(p_attempt_id uuid, p_payment_intent_id text)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, public AS $$
BEGIN
  IF p_payment_intent_id IS NULL OR p_payment_intent_id !~ '^pi_(test_|live_)?[A-Za-z0-9]+$' THEN RETURN false; END IF;
  UPDATE public.native_deposit_attempts SET observed_payment_intent_id = COALESCE(observed_payment_intent_id, p_payment_intent_id)
  WHERE id = p_attempt_id AND submitted_at IS NOT NULL
    AND (observed_payment_intent_id IS NULL OR observed_payment_intent_id = p_payment_intent_id);
  RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.observe_native_deposit_payment_intent(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.observe_native_deposit_payment_intent(uuid,text) TO service_role;

REVOKE ALL ON FUNCTION public.enforce_native_deposit_intent_bindings() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.enforce_native_deposit_approval_writer() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.enforce_native_deposit_attempt_bindings() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.enforce_native_deposit_canonical_freeze() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.enforce_native_deposit_hosted_exclusion() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.native_deposit_attempt_blocks_quote(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.native_deposit_attempt_blocks_quote(uuid) TO service_role;
REVOKE ALL ON FUNCTION public.native_deposit_blocks_hosted_checkout(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.record_native_deposit_buyer_approval(uuid, text, uuid, uuid, integer, text, text, text, text, timestamptz) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_native_deposit_attempt(uuid, text, text, integer, text, boolean) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bind_native_deposit_payment_intent(uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.claim_native_motor_deposit_paid(uuid, uuid, uuid, text, integer, text, uuid, text, text, text, text, timestamptz) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.native_deposit_blocks_hosted_checkout(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.record_native_deposit_buyer_approval(uuid, text, uuid, uuid, integer, text, text, text, text, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_native_deposit_attempt(uuid, text, text, integer, text, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.bind_native_deposit_payment_intent(uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_native_motor_deposit_paid(uuid, uuid, uuid, text, integer, text, uuid, text, text, text, text, timestamptz) TO service_role;

-- One-use UI challenge. Raw nonce and authorization credentials never persist.
CREATE TABLE public.native_deposit_review_challenges (
  nonce_hash text PRIMARY KEY CHECK (nonce_hash ~ '^[0-9a-f]{64}$'),
  intent_id uuid NOT NULL REFERENCES public.native_deposit_intents(id),
  actor_fingerprint text NOT NULL CHECK (actor_fingerprint ~ '^[0-9a-f]{64}$'),
  review_digest text NOT NULL CHECK (review_digest ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz
);
ALTER TABLE public.native_deposit_review_challenges ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.native_deposit_review_challenges FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT ON public.native_deposit_review_challenges TO service_role;
CREATE FUNCTION public.approve_native_deposit_review(p_intent_id uuid, p_nonce_hash text, p_actor_fingerprint text, p_review_digest text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE v_intent public.native_deposit_intents%ROWTYPE; v_challenge public.native_deposit_review_challenges%ROWTYPE; v_ok boolean;
BEGIN
  PERFORM 1 FROM public.saved_quotes WHERE id = (SELECT saved_quote_id FROM public.native_deposit_intents WHERE id = p_intent_id) FOR UPDATE;
  SELECT * INTO v_intent FROM public.native_deposit_intents WHERE id = p_intent_id FOR UPDATE;
  SELECT * INTO v_challenge FROM public.native_deposit_review_challenges WHERE nonce_hash = p_nonce_hash FOR UPDATE;
  IF NOT FOUND OR v_challenge.intent_id IS DISTINCT FROM p_intent_id
    OR v_challenge.actor_fingerprint IS DISTINCT FROM p_actor_fingerprint
    OR v_challenge.review_digest IS DISTINCT FROM p_review_digest
    OR v_challenge.consumed_at IS NOT NULL OR v_challenge.expires_at <= now()
    OR v_intent.status IS DISTINCT FROM 'requires_escalation' THEN RETURN false; END IF;
  v_ok := public.record_native_deposit_buyer_approval(v_intent.id, v_intent.child_id, v_intent.saved_quote_id,
    v_intent.motor_id, v_intent.amount_cents, v_intent.document_sha256, v_intent.policy_version,
    v_intent.policy_code, v_intent.terms_version, v_intent.expires_at);
  IF NOT v_ok THEN RETURN false; END IF;
  UPDATE public.native_deposit_review_challenges SET consumed_at = now() WHERE nonce_hash = p_nonce_hash;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.approve_native_deposit_review(uuid,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.approve_native_deposit_review(uuid,text,text,text) TO service_role;

COMMIT;
