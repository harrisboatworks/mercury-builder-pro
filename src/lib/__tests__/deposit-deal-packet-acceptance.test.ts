import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  ACCEPTANCE_CUSTOMER_EMAIL,
  ACCEPTANCE_DEAL_ID,
  ACCEPTANCE_QUOTE_ID,
  ACCEPTANCE_SESSION_COMPLETE,
  claimOutbox,
  claimRpcAllows,
  classifyCreatePaymentExistingSession,
  createAcceptanceWorld,
  deliveryTableAllows,
  historicalBackfillDoesNotSeedOrPromotePaid,
  historicalReplayDoesNotAutoSend,
  HBW_OPERATIONS_EMAIL,
  GROK_BOT_AGENTMAIL,
  mutateCustomerQuote,
  recoveryPlanForBoundSession,
  runFreshPaidDepositPacket,
  seedOutbox,
  simulateConcurrentClaims,
  triggerHelperExecuteAllows,
} from './helpers/deposit-deal-packet-acceptance';
import { deriveDepositMailAttachmentKey } from '../../../supabase/functions/_shared/deposit-email-deliveries.ts';

const migration = readFileSync('supabase/migrations/20260823120000_deposit_deal_packet.sql', 'utf8');
const createPayment = readFileSync('supabase/functions/create-payment/index.ts', 'utf8');
const webhook = readFileSync('supabase/functions/stripe-webhook/index.ts', 'utf8');
const mailer = readFileSync('supabase/functions/send-deposit-confirmation-email/index.ts', 'utf8');
const adminDetail = readFileSync('src/pages/AdminQuoteDetail.tsx', 'utf8');

describe('deposit deal-packet staged acceptance', () => {
  it('stage 1: pins migration role ACLs and nested helper EXECUTE', () => {
    expect(migration).toContain('REVOKE ALL ON TABLE public.deposit_email_deliveries FROM PUBLIC, anon, authenticated, service_role');
    expect(migration).toContain('GRANT SELECT ON TABLE public.deposit_email_deliveries TO authenticated');
    expect(migration).toContain('GRANT SELECT, INSERT, UPDATE ON TABLE public.deposit_email_deliveries TO service_role');
    expect(migration).toContain('GRANT EXECUTE ON FUNCTION public.claim_deposit_email_delivery(uuid, text, uuid, integer) TO service_role');
    expect(migration).not.toMatch(/GRANT EXECUTE ON FUNCTION public.claim_deposit_email_delivery\([^)]+\) TO anon/);
    expect(migration).not.toMatch(/GRANT EXECUTE ON FUNCTION public.claim_deposit_email_delivery\([^)]+\) TO authenticated/);
    expect(migration).toContain('GRANT EXECUTE ON FUNCTION public.deposit_authority_caller() TO anon, authenticated, service_role');
    expect(migration).not.toMatch(/GRANT EXECUTE ON FUNCTION public.enforce_customer_quotes_deposit_authority/);
    expect(migration).not.toMatch(/GRANT EXECUTE ON FUNCTION public.enforce_customer_quotes_deposit_delete/);
    expect(deliveryTableAllows('anon', 'SELECT')).toBe(false);
    expect(deliveryTableAllows('authenticated', 'SELECT', false)).toBe(false);
    expect(deliveryTableAllows('admin', 'SELECT', true)).toBe(true);
    expect(deliveryTableAllows('authenticated', 'INSERT', true)).toBe(false);
    expect(deliveryTableAllows('service_role', 'INSERT')).toBe(true);
    expect(deliveryTableAllows('service_role', 'DELETE')).toBe(false);
    expect(claimRpcAllows('anon')).toBe(false);
    expect(claimRpcAllows('authenticated')).toBe(false);
    expect(claimRpcAllows('admin')).toBe(false);
    expect(claimRpcAllows('service_role')).toBe(true);
    expect(triggerHelperExecuteAllows('deposit_authority_caller')).toBe(true);
    expect(triggerHelperExecuteAllows('enforce_customer_quotes_deposit_authority')).toBe(false);
  });

  it('stage 1: rejects non-authority payment-column poisoning and buyer delete', () => {
    expect(mutateCustomerQuote('anon', 'INSERT', null, {
      lead_source: 'website',
      payment_status: 'paid',
    }).ok).toBe(false);
    expect(mutateCustomerQuote('authenticated', 'UPDATE', {
      lead_source: 'website',
      saved_quote_id: null,
    }, {
      lead_source: 'website',
      saved_quote_id: ACCEPTANCE_QUOTE_ID,
    }).ok).toBe(false);
    expect(mutateCustomerQuote('authenticated', 'DELETE', {
      lead_source: 'deposit',
    }).ok).toBe(false);
    expect(mutateCustomerQuote('service_role', 'INSERT', null, {
      lead_source: 'deposit',
      payment_status: 'pending',
    }).ok).toBe(true);
    expect(mutateCustomerQuote('admin', 'DELETE', {
      lead_source: 'deposit',
    }).ok).toBe(true);
  });

  it('stage 2: delivery claims are exclusive and role-gated', () => {
    const world = createAcceptanceWorld();
    seedOutbox(world, ACCEPTANCE_DEAL_ID, ACCEPTANCE_QUOTE_ID);
    expect(claimOutbox(world, 'anon', ACCEPTANCE_DEAL_ID, 'customer', 'token-anon')).toBeNull();
    expect(claimOutbox(world, 'authenticated', ACCEPTANCE_DEAL_ID, 'customer', 'token-user')).toBeNull();
    const raced = simulateConcurrentClaims(
      world.deliveries.get(`${ACCEPTANCE_DEAL_ID}:hbw`)!,
      ['token-a', 'token-b'],
      world.now,
    );
    expect(raced.winners).toBe(1);
    expect(raced.claimedBy).toBe('token-a');
    const first = claimOutbox(world, 'service_role', ACCEPTANCE_DEAL_ID, 'customer', 'token-a');
    expect(first?.status).toBe('sending');
    expect(claimOutbox(world, 'service_role', ACCEPTANCE_DEAL_ID, 'customer', 'token-b')).toBeNull();
  });

  it('stage 3: create-payment, webhook, and mailer use synthetic Stripe/Resend/SMS only', async () => {
    const result = await runFreshPaidDepositPacket();
    expect(result.openDisposition).toBe('reuse_open');
    expect(result.completeDisposition).toBe('already_complete');
    expect(result.expiredDisposition).toBe('renew_expired');
    expect(classifyCreatePaymentExistingSession('complete')).toBe('already_complete');
    expect(createPayment).toContain('classifyExistingDepositCheckoutSession(existingSession)');
    expect(createPayment.indexOf('already_complete'))
      .toBeLessThan(createPayment.indexOf('stripe.checkout.sessions.create(sessionData'));

    expect(result.mailerPlan).toEqual({ seed: true, invoke: true });
    expect(webhook).toContain('planDepositWebhookMailer');
    expect(webhook).toContain('resolveDepositWebhookSmsGate');
    expect(webhook).toContain('assertStripeDepositChargeMatches');
    expect(result.lostClaimSms).toBe(false);
    expect(result.world.smsSends).toEqual([]);

    expect(result.world.resendSends).toHaveLength(3);
    expect(result.world.resendSends.map((send) => send.audience).sort()).toEqual([
      'customer',
      'grok_bot',
      'hbw',
    ]);
    expect(new Set(result.world.resendSends.map((send) => send.idempotencyKey)).size).toBe(3);
    expect(result.world.resendSends.every((send) => send.attachmentSha256 === result.pdf.sha256)).toBe(true);
    expect(result.world.resendSends.every((send) => send.attachmentPath === result.attachmentPath)).toBe(true);
    expect(result.attachmentPath).toBe(deriveDepositMailAttachmentKey(ACCEPTANCE_QUOTE_ID));
    expect(result.world.resendSends.find((send) => send.audience === 'customer')?.to).toEqual([
      ACCEPTANCE_CUSTOMER_EMAIL,
    ]);
    expect(result.world.resendSends.find((send) => send.audience === 'hbw')?.to).toEqual([
      'jayharris97@gmail.com',
      HBW_OPERATIONS_EMAIL,
    ]);
    expect(result.world.resendSends.find((send) => send.audience === 'grok_bot')?.to).toEqual([
      GROK_BOT_AGENTMAIL,
    ]);
    expect(mailer).toContain('attachments: pdfAttachment');
    expect(mailer).toContain('await sendAudience("customer"');
    expect(mailer).toContain('await sendAudience("hbw"');
    expect(mailer).toContain('await sendAudience("grok_bot"');
    expect(mailer).not.toContain('bcc:');
    expect([...result.world.deliveries.values()].every((row) => row.status === 'sent')).toBe(true);
  });

  it('stage 4: admin deal packet uses saved_quotes.id and hides generic quote email when paid', async () => {
    const result = await runFreshPaidDepositPacket();
    expect(result.packet.path).toBe(`/admin/quotes/${ACCEPTANCE_QUOTE_ID}`);
    expect(result.packet.savedQuoteId).toBe(ACCEPTANCE_QUOTE_ID);
    expect(result.packet.operationalId).toBe(ACCEPTANCE_DEAL_ID);
    expect(result.packet.rowIds).toEqual([ACCEPTANCE_QUOTE_ID]);
    expect(result.packet.paid).toBe(true);
    expect(result.packet.canonicalDownload).toBe(true);
    expect(result.packet.canRetry).toBe(false);
    expect(adminDetail).toContain('data-section="email-deliveries"');
    expect(adminDetail).toContain('Use Email deliveries to retry missing or failed sends');
    expect(adminDetail).not.toContain("from('saved_quotes').update({ quote_data: updatedQuoteData })");
  });

  it('stage 5: bound PDF hash/path is required and is the only attachment key', async () => {
    const result = await runFreshPaidDepositPacket();
    expect(result.pdf.path).toBe(`saved-quotes/${ACCEPTANCE_QUOTE_ID}/quote.pdf`);
    expect(result.pdf.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(mailer).toContain('deriveDepositMailAttachmentKey(savedQuote.id)');
    expect(mailer).toContain('assertCanonicalPaidQuoteDocument({');
    expect(mailer).not.toContain('getPublicUrl');
  });

  it('stage 6: recovery validates the bound session and does not overwrite a concurrent paid write', () => {
    const recovery = recoveryPlanForBoundSession();
    expect(recovery.paidAt).toBe(new Date(1755964900 * 1000).toISOString());
    expect(recovery.plan.customerQuotePatch.payment_status).toBe('paid');
    expect(recovery.plan.customerQuotePatch.stripe_checkout_session_id).toBe(ACCEPTANCE_SESSION_COMPLETE);
    expect(recovery.lostWrite).toBe('already_completed');
    expect(createPayment).toContain('stripeDerivedPaidAt(session)');
    expect(createPayment).toContain('classifyOptimisticRecoveryWrite');
    expect(webhook).toContain('depositNotificationOutcomeGuard(event.id)');
    expect(webhook).toContain('notification outcome ownership lost; leaving existing state');
  });

  it('stage 7: historical paid rows are not auto-emailed and backfill does not promote paid', () => {
    expect(historicalReplayDoesNotAutoSend()).toEqual({ seed: false, invoke: false });
    const backfill = historicalBackfillDoesNotSeedOrPromotePaid();
    expect(backfill.seedsDeliveries).toBe(false);
    expect(backfill.promotesPaid).toBe(false);
    expect(backfill.plan.savedQuoteUpdates).toEqual([]);
    expect(backfill.plan.customerQuoteUpdates[0]?.patch).not.toHaveProperty('payment_status');
    expect(migration).not.toMatch(/INSERT INTO public\.deposit_email_deliveries/i);
    expect(migration).not.toMatch(/SET\s+deposit_status\s*=\s*'paid'/);
    expect(webhook).toContain('Historical paid deposit has no email outbox');
  });

  it('keeps the three Edge Function source contracts fail-closed on live side effects', () => {
    expect(createPayment).not.toContain('Access-Control-Allow-Origin": "*"');
    expect(mailer).not.toContain('Access-Control-Allow-Origin": "*"');
    expect(webhook).toContain('planDepositWebhookMailer({');
    expect(webhook).toContain('depositNotificationOutcomeGuard(event.id)');
    expect(mailer).toContain('claim_deposit_email_delivery');
    expect(mailer).toContain('sendResendEmailWithIdempotency');
  });
});
