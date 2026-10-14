// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { formatStandingTdExpiry } from './motor-selection-financing';

const standing = {
  name: 'TD Auto Finance — Always On',
  rate: 5.48,
  promo_end_date: '2026-12-31',
};
const now = new Date('2026-10-14T07:11:40-04:00');

describe('motor-selection standing financing expiry', () => {
  it('names TD and December 31 rather than calling it a promo rate', () => {
    expect(formatStandingTdExpiry(standing, now)).toBe(
      'TD Auto Finance offer available through December 31, 2026 (OAC).',
    );
  });

  it('does not relabel Chase financing or borrow its October 30 expiry', () => {
    expect(formatStandingTdExpiry({
      name: 'Mercury Chase the Savings! — 2.99% for 24 months',
      rate: 2.99,
      promo_end_date: '2026-10-30',
    }, now)).toBeNull();
    expect(formatStandingTdExpiry({ ...standing, name: 'Other lender' }, now)).toBeNull();
  });

  it('uses the selected TD record date instead of a hardcoded deadline', () => {
    expect(formatStandingTdExpiry({ ...standing, promo_end_date: '2027-03-31' }, now))
      .toBe('TD Auto Finance offer available through March 31, 2027 (OAC).');
    expect(formatStandingTdExpiry({ ...standing, name: 'TD Always On' }, now))
      .toContain('December 31, 2026');
  });

  it('keeps December 31 inclusive in Ontario and hides the expired offer', () => {
    expect(formatStandingTdExpiry(standing, new Date('2027-01-01T04:59:59.999Z')))
      .toContain('December 31, 2026');
    expect(formatStandingTdExpiry(standing, new Date('2027-01-01T05:00:00Z')))
      .toBeNull();
  });

  it('does not claim a dated offer for missing, invalid or expired data', () => {
    expect(formatStandingTdExpiry(null, now)).toBeNull();
    expect(formatStandingTdExpiry(undefined, now)).toBeNull();
    for (const promo_end_date of [null, undefined, '', 'invalid', '2026-10-13']) {
      expect(formatStandingTdExpiry({ ...standing, promo_end_date }, now)).toBeNull();
    }
    for (const rate of [NaN, Infinity, -1]) {
      expect(formatStandingTdExpiry({ ...standing, rate }, now)).toBeNull();
    }
  });

  it('wires the expiry to the same offer as the card APR and removes the ambiguous countdown', () => {
    const page = readFileSync(new URL('../pages/quote/MotorSelectionPage.tsx', import.meta.url), 'utf8');
    expect(page).toContain('formatStandingTdExpiry(financingPromo)');
    expect(page).toContain('financingPromo.rate');
    expect(page).toContain('financingRate,');
    expect(page).toContain('<span>{standingTdExpiryLabel}</span>');
    expect(page).not.toContain('Promo rate');
    expect(page).not.toContain('daysUntil(');
    expect(page).toContain('formatPromoCalendarDate(promo.end_date)');
  });
});
