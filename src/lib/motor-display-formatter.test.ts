// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { formatMotorDisplayName } from './motor-display-formatter';

describe('formatMotorDisplayName', () => {
  it.each([
    { input: '8MH FourStroke', expected: '8 MH FourStroke' },
    { input: '9.9ELH FourStroke', expected: '9.9 ELH FourStroke' },
    { input: '25ELHPT FourStroke', expected: '25 ELHPT FourStroke' },
    { input: '40EXLPT SeaPro', expected: '40 EXLPT SeaPro' },
    { input: '115MLH Verado', expected: '115 MLH Verado' },
    { input: '200XL Verado', expected: '200 XL Verado' },
    { input: '15M FourStroke', expected: '15 M FourStroke' },
    { input: '2.5mh fourstroke', expected: '2.5 MH fourstroke' },
    { input: '9.9elh fourstroke', expected: '9.9 ELH fourstroke' },
    { input: 'FourStroke 25HP', expected: 'FourStroke 25HP' },
    { input: '', expected: '' },
  ])('formats "$input" as "$expected"', ({ input, expected }) => {
    expect(formatMotorDisplayName(input)).toBe(expected);
  });

  it.each([
    { input: '15ELH FourStroke', expected: '15 ELH FourStroke' },
    { input: '25ELPT FourStroke', expected: '25 ELPT FourStroke' },
    { input: '60ELPT CT FourStroke', expected: '60 ELPT CT FourStroke' },
    { input: '90ELHPT FourStroke', expected: '90 ELHPT FourStroke' },
    { input: '115ELPT FourStroke', expected: '115 ELPT FourStroke' },
    { input: '150XL Pro XS', expected: '150 XL Pro XS' },
    { input: '200EXLPT SeaPro', expected: '200 EXLPT SeaPro' },
    { input: '300XL Verado', expected: '300 XL Verado' },
    { input: '300 DTS Verado', expected: '300 DTS Verado' },
  ])('keeps dealer rigging codes spaced in "$input"', ({ input, expected }) => {
    expect(formatMotorDisplayName(input)).toBe(expected);
  });
});
