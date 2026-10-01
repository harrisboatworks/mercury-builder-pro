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
      // Glued portable bundles peel the same way as the spaced form.
      // The previous ['S'] lock recorded the horsepower-prefix miss.
      { input: '9.9MH', expectedTokens: ['S', 'M', 'H'] },
      { input: '25E', expectedTokens: ['S', 'E'] },
    ];

    for (const c of cases) {
      const rig = parseMercuryRigCodes(c.input);
      expect(rig.tokens).toEqual(c.expectedTokens);
    }
  });

  it('peels horsepower-prefixed catalog bundles without inventing power trim', () => {
    expect(parseMercuryRigCodes('115EXLPT FourStroke')).toMatchObject({
      tokens: ['XL', 'E', 'PT'],
      shaft_code: 'XL',
      shaft_inches: 25,
      start_type: 'Electric',
      control_type: 'Remote',
      has_power_trim: true,
      has_command_thrust: false,
      is_counter_rotating: false,
    });
    expect(parseMercuryRigCodes('115 EXLPT FourStroke')).toMatchObject({
      tokens: ['XL', 'E', 'PT'],
      shaft_code: 'XL',
      shaft_inches: 25,
      start_type: 'Electric',
      control_type: 'Remote',
      has_power_trim: true,
    });
    expect(parseMercuryRigCodes('9.9ELH FourStroke')).toMatchObject({
      tokens: ['L', 'E', 'H'],
      shaft_code: 'L',
      shaft_inches: 20,
      start_type: 'Electric',
      control_type: 'Tiller',
      has_power_trim: false,
    });
    expect(parseMercuryRigCodes('9.9 ELH FourStroke')).toMatchObject({
      shaft_code: 'L',
      shaft_inches: 20,
      start_type: 'Electric',
      control_type: 'Tiller',
    });
    expect(parseMercuryRigCodes('9.9 MH FourStroke')).toMatchObject({
      tokens: ['S', 'M', 'H'],
      shaft_code: 'S',
      shaft_inches: 15,
      start_type: 'Manual',
      control_type: 'Tiller',
    });
    expect(parseMercuryRigCodes('9.9MH')).toMatchObject({
      tokens: ['S', 'M', 'H'],
      shaft_code: 'S',
      start_type: 'Manual',
      control_type: 'Tiller',
    });
    expect(parseMercuryRigCodes('25E')).toMatchObject({
      tokens: ['S', 'E'],
      shaft_code: 'S',
      shaft_inches: 15,
      start_type: 'Electric',
      control_type: 'Remote',
      has_power_trim: false,
    });
    expect(parseMercuryRigCodes('150L FourStroke')).toMatchObject({
      tokens: ['L'],
      shaft_code: 'L',
      shaft_inches: 20,
      start_type: 'Unknown',
      control_type: 'Remote',
      has_power_trim: false,
    });
    expect(parseMercuryRigCodes('150 XL FourStroke')).toMatchObject({
      tokens: ['XL'],
      shaft_code: 'XL',
      shaft_inches: 25,
      start_type: 'Unknown',
      has_power_trim: false,
    });
    expect(parseMercuryRigCodes('225XXL FourStroke')).toMatchObject({
      tokens: ['XXL'],
      shaft_code: 'XXL',
      shaft_inches: 30,
      start_type: 'Unknown',
      has_power_trim: false,
      is_counter_rotating: false,
    });
    expect(parseMercuryRigCodes('5MXLH FourStroke')).toMatchObject({
      tokens: ['XL', 'M', 'H'],
      shaft_code: 'XL',
      shaft_inches: 25,
      start_type: 'Manual',
      control_type: 'Tiller',
    });
    expect(parseMercuryRigCodes('5MLHA Sail Power FourStroke')).toMatchObject({
      tokens: ['L', 'M', 'H'],
      shaft_code: 'L',
      shaft_inches: 20,
      start_type: 'Manual',
      control_type: 'Tiller',
    });
    // Trailing GA is not a rig code. The shaft letter still counts.
    expect(parseMercuryRigCodes('30MLHGA FourStroke')).toMatchObject({
      tokens: ['L', 'M', 'H'],
      shaft_code: 'L',
      shaft_inches: 20,
      start_type: 'Manual',
      control_type: 'Tiller',
    });
    // MRC is not a manual-start bundle, but the existing peel already reads a
    // leading M. Glued 9.9MRC now matches that standalone result. Shaft stays short.
    expect(parseMercuryRigCodes('9.9MRC FourStroke')).toMatchObject({
      tokens: ['S', 'M'],
      shaft_code: 'S',
      shaft_inches: 15,
      start_type: 'Manual',
      control_type: 'Remote',
    });
  });

  it('recognizes glued counter-rotation without changing spaced or standalone codes', () => {
    expect(parseMercuryRigCodes('225CXXL FourStroke')).toMatchObject({
      tokens: ['XXL'],
      shaft_code: 'XXL',
      shaft_inches: 30,
      is_counter_rotating: true,
    });
    expect(parseMercuryRigCodes('115ECXLPT Command Thrust FourStroke')).toMatchObject({
      tokens: ['XL', 'E', 'PT'],
      shaft_code: 'XL',
      shaft_inches: 25,
      start_type: 'Electric',
      control_type: 'Remote',
      has_power_trim: true,
      has_command_thrust: false,
      is_counter_rotating: true,
    });
    expect(parseMercuryRigCodes('250 CXL')).toMatchObject({
      tokens: ['XL'],
      shaft_code: 'XL',
      shaft_inches: 25,
      is_counter_rotating: true,
    });
    expect(parseMercuryRigCodes('CXXL')).toMatchObject({
      tokens: ['XXL'],
      shaft_code: 'XXL',
      is_counter_rotating: true,
    });
    expect(parseMercuryRigCodes('ECXLPT')).toMatchObject({
      tokens: ['XL', 'E', 'PT'],
      shaft_code: 'XL',
      start_type: 'Electric',
      has_power_trim: true,
      is_counter_rotating: true,
    });
  });

  it('keeps unrelated inference and official model-number identity', () => {
    expect(parseMercuryRigCodes('LAKE')).toMatchObject({
      tokens: ['L'],
      shaft_code: 'L',
      start_type: 'Unknown',
    });
    expect(parseMercuryRigCodes('MERCURY')).toMatchObject({
      tokens: ['S', 'M', 'E'],
      shaft_code: 'S',
      start_type: 'Electric',
    });
    expect(parseMercuryRigCodes('MRC')).toMatchObject({
      tokens: ['S', 'M'],
      shaft_code: 'S',
      start_type: 'Manual',
      control_type: 'Remote',
    });
    expect(parseMercuryRigCodes('90HP')).toMatchObject({
      tokens: ['S', 'PT'],
      shaft_code: 'S',
      start_type: 'Unknown',
      control_type: 'Remote',
      has_power_trim: true,
    });
    expect(parseMercuryRigCodes('90 HP FourStroke')).toMatchObject({
      tokens: ['S', 'H', 'PT'],
      shaft_code: 'S',
      control_type: 'Tiller',
      has_power_trim: true,
    });
    expect(parseMercuryRigCodes('115EXLPT Command Thrust FourStroke')).toMatchObject({
      shaft_code: 'XL',
      has_command_thrust: false,
      control_type: 'Remote',
    });

    const rig = parseMercuryRigCodes('115EXLPT FourStroke');
    expect(buildMercuryModelKey({
      family: 'FourStroke',
      hp: 115,
      rig,
      modelNo: '1115F232D',
    })).toBe('1115F232D');
    expect(buildMercuryModelKey({
      family: 'FourStroke',
      hp: 115,
      rig,
      modelDisplay: '115 EXLPT FourStroke',
    })).toBe('1115F232D');
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