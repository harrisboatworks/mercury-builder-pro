import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  assertReusableDepositCheckoutAmount,
} from '../../../supabase/functions/_shared/deposit-deal-record.ts';
import {
  EXPRESS_RESERVATION_DEPOSIT_AMOUNT,
  assertAuthoritativeDepositTier,
  parseAuthoritativeHorsepower,
  parseExactDepositAmount,
  recommendedStandardDeposit,
} from '../../../supabase/functions/_shared/deposit-policy.ts';

const EXPRESS_MOTOR_ID = 'e920cfdf-223a-408a-850b-6f112e15c4d7';
const EXPRESS_MOTOR_MODEL_NUMBER = '1A10201LK';
const OTHER_MOTOR_ID = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
const SAVED_QUOTE_ID = 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb';

const CATALOG = {
  '100': null,
  '200': 'price_200',
  '500': 'price_500',
  '1000': 'price_1000',
  '2500': 'price_2500',
} as const;

function standardExpress(hp: unknown, amount: unknown, extras: Record<string, unknown> = {}) {
  return {
    requestedAmount: amount,
    savedQuoteAmount: extras.savedQuoteAmount ?? amount,
    horsepower: hp,
    expressMotor: {
      quoteMotorId: extras.quoteMotorId ?? OTHER_MOTOR_ID,
      savedMotorId: extras.savedMotorId ?? OTHER_MOTOR_ID,
      modelNumber: extras.modelNumber ?? 'OTHER',
      motorRowPresent: extras.motorRowPresent ?? true,
      expressMotorId: EXPRESS_MOTOR_ID,
      expressModelNumber: EXPRESS_MOTOR_MODEL_NUMBER,
    },
    priceId: extras.priceId === undefined ? CATALOG[String(amount) as keyof typeof CATALOG] ?? null : extras.priceId,
    catalog: CATALOG,
    ...('existingDepositAmount' in extras ? { existingDepositAmount: extras.existingDepositAmount } : {}),
    ...('stagingPriceOverride' in extras ? { stagingPriceOverride: extras.stagingPriceOverride } : {}),
  };
}

describe('authoritative deposit tier derivation', () => {
  it('allows only the HP-derived standard tier at 25, 26, 115, and 116 HP', () => {
    expect(recommendedStandardDeposit(25)).toBe(200);
    expect(recommendedStandardDeposit(25.0001)).toBe(500);
    expect(recommendedStandardDeposit(26)).toBe(500);
    expect(recommendedStandardDeposit(115)).toBe(500);
    expect(recommendedStandardDeposit(115.0001)).toBe(1000);
    expect(recommendedStandardDeposit(116)).toBe(1000);

    expect(assertAuthoritativeDepositTier(standardExpress(25, 200))).toBe(200);
    expect(assertAuthoritativeDepositTier(standardExpress(26, 500))).toBe(500);
    expect(assertAuthoritativeDepositTier(standardExpress(115, 500))).toBe(500);
    expect(assertAuthoritativeDepositTier(standardExpress(116, 1000))).toBe(1000);

    expect(() => assertAuthoritativeDepositTier(standardExpress(25, 500))).toThrow(
      'Invalid deposit amount for selected motor',
    );
    expect(() => assertAuthoritativeDepositTier(standardExpress(26, 200))).toThrow(
      'Invalid deposit amount for selected motor',
    );
    expect(() => assertAuthoritativeDepositTier(standardExpress(115, 1000))).toThrow(
      'Invalid deposit amount for selected motor',
    );
    expect(() => assertAuthoritativeDepositTier(standardExpress(116, 500))).toThrow(
      'Invalid deposit amount for selected motor',
    );
  });

  it('rejects a crafted lower-tier request that matches a pending saved quote', () => {
    expect(() => assertAuthoritativeDepositTier(standardExpress(150, 200, {
      savedQuoteAmount: 200,
    }))).toThrow('Invalid deposit amount for selected motor');
    expect(() => assertAuthoritativeDepositTier(standardExpress(150, '200', {
      savedQuoteAmount: '200.00',
    }))).toThrow('Invalid deposit amount for selected motor');
    expect(() => assertAuthoritativeDepositTier(standardExpress('150', 200, {
      savedQuoteAmount: 200,
      existingDepositAmount: 200,
    }))).toThrow('Invalid deposit amount for selected motor');
  });

  it('preserves the exact $100 express-motor exception and rejects it elsewhere', () => {
    expect(assertAuthoritativeDepositTier(standardExpress(9.9, 100, {
      quoteMotorId: EXPRESS_MOTOR_ID,
      savedMotorId: EXPRESS_MOTOR_ID,
      modelNumber: EXPRESS_MOTOR_MODEL_NUMBER,
      priceId: null,
    }))).toBe(EXPRESS_RESERVATION_DEPOSIT_AMOUNT);
    expect(assertAuthoritativeDepositTier(standardExpress(9.9, 200, {
      quoteMotorId: EXPRESS_MOTOR_ID,
      savedMotorId: EXPRESS_MOTOR_ID,
      modelNumber: EXPRESS_MOTOR_MODEL_NUMBER,
      priceId: 'price_200',
    }))).toBe(200);

    expect(() => assertAuthoritativeDepositTier(standardExpress(9.9, 100, {
      quoteMotorId: EXPRESS_MOTOR_ID,
      savedMotorId: EXPRESS_MOTOR_ID,
      modelNumber: 'WRONG',
      priceId: null,
    }))).toThrow('Invalid deposit amount for selected motor');
    expect(() => assertAuthoritativeDepositTier(standardExpress(150, 100, {
      quoteMotorId: EXPRESS_MOTOR_ID,
      savedMotorId: EXPRESS_MOTOR_ID,
      modelNumber: EXPRESS_MOTOR_MODEL_NUMBER,
      priceId: null,
    }))).toThrow('Invalid deposit amount for selected motor');
  });

  it('rejects mismatched existing-deposit, price-id, encodings, and retry session state', () => {
    expect(parseExactDepositAmount('200.00')).toBe(200);
    expect(parseExactDepositAmount('1e3')).toBeNull();
    expect(parseExactDepositAmount(2500)).toBe(2500);
    expect(() => assertAuthoritativeDepositTier(standardExpress(25, 2500, {
      priceId: 'price_2500',
    }))).toThrow('Invalid deposit amount for selected motor');
    expect(() => assertAuthoritativeDepositTier(standardExpress(26, 500, {
      existingDepositAmount: 200,
    }))).toThrow('Invalid deposit amount for selected motor');
    expect(() => assertAuthoritativeDepositTier(standardExpress(26, 500, {
      priceId: 'price_200',
    }))).toThrow('Invalid deposit amount for selected motor');
    expect(() => assertAuthoritativeDepositTier(standardExpress(115, '500', {
      savedQuoteAmount: '1e3',
    }))).toThrow('Invalid saved quote for deposit');

    expect(assertReusableDepositCheckoutAmount({
      session: {
        amount_total: 50000,
        currency: 'cad',
        metadata: {
          deposit_amount: '500',
          payment_type: 'motor_deposit',
          saved_quote_id: SAVED_QUOTE_ID,
        },
      },
      depositAmount: 500,
      savedQuoteId: SAVED_QUOTE_ID,
    })).toBe(500);
    expect(() => assertReusableDepositCheckoutAmount({
      session: {
        amount_total: 20000,
        currency: 'cad',
        metadata: {
          deposit_amount: '200',
          payment_type: 'motor_deposit',
          saved_quote_id: SAVED_QUOTE_ID,
        },
      },
      depositAmount: 1000,
      savedQuoteId: SAVED_QUOTE_ID,
    })).toThrow('Stripe deposit amount does not match');
    expect(() => assertReusableDepositCheckoutAmount({
      session: {
        amount_total: 100000,
        currency: 'cad',
        metadata: {
          deposit_amount: '200',
          payment_type: 'motor_deposit',
          saved_quote_id: SAVED_QUOTE_ID,
        },
      },
      depositAmount: 1000,
      savedQuoteId: SAVED_QUOTE_ID,
    })).toThrow('Invalid deposit amount for selected motor');
    expect(() => assertReusableDepositCheckoutAmount({
      session: {
        amount_total: 50000,
        metadata: {
          deposit_amount: '500',
          payment_type: 'motor_deposit',
          saved_quote_id: SAVED_QUOTE_ID,
        },
      },
      depositAmount: 500,
      savedQuoteId: SAVED_QUOTE_ID,
    })).toThrow('Stripe deposit currency is not CAD');
    expect(() => assertReusableDepositCheckoutAmount({
      session: {
        amount_total: 50000,
        currency: '',
        metadata: {
          deposit_amount: '500',
          payment_type: 'motor_deposit',
          saved_quote_id: SAVED_QUOTE_ID,
        },
      },
      depositAmount: 500,
      savedQuoteId: SAVED_QUOTE_ID,
    })).toThrow('Stripe deposit currency is not CAD');
    expect(() => assertReusableDepositCheckoutAmount({
      session: {
        amount_total: 50000,
        currency: '   ',
        metadata: {
          deposit_amount: '500',
          payment_type: 'motor_deposit',
          saved_quote_id: SAVED_QUOTE_ID,
        },
      },
      depositAmount: 500,
      savedQuoteId: SAVED_QUOTE_ID,
    })).toThrow('Stripe deposit currency is not CAD');
    expect(() => assertReusableDepositCheckoutAmount({
      session: {
        amount_total: 50000,
        currency: 'cad',
        metadata: { payment_type: 'motor_deposit', saved_quote_id: SAVED_QUOTE_ID },
      },
      depositAmount: 500,
      savedQuoteId: SAVED_QUOTE_ID,
    })).toThrow('Deposit amount is missing');
    expect(() => assertReusableDepositCheckoutAmount({
      session: { amount_total: 50000, currency: 'cad', metadata: null },
      depositAmount: 500,
      savedQuoteId: SAVED_QUOTE_ID,
    })).toThrow('Deposit amount is missing');
    expect(() => assertReusableDepositCheckoutAmount({
      session: {
        amount_total: 50000,
        currency: 'cad',
        metadata: { deposit_amount: '500', saved_quote_id: SAVED_QUOTE_ID },
      },
      depositAmount: 500,
      savedQuoteId: SAVED_QUOTE_ID,
    })).toThrow('Session is not a motor deposit');
    expect(() => assertReusableDepositCheckoutAmount({
      session: {
        amount_total: 50000,
        currency: 'cad',
        metadata: {
          deposit_amount: '500',
          payment_type: 'quote',
          saved_quote_id: SAVED_QUOTE_ID,
        },
      },
      depositAmount: 500,
      savedQuoteId: SAVED_QUOTE_ID,
    })).toThrow('Session is not a motor deposit');
    expect(() => assertReusableDepositCheckoutAmount({
      session: {
        amount_total: 50000,
        currency: 'cad',
        metadata: { deposit_amount: '500', payment_type: 'motor_deposit' },
      },
      depositAmount: 500,
      savedQuoteId: SAVED_QUOTE_ID,
    })).toThrow('Session metadata does not match saved quote');
    expect(() => assertReusableDepositCheckoutAmount({
      session: {
        amount_total: 50000,
        currency: 'cad',
        metadata: {
          deposit_amount: '500',
          payment_type: 'motor_deposit',
          saved_quote_id: OTHER_MOTOR_ID,
        },
      },
      depositAmount: 500,
      savedQuoteId: SAVED_QUOTE_ID,
    })).toThrow('Session metadata does not match saved quote');
  });

  it('accepts only plain-decimal horsepower greater than 0 and at most 1000', () => {
    expect(parseAuthoritativeHorsepower(9.9)).toBe(9.9);
    expect(parseAuthoritativeHorsepower('90')).toBe(90);
    expect(parseAuthoritativeHorsepower('115.0')).toBe(115);
    expect(parseAuthoritativeHorsepower(1000)).toBe(1000);
    expect(() => parseAuthoritativeHorsepower('0x90')).toThrow('Invalid deposit amount for selected motor');
    expect(() => parseAuthoritativeHorsepower('0X5A')).toThrow('Invalid deposit amount for selected motor');
    expect(() => parseAuthoritativeHorsepower('0b1011010')).toThrow('Invalid deposit amount for selected motor');
    expect(() => parseAuthoritativeHorsepower('1e2')).toThrow('Invalid deposit amount for selected motor');
    expect(() => parseAuthoritativeHorsepower('9.9e1')).toThrow('Invalid deposit amount for selected motor');
    expect(() => parseAuthoritativeHorsepower(0)).toThrow('Invalid deposit amount for selected motor');
    expect(() => parseAuthoritativeHorsepower('0')).toThrow('Invalid deposit amount for selected motor');
    expect(() => parseAuthoritativeHorsepower(-15)).toThrow('Invalid deposit amount for selected motor');
    expect(() => parseAuthoritativeHorsepower('-15')).toThrow('Invalid deposit amount for selected motor');
    expect(() => parseAuthoritativeHorsepower(Number.POSITIVE_INFINITY)).toThrow('Invalid deposit amount for selected motor');
    expect(() => parseAuthoritativeHorsepower(Number.NaN)).toThrow('Invalid deposit amount for selected motor');
    expect(() => parseAuthoritativeHorsepower(1000.1)).toThrow('Invalid deposit amount for selected motor');
    expect(() => assertAuthoritativeDepositTier(standardExpress('0x90', 500))).toThrow(
      'Invalid deposit amount for selected motor',
    );
  });

  it('enforces the derived tier in create-payment before Stripe create or reuse', () => {
    const payment = readFileSync('supabase/functions/create-payment/index.ts', 'utf8');
    const tierAssert = payment.indexOf('assertAuthoritativeDepositTier({');
    const retrieve = payment.indexOf('const existingSession = await stripe.checkout.sessions.retrieve');
    const reuseAmount = payment.indexOf('assertReusableDepositCheckoutAmount({');
    const reuseOpen = payment.indexOf('if (existingSessionDisposition === "reuse_open")');
    const create = payment.indexOf('stripe.checkout.sessions.create(sessionData');

    expect(tierAssert).toBeGreaterThan(-1);
    expect(retrieve).toBeGreaterThan(tierAssert);
    expect(reuseAmount).toBeGreaterThan(retrieve);
    expect(reuseOpen).toBeGreaterThan(reuseAmount);
    expect(create).toBeGreaterThan(reuseOpen);
    expect(payment).toContain('existingDepositAmount: existingDeposit ? existingDeposit.deposit_amount : undefined');
    expect(payment).toContain('.select("id, stripe_checkout_session_id, payment_status, deposit_amount")');
    expect(payment).toContain('reservationMotor.horsepower');
    expect(payment).not.toContain('quoteData?.horsepower ?? reservationMotor.horsepower');
    expect(payment.slice(reuseAmount, reuseOpen)).toContain('savedQuoteId');
    expect(payment.slice(reuseAmount, reuseOpen)).toContain('depositAmount: authoritativeDepositAmount');
    expect(payment).toContain('unit_amount: authoritativeDepositAmount * 100');
    expect(payment).toContain('depositAmount: String(authoritativeDepositAmount)');
  });
});
