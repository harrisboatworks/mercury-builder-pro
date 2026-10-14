import { nativeDepositBankAction, nativeDepositBankRecoveryAllowed } from '../_shared/native-deposit-bank-action.ts';
import { nativeLiveSellerVerified } from '../_shared/native-deposit-live-config.ts';
import { nativeBuyerReviewAuthorized } from '../_shared/native-buyer-review-authorization.ts';
import { resolveDepositStagingOrigin } from '../_shared/deposit-staging-origin.ts';
import { corsHeaders as sharedCorsHeaders } from '../_shared/cors.ts';
// Trusted buyer UI only. UCP caller fields cannot record approval.
import { createClient } from 'npm:@supabase/supabase-js@2.53.1';
import { nativeDepositCheckoutEnabled, isNativeDepositChildId, runNativeDepositCreate, runNativeDepositComplete } from '../_shared/native-deposit-checkout.ts';
import { nativeActorFromRequest, nativeDepositIo } from '../_shared/native-deposit-io.ts';
import { sha256Hex } from '../_shared/quote-document-policy.ts';
import { DEPOSIT_POLICY_IN_STOCK_TEXT, DEPOSIT_POLICY_SPECIAL_ORDER_TEXT } from '../_shared/deposit-policy.ts';
import { resolveAllowedBrowserOrigin } from '../_shared/browser-origin.ts';
import { createNativeStripePreviewClient } from '../_shared/native-stripe-preview.ts';

Deno.serve(async req => {
  const origin = req.headers.get('origin');
  // A separately configured exact staging origin may be used only with the
  // isolated staging marker. Production retains the existing exact allowlist.
  const allowed = resolveAllowedBrowserOrigin(origin)
    || resolveDepositStagingOrigin(origin, { DEPOSIT_STAGING_MODE: Deno.env.get('DEPOSIT_STAGING_MODE'),
      SUPABASE_URL: Deno.env.get('SUPABASE_URL'), NATIVE_DEPOSIT_REVIEW_ORIGIN: Deno.env.get('NATIVE_DEPOSIT_REVIEW_ORIGIN') });
  const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': sharedCorsHeaders['Access-Control-Allow-Headers'] + ', x-resume-token' };
  if (allowed) headers['Access-Control-Allow-Origin'] = allowed;
  const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
  if (!origin || !allowed) return reply({ error: 'Buyer review must use the trusted site.' }, 403);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);
  const enabled = nativeDepositCheckoutEnabled(Deno.env.get('NATIVE_DEPOSIT_ENABLED'));
  const production = Deno.env.get('SUPABASE_URL') === 'https://eutsoqdpjurknjsshxes.supabase.co';
  const liveActivationRequired = production || Deno.env.get('STRIPE_SECRET_KEY')?.trim().startsWith('sk_live_') === true;
  const sellerVerified = !liveActivationRequired || await nativeLiveSellerVerified({
    SUPABASE_URL: Deno.env.get('SUPABASE_URL'), STRIPE_SECRET_KEY: Deno.env.get('STRIPE_SECRET_KEY'),
    STRIPE_WEBHOOK_SECRET: Deno.env.get('STRIPE_WEBHOOK_SECRET'),
    NATIVE_STRIPE_SELLER_ACCOUNT: Deno.env.get('NATIVE_STRIPE_SELLER_ACCOUNT'),
    NATIVE_STRIPE_SELLER_PROFILE: Deno.env.get('NATIVE_STRIPE_SELLER_PROFILE'),
    NATIVE_DEPOSIT_LIVE_ATTESTATION: Deno.env.get('NATIVE_DEPOSIT_LIVE_ATTESTATION'),
    NATIVE_STRIPE_WEBHOOK_ID: Deno.env.get('NATIVE_STRIPE_WEBHOOK_ID'),
  });
  try {
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
    const token = req.headers.get('authorization')?.match(/^Bearer\s+(\S+)$/i)?.[1];
    const { data: auth, error: authError } = token ? await db.auth.getUser(token) : { data: null, error: true };
    const user = auth?.user;
    if (authError || !user || !user.email_confirmed_at) return reply({ error: 'Sign in with the account that owns this quote.' }, 401);
    const body = await req.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)
      || Object.keys(body).some(k => !['action', 'child_id', 'nonce', 'review_digest', 'accept_terms'].includes(k))
      || !['review', 'approve', 'step_up', 'restart'].includes(body.action) || !isNativeDepositChildId(body.child_id || ''))
      return reply({ error: 'Invalid review request.' }, 400);
    const io = nativeDepositIo(db);
    let intent = await io.loadIntentByChild(body.child_id);
    const quote = intent ? await io.loadSavedQuote(intent.saved_quote_id) : null;
    if (!intent || !quote) return reply({ error: 'Quote unavailable.' }, 404);
    if (quote.deposit_status === 'paid' && intent.status !== 'paid') return reply({ error: 'This quote was paid through hosted checkout. Open its existing receipt.' }, 409);
    const actor = await nativeActorFromRequest(db, req);
    const owns = body.action === 'review' && intent.status === 'paid' && quote.user_id === user.id
      || nativeBuyerReviewAuthorized(quote, user, actor);
    if (!owns) return reply({ error: 'Quote unavailable.' }, 404);
    if ((!enabled || !sellerVerified) && ['approve','restart'].includes(body.action)) return reply({ error: 'New native payments are paused.' }, 409);
    const fingerprint = await sha256Hex(new TextEncoder().encode(`buyer-session:${user.id}:${token}`));
    const existingAttempt = await io.loadAttempt(intent.id);
    const recovering = Boolean(existingAttempt?.submitted_at || existingAttempt?.stripe_payment_intent_id || existingAttempt?.observed_payment_intent_id || intent.status === 'paid');
    if (body.action === 'restart') {
      if (!await io.retireIntent(intent.id, false)) return reply({ error: 'This payment was submitted. Refresh its original status or contact HBW; a new payment cannot be started.' }, 409);
      const next = await runNativeDepositCreate({ caller: { operation: 'motor_reservation', saved_quote_id: quote.id },
        routeParentId: intent.parent_session_id, actor, now: new Date(), intentId: crypto.randomUUID(),
        childId: 'ndc_' + crypto.randomUUID().replaceAll('-', ''), io });
      return reply(next.ok ? { new_child_id: next.checkout.id } : { canceled: true, saved_quote_id: quote.id, message: 'The unsubmitted review was canceled. Reopen your saved quote to prepare a fresh deposit.' });
    }
    const approval = await io.loadApproval(intent.id);
    if (body.action === 'step_up') {
      const attempt = await io.loadAttempt(intent.id);
      if (!nativeDepositBankRecoveryAllowed(intent, attempt, approval) || !attempt?.stripe_payment_intent_id) return reply({ error: 'No buyer verification is pending.' }, 409);
      const stripe = createNativeStripePreviewClient({ secretKey: Deno.env.get('STRIPE_SECRET_KEY')!, sellerAccountId: Deno.env.get('NATIVE_STRIPE_SELLER_ACCOUNT')! });
      const pi = await stripe.retrievePaymentIntent(attempt.stripe_payment_intent_id) as Record<string, unknown>;
      if (pi.id !== attempt.stripe_payment_intent_id) return reply({ error: 'Payment reconciliation is pending.' }, 503);
      const action = nativeDepositBankAction(pi, { amountCents: intent.amount_cents,
        intentId: intent.id, savedQuoteId: intent.saved_quote_id, motorId: intent.motor_id,
        childId: intent.child_id, livemode: attempt.livemode });
      if (!action) return reply({ error: 'Refresh the payment status before continuing.' }, 409);
      return reply(action); // Safe wallet handoff; no PI secret or issued-token action.
    }
    let documentUrl: string | null = null;
    const documentHash = await io.loadDocumentHash(quote);
    const exactDocument = documentHash === intent.document_sha256;
    if (body.action === 'approve') {
      if (!documentHash) return reply({ error: 'Quote document temporarily unavailable. Payment was not submitted.' }, 503);
      if (!exactDocument) return reply({ error: 'The quote document changed. Start a fresh deposit review.' }, 409);
    }
    if (body.action === 'approve') {
      if (body.accept_terms !== true || typeof body.nonce !== 'string' || !/^[0-9a-f]{64}$/.test(body.nonce)
        || typeof body.review_digest !== 'string' || !/^[0-9a-f]{64}$/.test(body.review_digest))
        return reply({ error: 'Review the quote and accept the deposit terms.' }, 400);
      if (!await io.validateFreshIntent(intent, quote)) return reply({ error: 'The quote changed or expired. Review a fresh quote.' }, 409);
      const { data, error } = await db.rpc('approve_native_deposit_review', { p_intent_id: intent.id,
        p_nonce_hash: await sha256Hex(new TextEncoder().encode(body.nonce)), p_actor_fingerprint: fingerprint, p_review_digest: body.review_digest });
      if (error || data !== true) return reply({ error: 'Review expired or already used. Refresh this page.' }, 409);
      return reply({ approved: true, amount_cents: intent.amount_cents, currency: 'CAD' });
    }
    if (recovering) {
      // A buyer refresh reconciles the existing PI only. No credential/new POST.
      await runNativeDepositComplete({ caller: {}, childId: intent.child_id, actor, now: new Date(),
        sellerAccountId: Deno.env.get('NATIVE_STRIPE_SELLER_ACCOUNT') || null,
        livemode: Deno.env.get('STRIPE_SECRET_KEY')?.trim().startsWith('sk_live_') === true,
        openStripe: () => createNativeStripePreviewClient({ secretKey: Deno.env.get('STRIPE_SECRET_KEY') || '', sellerAccountId: Deno.env.get('NATIVE_STRIPE_SELLER_ACCOUNT') || '' }), io });
      intent = await io.loadIntentByChild(body.child_id) || intent;
    }
    const fresh = exactDocument && !recovering && !intent.retired_at && await io.validateFreshIntent(intent, quote);
    if (exactDocument) {
      const { data: signed, error: pdfError } = await db.storage.from('quotes').createSignedUrl(intent.document_path, 120);
      if (!pdfError && signed?.signedUrl) documentUrl = signed.signedUrl;
    }
    const digest = await sha256Hex(new TextEncoder().encode(JSON.stringify([
      intent.id, intent.child_id, intent.saved_quote_id, intent.motor_id, intent.amount_cents, intent.currency,
      intent.document_sha256, intent.policy_version, intent.policy_code, intent.terms_version, intent.expires_at,
    ])));
    let nonce: string | null = null;
    if (enabled && sellerVerified && fresh && documentUrl && !approval && intent.status === 'requires_escalation') {
      nonce = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
      const { error } = await db.from('native_deposit_review_challenges').insert({ nonce_hash: await sha256Hex(new TextEncoder().encode(nonce)),
        intent_id: intent.id, actor_fingerprint: fingerprint, review_digest: digest,
        expires_at: new Date(Math.min(Date.now() + 10 * 60_000, Date.parse(intent.expires_at))).toISOString() });
      if (error) return reply({ error: 'Review unavailable. Try again.' }, 503);
    }
    return reply({ motor: `Mercury ${intent.horsepower} HP — ${intent.catalog_model_number}`, amount_cents: intent.amount_cents,
      merchandise_cents: intent.merchandise_cents, currency: 'CAD', document_url: documentUrl,
      can_restart: !recovering && intent.status !== 'paid',
      saved_quote_id: quote.id,
      terms: intent.policy_code === 'in_stock_refundable' ? DEPOSIT_POLICY_IN_STOCK_TEXT : DEPOSIT_POLICY_SPECIAL_ORDER_TEXT,
      approved: Boolean(fresh && enabled && intent.status === "approved" && approval && Date.parse(approval.expires_at) > Date.now()), paid: intent.status === 'paid',
      receipt_reconciliation_required: intent.receipt_reconciliation_required === true,
      test_mode: Deno.env.get('STRIPE_SECRET_KEY')?.startsWith('sk_test_') === true,
      payment_status: !recovering && (approval && Date.parse(approval.expires_at) <= Date.now() || !fresh) && !intent.retired_at ? 'expired' : intent.status, nonce, review_digest: digest });
  } catch {
    return reply({ error: 'Deposit review is temporarily unavailable.' }, 503);
  }
});
