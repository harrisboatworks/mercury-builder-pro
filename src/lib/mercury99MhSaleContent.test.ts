// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { buildMercury99MhFaqs, MERCURY_99_MH_ALTERNATE_NAMES } from './mercury99MhSaleContent';

describe('Mercury 9.9 MH search-intent content', () => {
  it('answers price, for-sale, EFI, weight, and availability questions directly', () => {
    const faqs = buildMercury99MhFaqs(2999, {
      inStock: false,
      quantity: 0,
      label: 'Available to order',
      detail: 'Available to order. Confirm the current ETA before travelling.',
      faqAnswer: 'It is available to order. Call or build a quote to confirm the current ETA before travelling to Gores Landing.',
      schemaAvailability: 'BackOrder',
      status: 'available_to_order',
    });

    const searchableCopy = faqs.map(({ question, answer }) => `${question} ${answer}`).join(' ');
    expect(searchableCopy).toContain('How much is a new Mercury 9.9 outboard in Ontario?');
    expect(searchableCopy).toContain('Mercury 9.9 outboard for sale in Ontario');
    expect(searchableCopy).toContain('battery-free electronic fuel injection (EFI)');
    expect(searchableCopy).toContain('dry weight of 88 lb');
    expect(searchableCopy).toContain('available to order');
  });

  it('publishes natural aliases for search and answer engines', () => {
    expect(MERCURY_99_MH_ALTERNATE_NAMES).toEqual(expect.arrayContaining([
      'Mercury 9.9',
      'Mercury 9.9 outboard',
      'Mercury 9.9 EFI',
      'Mercury 9.9 short shaft tiller',
    ]));
  });
});
