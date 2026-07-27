import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  'supabase/migrations/20260727140000_allow_fractional_quote_activity_motor_hp.sql',
  'utf8',
);

describe('quote activity motor horsepower schema', () => {
  it('stores fractional Mercury horsepower without integer coercion', () => {
    expect(migration).toMatch(
      /ALTER COLUMN motor_hp TYPE NUMERIC\s+USING motor_hp::NUMERIC;/,
    );
    expect(migration).not.toMatch(/\b(?:ROUND|FLOOR|CEIL)\s*\(/i);
    expect(Number('2.5')).toBe(2.5);
  });
});
