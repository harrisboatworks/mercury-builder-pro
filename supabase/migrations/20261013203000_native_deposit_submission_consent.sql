-- Link can issue a seven-day test credential. Buyer consent still expires in
-- ten minutes; only this service-only gate can authorize the first submission.
ALTER TABLE public.native_deposit_attempts
  ADD COLUMN submission_approval_id uuid REFERENCES public.native_deposit_approvals(id),
  ADD COLUMN submission_token_expires_at timestamptz;

CREATE OR REPLACE FUNCTION public.guard_native_deposit_submission()
RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.submitted_at IS NOT NULL OR NEW.submission_approval_id IS NOT NULL
      OR NEW.submission_token_expires_at IS NOT NULL THEN
      RAISE EXCEPTION 'First native submission requires fresh buyer consent' USING ERRCODE = '40001';
    END IF;
  ELSIF OLD.submitted_at IS NOT NULL AND NEW.submitted_at IS DISTINCT FROM OLD.submitted_at THEN
    RAISE EXCEPTION 'Native submission timestamp is immutable' USING ERRCODE = '40001';
  ELSIF OLD.submitted_at IS NULL AND NEW.submitted_at IS NOT NULL THEN
    IF current_setting('native_deposit.submission', true) IS DISTINCT FROM NEW.id::text
      OR NEW.submission_approval_id IS NULL OR NEW.submission_token_expires_at IS NULL THEN
      RAISE EXCEPTION 'First native submission requires fresh buyer consent' USING ERRCODE = '40001';
    END IF;
  ELSIF NEW.submission_approval_id IS DISTINCT FROM OLD.submission_approval_id
    OR NEW.submission_token_expires_at IS DISTINCT FROM OLD.submission_token_expires_at THEN
    RAISE EXCEPTION 'Native submission audit is immutable' USING ERRCODE = '40001';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER native_deposit_submission_guard BEFORE INSERT OR UPDATE
  ON public.native_deposit_attempts FOR EACH ROW EXECUTE FUNCTION public.guard_native_deposit_submission();

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
  IF v_attempt.id IS NULL OR v_intent.id IS NULL OR v_saved.id IS NULL
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
    OR v_attempt.status NOT IN ('claimed','failed')
    OR v_intent.status NOT IN ('attempt_claimed','failed')
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
REVOKE ALL ON FUNCTION public.begin_native_deposit_submission(uuid,text,text,integer,text,boolean,timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.begin_native_deposit_submission(uuid,text,text,integer,text,boolean,timestamptz) TO service_role;
REVOKE ALL ON FUNCTION public.guard_native_deposit_submission() FROM PUBLIC, anon, authenticated;

-- Keep old submitted attempts recoverable, but remove the generic first-submit
-- bypass. Neither callers nor webhook processing may create first consent.
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

  IF p_status IN ('submitted','succeeded') AND v_attempt.submitted_at IS NULL THEN RETURN false; END IF;
  IF v_attempt.status = 'succeeded' THEN RETURN true; END IF;

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

-- A submission clock sampled after locks can exceed transaction-start now().
-- Validate paid reconciliation against the current clock as well.
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
    OR (v_quote.quote_data ->> 'payment_channel') IS DISTINCT FROM 'native_spt'
    OR (v_quote.stripe_payment_intent_id IS NOT NULL AND v_quote.stripe_payment_intent_id IS DISTINCT FROM p_payment_intent_id)
    OR (COALESCE(v_quote.quote_data ->> 'stripe_payment_intent', '') <> '' AND v_quote.quote_data ->> 'stripe_payment_intent' IS DISTINCT FROM p_payment_intent_id)
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

  IF NOT EXISTS (SELECT 1 FROM public.deposit_payment_rails
    WHERE saved_quote_id = p_saved_quote_id AND rail = 'native') THEN
    RETURN false;
  END IF;

  -- A concurrent winner may insert the initially absent customer row while we
  -- wait for the saved-row lock. Refresh it without acquiring a reverse-order
  -- row lock; an idempotent paid return makes no customer-row mutation.
  SELECT * INTO v_quote FROM public.customer_quotes AS cq
    WHERE cq.saved_quote_id = p_saved_quote_id AND cq.lead_source = 'deposit';

  IF v_quote.id IS NOT NULL AND (
    v_quote.stripe_checkout_session_id IS NOT NULL
    OR COALESCE(v_quote.quote_data ->> 'stripe_session_id', '') <> ''
    OR (v_quote.quote_data ->> 'payment_channel') IS DISTINCT FROM 'native_spt'
    OR (v_quote.stripe_payment_intent_id IS NOT NULL AND v_quote.stripe_payment_intent_id IS DISTINCT FROM p_payment_intent_id)
    OR (COALESCE(v_quote.quote_data ->> 'stripe_payment_intent', '') <> '' AND v_quote.quote_data ->> 'stripe_payment_intent' IS DISTINCT FROM p_payment_intent_id)
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
    OR v_attempt.submitted_at > clock_timestamp()
    OR (v_attempt.submission_approval_id IS NOT NULL AND (
      v_attempt.submission_approval_id IS DISTINCT FROM v_approval.id
      OR v_attempt.submission_token_expires_at IS NULL
      OR v_attempt.submitted_at >= v_attempt.submission_token_expires_at))
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
      AND (COALESCE(quote_data ->> 'stripe_payment_intent', '') = '' OR quote_data ->> 'stripe_payment_intent' = p_payment_intent_id)
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

-- Approval retains the trusted review's ten-minute deadline, never the
-- parent quote's longer lifetime. Waiting for locks cannot revive a challenge.
CREATE OR REPLACE FUNCTION public.approve_native_deposit_review(p_intent_id uuid, p_nonce_hash text, p_actor_fingerprint text, p_review_digest text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE v_intent public.native_deposit_intents%ROWTYPE; v_challenge public.native_deposit_review_challenges%ROWTYPE; v_ok boolean;
BEGIN
  PERFORM 1 FROM public.saved_quotes WHERE id = (SELECT saved_quote_id FROM public.native_deposit_intents WHERE id = p_intent_id) FOR UPDATE;
  SELECT * INTO v_intent FROM public.native_deposit_intents WHERE id = p_intent_id FOR UPDATE;
  SELECT * INTO v_challenge FROM public.native_deposit_review_challenges WHERE nonce_hash = p_nonce_hash FOR UPDATE;
  IF NOT FOUND OR v_challenge.intent_id IS DISTINCT FROM p_intent_id
    OR v_challenge.actor_fingerprint IS DISTINCT FROM p_actor_fingerprint
    OR v_challenge.review_digest IS DISTINCT FROM p_review_digest
    OR v_challenge.consumed_at IS NOT NULL OR v_challenge.expires_at <= clock_timestamp()
    OR v_intent.status IS DISTINCT FROM 'requires_escalation' THEN RETURN false; END IF;
  v_ok := public.record_native_deposit_buyer_approval(v_intent.id, v_intent.child_id, v_intent.saved_quote_id,
    v_intent.motor_id, v_intent.amount_cents, v_intent.document_sha256, v_intent.policy_version,
    v_intent.policy_code, v_intent.terms_version, LEAST(v_intent.expires_at, v_challenge.expires_at, now() + interval '10 minutes'));
  IF NOT v_ok THEN RETURN false; END IF;
  UPDATE public.native_deposit_review_challenges SET consumed_at = clock_timestamp() WHERE nonce_hash = p_nonce_hash;
  RETURN true;
END;
$$;

-- Service API callers may update processor outcomes, never first-submission
-- consent or its immutable audit. The definer gate alone owns those columns.
REVOKE UPDATE ON public.native_deposit_attempts FROM service_role;
GRANT UPDATE(status, stripe_payment_intent_id, observed_payment_intent_id)
  ON public.native_deposit_attempts TO service_role;
REVOKE ALL ON FUNCTION public.approve_native_deposit_review(uuid,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_native_deposit_review(uuid,text,text,text) TO service_role;
