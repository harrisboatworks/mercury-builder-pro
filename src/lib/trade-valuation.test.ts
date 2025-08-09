import { describe, it, expect } from 'vitest';
import { medianRoundedTo25 } from './trade-valuation';

const compute = (low: number, high: number) => medianRoundedTo25(low, high);

describe('medianRoundedTo25', () => {
  it('Range $320–$480 → median $400 → displays $400', () => {
    expect(compute(320, 480)).toBe(400);
  });

  it('Range $330–$465 → median $397.50 → rounds to $400', () => {
    expect(compute(330, 465)).toBe(400);
  });

  it('Range $350–$410 → median $380 → rounds to $375', () => {
    expect(compute(350, 410)).toBe(375);
  });

  it('Median exactly at $362.50 rounds to $375', () => {
    // low + high = 725 → median 362.5
    expect(compute(350, 375)).toBe(375);
  });

  it('Median just below $387.50 (e.g., $387.49) rounds to $375', () => {
    expect(compute(325.0, 449.98)).toBe(375); // (325 + 449.98)/2 = 387.49
  });

  it('Median exactly at $387.50 rounds up to $400', () => {
    expect(compute(349, 426)).toBe(400); // (349 + 426)/2 = 387.5
  });
});
