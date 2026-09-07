import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { getArticleBySlug } from '@/data/blogArticles';
import { cleanBlogContent } from '@/lib/cleanBlogContent.js';

describe('HBW owner-confirmed arrival policy', () => {
  const article = getArticleBySlug('toronto-to-rice-lake-drive-in-process')!;
  it('answers the appointment question without requiring a drop-off appointment', () => {
    const answer = article.faqs?.find(faq => faq.question === 'Do I need an appointment before driving to HBW?')?.answer;
    expect(answer).toMatch(/^No appointment is required for drop-off\./);
    expect(answer).toContain('Complete the service request');
    expect(answer).toContain('drop off anytime, including after hours');
  });
  it('keeps the closing instructions and Markdown consistent with the arrival policy', () => {
    const content = cleanBlogContent(article.content, { hasStructuredFaqs: true });
    const twin = readFileSync('public/blog/toronto-to-rice-lake-drive-in-process.md', 'utf8');
    for (const surface of [content, twin]) {
      expect(surface).toContain('Send the Service Request Before Drop-Off');
      expect(surface).not.toContain('HBW will confirm whether the job fits and when to arrive');
      expect(surface).not.toContain('Confirm the Job Before Making the Drive');
      expect(surface).toContain('HBW contacts you about the work scope, approvals, and scheduling');
    }
  });
});
