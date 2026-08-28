import { describe, expect, it } from 'vitest';
import { buildAccessoryBreakdown } from '@/lib/build-accessory-breakdown';
import { includesPropeller } from '@/lib/motor-helpers';

describe('propeller quote selection', () => {
  it('includes the allowance by default for a 60 HP motor', () => {
    const breakdown = buildAccessoryBreakdown({
      motor: { model: '60 ELPT FourStroke', hp: 60 },
      purchasePath: 'installed',
    });

    expect(breakdown).toContainEqual(expect.objectContaining({
      name: 'Propeller Allowance (Aluminum)',
      price: 350,
    }));
  });

  it('removes the allowance when the customer selects an existing propeller', () => {
    const breakdown = buildAccessoryBreakdown({
      motor: { model: '60 ELPT FourStroke', hp: 60 },
      purchasePath: 'installed',
      installConfig: { propellerDecision: 'reuse_existing' },
    });

    expect(breakdown).toContainEqual(expect.objectContaining({
      name: 'Propeller: Use Existing',
      price: 0,
    }));
    expect(breakdown.some((item) => item.name.includes('Allowance'))).toBe(false);
  });

  it('keeps the legacy same-HP Mercury trade-in reuse assumption', () => {
    const breakdown = buildAccessoryBreakdown({
      motor: { model: '60 ELPT FourStroke', hp: 60 },
      purchasePath: 'installed',
      tradeInInfo: {
        hasTradeIn: true,
        brand: 'Mercury',
        horsepower: 60,
      },
    });

    expect(breakdown).toContainEqual(expect.objectContaining({
      name: 'Propeller: Use Existing',
      price: 0,
    }));
  });

  it('lets a same-HP Mercury trade-in customer request a new propeller', () => {
    const breakdown = buildAccessoryBreakdown({
      motor: { model: '60 ELPT FourStroke', hp: 60 },
      purchasePath: 'installed',
      installConfig: { propellerDecision: 'include_allowance' },
      tradeInInfo: {
        hasTradeIn: true,
        brand: 'Mercury',
        horsepower: 60,
      },
    });

    expect(breakdown).toContainEqual(expect.objectContaining({
      name: 'Propeller Allowance (Aluminum)',
      price: 350,
    }));
  });

  it('requires a propeller allowance for 25 HP tiller motors', () => {
    expect(includesPropeller({
      hp: 25,
      model: '25 MH FourStroke',
    } as Parameters<typeof includesPropeller>[0])).toBe(false);
    const breakdown = buildAccessoryBreakdown({
      motor: { model: '25 MH FourStroke', hp: 25 },
      purchasePath: 'installed',
    });

    expect(breakdown).toContainEqual(expect.objectContaining({
      name: 'Propeller Allowance (Aluminum)',
      price: 350,
    }));
  });

  it('does not add an allowance below 25 HP', () => {
    const breakdown = buildAccessoryBreakdown({
      motor: { model: '20 ELH FourStroke', hp: 20 },
      purchasePath: 'installed',
    });

    expect(includesPropeller({
      hp: 20,
      model: '20 ELH FourStroke',
    } as Parameters<typeof includesPropeller>[0])).toBe(true);
    expect(breakdown.some((item) => item.name.includes('Propeller'))).toBe(false);
  });
});
