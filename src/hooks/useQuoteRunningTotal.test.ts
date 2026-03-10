import { describe, it, expect, vi } from 'vitest';
import { calculateRunningTotal } from './useQuoteRunningTotal';

const motor = (overrides = {}) => ({ price: 10000, model: 'F115EXB', hp: 115, ...overrides });

describe('calculateRunningTotal', () => {
  it('returns zeros for null motor', () => {
    const r = calculateRunningTotal(null);
    expect(r).toEqual({ subtotal: 0, hst: 0, total: 0, lineItems: [] });
  });

  it('returns zeros when motor has no price', () => {
    const r = calculateRunningTotal({ model: 'X', hp: 10 });
    expect(r).toEqual({ subtotal: 0, hst: 0, total: 0, lineItems: [] });
  });

  it('calculates motor only with 13% HST', () => {
    const r = calculateRunningTotal(motor());
    expect(r.subtotal).toBe(10000);
    expect(r.hst).toBeCloseTo(1300);
    expect(r.total).toBeCloseTo(11300);
    expect(r.lineItems).toHaveLength(1);
  });

  it('adds selected options', () => {
    const r = calculateRunningTotal(motor(), {
      selectedOptions: [
        { name: 'Prop', price: 500 },
        { name: 'Cover', price: 200 },
      ],
    });
    expect(r.subtotal).toBe(10700);
    expect(r.lineItems).toHaveLength(3);
  });

  it('adds $1200 for controls=none', () => {
    const r = calculateRunningTotal(motor(), { controlsOption: 'none' });
    expect(r.subtotal).toBe(11200);
  });

  it('adds $125 for controls=adapter', () => {
    const r = calculateRunningTotal(motor(), { controlsOption: 'adapter' });
    expect(r.subtotal).toBe(10125);
  });

  it('adds $450 installation labor for remote motor on installed path', () => {
    const r = calculateRunningTotal(motor(), { purchasePath: 'installed' });
    expect(r.subtotal).toBe(10450);
    expect(r.lineItems.find(l => l.label === 'Installation Labor')?.value).toBe(450);
  });

  it('skips installation labor for tiller (TLR) motor', () => {
    const r = calculateRunningTotal(motor({ model: 'F25TLR' }), { purchasePath: 'installed' });
    expect(r.subtotal).toBe(10000);
    expect(r.lineItems.find(l => l.label === 'Installation Labor')).toBeUndefined();
  });

  it('skips installation labor for MH tiller motor', () => {
    const r = calculateRunningTotal(motor({ model: 'F6MH' }), { purchasePath: 'installed' });
    expect(r.subtotal).toBe(10000);
  });

  it('adds mounting hardware on installed path', () => {
    const r = calculateRunningTotal(motor(), { purchasePath: 'installed', installationCost: 350 });
    expect(r.subtotal).toBe(10800); // 10000 + 450 labor + 350 hardware
  });

  it('adds fuel tank cost', () => {
    const r = calculateRunningTotal(motor(), { tankSize: '25L', tankCost: 189 });
    expect(r.subtotal).toBe(10189);
    expect(r.lineItems.find(l => l.label === '25L Fuel Tank')?.value).toBe(189);
  });

  it('adds battery cost when wantsBattery', () => {
    const r = calculateRunningTotal(motor(), { wantsBattery: true, batteryCost: 250 });
    expect(r.subtotal).toBe(10250);
  });

  it('skips battery when wantsBattery is false', () => {
    const r = calculateRunningTotal(motor(), { wantsBattery: false, batteryCost: 250 });
    expect(r.subtotal).toBe(10000);
  });

  it('adds warranty price with label showing extra years', () => {
    const r = calculateRunningTotal(motor(), { warrantyPrice: 800, warrantyTotalYears: 8 });
    expect(r.subtotal).toBe(10800);
    const item = r.lineItems.find(l => l.label.includes('Warranty'));
    expect(item?.label).toContain('+3 yrs');
  });

  it('subtracts trade-in credit', () => {
    const r = calculateRunningTotal(motor(), { tradeInValue: 2000 });
    expect(r.subtotal).toBe(8000);
    const item = r.lineItems.find(l => l.label === 'Trade-In Credit');
    expect(item?.isCredit).toBe(true);
    expect(item?.value).toBe(2000);
  });

  it('adds admin custom items', () => {
    const r = calculateRunningTotal(motor(), {
      adminCustomItems: [
        { name: 'Rush Fee', price: 100 },
        { name: 'Delivery', price: 75 },
      ],
    });
    expect(r.subtotal).toBe(10175);
  });

  it('subtracts admin discount', () => {
    const r = calculateRunningTotal(motor(), { adminDiscount: 500 });
    expect(r.subtotal).toBe(9500);
    const item = r.lineItems.find(l => l.label === 'Discount');
    expect(item?.isCredit).toBe(true);
  });

  it('applies cash rebate via getRebateForHP', () => {
    const getRebateForHP = vi.fn().mockReturnValue(750);
    const r = calculateRunningTotal(motor(), {
      selectedPromoOption: 'cash_rebate',
      getRebateForHP,
    });
    expect(getRebateForHP).toHaveBeenCalledWith(115);
    expect(r.subtotal).toBe(9250);
    expect(r.lineItems.find(l => l.label === 'Mercury Rebate')?.isCredit).toBe(true);
  });

  it('skips rebate when promo option is not cash_rebate', () => {
    const getRebateForHP = vi.fn().mockReturnValue(750);
    const r = calculateRunningTotal(motor(), {
      selectedPromoOption: 'special_financing',
      getRebateForHP,
    });
    expect(getRebateForHP).not.toHaveBeenCalled();
    expect(r.subtotal).toBe(10000);
  });

  it('kitchen sink: all options combined', () => {
    const getRebateForHP = vi.fn().mockReturnValue(500);
    const r = calculateRunningTotal(motor(), {
      selectedOptions: [{ name: 'Prop', price: 400 }],
      controlsOption: 'none',
      purchasePath: 'installed',
      installationCost: 300,
      tankSize: '25L',
      tankCost: 189,
      wantsBattery: true,
      batteryCost: 250,
      warrantyPrice: 800,
      warrantyTotalYears: 8,
      tradeInValue: 2000,
      adminCustomItems: [{ name: 'Delivery', price: 100 }],
      adminDiscount: 200,
      selectedPromoOption: 'cash_rebate',
      getRebateForHP,
    });
    // 10000 + 400 + 1200 + 450 + 300 + 189 + 250 + 800 - 2000 + 100 - 200 - 500 = 10989
    expect(r.subtotal).toBe(10989);
    expect(r.hst).toBeCloseTo(10989 * 0.13);
    expect(r.total).toBeCloseTo(10989 * 1.13);
    expect(r.lineItems.length).toBe(12);
  });
});
