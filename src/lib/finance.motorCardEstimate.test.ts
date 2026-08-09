import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  calculateMotorFinancingEstimate,
  DEALERPLAN_FEE,
  FINANCING_MINIMUM,
} from './finance';

describe('calculateMotorFinancingEstimate', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('amortizes the live 60 ELPT card price with HST, the canonical fee, and APR', () => {
    const estimate = calculateMotorFinancingEstimate(12_342, 5.48);

    expect(DEALERPLAN_FEE).toBe(349);
    expect(estimate).not.toBeNull();
    expect(estimate?.amountFinanced).toBeCloseTo(14_295.46, 2);
    expect(estimate?.termMonths).toBe(60);
    expect(estimate?.rate).toBe(5.48);
    expect(estimate?.payment).toBe(273);
    expect(estimate!.payment).toBeGreaterThan(estimate!.amountFinanced / estimate!.termMonths);
  });

  it('does not advertise financing below the policy minimum', () => {
    expect(calculateMotorFinancingEstimate(FINANCING_MINIMUM - 0.01, 5.48)).toBeNull();
    expect(calculateMotorFinancingEstimate(FINANCING_MINIMUM, 5.48)).not.toBeNull();
  });

  it('uses the active standing rate when no APR is supplied', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-09T12:00:00-04:00'));

    expect(calculateMotorFinancingEstimate(12_342)?.rate).toBe(5.48);
  });

  it('returns to the applicable price tier after the standing offer expires', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2027-01-01T12:00:00-05:00'));

    expect(calculateMotorFinancingEstimate(8_000)?.rate).toBe(8.99);
    expect(calculateMotorFinancingEstimate(12_342)?.rate).toBe(7.99);
  });
});
