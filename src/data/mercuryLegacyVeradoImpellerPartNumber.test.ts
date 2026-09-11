// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

const LEGACY_VERADO_IMPELLER_ROW =
  '| Impeller / kit | 43026T2 / 8M0100527 | 43026T2 / 8M0100527 | 43026T2 / 8M0100527 | 8M0200115 / 8M0200136 | 8M0177706 / 8M0177997 |';

const ARTICLE_PATH = 'src/data/blogArticles.ts';
const MARKDOWN_PATH = 'public/blog/mercury-outboard-maintenance-parts-list.md';

describe('legacy Verado impeller part-number source contract', () => {
  for (const filePath of [ARTICLE_PATH, MARKDOWN_PATH]) {
    it(`${filePath} excludes invalid 443026T2`, () => {
      expect(source(filePath)).not.toContain('443026T2');
    });

    it(`${filePath} keeps legacy Verado impeller cells as 43026T2 / 8M0100527`, () => {
      expect(source(filePath)).toContain(LEGACY_VERADO_IMPELLER_ROW);
    });
  }
});
