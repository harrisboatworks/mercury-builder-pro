import { describe, expect, it } from 'vitest';
import { canonicalPathFor, canonicalUrlFor } from '@/lib/canonicalUrl';

describe('canonical URL normalization', () => {
  it('uses a slash-terminated canonical for the homepage', () => {
    expect(canonicalUrlFor('/')).toBe('https://www.mercuryrepower.ca/');
  });

  it('normalizes route case and trailing slashes', () => {
    expect(canonicalPathFor('/REPOWER/')).toBe('/repower');
    expect(canonicalUrlFor('/repower/')).toBe('https://www.mercuryrepower.ca/repower');
  });

  it('preserves the two intentional canonical aliases', () => {
    expect(canonicalPathFor('/mercury-repower-faq')).toBe('/faq');
    expect(canonicalPathFor('/motor-selection')).toBe('/quote/motor-selection');
  });

  it('does not lowercase case-sensitive path values', () => {
    expect(canonicalPathFor('/quote/saved/QuoteABC')).toBe('/quote/saved/QuoteABC');
  });
});
