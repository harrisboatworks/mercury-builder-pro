// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const cardSource = readFileSync(new URL('./MotorCardPreview.tsx', import.meta.url), 'utf8');
const pageSource = readFileSync(
  new URL('../../pages/quote/MotorSelectionPage.tsx', import.meta.url),
  'utf8',
);

describe('motor-card financing wiring', () => {
  it('uses the canonical estimate helper and cannot restore the old straight-line formula', () => {
    expect(cardSource).toContain('calculateMotorFinancingEstimate');
    expect(cardSource).not.toMatch(/\+\s*299/);
    expect(cardSource).not.toMatch(/totalFinanced\s*\/\s*term/);
  });

  it('shares the disclosed APR with cards and has no dead page-local payment map', () => {
    expect(pageSource).toContain('financingRate: financingPromo?.rate');
    expect(pageSource).toContain('isMercuryPromoActive()');
    expect(pageSource).not.toContain('const monthlyPayments');
  });
});
