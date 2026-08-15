import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  getActiveWarrantyExtraYears,
  getWarrantyDisplay,
  STANDARD_WARRANTY_YEARS,
} from '../warranty-display';
import { generateSMSMessage } from '../smsTemplates';

const now = new Date('2026-08-15T12:00:00Z');

describe('getWarrantyDisplay', () => {
  it('derives total years from an active extension', () => {
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

describe('getActiveWarrantyExtraYears', () => {
  it('uses the active promotion extra years', () => {
    expect(
      getActiveWarrantyExtraYears(
        [{ warranty_extra_years: 4, is_active: true, start_date: '2026-07-15', end_date: '2026-08-31' }],
        now,
      ),
    ).toBe(4);
  });

  it('returns 0 when no promotion has extra years', () => {
    expect(
      getActiveWarrantyExtraYears(
        [{ warranty_extra_years: 0, is_active: true, end_date: '2026-12-31' }],
        now,
      ),
    ).toBe(0);
  });

  it('ignores an expired promotion', () => {
    expect(
      getActiveWarrantyExtraYears(
        [{ warranty_extra_years: 4, is_active: true, start_date: '2026-05-01', end_date: '2026-06-30' }],
        now,
      ),
    ).toBe(0);
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

  it('derives campaign copy from warrantyExtraYears when an extension is active', () => {
    const campaign = generateSMSMessage('get7_campaign', { warrantyExtraYears: 4 });
    expect(campaign).toContain('7-Year Factory-Backed Warranty');
    expect(campaign).toContain('3 + 4 FREE years');
  });
});

describe('funnel warranty card source contract', () => {
  it('removes hardcoded seven-year copy from the remaining funnel cards', () => {
    const summary = readFileSync('src/components/quote-builder/PromoSummaryCard.tsx', 'utf8');
    const badge = readFileSync('src/components/quote-builder/PromoSelectionBadge.tsx', 'utf8');

    expect(summary).toContain('getWarrantyDisplay');
    expect(badge).toContain('getWarrantyDisplay');
    expect(summary).not.toContain('7-YEAR WARRANTY');
    expect(badge).not.toContain('7-YEAR WARRANTY');
    expect(summary).not.toContain('3 + 4 FREE years');
  });
});
