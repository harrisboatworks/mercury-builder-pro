import { afterEach, describe, expect, it, vi } from 'vitest';
import { getMotorCalculatorApr } from './finance';

describe('getMotorCalculatorApr', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('uses the active standing Mercury rate before expiry', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-23T12:00:00-04:00'));

    expect(getMotorCalculatorApr(25_000)).toBe(5.48);
    expect(getMotorCalculatorApr(8_000)).toBe(5.48);
  });

  it('preserves an explicitly selected lower special-financing rate', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-23T12:00:00-04:00'));

    expect(getMotorCalculatorApr(25_000, 2.99)).toBe(2.99);
  });

  it('returns to the standard price tiers after the standing offer expires', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2027-01-01T12:00:00-05:00'));

    expect(getMotorCalculatorApr(25_000)).toBe(7.99);
    expect(getMotorCalculatorApr(8_000)).toBe(8.99);
  });
});
