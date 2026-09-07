import { afterEach, describe, expect, it, vi } from "vitest";
import {
  calculateMotorFinancingEstimate,
  DEALERPLAN_FEE,
  FINANCING_CONTRACT_TERM_MONTHS,
  FINANCING_MAXIMUM_AMORTIZATION_MONTHS,
  FINANCING_MINIMUM,
  formatFinancingRate,
  isMercuryPromoActive,
  MERCURY_PROMO_APR,
  MERCURY_PROMO_END_ISO,
  ONTARIO_HST_RATE,
} from "./finance";

describe("calculateMotorFinancingEstimate", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("amortizes the 60 ELPT card price with HST, the policy fee, and APR", () => {
    const estimate = calculateMotorFinancingEstimate(12_342, 5.48);

    expect(DEALERPLAN_FEE).toBe(349);
    expect(estimate).not.toBeNull();
    expect(estimate?.amountFinanced).toBeCloseTo(14_295.46, 2);
    expect(estimate?.termMonths).toBe(60);
    expect(estimate?.rate).toBe(5.48);
    expect(estimate?.payment).toBe(273);
    expect(estimate!.payment).toBeGreaterThan(
      estimate!.amountFinanced / estimate!.termMonths,
    );
  });

  it("does not advertise financing below the policy minimum", () => {
    expect(FINANCING_MINIMUM).toBe(5_000);
    expect(
      calculateMotorFinancingEstimate(FINANCING_MINIMUM - 0.01, 5.48),
    ).toBeNull();
    expect(
      calculateMotorFinancingEstimate(FINANCING_MINIMUM, 5.48),
    ).not.toBeNull();
    expect(calculateMotorFinancingEstimate(Number.NaN, 5.48)).toBeNull();
    expect(
      calculateMotorFinancingEstimate(Number.POSITIVE_INFINITY, 5.48),
    ).toBeNull();
    expect(calculateMotorFinancingEstimate(-1, 5.48)).toBeNull();
  });

  it("locks the disclosed fee, tax, contract, and amortization policy", () => {
    expect(DEALERPLAN_FEE).toBe(349);
    expect(ONTARIO_HST_RATE).toBe(0.13);
    expect(FINANCING_CONTRACT_TERM_MONTHS).toBe(60);
    expect(FINANCING_MAXIMUM_AMORTIZATION_MONTHS).toBe(240);
    expect(MERCURY_PROMO_APR).toBe(5.48);
    expect(formatFinancingRate(MERCURY_PROMO_APR)).toBe("5.48% APR");
  });

  it("uses the active standing rate when no valid APR is supplied", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-31T12:00:00-04:00"));

    expect(calculateMotorFinancingEstimate(12_342)?.rate).toBe(5.48);
    expect(calculateMotorFinancingEstimate(12_342, Number.NaN)?.rate).toBe(
      5.48,
    );
  });

  it("preserves a valid zero-percent rate", () => {
    const estimate = calculateMotorFinancingEstimate(12_342, 0);

    expect(estimate?.rate).toBe(0);
    expect(estimate?.payment).toBe(Math.round(14_295.46 / 60));
  });

  it("uses the standing APR through the exact inclusive expiry instant", () => {
    vi.useFakeTimers();
    const expiry = new Date(MERCURY_PROMO_END_ISO).getTime();

    vi.setSystemTime(expiry);
    expect(isMercuryPromoActive()).toBe(true);
    expect(calculateMotorFinancingEstimate(8_000)?.rate).toBe(5.48);

    vi.setSystemTime(expiry + 1);
    expect(isMercuryPromoActive()).toBe(false);
    expect(calculateMotorFinancingEstimate(8_000)?.rate).toBe(8.99);
    expect(calculateMotorFinancingEstimate(12_342)?.rate).toBe(7.99);
  });

  it("uses the financed amount for post-promo rate and amortization tiers", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-01-01T12:00:00-05:00"));

    const motorPriceAtFinancedThreshold =
      (10_000 - DEALERPLAN_FEE) / (1 + ONTARIO_HST_RATE);
    const thresholdEstimate = calculateMotorFinancingEstimate(
      motorPriceAtFinancedThreshold,
    );

    expect(calculateMotorFinancingEstimate(8_000)?.rate).toBe(8.99);
    expect(thresholdEstimate?.amountFinanced).toBeCloseTo(10_000, 8);
    expect(thresholdEstimate?.rate).toBe(7.99);
    expect(calculateMotorFinancingEstimate(17_500)?.termMonths).toBe(72);
    expect(calculateMotorFinancingEstimate(17_500)?.rate).toBe(7.99);
  });
});
