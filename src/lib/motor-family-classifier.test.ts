// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { classifyMotorFamily } from './motor-family-classifier';

describe('classifyMotorFamily', () => {
  it('does not turn a standard 9.9 MH into a ProKicker from generic family copy', () => {
    expect(classifyMotorFamily(
      9.9,
      '9.9MH FourStroke',
      ['ProKicker/Command Thrust variants available for higher-thrust trolling applications'],
    )).toBe('FourStroke');
  });

  it('still recognizes a dedicated ProKicker model by its exact name', () => {
    expect(classifyMotorFamily(9.9, '9.9 ELPT ProKicker FourStroke')).toBe('ProKicker');
  });
});
