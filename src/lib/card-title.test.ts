import { describe, it, expect } from 'vitest';
import {
  ensureCommandThrustDisplayName,
  formatMotorTitle,
  formatVariantSubtitle,
  resolveMotorCardTitle,
} from './card-title';

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

describe('resolveMotorCardTitle', () => {
  it('restores Command Thrust for the stale 90 EXLPT presentation override', () => {
    expect(
      resolveMotorCardTitle({
        model: '90 EXLPT FourStroke',
        model_display: '90 EXLPT FourStroke',
        model_number: '1F904632D',
      }),
    ).toBe('90 EXLPT Command Thrust FourStroke');
  });

  it('keeps an already-correct adjacent Command Thrust title unchanged', () => {
    expect(
      resolveMotorCardTitle({
        model: '90 ELPT Command Thrust FourStroke',
        model_display: '90 ELPT Command Thrust FourStroke',
        model_number: '1F904532D',
      }),
    ).toBe('90 ELPT Command Thrust FourStroke');
  });

  it('leaves a non-CT FourStroke title unchanged', () => {
    expect(
      resolveMotorCardTitle({
        model: '90 EXLPT FourStroke',
        model_display: '90 EXLPT FourStroke',
        model_number: '1F904612D',
      }),
    ).toBe('90 EXLPT FourStroke');
  });

  it('inserts Command Thrust when features mark a motor as CT', () => {
    expect(
      ensureCommandThrustDisplayName('115 EXLPT FourStroke', {
        features: ['Command Thrust', 'Power Trim'],
      }),
    ).toBe('115 EXLPT Command Thrust FourStroke');
  });

  it('inserts Command Thrust when commandThrust is true', () => {
    expect(
      ensureCommandThrustDisplayName('90 EXLPT FourStroke', { commandThrust: true }),
    ).toBe('90 EXLPT Command Thrust FourStroke');
  });
});


describe('Command Thrust feature identity', () => {
  it.each([
    'ProKicker/Command Thrust variants available for higher-thrust trolling applications',
    'Available with Command Thrust',
    'Not equipped with Command Thrust',
    'CT variants available',
    'CT-compatible rigging',
    'Command Thrust gearcase available as an option',
  ])('does not rename a standard motor from generic copy: %s', (feature) => {
    const motor = { model: '9.9MH FourStroke', features: [feature] };
    expect(resolveMotorCardTitle(motor)).toBe(motor.model);
  });

  it('ignores generic copy in object-shaped feature titles', () => {
    expect(resolveMotorCardTitle({
      model: '9.9MH FourStroke',
      features: [{ title: 'ProKicker/Command Thrust variants available for higher-thrust trolling applications' }],
    })).toBe('9.9MH FourStroke');
  });

  it.each(['Command Thrust', ' command   thrust ', 'CT', ' ct ', 'Command Thrust gearcase', ' command  thrust gearcase '])(
    'keeps explicit per-motor feature labels: %s', (feature) => {
      expect(ensureCommandThrustDisplayName('115 EXLPT FourStroke', { features: [feature] }))
        .toBe('115 EXLPT Command Thrust FourStroke');
    },
  );

  it('keeps explicit object-shaped CT feature labels', () => {
    expect(ensureCommandThrustDisplayName('115 EXLPT FourStroke', { features: [{ title: 'CT' }] }))
      .toBe('115 EXLPT Command Thrust FourStroke');
  });

  it('keeps an explicit CT flag authoritative when feature copy is generic', () => {
    expect(ensureCommandThrustDisplayName('115 EXLPT FourStroke', {
      commandThrust: true,
      features: ['Command Thrust variants available'],
    })).toBe('115 EXLPT Command Thrust FourStroke');
  });

  it('reads the actual database CT flag when the display name is stale', () => {
    expect(resolveMotorCardTitle({
      model_display: '60 ELPT FourStroke',
      has_command_thrust: true,
      features: ['CT variants available'],
    })).toBe('60 ELPT Command Thrust FourStroke');
  });

  it.each([false, null])('does not infer CT from generic copy with DB flag %s', (has_command_thrust) => {
    expect(resolveMotorCardTitle({
      model_display: '9.9MH FourStroke',
      has_command_thrust,
      features: ['ProKicker/Command Thrust variants available for higher-thrust trolling applications'],
    })).toBe('9.9MH FourStroke');
  });

  it.each([
    ['1F5145TJZ', '50 ELHPT Command Thrust FourStroke Tiller'],
    ['1F60463GZ', '60 EXLPT Command Thrust FourStroke'],
    ['1F904632D', '90 EXLPT Command Thrust FourStroke'],
  ])('preserves verified presentation override %s', (model_number, expected) => {
    expect(resolveMotorCardTitle({ model: 'Upstream display', model_number })).toBe(expected);
  });
});
