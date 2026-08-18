import { describe, expect, it } from 'vitest';
import { getArticleBySlug } from './blogArticles';

const article = (slug: string) => {
  const match = getArticleBySlug(slug);
  if (!match) throw new Error(`Missing blog article: ${slug}`);
  return match;
};

const count = (surface: string, token: string) => surface.split(token).length - 1;

describe('official Mercury video placement', () => {
  it('renders the winterization checklist once inside the sequence', () => {
    const winterization = article('diy-mercury-outboard-winterization-guide');
    const sequenceIndex = winterization.content.indexOf('## The Winterization Sequence');
    const videoIndex = winterization.content.indexOf('id: YGuQjF6vuao');
    const firstStepIndex = winterization.content.indexOf('### Step 1: Stabilize the Fuel');

    expect(winterization.dateModified).toBe('2026-08-09');
    expect(winterization.youtubeVideoId).toBeUndefined();
    expect(count(winterization.content, 'YGuQjF6vuao')).toBe(1);
    expect(winterization.content).not.toContain('https://www.youtube.com/watch?v=YGuQjF6vuao');
    expect(winterization.content).toContain(
      ':::youtube-embed\nid: YGuQjF6vuao\ntitle: How To Winterize Your Outboard | Winterization Checklist (Mercury Marine)\n:::',
    );
    expect(sequenceIndex).toBeGreaterThan(-1);
    expect(videoIndex).toBeGreaterThan(sequenceIndex);
    expect(firstStepIndex).toBeGreaterThan(videoIndex);
  });

  it('keeps the SmartCraft install contextual and model-aware', () => {
    const smartCraft = article('mercury-smartcraft-connect-guide-ontario');
    const installIndex = smartCraft.content.indexOf('## Install: DIY vs. HBW');
    const videoIndex = smartCraft.content.indexOf('id: lEa_MVfOs7M');
    const comparisonIndex = smartCraft.content.indexOf('**DIY works if:**');

    expect(smartCraft.dateModified).toBe('2026-08-09');
    expect(smartCraft.youtubeVideoId).toBeUndefined();
    expect(count(smartCraft.content, 'lEa_MVfOs7M')).toBe(1);
    expect(smartCraft.content).toContain('single-engine under-cowl 8M0173128 installation');
    expect(smartCraft.content).toContain('one to four engines use the under-helm 8M0173129 kit');
    expect(smartCraft.content).toContain(
      ':::youtube-embed\nid: lEa_MVfOs7M\ntitle: SmartCraft Mobile Installation: Control Your Engine from Your Phone (Mercury Marine)\n:::',
    );
    expect(installIndex).toBeGreaterThan(-1);
    expect(videoIndex).toBeGreaterThan(installIndex);
    expect(comparisonIndex).toBeGreaterThan(videoIndex);
  });

  it('does not reintroduce the rejected or owner-blocked placements', () => {
    const maintenance = article('mercury-maintenance-intervals-20-100-300-rule');
    const oilCapacity = article('mercury-outboard-oil-capacity-chart');
    const breakIn = article('breaking-in-new-mercury-motor-guide');

    expect(maintenance.content).not.toContain('BBbQVH5j0W0');
    expect(oilCapacity.content).not.toContain('ABeIIfXeB0Q');
    expect(oilCapacity.content).not.toContain('7DlXFotIfLo');
    expect(breakIn.content).toContain('ydFfxwUz5yc');
    expect(breakIn.content).not.toContain('FfMtJ7Yn5Fs');

    for (const route of [maintenance, oilCapacity, breakIn]) {
      expect(route.youtubeVideoId).toBeUndefined();
    }
  });
});
