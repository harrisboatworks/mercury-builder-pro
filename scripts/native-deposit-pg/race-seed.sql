SET ROLE service_role;
SELECT public.record_native_deposit_buyer_approval('74747474-7474-4474-8474-747474747474','ndc_74747474747444748474747474747474','74747474-7474-4474-8474-747474747474','36363636-3636-4636-8636-363636363636',50000,repeat('a',64),'deposit-policy/v1','in_stock_refundable','hbw-reservation-terms/2026-04-08', now()+interval '10 minutes');
SELECT public.claim_native_deposit_attempt('74747474-7474-4474-8474-747474747474',repeat('1',64),repeat('2',64),50000,'acct_synthetic',false);
SELECT public.begin_native_deposit_submission(id,repeat('1',64),repeat('2',64),50000,'acct_synthetic',false,now()+interval '7 days') FROM public.native_deposit_attempts WHERE intent_id='74747474-7474-4474-8474-747474747474';
SELECT public.bind_native_deposit_payment_intent(id,'pi_race','succeeded') FROM public.native_deposit_attempts WHERE intent_id='74747474-7474-4474-8474-747474747474';
