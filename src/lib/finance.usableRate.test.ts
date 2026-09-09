import { describe, expect, it } from 'vitest';
import {
  firstUsableFinancingRate,
  formatSpecialFinancingLabel,
  getMotorCalculatorApr,
  isUsableFinancingRate,
} from './finance';

describe('isUsableFinancingRate', () => {
  it('treats 0 as a real promotional rate', () => {
    expect(isUsableFinancingRate(0)).toBe(true);
    expect(isUsableFinancingRate(2.99)).toBe(true);
    expect(isUsableFinancingRate(null)).toBe(false);
    expect(isUsableFinancingRate(undefined)).toBe(false);
    expect(isUsableFinancingRate(Number.NaN)).toBe(false);
    expect(isUsableFinancingRate(-1)).toBe(false);
  });

  it('keeps the first usable candidate, including 0', () => {
    expect(firstUsableFinancingRate(0, 5.48)).toBe(0);
    expect(firstUsableFinancingRate(null, 0)).toBe(0);
    expect(firstUsableFinancingRate(undefined, null)).toBeNull();
  });
});

describe('formatSpecialFinancingLabel', () => {
  it('renders 0% APR with a finite term and omits a missing term', () => {
    expect(formatSpecialFinancingLabel(0, 60)).toBe('0% APR for 60 months');
    expect(formatSpecialFinancingLabel(0, null)).toBe('0% APR');
    expect(formatSpecialFinancingLabel(0)).toBe('0% APR');
    expect(formatSpecialFinancingLabel(2.99, 24)).toBe('2.99% APR for 24 months');
  });
});

describe('getMotorCalculatorApr — zero promo', () => {
  it('preserves an explicitly selected 0% special-financing rate', () => {
    expect(getMotorCalculatorApr(20112.7, 0)).toBe(0);
  });
});
