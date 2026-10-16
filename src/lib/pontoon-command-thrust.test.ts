import { describe, expect, it } from 'vitest';
import { isCommandThrustMotor, pontoonShouldUseCommandThrust } from './pontoon-command-thrust';

describe('isCommandThrustMotor', () => {
  it.each([
    [{ model: '90ELPT Command Thrust FourStroke' }, true],
    [{ model: '115ELPT Pro XS Command Thrust' }, true],
    [{ model: '90ELPT CT' }, true],
    [{ model: '90ELPT FourStroke' }, false],
    [{ model: '115EXLPT ProXS' }, false],
    [{ model: '60ELPT FourStroke', has_command_thrust: true }, true],
    [{ model: '60ELPT FourStroke', features: ['Command Thrust'] }, true],
    [{ model: '60ELPT FourStroke', features: ['Power trim'] }, false],
    [null, false],
  ])('%j -> %s', (motor, expected) => {
    expect(isCommandThrustMotor(motor)).toBe(expected);
  });
});

describe('pontoonShouldUseCommandThrust', () => {
  it('flags a non-CT 90 ELPT on a pontoon (the audit case)', () => {
    expect(pontoonShouldUseCommandThrust('pontoon', 90, { model: '90ELPT FourStroke' })).toBe(true);
  });

  it('does not flag the CT version', () => {
    expect(pontoonShouldUseCommandThrust('pontoon', 90, { model: '90ELPT Command Thrust FourStroke' })).toBe(false);
  });

  it('does not flag sizes with no CT variant', () => {
    expect(pontoonShouldUseCommandThrust('pontoon', 25, { model: '25ELPT FourStroke' })).toBe(false);
    expect(pontoonShouldUseCommandThrust('pontoon', 150, { model: '150L FourStroke' })).toBe(false);
  });

  it('only applies to pontoons', () => {
    expect(pontoonShouldUseCommandThrust('v-hull-fishing', 90, { model: '90ELPT FourStroke' })).toBe(false);
  });

  it('covers the 40 and 115 HP boundaries', () => {
    expect(pontoonShouldUseCommandThrust('pontoon', 40, { model: '40ELPT FourStroke' })).toBe(true);
    expect(pontoonShouldUseCommandThrust('pontoon', 115, { model: '115ELPT FourStroke' })).toBe(true);
  });
});
