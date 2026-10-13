// Service-role adapter. Public projections must never include database rows.
import {
  type NativeActor, type NativeIntentRecord, type NativeSavedQuoteRecord,
  type NativeCompleteIo, type NativeCreateIo,
  NATIVE_DEPOSIT_TERMS_VERSION, NATIVE_DEPOSIT_POLICY_VERSION,
} from './native-deposit-checkout.ts';
import { canonicalQuoteDocumentPath, sha256Hex } from './quote-document-policy.ts';
import { assertDepositPolicyReadyForCheckout } from './deposit-policy.ts';
import { prepareMotorReservationIntent } from './motor-reservation-intent.ts';
import { PUBLIC_CATALOG_AVAILABILITY_OR } from './public-motor-contract.ts';

export async function nativeActorFromRequest(db: any, req: Request): Promise<NativeActor> {
  const token = req.headers.get('authorization')?.match(/^Bearer\s+(\S+)$/i)?.[1];
  let userId: string | null = null;
  if (token) {
    const { data, error } = await db.auth.getUser(token);
    if (!error) userId = data?.user?.id ?? null;
  }
  const capability = req.headers.get('x-resume-token');
  return { userId, resumeCapability: capability };
}

export function nativeDepositIo(db: any): NativeCreateIo & NativeCompleteIo {
  async function one(table: string, column: string, value: string) {
    const { data, error } = await db.from(table).select('*').eq(column, value).maybeSingle();
    if (error) throw new Error('native_storage_unavailable');
    return data;
  }
  async function rpc(name: string, args: Record<string, unknown>) {
    const { data, error } = await db.rpc(name, args);
    if (error) throw new Error('native_storage_unavailable');
    return data;
  }
  const loadParent = async (id: string) => (await one('ucp_checkout_sessions', 'id', id))?.payload ?? null;
  const loadMotor = async (id: string) => {
    const { data, error } = await db.from('motor_models')
      .select('id, model, model_display, model_number, mercury_model_no, family, horsepower, msrp, sale_price, dealer_price, base_price, manual_overrides, availability, in_stock, stock_quantity')
      .eq('id', id).or(PUBLIC_CATALOG_AVAILABILITY_OR).maybeSingle();
    if (error) throw new Error('native_catalog_unavailable');
    return data;
  };
  return {
    loadParent, loadMotor,
    loadSavedQuote: id => one('saved_quotes', 'id', id),
    loadIntentByChild: id => one('native_deposit_intents', 'child_id', id),
    loadIntentBySavedQuote: id => one('native_deposit_intents', 'saved_quote_id', id),
    loadApproval: id => one('native_deposit_approvals', 'intent_id', id),
    loadAttempt: id => one('native_deposit_attempts', 'intent_id', id),
    async loadDocumentHash(quote: NativeSavedQuoteRecord) {
      const path = canonicalQuoteDocumentPath(quote.id);
      if (path !== quote.quote_pdf_path) return null;
      const { data, error } = await db.storage.from('quotes').download(path);
      if (error || !data || data.size > 10 * 1024 * 1024) return null;
      return sha256Hex(new Uint8Array(await data.arrayBuffer()));
    },
    async hostedRailActive(id: string) {
      const row = await one('deposit_payment_rails', 'saved_quote_id', id);
      if (row?.rail === 'hosted') return true;
      const { data, error } = await db.from('customer_quotes').select('stripe_checkout_session_id,payment_status')
        .eq('saved_quote_id', id).eq('lead_source', 'deposit').maybeSingle();
      if (error) throw new Error('native_storage_unavailable');
      return Boolean(data?.stripe_checkout_session_id || (data?.payment_status === 'paid' && row?.rail !== 'native'));
    },
    async insertIntent(row: NativeIntentRecord) {
      const { data, error } = await db.from('native_deposit_intents').insert(row).select('*').single();
      if (error) throw new Error('native_storage_unavailable');
      return data;
    },
    async validateFreshIntent(intent, quote) {
      try {
        if (intent.terms_version !== NATIVE_DEPOSIT_TERMS_VERSION || intent.policy_version !== NATIVE_DEPOSIT_POLICY_VERSION) return false;
        const parent = await loadParent(intent.parent_session_id);
        const motor = await loadMotor(intent.motor_id);
        const priced = prepareMotorReservationIntent({ persistedSession: parent, serverLoadedMotor: motor,
          caller: { id: intent.parent_session_id, operation: 'motor_reservation' }, now: new Date() });
        if (!priced.ok || priced.preparation.amount_cents !== intent.amount_cents || priced.preparation.motor_id !== intent.motor_id) return false;
        const policy = assertDepositPolicyReadyForCheckout({ savedMotorId: intent.motor_id, motorRow: motor, quoteState: quote.quote_state });
        return policy.policyCode === intent.policy_code && Date.parse(intent.expires_at) > Date.now();
      } catch { return false; }
    },
    claimAttempt: args => rpc('claim_native_deposit_attempt', {
      p_intent_id: args.intentId, p_token_fingerprint: args.tokenFingerprint,
      p_processor_params_hash: args.processorParamsHash, p_amount_cents: args.amountCents,
      p_seller_account_id: args.sellerAccountId, p_livemode: args.livemode,
    }),
    bindAttempt: (id, pi, status) => rpc('bind_native_deposit_payment_intent', {
      p_attempt_id: id, p_payment_intent_id: pi, p_status: status,
    }),
    claimPaid: args => rpc('claim_native_motor_deposit_paid', {
      p_intent_id: args.intent.id, p_attempt_id: args.attemptId,
      p_saved_quote_id: args.intent.saved_quote_id, p_payment_intent_id: args.paymentIntentId,
      p_amount_cents: args.intent.amount_cents, p_document_sha256: args.intent.document_sha256,
      p_motor_id: args.intent.motor_id, p_terms_version: args.intent.terms_version,
      p_policy_version: args.intent.policy_version, p_policy_code: args.intent.policy_code,
      p_notification_event_id: args.notificationEventId, p_deposit_paid_at: args.paidAt,
    }),
  };
}
