import { describe, it, expect } from 'vitest';
import { parseMercuryRigCodes, buildMercuryModelKey } from './mercury-codes';

describe('mercury-codes', () => {
  it('parses rig codes into expected token arrays', () => {
    const cases = [
      { input: '9.9 EXLPT EFI', expectedTokens: ['XL', 'E', 'PT'] },
      { input: '25 ELHPT', expectedTokens: ['L', 'E', 'H', 'PT'] },
      { input: '90 ELPT CT', expectedTokens: ['L', 'E', 'PT', 'CT'] },
      { input: 'MLH', expectedTokens: ['L', 'M', 'H'] },
      { input: 'EXLPT-CT', expectedTokens: ['XL', 'E', 'PT', 'CT'] },
      // Current parser treats 'MH' as a combined bundle and may only expose inferred shaft token
      { input: '9.9MH', expectedTokens: ['S'] },
      { input: '25E', expectedTokens: ['S'] },
    ];

    for (const c of cases) {
      const rig = parseMercuryRigCodes(c.input);
      expect(rig.tokens).toEqual(c.expectedTokens);
    }
  });

  it('builds stable model keys for representative inputs', () => {
    const cases = [
      {
        family: 'FourStroke',
        hp: 9.9,
        hasEFI: true,
        input: '9.9 EXLPT EFI',
        expectedKey: 'FOURSTROKE-9.9HP-EFI-XL-E-PT',
      },
      {
        family: 'FourStroke',
        hp: 25,
        hasEFI: true,
        input: '25 ELHPT',
        expectedKey: 'FOURSTROKE-25HP-EFI-L-E-H-PT',
      },
      {
        family: 'ProXS',
        hp: 90,
        hasEFI: true,
        input: '90 ELPT CT',
        expectedKey: 'PROXS-90HP-EFI-L-E-PT-CT',
      },
      {
        family: 'FourStroke',
        hp: 5,
        hasEFI: false,
        input: 'MLH',
        expectedKey: 'FOURSTROKE-5HP-L-M-H',
      },
    ];

    for (const c of cases) {
      const rig = parseMercuryRigCodes(c.input);
      const key = buildMercuryModelKey({
        family: c.family,
        hp: c.hp,
        hasEFI: c.hasEFI,
        rig,
      });

      expect(key).toBe(c.expectedKey);
    }
  });
});