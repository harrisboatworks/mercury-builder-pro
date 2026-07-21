import { describe, expect, it } from 'vitest';
import type { BoatInfo } from '@/components/QuoteBuilder';
import {
  buildEmptyTradeInInfo,
  buildInitialTradeInInfo,
  isSupportedTradeInYear,
  parseMotorHorsepowerInput,
} from './trade-in-state';

describe('buildEmptyTradeInInfo', () => {
  it('removes both the trade decision and every valuation field', () => {
    expect(buildEmptyTradeInInfo()).toEqual({
      hasTradeIn: false,
      brand: '',
      year: 0,
      horsepower: 0,
      model: '',
      serialNumber: '',
      condition: 'good',
      estimatedValue: 0,
      confidenceLevel: 'medium',
    });
  });
});

const boatInfo = (
  currentMotorBrand: string,
  currentMotorYear: number,
  currentHp: number,
): BoatInfo => ({
  type: 'utility',
  make: '',
  model: '',
  length: '14',
  currentMotorBrand,
  currentMotorYear,
  currentHp,
  serialNumber: '',
  controlType: 'tiller',
  shaftLength: '20"',
});

describe('buildInitialTradeInInfo', () => {
  it('restores an existing trade-in before considering boat prefill', () => {
    const existing = {
      hasTradeIn: true,
      brand: 'Evinrude',
      year: 2016,
      horsepower: 90,
      model: 'E90DSL',
      serialNumber: '',
      condition: 'good' as const,
      estimatedValue: 3200,
      confidenceLevel: 'medium' as const,
    };
    const boat = boatInfo('Mercury', 2020, 60);

    expect(buildInitialTradeInInfo(existing, boat)).toEqual(existing);
  });

  it('uses boat details only when no saved trade-in exists', () => {
    const result = buildInitialTradeInInfo(null, boatInfo('Yamaha', 2003, 115));

    expect(result).toMatchObject({
      hasTradeIn: false,
      brand: 'Yamaha',
      year: 2003,
      horsepower: 115,
    });
  });
});

describe('isSupportedTradeInYear', () => {
  it('matches the valuation API range boundary', () => {
    expect(isSupportedTradeInYear(1949, 2026)).toBe(false);
    expect(isSupportedTradeInYear(1950, 2026)).toBe(true);
    expect(isSupportedTradeInYear(2026, 2026)).toBe(true);
    expect(isSupportedTradeInYear(2027, 2026)).toBe(false);
  });
});

describe('parseMotorHorsepowerInput', () => {
  it('preserves decimal horsepower used by portable outboards', () => {
    expect(parseMotorHorsepowerInput('9.9')).toBe(9.9);
    expect(parseMotorHorsepowerInput('2.5')).toBe(2.5);
  });

  it('normalizes empty or invalid values to zero', () => {
    expect(parseMotorHorsepowerInput('')).toBe(0);
    expect(parseMotorHorsepowerInput('-9.9')).toBe(0);
  });
});
