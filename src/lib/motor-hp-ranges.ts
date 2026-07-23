export type MotorHpRangeId =
  | 'all'
  | 'portable'
  | 'midrange'
  | 'core-repower'
  | 'high-output'
  | 'big-water';

export interface MotorHpRange {
  id: MotorHpRangeId;
  label: string;
  description: string;
  min: number | null;
  max: number | null;
  popular?: boolean;
}

export const MOTOR_HP_RANGES: MotorHpRange[] = [
  {
    id: 'all',
    label: 'All HP',
    description: 'Every available motor',
    min: null,
    max: null,
  },
  {
    id: 'portable',
    label: '2.5–25 HP',
    description: 'Portable and kicker',
    min: 2.5,
    max: 25,
  },
  {
    id: 'midrange',
    label: '30–60 HP',
    description: 'Fishing and utility',
    min: 30,
    max: 60,
  },
  {
    id: 'core-repower',
    label: '75–115 HP',
    description: 'Common repower range',
    min: 75,
    max: 115,
    popular: true,
  },
  {
    id: 'high-output',
    label: '150–225 HP',
    description: 'Runabout and performance',
    min: 150,
    max: 225,
  },
  {
    id: 'big-water',
    label: '250+ HP',
    description: 'Large hulls and big water',
    min: 250,
    max: null,
  },
];

export function getMotorHpRange(rangeId: MotorHpRangeId): MotorHpRange {
  return MOTOR_HP_RANGES.find((range) => range.id === rangeId) ?? MOTOR_HP_RANGES[0];
}

export function motorMatchesHpRange(hp: number, rangeId: MotorHpRangeId): boolean {
  const range = getMotorHpRange(rangeId);
  if (range.min != null && hp < range.min) return false;
  if (range.max != null && hp > range.max) return false;
  return true;
}
