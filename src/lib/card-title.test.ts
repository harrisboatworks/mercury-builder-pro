import { describe, it, expect } from 'vitest';
import { formatVariantSubtitle, formatMotorTitle } from './card-title';

// Helper to build title
const title = (year: number, model: string) => `${year} ${model}`;

describe('formatVariantSubtitle', () => {
  it('keeps feature words and codes in priority order (max 3)', () => {
    const raw = '2025 FourStroke 9.9HP Command Thrust ProKicker EXLPT';
    const t = title(2025, 'FourStroke 9.9HP');
    expect(formatVariantSubtitle(raw, t)).toBe('Command Thrust · ProKicker · EXLPT');
  });

  it('keeps ELPT and XL codes when present', () => {
    const raw = '2025 FourStroke 115HP ELPT XL';
    const t = title(2025, 'FourStroke 115HP');
    expect(formatVariantSubtitle(raw, t)).toBe('ELPT · XL');
  });

  it('drops tokens already in title and ignores non-whitelisted tokens', () => {
    const raw = '2025 Verado 350HP HD CXXXL';
    const t = title(2025, 'Verado 350HP');
    expect(formatVariantSubtitle(raw, t)).toBe('');
  });

  it('handles duplicate noise and keeps only MH', () => {
    const raw = '2025 Mercury 2025 FourStroke 9.9HP MH';
    const t = title(2025, 'FourStroke 9.9HP');
    expect(formatVariantSubtitle(raw, t)).toBe('MH');
  });

  it('removes year tokens anywhere in raw', () => {
    const raw = '2025 Mercury 2025 FourStroke ELPT';
    const t = title(2025, 'FourStroke');
    expect(formatVariantSubtitle(raw, t)).toBe('ELPT');
  });
});

describe('formatMotorTitle', () => {
  it('strips repeated leading years', () => {
    expect(formatMotorTitle(2025, '2025 2025 FourStroke 2.5HP MH')).toBe('2025 FourStroke 2.5HP MH');
  });

  it('strips leading years with punctuation and brand', () => {
    expect(formatMotorTitle(2025, '2025 - 2025 Mercury FourStroke 9.9HP MH')).toBe('2025 FourStroke 9.9HP MH');
  });

  it('prepends year when none in model', () => {
    expect(formatMotorTitle(2025, 'FourStroke 9.9HP MH')).toBe('2025 FourStroke 9.9HP MH');
  });

  it('keeps product line names', () => {
    expect(formatMotorTitle(2025, 'Verado 350HP HD CXXXL')).toBe('2025 Verado 350HP HD CXXXL');
  });
});
