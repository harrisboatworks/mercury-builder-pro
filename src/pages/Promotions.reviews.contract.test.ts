import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), 'utf8');

describe('promotions and related review surfaces', () => {
  it('pulls /promotions testimonials from live Google Places reviews', () => {
    const promotions = read('./Promotions.tsx');

    expect(promotions).toContain("from '@/components/reviews/GoogleReviewsTestimonials'");
    expect(promotions).toContain('variant="light-carousel"');
    expect(promotions).not.toContain('allTestimonials');
    expect(promotions).not.toContain('generateDailyTestimonials');
    expect(promotions).not.toContain('testimonialData');
    expect(promotions).not.toContain('Mercury Owner');
    expect(promotions).not.toMatch(/>Verified</);
  });

  it('uses the same live Google reviews on /repower instead of placeholder quotes', () => {
    const repower = read('./Repower.tsx');

    expect(repower).toContain('GoogleReviewsTestimonials');
    expect(repower).toContain('variant="dark-grid"');
    expect(repower).not.toContain('allTestimonials');
    expect(repower).not.toContain('generateDailyTestimonials');
  });

  it('does not emit review or aggregateRating JSON-LD on promotions', () => {
    const seo = read('../components/seo/PromotionsPageSEO.tsx');
    const globalSeo = read('../components/seo/GlobalSEO.tsx');

    expect(seo).not.toContain('aggregateRating');
    expect(seo).not.toContain("'Review'");
    expect(seo).not.toContain('"Review"');
    expect(globalSeo).not.toContain('aggregateRating');
    expect(globalSeo).not.toContain('"@type": "Review"');
  });

  it('does not keep a placeholder testimonial catalogue', () => {
    expect(() => read('../lib/testimonialData.ts')).toThrow();
  });
});
