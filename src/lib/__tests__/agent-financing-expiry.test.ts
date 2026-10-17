import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import policy from '@/data/finance-policy.json';
import { resolveAgentFinancing, type AgentFinancingPromotion } from '../../../supabase/functions/agent-quote-api/financing';

const promotion: AgentFinancingPromotion = {
  is_active: true, start_date: '2026-10-01', end_date: '2026-10-30',
  promo_options: { options: [{ id: 'special_financing', rates: [{ rate: 2.99, months: 120 }] }] },
};
const active = new Date('2026-10-30T23:59:59-04:00');
const expired = new Date('2026-10-31T00:00:00-04:00');

describe('agent special-financing expiry', () => {
  it('uses the published offer through the Toronto end of the final day', () => {
    expect(resolveAgentFinancing({ promotion, amount: 10000, now: active })).toEqual({ rate: 2.99, term: 120, promotional: true });
  });
  it('uses the standard rate at the next Toronto midnight, ignoring stale requested rates', () => {
    expect(resolveAgentFinancing({ promotion, amount: 10000, now: expired, requestedRate: 2.99, requestedTerm: 120 })).toEqual({ rate: 7.99, term: 60, promotional: false });
  });
  it.each([null, { ...promotion, is_active: false }, { ...promotion, start_date: '2026-11-01' }, { ...promotion, end_date: 'invalid' }, { ...promotion, promo_options: null }])('falls back without a live special-financing option', (offer) => {
    expect(resolveAgentFinancing({ promotion: offer, amount: 9999, now: active }).rate).toBe(8.99);
  });
  it('cannot apply a caller-invented rate to a live promotion', () => {
    expect(resolveAgentFinancing({ promotion, amount: 10000, now: active, requestedRate: 0 })).toEqual({ rate: 7.99, term: 60, promotional: false });
  });
  it('respects the live option minimum', () => {
    const offer = { ...promotion, promo_options: { options: [{ id: 'special_financing', minimum_amount: 10000, minimum_amount_exclusive: true, rates: [{ rate: 2.99, months: 120 }] }] } };
    expect(resolveAgentFinancing({ promotion: offer, amount: 10000, now: active }).promotional).toBe(false);
    expect(resolveAgentFinancing({ promotion: offer, amount: 10001, now: active }).promotional).toBe(true);
  });
  it('keeps deployment-local standard tiers and term in parity with canonical policy', () => {
    const low = resolveAgentFinancing({ promotion: null, amount: 9999 });
    const high = resolveAgentFinancing({ promotion: null, amount: 10000 });
    expect(low.rate).toBe(policy.standardApr.under10000);
    expect(high.rate).toBe(policy.standardApr.atLeast10000);
    expect(low.term).toBe(policy.contractTermMonths);
  });
  it('wires the resolver before the quote insert and preserves the financing minimum', () => {
    const source = readFileSync('supabase/functions/agent-quote-api/index.ts', 'utf8');
    const resolver = source.indexOf('const { rate, term, promotional } = resolveAgentFinancing(');
    expect(resolver).toBeGreaterThan(0);
    expect(source.slice(resolver)).toMatch(/\.insert\(/);
    expect(source).toContain('promoOption === "special_financing" && pricing.finalPrice >= FINANCING_MINIMUM');
  });
});