import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('web font loading policy', () => {
  it('does not swap Google Fonts into an already rendered layout', () => {
    const document = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
    const googleFontsUrl = document.match(
      /https:\/\/fonts\.googleapis\.com\/css2\?[^"']+/,
    )?.[0];

    expect(googleFontsUrl).toBeDefined();
    expect(googleFontsUrl).toContain('display=optional');
    expect(googleFontsUrl).not.toContain('display=swap');
  });
});
