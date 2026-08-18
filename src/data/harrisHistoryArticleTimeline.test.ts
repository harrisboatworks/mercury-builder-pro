// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/data/blogArticles.ts', 'utf8');
const publicTwin = readFileSync(
  'public/blog/harris-boat-works-since-1947-rice-lake-institution.md',
  'utf8',
);

const copies = [source, publicTwin];

describe('Harris Boat Works history article timeline', () => {
  it.each(copies)('keeps the confirmed ownership succession', (copy) => {
    expect(copy).toContain("## George's Shop: 1947 to 1978");
    expect(copy).toContain("## Jim's Shop: 1978 to 2015");
    expect(copy).toContain("## Jay's Shop: 2016 to Now");
    expect(copy).not.toContain("## Jay's Shop: 2015");
  });

  it.each(copies)('includes the public George Harris builder milestones', (copy) => {
    expect(copy).toContain('Rice Lake Boat Works in 1928 under owner Wally Pratt');
    expect(copy).toContain('original workshop burned in 1980');
    expect(copy).toContain('until his death in November 1988');
    expect(copy).toContain('last cedar-strip canoe he built still hangs');
    expect(copy).toContain('https://www.harrisboatworks.ca/george-harris');
  });
});
