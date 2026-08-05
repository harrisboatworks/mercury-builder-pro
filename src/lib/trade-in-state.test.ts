import { describe, expect, it } from 'vitest';
import type { BoatInfo } from '@/components/QuoteBuilder';
import {
  buildInitialTradeInInfo,
  clearTradeInValuation,
  isSupportedTradeInYear,
  parseTradeInDraft,
  parseMotorHorsepowerInput,
  serializeTradeInDraft,
} from './trade-in-state';

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

describe('valuation freshness', () => {
  const valued = {
    hasTradeIn: true,
    brand: 'Mercury',
    year: 2017,
    horsepower: 150,
    model: '150 Pro XS',
    serialNumber: '',
    condition: 'good' as const,
    estimatedValue: 5000,
    confidenceLevel: 'high' as const,
    rangeFinalLow: 4500,
    rangeFinalHigh: 5500,
    valuationReportUrl: 'https://valuation.mercuryrepower.ca/report',
  };

  it('clears every price artifact when a price-driving input changes', () => {
    expect(clearTradeInValuation(valued, { year: 2018 })).toMatchObject({
      year: 2018,
      estimatedValue: 0,
      rangeFinalLow: undefined,
      rangeFinalHigh: undefined,
      valuationReportUrl: undefined,
    });
  });

  it('keeps a recent draft value but strips a stale or legacy value', () => {
    const now = 1_800_000_000_000;
    expect(parseTradeInDraft(serializeTradeInDraft(valued, now - 60_000), now)?.estimatedValue).toBe(5000);
    expect(parseTradeInDraft(serializeTradeInDraft(valued, now - 31 * 60_000), now)?.estimatedValue).toBe(0);
    expect(parseTradeInDraft(JSON.stringify(valued), now)?.estimatedValue).toBe(0);
    expect(parseTradeInDraft(serializeTradeInDraft(valued, now - 25 * 60 * 60_000), now)?.estimatedValue).toBe(0);
  });
});
