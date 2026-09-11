import { describe, expect, it } from 'vitest';
import { mercuryOutboardCapacities as entries, matchesCapacityQuery } from './mercuryOutboardCapacities';
const search = (query: string) => entries.filter((row) => matchesCapacityQuery(row, query));

describe('capacity lookup identity search', () => {
  it('does not confuse horsepower with oil-grade or filter digits', () => {
    expect(search('30')).toHaveLength(4);
    expect(search('30').every((row) => row.model === '30 HP')).toBe(true);
    expect(search('9.9')).toHaveLength(3);
  });
  it('combines horsepower ranges and engine family across fields', () => {
    expect(search('200 V8')).toHaveLength(2);
    expect(search('200 V8').every((row) => row.notes === '4.6 L V8')).toBe(true);
    expect(search('350 Verado')).toHaveLength(2);
    expect(search('90 hp')).toHaveLength(4);
  });
  it('supports serial identifiers, model years and explicit displacement', () => {
    expect(search('2B094996')).toHaveLength(2);
    expect(search('2022')).toHaveLength(4);
    expect(search('500 cc')).toHaveLength(2);
    expect(search('')).toHaveLength(67);
    expect(search('nonexistent engine')).toHaveLength(0);
  });
});
