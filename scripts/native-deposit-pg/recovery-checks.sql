-- Synthetic local acceptance; no processor calls.
INSERT INTO public.saved_quotes(id,user_id,email,resume_token,quote_state,deposit_status,deposit_amount,quote_pdf_path,quote_pdf_sha256,
 customer_full_name,customer_phone,customer_address_line1,customer_city,customer_region,customer_postal_code,customer_country)
SELECT '75757575-7575-4575-8575-757575757575',user_id,email,'dep_'||repeat('7',24),quote_state,'pending',deposit_amount,
 'saved-quotes/75757575-7575-4575-8575-757575757575/quote.pdf',quote_pdf_sha256,customer_full_name,customer_phone,customer_address_line1,customer_city,customer_region,customer_postal_code,customer_country
FROM public.saved_quotes WHERE id='73737373-7373-4373-8373-737373737373';
INSERT INTO public.native_deposit_intents(id,child_id,parent_session_id,saved_quote_id,owner_user_id,motor_id,amount_cents,currency,merchandise_cents,document_sha256,document_path,policy_version,policy_code,terms_version,catalog_model_number,horsepower,status,expires_at)
SELECT '75757575-7575-4575-8575-757575757575','ndc_75757575757545758575757575757575',parent_session_id,'75757575-7575-4575-8575-757575757575',owner_user_id,motor_id,amount_cents,currency,merchandise_cents,document_sha256,
 'saved-quotes/75757575-7575-4575-8575-757575757575/quote.pdf',policy_version,policy_code,terms_version,catalog_model_number,horsepower,'requires_escalation',now()+interval '1 hour'
FROM public.native_deposit_intents WHERE id='73737373-7373-4373-8373-737373737373';
SET ROLE service_role;
DO $$ DECLARE old_id uuid:='75757575-7575-4575-8575-757575757575'; attempt uuid; BEGIN
 IF NOT public.record_native_deposit_buyer_approval(old_id,'ndc_75757575757545758575757575757575',old_id,'36363636-3636-4636-8636-363636363636',50000,repeat('a',64),'deposit-policy/v1','in_stock_refundable','hbw-reservation-terms/2026-04-08',now()+interval '10 minutes') THEN RAISE EXCEPTION 'fresh approval refused'; END IF;
 PERFORM public.claim_native_deposit_attempt(old_id,repeat('5',64),repeat('6',64),50000,'acct_synthetic',false);
 IF public.retire_unsubmitted_native_deposit(old_id,true) THEN RAISE EXCEPTION 'automatic renewal revoked fresh consent'; END IF;
 IF NOT public.retire_unsubmitted_native_deposit(old_id,false) THEN RAISE EXCEPTION 'buyer cancellation of unsubmitted failed'; END IF;
 IF (SELECT count(*) FROM public.native_deposit_approvals WHERE intent_id=old_id)<>1 OR (SELECT count(*) FROM public.native_deposit_attempts WHERE intent_id=old_id)<>1 THEN RAISE EXCEPTION 'audit lost'; END IF;
 SELECT id INTO attempt FROM public.native_deposit_attempts WHERE intent_id=old_id;
 IF public.begin_native_deposit_submission(attempt,repeat('5',64),repeat('6',64),50000,'acct_synthetic',false,now()+interval '7 days') THEN RAISE EXCEPTION 'retired identity submitted'; END IF;
 IF public.bind_native_deposit_payment_intent(attempt,NULL,'unknown') THEN RAISE EXCEPTION 'retired state rebound'; END IF;
 IF NOT public.claim_hosted_deposit_rail(old_id) THEN RAISE EXCEPTION 'cancellation failed to release hosted rail'; END IF;
 IF public.retire_unsubmitted_native_deposit('71717171-7171-4171-8171-717171717171',false) THEN RAISE EXCEPTION 'paid payment retired'; END IF;
 UPDATE public.saved_quotes SET resume_token='dep_'||repeat('8',24) WHERE id='71717171-7171-4171-8171-717171717171';
 BEGIN
  UPDATE public.saved_quotes SET customer_full_name='Changed' WHERE id='71717171-7171-4171-8171-717171717171';
  RAISE EXCEPTION 'paid customer binding changed';
 EXCEPTION WHEN serialization_failure THEN NULL; END;
END; $$;
RESET ROLE;
-- Hosted test claim itself made no external call. Only local superuser cleanup
-- prepares this same synthetic quote for the alternate fresh native route.
DELETE FROM public.deposit_payment_rails WHERE saved_quote_id='75757575-7575-4575-8575-757575757575';
INSERT INTO public.native_deposit_intents(id,child_id,parent_session_id,saved_quote_id,owner_user_id,motor_id,amount_cents,currency,merchandise_cents,document_sha256,document_path,policy_version,policy_code,terms_version,catalog_model_number,horsepower,status,expires_at)
SELECT '76767676-7676-4676-8676-767676767676','ndc_76767676767646768676767676767676',parent_session_id,saved_quote_id,owner_user_id,motor_id,amount_cents,currency,merchandise_cents,document_sha256,document_path,policy_version,policy_code,terms_version,catalog_model_number,horsepower,'requires_escalation',expires_at FROM public.native_deposit_intents WHERE id='75757575-7575-4575-8575-757575757575';
SET ROLE service_role;
DO $$ DECLARE new_id uuid:='76767676-7676-4676-8676-767676767676'; saved_id uuid:='75757575-7575-4575-8575-757575757575'; attempt uuid; BEGIN
 IF NOT public.record_native_deposit_buyer_approval(new_id,'ndc_76767676767646768676767676767676',saved_id,'36363636-3636-4636-8636-363636363636',50000,repeat('a',64),'deposit-policy/v1','in_stock_refundable','hbw-reservation-terms/2026-04-08',now()+interval '10 minutes') THEN RAISE EXCEPTION 'fresh superseding review refused'; END IF;
 PERFORM public.claim_native_deposit_attempt(new_id,repeat('7',64),repeat('8',64),50000,'acct_synthetic',false);
 SELECT id INTO attempt FROM public.native_deposit_attempts WHERE intent_id=new_id;
 IF NOT public.begin_native_deposit_submission(attempt,repeat('7',64),repeat('8',64),50000,'acct_synthetic',false,now()+interval '7 days') THEN RAISE EXCEPTION 'fresh submission failed'; END IF;
 IF public.retire_unsubmitted_native_deposit(new_id,false) THEN RAISE EXCEPTION 'submitted identity retired'; END IF;
 PERFORM public.bind_native_deposit_payment_intent(attempt,'pi_monotonic','requires_action');
 PERFORM public.bind_native_deposit_payment_intent(attempt,NULL,'unknown');
 PERFORM public.bind_native_deposit_payment_intent(attempt,'pi_monotonic','unknown');
 IF (SELECT status FROM public.native_deposit_attempts WHERE id=attempt)<>'requires_action' OR (SELECT status FROM public.native_deposit_intents WHERE id=new_id)<>'requires_action' THEN RAISE EXCEPTION 'uncertainty regressed bank action'; END IF;
 PERFORM public.bind_native_deposit_payment_intent(attempt,'pi_monotonic','processing');
 PERFORM public.bind_native_deposit_payment_intent(attempt,'pi_monotonic','requires_action');
 IF (SELECT status FROM public.native_deposit_attempts WHERE id=attempt)<>'processing' THEN RAISE EXCEPTION 'stale bank observation regressed processing'; END IF;
 IF public.claim_hosted_deposit_rail(saved_id) THEN RAISE EXCEPTION 'hosted crossed submitted money authority'; END IF;
 IF (SELECT count(*) FROM public.native_deposit_intents WHERE saved_quote_id=saved_id)<>2 THEN RAISE EXCEPTION 'retired audit lost'; END IF;
END; $$;
RESET ROLE;
DO $$ BEGIN
 IF has_function_privilege('anon','public.retire_unsubmitted_native_deposit(uuid,boolean)','EXECUTE') OR has_function_privilege('authenticated','public.retire_unsubmitted_native_deposit(uuid,boolean)','EXECUTE') THEN RAISE EXCEPTION 'public cancellation authority exposed'; END IF;
END; $$;
SELECT 'unsubmitted cancellation releases rails, old IDs cannot submit, retained audit, fresh consent, submitted and paid holds, capability rotation, monotonic PI states' AS passed;
