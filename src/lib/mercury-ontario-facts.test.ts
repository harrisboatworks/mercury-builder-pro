import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { ONTARIO_HUB_FAQ } from '@/components/seo/MercuryOutboardsOntarioSEO';
import { ONTARIO_RESEARCH_GUIDES, ONTARIO_LINEUP_ANSWER, ONTARIO_PRICING_ANSWER } from './mercury-ontario-facts.js';

describe('Ontario research and lineup guidance', () => {
  it('distinguishes manufacturer scope from current HBW catalog and exact CT fitment', () => {
    const answer = ONTARIO_HUB_FAQ.find(item => item.question === 'What Mercury motor lines are sold at Harris Boat Works?')!.answer;
    expect(answer).toBe(ONTARIO_LINEUP_ANSWER);
    expect(answer).toContain('115–300 HP manufacturer lineup');
    expect(answer).toContain('selected exact models');
    expect(answer).toContain('current HBW catalog');
    expect(answer).not.toMatch(/Command Thrust \(40[–,]\s*150/);
  });

  it('makes tax and selected package costs explicit without an all-in promise', () => {
    const answer = ONTARIO_HUB_FAQ.find(item => item.question === 'Are Mercury outboard prices in Canadian dollars?')!.answer;
    expect(answer).toBe(ONTARIO_PRICING_ANSWER);
    expect(answer).toContain('before HST');
    expect(answer).toContain('itemizes');
    expect(answer).toContain('confirmation');
    expect(answer).not.toContain('all-in');
  });

  it('links existing published canonical guides with corresponding Markdown twins', () => {
    const sitemap = readFileSync('public/sitemap.xml', 'utf8');
    for (const guide of ONTARIO_RESEARCH_GUIDES) {
      expect(sitemap).toContain(`https://www.mercuryrepower.ca${guide.href}`);
      expect(readFileSync(`public${guide.href}.md`, 'utf8')).toContain('content_type: blog_article');
    }
    expect(new Set(ONTARIO_RESEARCH_GUIDES.map(guide => guide.href)).size).toBe(ONTARIO_RESEARCH_GUIDES.length);
  });
});
