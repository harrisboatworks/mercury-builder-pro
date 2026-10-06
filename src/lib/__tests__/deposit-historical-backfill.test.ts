import { describe, expect, it } from 'vitest';

import { planHistoricalDepositBackfill } from '@/lib/deposit-historical-backfill';

const SAVED_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_SAVED = '44444444-4444-4444-8444-444444444444';
const MISSING_SAVED = '66666666-6666-4666-8666-666666666666';
const DEAL_ID = '22222222-2222-4222-8222-222222222222';
const OTHER_DEAL = '33333333-3333-4333-8333-333333333333';

describe('historical deposit backfill planner', () => {
  it('promotes unambiguous 9.9-style join/session IDs without treating JSON as paid proof', () => {
    const plan = planHistoricalDepositBackfill([
      {
        id: DEAL_ID,
        lead_source: 'deposit',
        saved_quote_id: null,
        stripe_checkout_session_id: null,
        stripe_payment_intent_id: null,
        payment_status: null,
        deposit_amount: 500,
        payment_paid_at: '2026-08-20T15:00:00.000Z',
        quote_data: {
          saved_quote_id: SAVED_ID,
          stripe_session_id: 'cs_test_99mh001',
          stripe_payment_intent: 'pi_test_99mh001',
          payment_status: 'paid',
        },
      },
    ], [
      { id: SAVED_ID, deposit_status: 'pending', deposit_amount: null, deposit_paid_at: null },
    ]);

    expect(plan.customerQuoteUpdates).toEqual([{
      id: DEAL_ID,
      patch: {
        saved_quote_id: SAVED_ID,
        stripe_checkout_session_id: 'cs_test_99mh001',
        stripe_payment_intent_id: 'pi_test_99mh001',
      },
    }]);
    expect(plan.savedQuoteUpdates).toEqual([]);
    expect(plan.skipped).toEqual([]);
  });

  it('skips a syntactically valid saved-quote UUID that does not exist', () => {
    const plan = planHistoricalDepositBackfill([
      {
        id: DEAL_ID,
        lead_source: 'deposit',
        saved_quote_id: null,
        stripe_checkout_session_id: null,
        stripe_payment_intent_id: null,
        payment_status: null,
        quote_data: {
          saved_quote_id: MISSING_SAVED,
          stripe_session_id: 'cs_test_orphan001',
          stripe_payment_intent: 'pi_test_orphan001',
        },
      },
    ], [
      { id: SAVED_ID, deposit_status: 'pending' },
    ]);

    expect(plan.customerQuoteUpdates).toEqual([{
      id: DEAL_ID,
      patch: {
        stripe_checkout_session_id: 'cs_test_orphan001',
        stripe_payment_intent_id: 'pi_test_orphan001',
      },
    }]);
    expect(plan.skipped).toEqual([
      { id: DEAL_ID, field: 'saved_quote_id', reason: 'missing_saved_quote' },
    ]);
    expect(plan.savedQuoteUpdates).toEqual([]);
  });

  it('skips duplicate JSON claims, non-deposit rows, and conflicting promoted columns', () => {
    const conflictDeal = '77777777-7777-4777-8777-777777777777';
    const plan = planHistoricalDepositBackfill([
      {
        id: DEAL_ID,
        lead_source: 'deposit',
        saved_quote_id: null,
        stripe_checkout_session_id: null,
        stripe_payment_intent_id: null,
        payment_status: 'paid',
        quote_data: {
          saved_quote_id: SAVED_ID,
          stripe_session_id: 'cs_test_shared',
          stripe_payment_intent: 'not-a-pi',
          payment_status: 'paid',
        },
      },
      {
        id: OTHER_DEAL,
        lead_source: 'deposit',
        saved_quote_id: null,
        stripe_checkout_session_id: null,
        stripe_payment_intent_id: null,
        payment_status: 'pending',
        quote_data: {
          saved_quote_id: SAVED_ID,
          stripe_session_id: 'cs_test_shared',
          payment_status: 'paid',
        },
      },
      {
        id: conflictDeal,
        lead_source: 'deposit',
        saved_quote_id: OTHER_SAVED,
        stripe_checkout_session_id: 'cs_test_bound',
        stripe_payment_intent_id: 'pi_test_bound',
        payment_status: 'pending',
        quote_data: {
          saved_quote_id: SAVED_ID,
          stripe_session_id: 'cs_test_otherbound',
          stripe_payment_intent: 'pi_test_other',
        },
      },
      {
        id: '55555555-5555-4555-8555-555555555555',
        lead_source: 'website',
        saved_quote_id: null,
        stripe_checkout_session_id: null,
        stripe_payment_intent_id: null,
        payment_status: null,
        quote_data: {
          saved_quote_id: OTHER_SAVED,
          stripe_session_id: 'cs_test_website',
          stripe_payment_intent: 'pi_test_website',
        },
      },
    ], [
      { id: SAVED_ID, deposit_status: 'pending' },
      { id: OTHER_SAVED, deposit_status: 'pending' },
    ]);

    expect(plan.customerQuoteUpdates).toEqual([]);
    expect(plan.savedQuoteUpdates).toEqual([]);
    expect(plan.skipped.map((item) => `${item.field}:${item.reason}`).sort()).toEqual([
      'saved_quote_id:ambiguous_saved_quote',
      'saved_quote_id:ambiguous_saved_quote',
      'saved_quote_id:existing_column_conflict',
      'saved_quote_id:not_a_deposit_join',
      'stripe_checkout_session_id:existing_column_conflict',
      'stripe_checkout_session_id:not_a_deposit_join',
      'stripe_checkout_session_id:session_conflict',
      'stripe_checkout_session_id:session_conflict',
      'stripe_payment_intent_id:existing_column_conflict',
      'stripe_payment_intent_id:invalid_payment_intent',
      'stripe_payment_intent_id:not_a_deposit_join',
    ].sort());
  });
});
