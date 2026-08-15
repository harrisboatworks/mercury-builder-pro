import { describe, expect, it } from 'vitest';
import { getMotorHpRange, motorMatchesHpRange } from './motor-hp-ranges';

describe('motor HP ranges', () => {
  it('keeps common repower motors in the visible 75–115 HP range', () => {
    expect(motorMatchesHpRange(75, 'core-repower')).toBe(true);
    expect(motorMatchesHpRange(90, 'core-repower')).toBe(true);
    expect(motorMatchesHpRange(115, 'core-repower')).toBe(true);
    expect(motorMatchesHpRange(60, 'core-repower')).toBe(false);
    expect(motorMatchesHpRange(150, 'core-repower')).toBe(false);
  });

  it('treats the large-motor range as open ended', () => {
    expect(motorMatchesHpRange(250, 'big-water')).toBe(true);
    expect(motorMatchesHpRange(600, 'big-water')).toBe(true);
    expect(motorMatchesHpRange(225, 'big-water')).toBe(false);
  });

  it('falls back safely when range state is unavailable', () => {
    expect(getMotorHpRange('all').label).toBe('All HP');
    expect(motorMatchesHpRange(9.9, 'all')).toBe(true);
    expect(motorMatchesHpRange(400, 'all')).toBe(true);
  });
});
