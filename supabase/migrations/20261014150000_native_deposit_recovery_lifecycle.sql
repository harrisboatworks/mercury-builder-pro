-- Recover only provably never-submitted attempts; retain all prior consent and
-- processor audit. Submitted money authority is never timed out or replaced.
BEGIN;
ALTER TABLE public.native_deposit_intents ADD COLUMN retired_at timestamptz;
ALTER TABLE public.native_deposit_intents DROP CONSTRAINT native_deposit_intents_saved_quote_id_key;
CREATE UNIQUE INDEX native_deposit_one_active_quote ON public.native_deposit_intents(saved_quote_id) WHERE retired_at IS NULL;
CREATE OR REPLACE FUNCTION public.enforce_native_deposit_intent_bindings()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.retired_at IS NOT NULL THEN RAISE EXCEPTION 'New native intent cannot be retired' USING ERRCODE='23514'; END IF;
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

  IF OLD.retired_at IS NOT NULL AND (NEW.retired_at IS DISTINCT FROM OLD.retired_at OR NEW.status IS DISTINCT FROM 'canceled')
    OR NEW.retired_at IS DISTINCT FROM OLD.retired_at AND (current_setting('native_deposit.retire',true) IS DISTINCT FROM NEW.id::text OR NEW.status IS DISTINCT FROM 'canceled')
    OR OLD.status='paid' AND NEW.status IS DISTINCT FROM 'paid' THEN
    RAISE EXCEPTION 'Native payment lifecycle is immutable' USING ERRCODE='23514';
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
  IF NOT EXISTS (
    SELECT 1 FROM public.native_deposit_intents i
    LEFT JOIN public.native_deposit_approvals p ON p.intent_id=i.id
    LEFT JOIN public.native_deposit_attempts a ON a.intent_id=i.id
    WHERE i.saved_quote_id=NEW.id AND (i.status='paid' OR a.submitted_at IS NOT NULL
      OR a.stripe_payment_intent_id IS NOT NULL OR a.observed_payment_intent_id IS NOT NULL
      OR i.retired_at IS NULL AND p.expires_at > clock_timestamp())
  ) THEN
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
    OR NEW.expires_at IS DISTINCT FROM OLD.expires_at
    OR NEW.user_id IS DISTINCT FROM OLD.user_id
  THEN
    RAISE EXCEPTION 'canonical deposit authority is frozen during a native payment attempt'
      USING ERRCODE = '40001';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.retire_unsubmitted_native_deposit(p_intent_id uuid, p_if_consent_expired boolean DEFAULT false)
RETURNS boolean LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE v_saved_id uuid; v_saved public.saved_quotes%ROWTYPE; v_quote public.customer_quotes%ROWTYPE;
  v_intent public.native_deposit_intents%ROWTYPE; v_approval public.native_deposit_approvals%ROWTYPE;
  v_attempt public.native_deposit_attempts%ROWTYPE;
BEGIN
  SELECT saved_quote_id INTO v_saved_id FROM public.native_deposit_intents WHERE id=p_intent_id;
  IF v_saved_id IS NULL THEN RETURN false; END IF;
  -- Match claim/begin/paid lock order; retirement and the pre-POST marker have one winner.
  SELECT * INTO v_quote FROM public.customer_quotes WHERE saved_quote_id=v_saved_id AND lead_source='deposit' FOR UPDATE;
  SELECT * INTO v_saved FROM public.saved_quotes WHERE id=v_saved_id FOR UPDATE;
  SELECT * INTO v_intent FROM public.native_deposit_intents WHERE id=p_intent_id FOR UPDATE;
  SELECT * INTO v_approval FROM public.native_deposit_approvals WHERE intent_id=p_intent_id FOR UPDATE;
  SELECT * INTO v_attempt FROM public.native_deposit_attempts WHERE intent_id=p_intent_id FOR UPDATE;
  PERFORM 1 FROM public.deposit_payment_rails WHERE saved_quote_id=v_saved_id FOR UPDATE;
  IF v_intent.retired_at IS NOT NULL THEN RETURN true; END IF;
  IF v_saved.id IS NULL OR v_saved.deposit_status='paid' OR v_intent.status='paid'
    OR v_attempt.submitted_at IS NOT NULL OR v_attempt.stripe_payment_intent_id IS NOT NULL
    OR v_attempt.observed_payment_intent_id IS NOT NULL OR v_attempt.status='succeeded'
    OR v_quote.stripe_payment_intent_id IS NOT NULL OR NULLIF(v_quote.quote_data->>'stripe_payment_intent','') IS NOT NULL
    OR v_quote.payment_status='paid'
    OR p_if_consent_expired AND v_approval.expires_at > clock_timestamp() THEN RETURN false; END IF;
  PERFORM set_config('native_deposit.retire',p_intent_id::text,true);
  UPDATE public.native_deposit_intents SET status='canceled',retired_at=clock_timestamp() WHERE id=p_intent_id;
  PERFORM set_config('native_deposit.retire','',true);
  DELETE FROM public.deposit_payment_rails WHERE saved_quote_id=v_saved_id AND rail='native';
  -- Approval/attempt/challenge rows are retained as audit. Old IDs can never submit again.
  RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.retire_unsubmitted_native_deposit(uuid,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.retire_unsubmitted_native_deposit(uuid,boolean) TO service_role;


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
    WHERE i.saved_quote_id = p_saved_quote_id AND i.retired_at IS NULL
      AND (
        i.status = 'paid'
        OR a.submitted_at IS NOT NULL OR a.observed_payment_intent_id IS NOT NULL
        OR a.stripe_payment_intent_id IS NOT NULL
        OR a.status IN ('claimed', 'submitted', 'requires_action', 'processing', 'unknown', 'succeeded')
      )
  );
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
    OR v_intent.retired_at IS NOT NULL
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
    IF v_attempt.observed_payment_intent_id IS NOT NULL AND v_attempt.stripe_payment_intent_id IS NULL THEN
      RETURN jsonb_build_object('result', 'refused', 'reason', 'reconciliation_required');
    END IF;
    -- Identical never-submitted preflight failures may retry validation.
    -- Any submitted/observed processor failure remains held without a bound PI.
    IF v_attempt.status = 'failed' AND v_attempt.stripe_payment_intent_id IS NULL
      AND (v_attempt.submitted_at IS NOT NULL OR v_attempt.observed_payment_intent_id IS NOT NULL) THEN
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

CREATE OR REPLACE FUNCTION public.begin_native_deposit_submission(
  p_attempt_id uuid, p_token_fingerprint text, p_processor_params_hash text,
  p_amount_cents integer, p_seller_account_id text, p_livemode boolean,
  p_token_expires_at timestamptz
) RETURNS boolean LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = pg_catalog, public AS $$
DECLARE
  v_intent_id uuid;
  v_saved_id uuid;
  v_saved public.saved_quotes%ROWTYPE;
  v_quote public.customer_quotes%ROWTYPE;
  v_intent public.native_deposit_intents%ROWTYPE;
  v_approval public.native_deposit_approvals%ROWTYPE;
  v_attempt public.native_deposit_attempts%ROWTYPE;
  v_rail text;
  v_now timestamptz;
BEGIN
  SELECT a.intent_id, i.saved_quote_id INTO v_intent_id, v_saved_id
    FROM public.native_deposit_attempts a JOIN public.native_deposit_intents i ON i.id=a.intent_id
    WHERE a.id=p_attempt_id;
  IF NOT FOUND THEN RETURN false; END IF;
  -- Same lock order as attempt claiming and paired paid reconciliation.
  SELECT * INTO v_quote FROM public.customer_quotes
    WHERE saved_quote_id=v_saved_id AND lead_source='deposit' FOR UPDATE;
  SELECT * INTO v_saved FROM public.saved_quotes WHERE id=v_saved_id FOR UPDATE;
  SELECT * INTO v_intent FROM public.native_deposit_intents WHERE id=v_intent_id FOR UPDATE;
  SELECT * INTO v_approval FROM public.native_deposit_approvals WHERE intent_id=v_intent_id FOR UPDATE;
  SELECT * INTO v_attempt FROM public.native_deposit_attempts WHERE id=p_attempt_id FOR UPDATE;
  SELECT rail INTO v_rail FROM public.deposit_payment_rails WHERE saved_quote_id=v_saved_id FOR UPDATE;
  -- Transaction-start now() would allow consent to expire while waiting above.
  v_now := clock_timestamp();
  IF v_attempt.id IS NULL OR v_intent.id IS NULL OR v_saved.id IS NULL OR v_intent.retired_at IS NOT NULL
    OR v_attempt.intent_id IS DISTINCT FROM v_intent_id
    OR v_attempt.token_fingerprint IS DISTINCT FROM p_token_fingerprint
    OR v_attempt.processor_params_hash IS DISTINCT FROM p_processor_params_hash
    OR v_attempt.amount_cents IS DISTINCT FROM p_amount_cents
    OR v_attempt.seller_account_id IS DISTINCT FROM p_seller_account_id
    OR v_attempt.livemode IS DISTINCT FROM p_livemode
    OR v_attempt.idempotency_key IS DISTINCT FROM 'native-deposit-pi:' || v_intent_id::text
    OR v_attempt.currency IS DISTINCT FROM 'CAD' THEN RETURN false; END IF;
  -- Existing submitted attempts retain the same processor identity and recovery
  -- authority. This never refreshes consent or replaces the credential/audit.
  IF v_attempt.submitted_at IS NOT NULL THEN RETURN true; END IF;
  IF v_attempt.stripe_payment_intent_id IS NOT NULL OR v_attempt.observed_payment_intent_id IS NOT NULL
    OR v_attempt.status NOT IN ('claimed','failed','unknown')
    OR v_intent.status NOT IN ('attempt_claimed','failed','unknown')
    OR v_rail IS DISTINCT FROM 'native'
    OR v_approval.id IS NULL
    OR v_approval.approved_at > v_now
    OR v_approval.expires_at <= v_now
    OR v_approval.expires_at > v_approval.approved_at + interval '10 minutes'
    OR v_intent.expires_at <= v_now
    OR v_saved.expires_at IS NULL OR v_saved.expires_at <= v_now
    OR p_token_expires_at IS NULL OR NOT isfinite(p_token_expires_at)
    OR p_token_expires_at <= v_now OR p_token_expires_at > v_now + interval '7 days'
    OR v_saved.deposit_status IS DISTINCT FROM 'pending' OR v_saved.is_soft_lead IS TRUE
    OR v_saved.user_id IS DISTINCT FROM v_intent.owner_user_id
    OR v_saved.quote_pdf_path IS DISTINCT FROM v_intent.document_path
    OR v_saved.quote_pdf_sha256 IS DISTINCT FROM v_intent.document_sha256
    OR v_saved.quote_state -> 'motor' ->> 'id' IS DISTINCT FROM v_intent.motor_id::text
    OR v_saved.deposit_amount * 100 IS DISTINCT FROM v_intent.amount_cents::numeric
    OR NULLIF(btrim(v_saved.email),'') IS NULL
    OR NULLIF(btrim(v_saved.customer_full_name),'') IS NULL
    OR NULLIF(btrim(v_saved.customer_phone),'') IS NULL
    OR NULLIF(btrim(v_saved.customer_address_line1),'') IS NULL
    OR NULLIF(btrim(v_saved.customer_city),'') IS NULL
    OR NULLIF(btrim(v_saved.customer_region),'') IS NULL
    OR NULLIF(btrim(v_saved.customer_postal_code),'') IS NULL
    OR NULLIF(btrim(v_saved.customer_country),'') IS NULL
    OR v_approval.child_id IS DISTINCT FROM v_intent.child_id
    OR v_approval.saved_quote_id IS DISTINCT FROM v_intent.saved_quote_id
    OR v_approval.motor_id IS DISTINCT FROM v_intent.motor_id
    OR v_approval.amount_cents IS DISTINCT FROM v_intent.amount_cents
    OR v_approval.currency IS DISTINCT FROM v_intent.currency
    OR v_approval.document_sha256 IS DISTINCT FROM v_intent.document_sha256
    OR v_approval.policy_version IS DISTINCT FROM v_intent.policy_version
    OR v_approval.policy_code IS DISTINCT FROM v_intent.policy_code
    OR v_approval.terms_version IS DISTINCT FROM v_intent.terms_version
    OR (v_quote.id IS NOT NULL AND (
      v_quote.payment_status='paid' OR v_quote.stripe_checkout_session_id IS NOT NULL
      OR NULLIF(v_quote.quote_data->>'stripe_session_id','') IS NOT NULL
      OR NULLIF(v_quote.quote_data->>'stripe_payment_intent','') IS NOT NULL
      OR v_quote.stripe_payment_intent_id IS NOT NULL
      OR v_quote.quote_data->>'payment_channel' IS DISTINCT FROM 'native_spt'))
  THEN RETURN false; END IF;
  PERFORM set_config('native_deposit.submission', p_attempt_id::text, true);
  UPDATE public.native_deposit_attempts SET status='submitted', submitted_at=v_now,
    submission_approval_id=v_approval.id, submission_token_expires_at=p_token_expires_at
    WHERE id=p_attempt_id;
  PERFORM set_config('native_deposit.submission', '', true);
  RETURN true;
END; $$;

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

  PERFORM 1 FROM public.native_deposit_intents WHERE id = (SELECT intent_id FROM public.native_deposit_attempts WHERE id = p_attempt_id) AND retired_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;

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

  IF p_status IN ('submitted','succeeded') AND v_attempt.submitted_at IS NULL THEN RETURN false; END IF;
  IF v_attempt.status = 'succeeded' THEN RETURN true; END IF;
  -- An uncertain/null response is not a processor observation. Concurrent
  -- idempotency errors and unavailable GETs must retain the known PI state.
  IF v_attempt.stripe_payment_intent_id IS NOT NULL AND
    (p_payment_intent_id IS NULL OR p_status IN ('claimed','submitted','unknown')) THEN RETURN true; END IF;
  -- A delayed bank-action observation cannot regress a payment already processing.
  IF v_attempt.status='processing' AND p_status='requires_action'
    OR v_attempt.stripe_payment_intent_id IS NOT NULL AND v_attempt.status='failed' AND p_status IN ('requires_action','processing') THEN RETURN true; END IF;

  UPDATE public.native_deposit_attempts
  SET
    stripe_payment_intent_id = COALESCE(p_payment_intent_id, stripe_payment_intent_id),
    status = p_status
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
COMMIT;
