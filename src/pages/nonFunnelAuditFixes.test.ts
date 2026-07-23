import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), 'utf8');

describe('non-funnel audit fixes', () => {
  it('keeps the Mercury history and current Premier tier factually separate', () => {
    const source = readSource('./RepowerHub.tsx');

    expect(source).toContain('Mercury dealer since');
    expect(source).toContain('Premier tier today');
    expect(source).not.toMatch(/Mercury Premier\s+Dealer since 1965/);
  });

  it('uses human-readable quote-builder links on the affected marketing pages', () => {
    const sources = [
      readSource('./RepowerHub.tsx'),
      readSource('./MotorSelectionHub.tsx'),
      readSource('./RepowerCost.tsx'),
    ];

    for (const source of sources) {
      expect(source).not.toMatch(/>\s*\/quote\/motor-selection\s*</);
      expect(source).not.toContain('at /quote/motor-selection');
    }
  });

  it('defaults the public calculator through the canonical active-rate helper', () => {
    const source = readSource('./FinanceCalculator.tsx');

    expect(source).toContain('getMotorCalculatorApr');
    expect(source).not.toContain('useState<number>(8.99)');
    expect(source).not.toContain('setApr(getDefaultFinancingRate');
    expect(source).toContain('It is not automatically mixed into this standing-rate estimate.');
  });
});
