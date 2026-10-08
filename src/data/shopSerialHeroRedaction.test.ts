import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { getResponsiveWebpSrcSet } from '@/lib/responsiveImageVariants';
import { getArticleBySlug } from './blogArticles';

const HERO = '/images/shop/mercury-115-serial-model-label-transom.webp';
const REDACTED_ALT =
  'Mercury outboard transom bracket with the identification-label location redacted';
const VISIBLE_LABEL_ALT =
  'small white serial and model label on the bracket arm';

const REDACTED_SHA256 = {
  'public/images/shop/mercury-115-serial-model-label-transom.webp':
    'be5c903464beff1b2f44c888a4c157163e07f1e2a1103be8fe7b6c51c2c6e572',
  'public/images/shop/mercury-115-serial-model-label-transom-640.webp':
    '7c28ac32c47bea92420c5a94cb6b83079575427342e484d372970c3e2b1a9995',
  'public/images/shop/mercury-115-serial-model-label-transom-1024.webp':
    '458a3e485bc1918fa08250676d24d23207312171a9c923103829017098b4ecb5',
} as const;

describe('serial-number shop hero stays redacted beside current main copy', () => {
  const article = getArticleBySlug('how-to-read-mercury-outboard-serial-number');

  it('selects the redacted shop hero and the redacted-label alt', () => {
    expect(article).toBeDefined();
    expect(article?.image).toBe(HERO);
    expect(article?.imageAlt).toBe(REDACTED_ALT);
    expect(article?.imageAlt).not.toContain(VISIBLE_LABEL_ALT);
    expect(article?.dateModified).toBe('2026-10-04');
    expect(article?.content).toContain(
      'what your outboard is worth as a trade-in',
    );
    expect(article?.content).toContain('counter-rotation extra-long');
    expect(article?.faqs?.map((faq) => faq.answer).join('\n')).toContain(
      'A Mercury dealer can confirm the exact year and build spec for a specific serial.',
    );

    expect(getResponsiveWebpSrcSet(article?.image)).toBe(
      '/images/shop/mercury-115-serial-model-label-transom-640.webp 640w, /images/shop/mercury-115-serial-model-label-transom-1024.webp 1024w, /images/shop/mercury-115-serial-model-label-transom.webp 1600w',
    );
  });

  it('keeps the committed redacted shop bytes instead of the unredacted main image', () => {
    for (const [path, expected] of Object.entries(REDACTED_SHA256)) {
      const digest = createHash('sha256').update(readFileSync(path)).digest('hex');
      expect(digest, path).toBe(expected);
    }
    expect(
      REDACTED_SHA256['public/images/shop/mercury-115-serial-model-label-transom.webp'],
    ).not.toBe('977e8563545fd5905e4c19bf6bcf6e6e5fc06f03849e3b16f2efb281f09296b4');
  });

  it('leaves the generated markdown twin on the current main article contract', () => {
    const twin = readFileSync(
      'public/blog/how-to-read-mercury-outboard-serial-number.md',
      'utf8',
    );
    expect(twin).toContain('date_modified: 2026-10-04');
    expect(twin).toContain('## Related guides');
    expect(twin).toContain('/blog/outboard-trade-in-value-ontario-hbw');
    expect(twin).toContain(
      'A Mercury dealer can confirm the exact year and build spec for a specific serial.',
    );
    expect(twin).not.toContain(VISIBLE_LABEL_ALT);
    expect(twin).not.toContain(REDACTED_ALT);
  });
});
