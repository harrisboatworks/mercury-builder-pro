import { describe, expect, it, vi } from 'vitest';
import {
  buildPromoteTradeInFromVoiceCard,
  estimateVoiceTradeIn,
  isUsableVoiceTradeInCard,
  mapVoiceTradeCondition,
  resolveVoiceEngineType,
  type VoiceTradeInCard,
} from '@/lib/voice-trade-in';

const freshCard = (overrides: Partial<VoiceTradeInCard> = {}): VoiceTradeInCard => ({
  brand: 'Mercury',
  year: 2020,
  horsepower: 90,
  condition: 'good',
  engineType: '4-stroke',
  estimatedValue: 5000,
  wholesale: 5000,
  valueRange: { low: 4500, high: 5500 },
  architecture: '4-stroke',
  valuedAt: Date.now(),
  confidenceLevel: 'high',
  ...overrides,
});

describe('voice trade-in mapping', () => {
  it('requests a missing condition and maps rough to poor', () => {
    expect(mapVoiceTradeCondition(undefined)).toBeNull();
    expect(mapVoiceTradeCondition('rough')).toBe('poor');
  });

  it('does not assume four-stroke for an unknown architecture', () => {
    expect(resolveVoiceEngineType({ model: '90 ELPT' })).toBeNull();
    expect(resolveVoiceEngineType({ engine_type: 'etec' })).toBe('etec');
    expect(resolveVoiceEngineType({ model: '90 E-TEC' })).toBe('etec');
  });
});

describe('estimateVoiceTradeIn', () => {
  it('asks for condition before inventing a number', async () => {
    const fetchValuation = vi.fn();
    const result = await estimateVoiceTradeIn({
      brand: 'Mercury',
      year: 2020,
      horsepower: 90,
    }, fetchValuation);
    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.reason).toBe('need_condition');
    expect(fetchValuation).not.toHaveBeenCalled();
  });
});

describe('voice apply card', () => {
  it('rejects stale or mismatched card amounts', () => {
    expect(isUsableVoiceTradeInCard(freshCard({
      valuedAt: Date.now() - 31 * 60 * 1000,
    }))).toBe(false);
    expect(isUsableVoiceTradeInCard(freshCard({
      wholesale: 5000,
      estimatedValue: 4800,
    }))).toBe(false);
    expect(isUsableVoiceTradeInCard(freshCard())).toBe(true);
    expect(buildPromoteTradeInFromVoiceCard(freshCard()).estimatedValue).toBe(5000);
  });
});
