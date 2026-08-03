import { describe, expect, it } from 'vitest';
import { cleanBlogContent } from './cleanBlogContent.js';

describe('cleanBlogContent', () => {
  it('removes legacy scaffold while preserving CTA copy', () => {
    const content = `**Language:** English

*Last reviewed: 2026-07-30*

## Internal Links

- [Guide](/blog/guide)

## CTA

Book at hbw.wiki/service.

## Sources

- Mercury`;

    expect(cleanBlogContent(content)).toBe(
      'Book at hbw.wiki/service.\n\n## Sources\n\n- Mercury',
    );
  });

  it('removes inline FAQs only when structured FAQs exist', () => {
    const content = `## Frequently Asked Questions

**Question?**
Answer.

## Sources

- Mercury`;

    expect(
      cleanBlogContent(content, { hasStructuredFaqs: true }),
    ).toBe('## Sources\n\n- Mercury');
    expect(
      cleanBlogContent(content, { hasStructuredFaqs: false }),
    ).toContain('## Frequently Asked Questions');
  });

  it.each([
    'Questions fréquentes',
    'Preguntas frecuentes (FAQ)',
    '常见问题',
    '常見問題',
    '자주 묻는 질문',
    'FAQ (Mga Madalas Itanong)',
    'FAQ | ਅਕਸਰ ਪੁੱਛੇ ਜਾਂਦੇ ਸਵਾਲ',
    'Aksar puchhe jaande sawaal | ਅਕਸਰ ਪੁੱਛੇ ਜਾਂਦੇ ਸਵਾਲ',
    'اکثر پوچھے جانے والے سوالات | FAQ',
    'کشتی کی ونٹرائزیشن اور اسٹوریج کے بارے میں عام سوالات | FAQ',
    'FAQ | अक्सर पूछे जाने वाले सवाल',
  ])('removes a localized inline FAQ headed %s', (heading) => {
    const content = `## ${heading}\n\nQuestion and answer.\n\n## Sources\n\n- Source`;

    expect(
      cleanBlogContent(content, { hasStructuredFaqs: true }),
    ).toBe('## Sources\n\n- Source');
  });

  it('removes terminal related-guide variants', () => {
    const content = `## Closing

Done.

**Related guides:**
- [One](/blog/one)
- [Two](/blog/two)`;

    expect(cleanBlogContent(content)).toBe('## Closing\n\nDone.');
  });
});
