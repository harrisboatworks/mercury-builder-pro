import { describe, expect, it } from 'vitest';
import {
  inferValidatedTradeInHorsepower,
  resolveTradeInInput,
  TradeInInputError,
} from '@/lib/trade-in-input';

describe('inferValidatedTradeInHorsepower', () => {
  it('accepts a single validated model HP', () => {
    expect(inferValidatedTradeInHorsepower('90 FourStroke')).toBe(90);
    expect(inferValidatedTradeInHorsepower('F115')).toBe(115);
  });

  it('rejects ambiguous multi-number model text', () => {
    expect(inferValidatedTradeInHorsepower('ELPT 90 or 115')).toBeNull();
  });
});

describe('resolveTradeInInput', () => {
  it('accepts model-only HP when it is validated', () => {
    const resolved = resolveTradeInInput({
      brand: 'Mercury',
      year: 2020,
      model: '90 FourStroke',
      engine_type: '4-stroke',
    });
    expect(resolved.horsepower).toBe(90);
  });

  it('rejects a present malformed trade', () => {
    expect(() => resolveTradeInInput({ brand: 'Mercury', year: 2020, model: 'ELPT' }))
      .toThrow(TradeInInputError);
  });

  it('ignores public override_value', () => {
    const resolved = resolveTradeInInput({
      brand: 'Mercury',
      year: 2020,
      horsepower: 90,
      override_value: 9999,
    });
    expect(resolved.overrideValue).toBeUndefined();
  });

  it('keeps authorized override_value for agents', () => {
    const resolved = resolveTradeInInput({
      brand: 'Mercury',
      year: 2020,
      horsepower: 90,
      override_value: 9999,
    }, { allowOverride: true });
    expect(resolved.overrideValue).toBe(9999);
  });
});
