import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  DEPOSIT_FULFILMENT_INSTALLED,
  DEPOSIT_FULFILMENT_MOTOR_ONLY,
  DEPOSIT_POLICY_IN_STOCK_TEXT,
  DEPOSIT_POLICY_PUBLIC_SUMMARY,
  DEPOSIT_POLICY_QUOTE_DATA_KEY,
  DEPOSIT_POLICY_SCHEMA,
  DEPOSIT_POLICY_SPECIAL_ORDER_TEXT,
  assertDepositPolicyReadyForCheckout,
  buildDepositPolicySnapshot,
  classifyMotorStock,
  customerPolicyText,
  depositPolicySnapshotsMatch,
  fulfilmentText,
  parseDepositPolicySnapshot,
  policyCodeFromStock,
  readPersistedDepositPolicy,
  remainingBalance,
  tryBuildDepositPolicySnapshot,
} from '../../../supabase/functions/_shared/deposit-policy.ts';
import {
  createDepositConfirmationEmailHtml,
  createGrokDealEmailHtml,
  createInternalDealEmailHtml,
  customerDepositEmailSubject,
  grokDepositStructuredSummary,
  hbwDepositEmailSubject,
} from '../../../supabase/functions/_shared/deposit-email-templates.ts';
import {
  buildDepositCustomerQuoteRow,
  classifyOpenCheckoutPolicyUpgrade,
  storedDepositPolicyMatches,
} from '../../../supabase/functions/_shared/deposit-deal-record.ts';
import { formatStableDepositEmailTime } from '../../../supabase/functions/_shared/deposit-email-deliveries.ts';

const MOTOR_ID = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
const SAVED_QUOTE_ID = 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb';
const CUSTOMER_QUOTE_ID = 'cccccccc-3333-4333-8333-cccccccccccc';

const IDENTITY = {
  fullName: 'Ada Customer',
  email: 'ada@example.com',
  phone: '9053422153',
  address: {
    addressLine1: '5369 Harris Boat Works Rd',
    addressLine2: '',
    city: 'Gores Landing',
    region: 'ON',
    postalCode: 'K0K 2E0',
    country: 'CA',
  },
};

function inStockSnapshot(overrides: Record<string, unknown> = {}) {
  return buildDepositPolicySnapshot({
    motorId: MOTOR_ID,
    motor: { id: MOTOR_ID, stock_quantity: 3, in_stock: true, availability: 'In Stock' },
    purchasePath: 'motor_only',
    ...overrides,
  });
}

function specialOrderSnapshot() {
  return buildDepositPolicySnapshot({
    motorId: MOTOR_ID,
    motor: { id: MOTOR_ID, stock_quantity: 0, in_stock: false, availability: 'Special Order' },
    purchasePath: 'installed',
  });
}

describe('authoritative deposit stock classification', () => {
  it('prefers stock_quantity over leftover in_stock or availability labels', () => {
    expect(classifyMotorStock({ stock_quantity: 2, in_stock: false, availability: 'Out of Stock' })).toBe('in_stock');
    expect(classifyMotorStock({ stock_quantity: 0, in_stock: true, availability: 'In Stock' })).toBe('out_of_stock');
    expect(classifyMotorStock({ stock_quantity: '4', in_stock: null, availability: null })).toBe('in_stock');
  });

  it('falls back to in_stock then availability, and maps special-order labels', () => {
    expect(classifyMotorStock({ in_stock: true })).toBe('in_stock');
    expect(classifyMotorStock({ in_stock: false })).toBe('out_of_stock');
    expect(classifyMotorStock({ availability: 'Special Order' })).toBe('special_order');
    expect(classifyMotorStock({ availability: 'available-to-order' })).toBe('special_order');
    expect(classifyMotorStock({ availability: 'On Order' })).toBe('special_order');
    expect(policyCodeFromStock('in_stock')).toBe('in_stock_refundable');
    expect(policyCodeFromStock('out_of_stock')).toBe('special_order_until_written_approval');
    expect(policyCodeFromStock('special_order')).toBe('special_order_until_written_approval');
  });

  it('fails closed when the motor or stock status cannot be resolved', () => {
    expect(() => classifyMotorStock(null)).toThrow('Authoritative motor row is missing');
    expect(() => classifyMotorStock({})).toThrow('Motor stock status cannot be resolved');
    expect(() => classifyMotorStock({ stock_quantity: -1 })).toThrow('Motor stock quantity cannot be resolved');
    expect(() => classifyMotorStock({ availability: 'Maybe later' })).toThrow('Motor availability cannot be resolved');
    expect(tryBuildDepositPolicySnapshot({ motorId: MOTOR_ID, motor: {}, purchasePath: 'loose' })).toBeNull();
    expect(tryBuildDepositPolicySnapshot({
      motorId: MOTOR_ID,
      motor: { in_stock: true },
      purchasePath: null,
    })).toBeNull();
  });
});

describe('checkout snapshot match and historical protection', () => {
  it('accepts a matching snapshot and treats quantity-only drift as the same policy', () => {
    const recorded = inStockSnapshot();
    const authoritative = buildDepositPolicySnapshot({
      motorId: MOTOR_ID,
      motor: { id: MOTOR_ID, stock_quantity: 8, in_stock: true, availability: 'In Stock' },
      purchasePath: 'motor_only',
    });
    expect(depositPolicySnapshotsMatch(authoritative, recorded)).toBe(true);
    expect(assertDepositPolicyReadyForCheckout({
      savedMotorId: MOTOR_ID,
      motorRow: { id: MOTOR_ID, stock_quantity: 8, in_stock: true, availability: 'In Stock' },
      quoteState: { purchasePath: 'loose', depositPolicySnapshot: recorded },
    }).policyCode).toBe('in_stock_refundable');
  });

  it('fails closed on a missing or stale pre-payment snapshot', () => {
    const recorded = inStockSnapshot();
    expect(() => assertDepositPolicyReadyForCheckout({
      savedMotorId: MOTOR_ID,
      motorRow: { id: MOTOR_ID, stock_quantity: 1, in_stock: true },
      quoteState: { purchasePath: 'loose' },
    })).toThrow('Deposit policy snapshot is missing');
    expect(() => assertDepositPolicyReadyForCheckout({
      savedMotorId: MOTOR_ID,
      motorRow: { id: MOTOR_ID, stock_quantity: 0, in_stock: false },
      quoteState: { purchasePath: 'loose', depositPolicySnapshot: recorded },
    })).toThrow('Deposit policy snapshot is stale');
    expect(() => assertDepositPolicyReadyForCheckout({
      savedMotorId: MOTOR_ID,
      motorRow: { id: MOTOR_ID, stock_quantity: 1, in_stock: true },
      quoteState: { purchasePath: 'installed', depositPolicySnapshot: recorded },
    })).toThrow('Deposit policy snapshot is stale');
  });

  it('persists the snapshot on a new bound row and leaves historical paid rows unread-write', () => {
    const snapshot = specialOrderSnapshot();
    const row = buildDepositCustomerQuoteRow({
      identity: IDENTITY,
      savedQuoteId: SAVED_QUOTE_ID,
      sessionId: 'cs_test_session',
      depositAmount: 500,
      motorInfo: { model: '60 ELPT' },
      pricing: {
        motor_model_id: MOTOR_ID,
        base_price: 12000,
        final_price: 12000,
        total_cost: 12000,
        tradein_value_pre_penalty: null,
        tradein_value_final: null,
        monthly_payment: 0,
        term_months: 0,
        loan_amount: 0,
      },
      depositPolicy: snapshot,
    });
    const quoteData = row.quote_data as Record<string, unknown>;
    expect(quoteData[DEPOSIT_POLICY_QUOTE_DATA_KEY]).toEqual(snapshot);
    expect(readPersistedDepositPolicy(quoteData)).toEqual(snapshot);

    const historicalPaid = { payment_status: 'paid', quote_data: { deposit_amount: '500' } };
    expect(readPersistedDepositPolicy(historicalPaid.quote_data)).toBeNull();
    expect(parseDepositPolicySnapshot({ schema: 'old', policyCode: 'in_stock_refundable' })).toBeNull();
  });

  it('upgrades a legacy pending open-session row before reuse and fails closed on a conflicting write', () => {
    const snapshot = inStockSnapshot();
    const sessionId = 'cs_test_open_reuse';
    const legacyQuoteData = { deposit_amount: '500', stripe_session_id: sessionId };
    const upgradedRow = buildDepositCustomerQuoteRow({
      identity: IDENTITY,
      savedQuoteId: SAVED_QUOTE_ID,
      sessionId,
      depositAmount: 500,
      motorInfo: { model: '9.9 MH' },
      pricing: {
        motor_model_id: MOTOR_ID,
        base_price: 2999,
        final_price: 3388,
        total_cost: 3388,
        tradein_value_pre_penalty: null,
        tradein_value_final: null,
        monthly_payment: 0,
        term_months: 0,
        loan_amount: 0,
      },
      depositPolicy: snapshot,
    });

    expect(storedDepositPolicyMatches(legacyQuoteData, snapshot)).toBe(false);
    expect(storedDepositPolicyMatches(upgradedRow.quote_data, snapshot)).toBe(true);
    expect(classifyOpenCheckoutPolicyUpgrade({
      expectedSessionId: sessionId,
      expectedPolicy: snapshot,
      existing: { payment_status: 'pending', stripe_checkout_session_id: sessionId },
      wrote: {
        id: CUSTOMER_QUOTE_ID,
        payment_status: 'pending',
        stripe_checkout_session_id: sessionId,
        quote_data: upgradedRow.quote_data,
      },
      reread: {
        payment_status: 'pending',
        stripe_checkout_session_id: sessionId,
        quote_data: upgradedRow.quote_data,
      },
    })).toBe('upgraded');
    expect(classifyOpenCheckoutPolicyUpgrade({
      expectedSessionId: sessionId,
      expectedPolicy: snapshot,
      existing: { payment_status: 'pending', stripe_checkout_session_id: sessionId },
      wrote: null,
      writeError: new Error('row changed'),
      reread: {
        payment_status: 'pending',
        stripe_checkout_session_id: sessionId,
        quote_data: legacyQuoteData,
      },
    })).toBe('upgrade_failed');
    expect(classifyOpenCheckoutPolicyUpgrade({
      expectedSessionId: sessionId,
      expectedPolicy: snapshot,
      existing: { payment_status: 'paid', stripe_checkout_session_id: sessionId },
      reread: {
        payment_status: 'paid',
        stripe_checkout_session_id: sessionId,
        quote_data: upgradedRow.quote_data,
      },
    })).toBe('already_paid');
  });

  it('keeps webhook replay from re-querying stock and does not rewrite paid policy', () => {
    const webhook = readFileSync('supabase/functions/stripe-webhook/index.ts', 'utf8');
    expect(webhook).toContain('...boundQuoteData');
    expect(webhook).not.toContain('assertDepositPolicyReadyForCheckout');
    expect(webhook).not.toContain('classifyMotorStock');
    expect(webhook).not.toContain("from('motor_models')");
    expect(webhook).not.toContain('depositPolicySnapshot');
  });
});

describe('deposit email policy copy', () => {
  const paidAt = '2026-08-23T15:00:00.000Z';
  const inStock = inStockSnapshot();
  const special = specialOrderSnapshot();

  it('uses the confirmed customer subject, heading, and both policy branches', () => {
    expect(customerDepositEmailSubject('Mercury 9.9 MH')).toBe(
      'Deposit received: Mercury 9.9 MH | Harris Boat Works',
    );
    expect(customerDepositEmailSubject('')).toBe('Deposit received | Harris Boat Works');

    const inStockHtml = createDepositConfirmationEmailHtml({
      customerName: 'Ada Customer',
      depositAmount: '100',
      referenceNumber: 'HBW-12345678',
      motorLabel: 'Mercury 9.9 MH',
      paidAt,
      policy: inStock,
    });
    expect(inStockHtml).toContain('We received your deposit');
    expect(inStockHtml).toContain('Deposit reference');
    expect(inStockHtml).toContain('Your PDF quote is attached to this email.');
    expect(inStockHtml).not.toContain('reservation document');
    expect(inStockHtml).toContain(DEPOSIT_POLICY_IN_STOCK_TEXT);
    expect(inStockHtml).toContain(DEPOSIT_FULFILMENT_MOTOR_ONLY);
    expect(inStockHtml).not.toContain('pi_');
    expect(inStockHtml).not.toContain('Payment ID');
    expect(inStockHtml).not.toContain('Build a Quote');
    expect(inStockHtml).not.toContain('Pricing');
    expect(inStockHtml).not.toContain('\u2014');
    expect(inStockHtml).not.toContain('hbwsales.ca');

    const installedHtml = createDepositConfirmationEmailHtml({
      customerName: 'Ada Customer',
      depositAmount: '500',
      referenceNumber: 'HBW-12345678',
      motorLabel: '60 ELPT',
      paidAt,
      policy: special,
    });
    expect(installedHtml).toContain(DEPOSIT_POLICY_SPECIAL_ORDER_TEXT);
    expect(installedHtml).toContain(DEPOSIT_FULFILMENT_INSTALLED);
    expect(installedHtml).not.toContain(DEPOSIT_FULFILMENT_MOTOR_ONLY);
    expect(installedHtml).not.toContain('Payment ID');
    expect(customerPolicyText(special.policyCode)).toBe(DEPOSIT_POLICY_SPECIAL_ORDER_TEXT);
  });

  it('shows HBW paid fields, CTA, and Not available without inventing totals', () => {
    expect(hbwDepositEmailSubject('Ada Customer', '60 ELPT', '500')).toBe(
      '[PAID DEPOSIT] Ada Customer - 60 ELPT - $500',
    );
    const html = createInternalDealEmailHtml({
      customerName: 'Ada Customer',
      customerEmail: 'ada@example.com',
      customerPhone: '9053422153',
      customerAddress: '5369 Harris Boat Works Rd\nGores Landing ON K0K 2E0',
      depositAmount: '500',
      quoteTotal: 12000,
      remainingBalance: null,
      referenceNumber: 'HBW-12345678',
      paymentId: 'pi_test_123',
      sessionId: 'cs_test_456',
      savedQuoteId: SAVED_QUOTE_ID,
      customerQuoteId: CUSTOMER_QUOTE_ID,
      motorLabel: '60 ELPT',
      paidAt,
      policy: special,
      appUrl: 'https://mercuryrepower.ca',
    });
    expect(html).toContain('PAID DEPOSIT');
    expect(html).toContain('Open Deal Packet');
    expect(html).toContain(`/admin/quotes/${SAVED_QUOTE_ID}`);
    expect(html).toContain('within one business day');
    expect(html).toContain('$12000 CAD');
    expect(html).toContain(remainingBalance(12000, '500'));
    expect(html).toContain('pi_test_123');
    expect(html).toContain('cs_test_456');
    expect(html).toContain(DEPOSIT_POLICY_SPECIAL_ORDER_TEXT);
    expect(html).toContain('Deposit reference');

    const missing = createInternalDealEmailHtml({
      customerName: 'Ada Customer',
      customerEmail: '',
      customerPhone: '',
      customerAddress: '',
      depositAmount: '500',
      quoteTotal: null,
      remainingBalance: null,
      referenceNumber: 'HBW-12345678',
      paymentId: '',
      sessionId: '',
      savedQuoteId: '',
      customerQuoteId: '',
      motorLabel: '',
      paidAt,
      policy: null,
      appUrl: 'https://mercuryrepower.ca',
    });
    expect(missing).toContain('Not available');
    expect(missing).toContain('Deal packet URL: Not available');
    expect(remainingBalance(null, '500')).toBe('Not available');

    const missingPaidAt = createInternalDealEmailHtml({
      customerName: 'Ada Customer',
      customerEmail: '',
      customerPhone: '',
      customerAddress: '',
      depositAmount: '500',
      quoteTotal: null,
      remainingBalance: null,
      referenceNumber: 'HBW-12345678',
      paymentId: '',
      sessionId: '',
      savedQuoteId: '',
      customerQuoteId: '',
      motorLabel: '',
      policy: null,
      appUrl: 'https://mercuryrepower.ca',
    });
    expect(missingPaidAt).toContain('Not available');
    expect(missingPaidAt).not.toContain(formatStableDepositEmailTime('1970-01-01T00:00:00.000Z'));
    expect(missingPaidAt).not.toContain('1970-01-01');
    expect(missingPaidAt).not.toContain('1969-12-31');
  });

  it('gives Grok a deterministic structured block without secrets', () => {
    const input = {
      customerName: 'Ada Customer',
      customerEmail: 'ada@example.com',
      customerPhone: '9053422153',
      customerAddress: '5369 Harris Boat Works Rd',
      depositAmount: '500',
      quoteTotal: 12000,
      remainingBalance: null,
      referenceNumber: 'HBW-12345678',
      paymentId: 'pi_test_123',
      sessionId: 'cs_test_456',
      savedQuoteId: SAVED_QUOTE_ID,
      customerQuoteId: CUSTOMER_QUOTE_ID,
      motorLabel: '60 ELPT',
      paidAt,
      policy: special,
      appUrl: 'https://mercuryrepower.ca',
    };
    const structured = grokDepositStructuredSummary(input);
    expect(structured).toContain('schema: deposit-grok-summary/v1');
    expect(structured).toContain(`saved_quote_id: ${SAVED_QUOTE_ID}`);
    expect(structured).toContain(`customer_quote_id: ${CUSTOMER_QUOTE_ID}`);
    expect(structured).toContain('policy_code: special_order_until_written_approval');
    expect(structured).toContain('stock_classification: out_of_stock');
    expect(structured).toContain('purchase_path: installed');
    expect(structured).toContain('payment_status: paid');
    expect(structured).toContain('next_action: contact_within_one_business_day');
    expect(structured).toContain(`/admin/quotes/${SAVED_QUOTE_ID}`);
    expect(structured).not.toMatch(/sk_|rk_|token|secret/i);
    expect(createGrokDealEmailHtml(input)).toContain(structured);
    expect(createGrokDealEmailHtml(input)).not.toContain('hbwsales.ca');
  });
});

describe('live deposit copy drift tripwires', () => {
  const liveFiles = [
    'src/pages/Terms.tsx',
    'src/pages/PaymentSuccess.tsx',
    'src/pages/quote/QuoteSummaryPage.tsx',
    'src/pages/landing/HowToRepower.tsx',
    'src/pages/RepowerFinancing.tsx',
    'src/pages/AgentsHub.tsx',
    'src/components/payments/DepositPayment.tsx',
    'src/components/quote-builder/DepositInfoDialog.tsx',
    'src/components/quote-builder/MotorSelectionFAQ.tsx',
    'src/components/motors/Mercury99MHSalePage.tsx',
    'src/components/seo/HowToRepowerSEO.tsx',
    'src/lib/mercury99MhSaleContent.ts',
    'public/llms.txt',
    'supabase/functions/create-payment/index.ts',
    'supabase/functions/send-deposit-confirmation-email/index.ts',
    'supabase/functions/_shared/deposit-email-templates.ts',
    'supabase/functions/ai-chatbot/index.ts',
    'supabase/functions/realtime-session/index.ts',
    'supabase/functions/_shared/format-kb-documents.ts',
    'src/pages/RepowerProcess.tsx',
    'scripts/static-prerender.mjs',
    'AI-Chatbot-Knowledge-Base.md',
  ];

  it('keeps confirmed live surfaces on the stock-based policy and mercuryrepower.ca', () => {
    const combined = liveFiles.map((path) => readFileSync(path, 'utf8')).join('\n');
    expect(combined).not.toContain('hbwsales.ca');
    expect(combined).not.toContain('refundable within 30 days');
    expect(combined).not.toContain('Deposits are fully refundable.');
    expect(combined).not.toContain('Deposit is fully refundable');
    expect(combined).not.toContain("starts the order if the motor");
    expect(combined).not.toContain('Your $100 reservation terms:');
    expect(combined).not.toContain('depositAmount === 100');
    expect(DEPOSIT_POLICY_PUBLIC_SUMMARY).toContain('If the motor is in stock, the deposit is refundable.');
    expect(DEPOSIT_POLICY_PUBLIC_SUMMARY).toContain('Once HBW places the order after that written approval');
    expect(fulfilmentText('motor_only')).toContain('HBW does not pick up or deliver customer boats.');
    expect(fulfilmentText('installed')).toContain('your boat drop-off and installation');

    const emailTemplates = readFileSync('supabase/functions/_shared/deposit-email-templates.ts', 'utf8');
    expect(emailTemplates).not.toContain('\u2014');
    expect(emailTemplates).toContain('schema: ${GROK_SUMMARY_SCHEMA}');
    expect(DEPOSIT_POLICY_SCHEMA).toBe('deposit-policy/v1');

    const knowledgeBase = readFileSync('AI-Chatbot-Knowledge-Base.md', 'utf8');
    const depositSection = knowledgeBase.slice(
      knowledgeBase.indexOf('## Reservation & Deposit System'),
      knowledgeBase.indexOf('## NO DELIVERY POLICY'),
    );
    expect(depositSection).toContain('$200 deposit for portable motors (2.5 to 6 HP)');
    expect(depositSection).toContain('$500 deposit for mid-range motors (9.9 to 115 HP)');
    expect(depositSection).toContain('$1,000 deposit for big-block, Pro XS, or Verado (115 HP and up)');
    expect(depositSection).toContain('model 1A10201LK');
    expect(depositSection).toContain('That amount does not change the refund rule.');
    expect(depositSection).toContain('Refundability follows stock status, not the deposit amount.');
    expect(depositSection).toContain('It does not itself start a factory order.');
    expect(depositSection).toContain('HBW does not pick up or deliver customer boats.');
    expect(depositSection).not.toContain('0-25HP');
    expect(depositSection).not.toContain('30-115HP');
    expect(depositSection).not.toContain('150HP+');
    expect(depositSection).not.toContain('Deposit is fully refundable');
  });

  it('binds policy from motor_models before Stripe and never infers it from $100', () => {
    const payment = readFileSync('supabase/functions/create-payment/index.ts', 'utf8');
    expect(payment).toContain('assertDepositPolicyReadyForCheckout');
    expect(payment).toContain('.from("motor_models")');
    expect(payment).toContain('stock_quantity, in_stock, availability');
    expect(payment).toContain('if (depositAmount === "100")');
    expect(payment).not.toContain('depositAmount === "100" ? "in_stock_refundable"');
    expect(payment).not.toContain('Number(depositAmount) === 100');
  });
});
