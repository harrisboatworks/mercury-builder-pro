// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const dataSource = readFileSync('src/data/spanishBlogArticles.ts', 'utf8');
const markdownTwin = readFileSync(
  'public/blog/es/mercury-115-vs-150-comparacion.md',
  'utf8',
);

const articleSource = dataSource
  .split("slug: 'mercury-115-vs-150-comparacion'", 2)[1]
  ?.split('\n  },\n  {', 1)[0];

describe('Spanish 115-vs-150 language note', () => {
  it('uses renderable Markdown in both content sources', () => {
    expect(articleSource).toBeDefined();

    for (const source of [articleSource!, markdownTwin]) {
      expect(source).toContain(
        '> **Una nota sobre el idioma**\n> Creamos esta guía en español',
      );
      expect(source).not.toContain('\n>\n');
      expect(source).not.toContain('<div class="hbw-language-note">');
      expect(source).not.toContain('<h3>Una nota sobre el idioma</h3>');
      expect(source).not.toMatch(/<p>Creamos esta guía en español/);
    }
  });
});
