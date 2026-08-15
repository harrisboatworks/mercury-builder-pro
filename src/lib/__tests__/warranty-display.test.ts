import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  getAppliedPromotion,
  getAppliedWarrantyExtraYears,
  getWarrantyDisplay,
  getWarrantyDisplayFromAppliedPromotion,
  STANDARD_WARRANTY_YEARS,
} from '../warranty-display';
import { generateSMSMessage } from '../smsTemplates';

describe('getWarrantyDisplay', () => {
  it('derives total years from an applied extension', () => {
    expect(getWarrantyDisplay(4)).toEqual({
      extraYears: 4,
      totalYears: 7,
      hasExtension: true,
      badgeLabel: '7-YEAR WARRANTY',
      headline: '7 Years Warranty',
      shortHeadline: '7 Years',
      detail: '3 + 4 FREE years',
    });
  });

  it('shows only standard warranty wording when there is no extension', () => {
    expect(getWarrantyDisplay(0)).toEqual({
      extraYears: 0,
      totalYears: STANDARD_WARRANTY_YEARS,
      hasExtension: false,
      badgeLabel: '3-YEAR WARRANTY',
      headline: '3 Years Warranty',
      shortHeadline: '3 Years',
      detail: '3-year factory-backed warranty',
    });
  });
});

describe('applied promotion warranty rule', () => {
  it('shows 3 years when no promotion is applied', () => {
    expect(getAppliedPromotion([])).toBeNull();
    expect(getAppliedWarrantyExtraYears(null)).toBe(0);
    expect(getWarrantyDisplayFromAppliedPromotion(null).totalYears).toBe(3);
  });

  it('shows 7 years when the applied promotion adds 4', () => {
    const applied = getAppliedPromotion([{ warranty_extra_years: 4 }]);
    expect(getWarrantyDisplayFromAppliedPromotion(applied).totalYears).toBe(7);
  });

  it('shows 5 years when the applied promotion adds 2', () => {
    const applied = getAppliedPromotion([{ warranty_extra_years: 2 }]);
    expect(getWarrantyDisplayFromAppliedPromotion(applied).totalYears).toBe(5);
  });

  it('ignores an unrelated later active promotion and uses only the applied row', () => {
    const promotions = [
      { id: 'applied', warranty_extra_years: 2 },
      { id: 'unrelated-active', warranty_extra_years: 4 },
    ];
    const applied = getAppliedPromotion(promotions);

    expect(applied).toEqual(promotions[0]);
    expect(getWarrantyDisplayFromAppliedPromotion(applied).totalYears).toBe(5);
    expect(getWarrantyDisplayFromAppliedPromotion(applied).totalYears).not.toBe(7);
  });

  it('shows 3 years when an inactive or expired promotion was not applied', () => {
    // useActivePromotions already excludes inactive/expired rows. Those
    // promotions never become promotions[0], so the display helper receives
    // an empty applied list rather than re-parsing dates itself.
    const applied = getAppliedPromotion([]);
    expect(getWarrantyDisplayFromAppliedPromotion(applied).totalYears).toBe(3);
  });

  it('treats null or 0 extra years on the applied promotion as the standard 3 years', () => {
    expect(
      getWarrantyDisplayFromAppliedPromotion({ warranty_extra_years: null }).totalYears,
    ).toBe(3);
    expect(
      getWarrantyDisplayFromAppliedPromotion({ warranty_extra_years: 0 }).totalYears,
    ).toBe(3);
  });
});

describe('legacy get7 SMS templates', () => {
  it('are not used by quote or lead customer senders', () => {
    const quotesApi = readFileSync('src/lib/quotesApi.ts', 'utf8');
    const leadCapture = readFileSync('src/lib/leadCapture.ts', 'utf8');
    const dashboard = readFileSync('src/components/admin/SMSDashboard.tsx', 'utf8');

    expect(quotesApi).toContain("generateSMSMessage('quote_confirmation'");
    expect(quotesApi).not.toContain('get7_');
    expect(leadCapture).toContain("generateSMSMessage('hot_lead'");
    expect(leadCapture).not.toContain('get7_');
    expect(dashboard).not.toContain('get7_campaign');
    expect(dashboard).not.toContain('get7_reminder');
  });

  it('does not hardcode a seven-year promise without extra years', () => {
    const campaign = generateSMSMessage('get7_campaign', { customerName: 'Jay' });
    const reminder = generateSMSMessage('get7_reminder', { customerName: 'Jay', daysLeft: 3 });

    expect(campaign).toContain('3-year factory-backed warranty');
    expect(campaign).not.toMatch(/7-Year Factory-Backed Warranty/);
    expect(reminder).toContain('3-year factory-backed warranty');
    expect(reminder).not.toMatch(/7 years of factory coverage/);
  });

  it('derives campaign copy from warrantyExtraYears when an extension is applied', () => {
    const campaign = generateSMSMessage('get7_campaign', { warrantyExtraYears: 4 });
    expect(campaign).toContain('7-Year Factory-Backed Warranty');
    expect(campaign).toContain('3 + 4 FREE years');
  });
});

describe('funnel warranty card source contract', () => {
  it('uses the applied-promotion helper instead of max-active combining', () => {
    const helper = readFileSync('src/lib/warranty-display.ts', 'utf8');
    const summary = readFileSync('src/components/quote-builder/PromoSummaryCard.tsx', 'utf8');
    const badge = readFileSync('src/components/quote-builder/PromoSelectionBadge.tsx', 'utf8');

    expect(helper).toContain('getAppliedPromotion');
    expect(helper).not.toContain('getActiveWarrantyExtraYears');
    expect(helper).toContain('Do not Math.max or sum extra years across unrelated active rows');
    expect(summary).toContain('getWarrantyDisplayFromAppliedPromotion');
    expect(badge).toContain('getWarrantyDisplayFromAppliedPromotion');
    expect(summary).not.toContain('getActiveWarrantyExtraYears');
    expect(badge).not.toContain('getActiveWarrantyExtraYears');
    expect(summary).not.toContain('7-YEAR WARRANTY');
    expect(badge).not.toContain('7-YEAR WARRANTY');
    expect(summary).not.toContain('3 + 4 FREE years');
  });
});
