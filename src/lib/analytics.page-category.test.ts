import { describe, expect, it } from 'vitest';

import { getPageCategory } from './analytics';

describe('analytics page categories', () => {
  it('classifies the canonical pricing surface as a money page', () => {
    expect(getPageCategory('/pricing-reference')).toBe('money');
    expect(getPageCategory('/pricing-reference/')).toBe('money');
    expect(getPageCategory('/pricing-references')).toBe('other');
  });
});
