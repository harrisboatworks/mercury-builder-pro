import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  buildBusinessCustomerAnswer,
  buildCustomerKnowledgeSnapshot,
  buildFinancingCustomerAnswer,
  buildMotorCustomerAnswer,
  resolveCustomerSellingPrice,
  type CustomerKnowledge,
} from '../../../supabase/functions/_shared/customer-knowledge-context';
import type { PromotionRecord } from '../../../supabase/functions/_shared/promotion-context';

const profile = {
  name: 'Harris Boat Works',
  lastUpdated: '2026-07-15',
  currency: 'CAD',
  contact: {
    phone: '+1-905-342-2153',
    phoneDisplay: '(905) 342-2153',
    email: 'info@harrisboatworks.ca',
    hours: {
      note: 'In-season April 1-November 30; closed for winter December 1-April 1.',
      monSat: '08:00-17:00',
      sun: '09:00-16:00',
    },
  },
  geography: {
    primaryServiceArea: 'Ontario, Canada',
    headquarters: {
      street: '5369 Harris Boat Works Rd',
      city: 'Gores Landing',
      region: 'ON',
      postalCode: 'K0K 2E0',
      country: 'CA',
    },
  },
  services: ['Mercury outboard sales', 'Mercury repower', 'Mercury factory service'],
  productExclusions: {
    delivery: {
      policy: 'pickup_only',
      reason: 'Motor purchases are pickup only at Gores Landing; we do not ship or deliver motors.',
    },
  },
};

const summerSavings: PromotionRecord = {
  id: 'summer',
  name: 'Mercury Summer Savings Rebate',
  start_date: '2026-07-15',
  end_date: '2026-08-31',
  discount_fixed_amount: 0,
  details: { combination_mode: 'layered', market: { country: 'CA' } },
  promo_options: {
    options: [
      { id: 'cash_rebate', matrix: [{ hp_min: 30, hp_max: 115, rebate: 250 }] },
      { id: 'special_financing', rates: [{ rate: 2.99, months: 24 }] },
    ],
  },
};

const knowledge: CustomerKnowledge = {
  business: profile,
  businessPublished: true,
  motors: [
    {
      id: '60-elpt',
      model: '60 ELPT FourStroke',
      model_display: '60 ELPT FourStroke',
      horsepower: 60,
      msrp: 12_400,
      dealer_price: 11_900,
      manual_overrides: { sale_price: 11_500, sale_price_expires_at: '2026-08-31' },
      availability: 'Available',
      in_stock: false,
      stock_quantity: 0,
      updated_at: '2026-07-16T12:00:00Z',
    },
  ],
  promotions: [summerSavings],
  financing: [{
    id: 'td',
    name: 'TD Auto Finance — Always On',
    rate: 5.48,
    term_months: 60,
    min_amount: 5_000,
    promo_end_date: '2026-12-31',
    is_active: true,
  }],
};

describe('shared customer knowledge', () => {
  it('uses the quote-compatible selling-price hierarchy and honours override expiry', () => {
    const motor = knowledge.motors[0];
    expect(resolveCustomerSellingPrice(motor, new Date('2026-07-16T12:00:00Z'))).toBe(11_500);
    expect(resolveCustomerSellingPrice(motor, new Date('2026-09-01T12:00:00Z'))).toBe(11_900);
  });

  it('answers orderable motor, layered financing, and published-hours questions deterministically', () => {
    expect(buildMotorCustomerAnswer(knowledge.motors, 'How much is a 60 hp and is it available?'))
      .toContain('Available to order');

    const financing = buildFinancingCustomerAnswer(knowledge.financing, knowledge.promotions);
    expect(financing).toContain('2.99% APR for 24 months');
    expect(financing).toContain('layers with the eligible factory rebate');
    expect(financing).toContain('5.48% APR');
    expect(financing).toContain('60-month term');

    expect(buildBusinessCustomerAnswer(profile, 'Are you open Sunday?')).toContain('Sunday 09:00-16:00');
    expect(buildBusinessCustomerAnswer(profile, 'Do you deliver?')).toContain('do not ship or deliver');
  });

  it('produces a stable shared source version for chat and voice probes', async () => {
    const chat = await buildCustomerKnowledgeSnapshot(knowledge);
    const voice = await buildCustomerKnowledgeSnapshot(knowledge);
    expect(chat.sourceVersion).toBe(voice.sourceVersion);
    expect(chat.motors.count).toBe(1);
    expect(chat.business.phone).toBe('+1-905-342-2153');
  });

  it('applies the token endpoint prompt override when the ElevenLabs session starts', () => {
    const source = readFileSync('src/hooks/useElevenLabsVoice.ts', 'utf8');
    expect(source).toContain('prompt: { prompt: tokenData.systemPrompt }');
    expect(source).toContain('knowledgeVersion?: string');
  });
});
