import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildGoogleMapEmbedUrl, buildGoogleMapsFallbackHref } from '@/lib/google-maps-embed';
import { GoogleMapEmbed } from './GoogleMapEmbed';

const TEST_EMBED_KEY = 'test-maps-embed-key';

const { getGoogleMapsEmbedKey } = vi.hoisted(() => ({
  getGoogleMapsEmbedKey: vi.fn(() => TEST_EMBED_KEY),
}));

vi.mock('@/lib/google-maps-embed', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/google-maps-embed')>();
  return {
    ...actual,
    getGoogleMapsEmbedKey,
  };
});

afterEach(() => {
  getGoogleMapsEmbedKey.mockReset();
  getGoogleMapsEmbedKey.mockReturnValue(TEST_EMBED_KEY);
});

describe('GoogleMapEmbed', () => {
  it('can center the map without rendering a conflicting Google place card', () => {
    const html = renderToStaticMarkup(
      <GoogleMapEmbed center={{ latitude: 44.121684, longitude: -78.241502 }} />,
    );

    expect(html).toContain('/maps/embed/v1/view?');
    expect(html).toContain('center=44.121684,-78.241502');
    expect(html).not.toContain('q=Harris+Boat+Works');
  });

  it('preserves the existing place embed by default', () => {
    const html = renderToStaticMarkup(<GoogleMapEmbed />);

    expect(html).toContain('/maps/embed/v1/place?');
    expect(html).toContain('q=Harris+Boat+Works,Gores+Landing,ON');
  });

  it('builds the embed URL from the env key when it is set', () => {
    expect(
      buildGoogleMapEmbedUrl(TEST_EMBED_KEY, {
        latitude: 44.121684,
        longitude: -78.241502,
      }),
    ).toBe(
      `https://www.google.com/maps/embed/v1/view?key=${TEST_EMBED_KEY}&center=44.121684,-78.241502&zoom=14&maptype=roadmap`,
    );
    expect(buildGoogleMapEmbedUrl(TEST_EMBED_KEY)).toBe(
      `https://www.google.com/maps/embed/v1/place?key=${TEST_EMBED_KEY}&q=Harris+Boat+Works,Gores+Landing,ON&zoom=14`,
    );

    const html = renderToStaticMarkup(<GoogleMapEmbed />);
    expect(html).toContain(`key=${TEST_EMBED_KEY}`);
    expect(html).toContain('/maps/embed/v1/place?');
  });

  it('renders a static address fallback when the embed key is absent', () => {
    getGoogleMapsEmbedKey.mockReturnValue('');
    const html = renderToStaticMarkup(
      <GoogleMapEmbed center={{ latitude: 44.121684, longitude: -78.241502 }} />,
    );

    expect(html).not.toContain('maps/embed/v1');
    expect(html).not.toContain('<iframe');
    expect(html).toContain('Map preview is unavailable.');
    expect(html).toContain('Harris Boat Works');
    expect(html).toContain('5369 Harris Boat Works Rd');
    expect(html).toContain('Gores Landing, ON K0K 2E0');
    expect(html).toContain('View on Google Maps');
    // renderToStaticMarkup escapes & as &amp; inside the href. That is correct
    // HTML and browsers read it back as '&', so assert the rendered form here
    // and the unescaped URL through the builder below.
    expect(html).toContain(
      'https://www.google.com/maps/search/?api=1&amp;query=44.121684,-78.241502',
    );
    expect(
      buildGoogleMapsFallbackHref({ latitude: 44.121684, longitude: -78.241502 }),
    ).toBe('https://www.google.com/maps/search/?api=1&query=44.121684,-78.241502');
    expect(buildGoogleMapsFallbackHref()).toBe(
      'https://www.google.com/maps/search/?api=1&query=Harris+Boat+Works,Gores+Landing,ON',
    );
  });
});
