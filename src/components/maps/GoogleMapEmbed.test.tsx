import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { GoogleMapEmbed } from './GoogleMapEmbed';

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
});
