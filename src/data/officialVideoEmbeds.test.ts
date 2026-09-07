import { describe, expect, it } from 'vitest';
import { getArticleBySlug } from './blogArticles';

const article = (slug: string) => {
  const match = getArticleBySlug(slug);
  if (!match) throw new Error(`Missing blog article: ${slug}`);
  return match;
};

const count = (surface: string, token: string) => surface.split(token).length - 1;

describe('contextual official Mercury video placement', () => {
  it('keeps the winterization checklist inside the sequence with an adjacent manual caveat', () => {
    const winterization = article('diy-mercury-outboard-winterization-guide');
    const sequenceIndex = winterization.content.indexOf('## The Winterization Sequence');
    const videoIndex = winterization.content.indexOf('id: YGuQjF6vuao');
    const caveatIndex = winterization.content.indexOf('Mercury demonstrates this checklist on one outboard.');
    const firstStepIndex = winterization.content.indexOf('### Step 1: Stabilize the Fuel');

    expect(winterization.youtubeVideoId).toBeUndefined();
    expect(count(winterization.content, 'YGuQjF6vuao')).toBe(1);
    expect(winterization.content).not.toContain('https://www.youtube.com/watch?v=YGuQjF6vuao');
    expect(winterization.content).toContain(
      ':::youtube-embed\nid: YGuQjF6vuao\ntitle: How To Winterize Your Outboard | Winterization Checklist (Mercury Marine)\n:::',
    );
    expect(sequenceIndex).toBeGreaterThan(-1);
    expect(videoIndex).toBeGreaterThan(sequenceIndex);
    expect(caveatIndex).toBeGreaterThan(videoIndex);
    expect(firstStepIndex).toBeGreaterThan(caveatIndex);
  });

  it('describes the SmartCraft kits accurately beside the demonstrated install', () => {
    const smartCraft = article('mercury-smartcraft-connect-guide-ontario');
    const installIndex = smartCraft.content.indexOf('## Install: DIY vs. HBW');
    const videoIndex = smartCraft.content.indexOf('id: lEa_MVfOs7M');
    const installBodyIndex = smartCraft.content.indexOf('The module installs in roughly 30 minutes');
    const demonstratedInstall = [
      "Mercury's official walkthrough demonstrates the under-cowl 8M0173128 installation for a single-engine boat. Mercury lists 8M0173129 as the under-helm module for one to four engines. The engine must be SmartCraft-capable; confirm the exact boat and engine configuration and follow the current instructions before installation.",
      '',
      ':::youtube-embed',
      'id: lEa_MVfOs7M',
    ].join('\n');

    expect(smartCraft.youtubeVideoId).toBeUndefined();
    expect(count(smartCraft.content, 'lEa_MVfOs7M')).toBe(1);
    expect(smartCraft.content).toContain('under-cowl 8M0173128 installation for a single-engine boat');
    expect(smartCraft.content).toContain('8M0173129 as the under-helm module for one to four engines');
    expect(smartCraft.content).toContain('The engine must be SmartCraft-capable');
    expect(smartCraft.content).toContain(demonstratedInstall);
    expect(smartCraft.content).not.toContain('Multi-engine setups with one to four engines');
    expect(smartCraft.content).not.toMatch(/8M0173129\s*(?:\(|is\s+)?multi-engine/i);
    expect(smartCraft.content).toContain(
      ':::youtube-embed\nid: lEa_MVfOs7M\ntitle: SmartCraft Mobile Installation: Control Your Engine from Your Phone (Mercury Marine)\n:::',
    );
    expect(installIndex).toBeGreaterThan(-1);
    expect(videoIndex).toBeGreaterThan(installIndex);
    expect(installBodyIndex).toBeGreaterThan(videoIndex);
  });
});
