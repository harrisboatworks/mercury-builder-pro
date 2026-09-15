import { describe, expect, it } from 'vitest';
import { isPromotionMotorEligible } from '../promotion-eligibility';
import { resolveRebateForHP } from '../promotion-discounts';

const details = { motor_eligibility: { stock_required: true, min_hp: 2.5, max_hp: 425, excluded_families: ['racing', 'avator', 'v12', 'cpo'] } };
const motor = { hp: 20, model: '20 ELH FourStroke', stock_quantity: 1, in_stock: true };
describe('restricted campaign stock and model eligibility', () => {
  it('accepts available FourStroke stock', () => expect(isPromotionMotorEligible(details, motor)).toBe(true));
  it('rejects exhausted stock even with a stale stock flag', () => expect(isPromotionMotorEligible(details, {...motor, stock_quantity: 0})).toBe(false));
  it('rejects unknown or backordered inventory', () => {
    expect(isPromotionMotorEligible(details, null)).toBe(false);
    expect(isPromotionMotorEligible(details, {hp:20, stockStatus:'On Order'})).toBe(false);
  });
  it.each(['Racing', 'Avator', 'V12', 'CPO'])('excludes %s', family => expect(isPromotionMotorEligible(details, {...motor, family})).toBe(false));
  it('preserves offers without motor restrictions', () => expect(isPromotionMotorEligible(undefined, null)).toBe(true));
});

describe('Chase the Savings portable matrix', () => {
  const matrix = [{hp_min:2.5,hp_max:3.5,rebate:250},{hp_min:4,hp_max:9.9,rebate:300},{hp_min:15,hp_max:20,rebate:350},{hp_min:25,hp_max:30,rebate:400}];
  it.each([[2.5,250],[3.5,250],[4,300],[9.9,300],[15,350],[20,350],[25,400],[30,400]])('awards %s HP the exact $%s tier', (hp, value) => expect(resolveRebateForHP(matrix,hp)).toBe(value));
  it.each([2.49,3.51,3.99,9.91,14.99,20.01,24.99,30.01,40,115,425])('does not award a portable rebate at %s HP', hp => expect(resolveRebateForHP(matrix,hp)).toBeNull());
});
