/// <reference types="node" />

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  EXPRESS_MOTOR_ID,
  EXPRESS_MOTOR_MODEL_NUMBER,
  getMotorReservationDeposit,
  isVerifiedExpressMotorReservation,
} from '../../../supabase/functions/_shared/deposit-policy';
import {
  getExpressReservationDeposit,
  getRecommendedDeposit,
} from '../deposit';

describe('server-authoritative motor reservation deposit policy', () => {
  it.each([
    [9.9, 200],
    [25, 200],
    [25.1, 500],
    [30, 500],
    [115, 500],
    [115.1, 1000],
    [150, 1000],
    [400, 1000],
  ])('derives the normal deposit for %s HP', (horsepower, expected) => {
    expect(getMotorReservationDeposit(horsepower)).toBe(expected);
    expect(getRecommendedDeposit(horsepower)).toBe(expected);
  });

  it('allows the $100 tier only for the exact catalog express identity', () => {
    const exactExpressMotor = {
      motorId: EXPRESS_MOTOR_ID,
      modelNumber: EXPRESS_MOTOR_MODEL_NUMBER,
    };

    expect(isVerifiedExpressMotorReservation(exactExpressMotor)).toBe(true);
    expect(getMotorReservationDeposit(9.9, true)).toBe(100);
    expect(getMotorReservationDeposit(50, true)).toBe(500);
    expect(getExpressReservationDeposit(9.9)).toBe(100);
    expect(getExpressReservationDeposit(30)).toBe(500);

    expect(isVerifiedExpressMotorReservation({
      ...exactExpressMotor,
      motorId: '11111111-1111-4111-8111-111111111111',
    })).toBe(false);
    expect(isVerifiedExpressMotorReservation({
      ...exactExpressMotor,
      modelNumber: 'NOT-THE-EXPRESS-MOTOR',
    })).toBe(false);
    expect(getMotorReservationDeposit(9.9, false)).toBe(200);
  });

  it('keeps the durable checkout indexes additive and deposit-scoped', () => {
    const migration = readFileSync(
      'supabase/migrations/20260830193000_enforce_unique_deposit_checkout_bindings.sql',
      'utf8',
    );

    expect(migration).toContain('CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_quotes_deposit_saved_quote');
    expect(migration).toContain('CREATE UNIQUE INDEX IF NOT EXISTS uq_customer_quotes_deposit_stripe_session');
    expect(migration.match(/WHERE lead_source = 'deposit'/g)).toHaveLength(2);
    expect(migration).toContain('deposit_checkout_binding_authority_ready');
    expect(migration).toContain('REVOKE ALL ON FUNCTION');
    expect(migration).toContain('GRANT EXECUTE ON FUNCTION');
    expect(migration).not.toMatch(/\b(?:DELETE|UPDATE|TRUNCATE)\b/i);
  });
});
