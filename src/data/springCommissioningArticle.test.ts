import { describe, expect, it } from 'vitest';
import { getArticleBySlug } from './blogArticles';

describe('spring commissioning cost article facts', () => {
  const article = getArticleBySlug('spring-commissioning-cost-ontario');

  it('preserves the Lightspeed proof point while naming its job-row grain', () => {
    expect(article).toBeDefined();
    expect(article?.title).toContain('9,540 Spring Jobs');
    expect(article?.description).toContain('Lightspeed job records');
    expect(article?.content).toContain('individual spring-labelled service jobs');
    expect(article?.content).toContain('not 9,540 unique boats');
    expect(article?.content).not.toContain('9,540 spring work orders');
    expect(article?.content).not.toContain('9,540 spring work orders since 2013');
  });

  it('keeps current HBW pricing and service-intake policy explicit', () => {
    expect(article?.dateModified).toBe('2026-08-02');
    expect(article?.content).toContain('free for our winter-storage customers');
    expect(article?.content).toContain('$99 labour before HST for everyone else');
    expect(article?.content).toContain('about one to two weeks before your intended drop-off');
    expect(article?.content).toContain('first-come, first-served');
  });
});
