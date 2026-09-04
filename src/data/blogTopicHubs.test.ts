import { describe, it, expect } from 'vitest';
import { blogArticles, getPublishedArticles } from './blogArticles';
import {
  BLOG_TOPIC_HUBS,
  HUB_ASSIGNMENTS,
  getHubArticles,
  getHubForArticleSlug,
} from './blogTopicHubs';

const hubIds = new Set(BLOG_TOPIC_HUBS.map((h) => h.id));
const articleSlugs = new Set(blogArticles.map((a) => a.slug));

describe('blog topic hubs', () => {
  it('defines exactly five hubs with unique slugs', () => {
    expect(BLOG_TOPIC_HUBS).toHaveLength(5);
    const slugs = BLOG_TOPIC_HUBS.map((h) => h.slug);
    expect(new Set(slugs).size).toBe(5);
  });

  it('hub slugs do not collide with article slugs or language index routes', () => {
    const reserved = new Set(['fr', 'zh', 'zh-hant', 'ko', 'es', 'hi', 'pa', 'ur', 'tl', 'unsubscribe']);
    for (const hub of BLOG_TOPIC_HUBS) {
      expect(articleSlugs.has(hub.slug)).toBe(false);
      expect(reserved.has(hub.slug)).toBe(false);
    }
  });

  it('assigns every English article to exactly one valid hub', () => {
    for (const article of blogArticles) {
      const hubId = HUB_ASSIGNMENTS[article.slug];
      expect(hubId, `article ${article.slug} has no hub assignment`).toBeDefined();
      expect(hubIds.has(hubId), `article ${article.slug} assigned to unknown hub ${hubId}`).toBe(true);
    }
  });

  it('has no orphan assignment keys pointing at missing articles', () => {
    for (const slug of Object.keys(HUB_ASSIGNMENTS)) {
      expect(articleSlugs.has(slug), `assignment key ${slug} is not a live article slug`).toBe(true);
    }
  });

  it('anchor slugs exist and are assigned to their own hub', () => {
    for (const hub of BLOG_TOPIC_HUBS) {
      for (const anchor of hub.anchorSlugs) {
        expect(articleSlugs.has(anchor), `anchor ${anchor} missing from blogArticles`).toBe(true);
        expect(
          HUB_ASSIGNMENTS[anchor],
          `anchor ${anchor} assigned to ${HUB_ASSIGNMENTS[anchor]} but anchors ${hub.id}`,
        ).toBe(hub.id);
      }
      expect(new Set(hub.anchorSlugs).size).toBe(hub.anchorSlugs.length);
    }
  });

  it('getHubArticles returns anchors first, covers all published assignments once', () => {
    const published = getPublishedArticles();
    let total = 0;
    for (const hub of BLOG_TOPIC_HUBS) {
      const articles = getHubArticles(hub, published);
      total += articles.length;
      const slugs = articles.map((a) => a.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
      const presentAnchors = hub.anchorSlugs.filter((s) => slugs.includes(s));
      expect(slugs.slice(0, presentAnchors.length)).toEqual(presentAnchors);
      for (const a of articles) {
        expect(HUB_ASSIGNMENTS[a.slug]).toBe(hub.id);
      }
    }
    expect(total).toBe(published.length);
  });

  it('getHubForArticleSlug resolves assignments and rejects unknowns', () => {
    expect(getHubForArticleSlug('mercury-outboard-beeping-codes-guide')?.id).toBe('diagnostics');
    expect(getHubForArticleSlug('not-a-real-slug')).toBeUndefined();
  });
});
