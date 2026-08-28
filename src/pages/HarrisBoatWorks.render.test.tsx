import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { HelmetProvider } from '@/lib/helmet';
import HarrisBoatWorks from './HarrisBoatWorks';

vi.mock('@/components/repower/RepowerHeader', () => ({
  RepowerHeader: () => <header>RepowerHeader</header>,
}));
vi.mock('@/components/ui/site-footer', () => ({
  SiteFooter: () => <footer>SiteFooter</footer>,
}));
vi.mock('@/components/maps/GoogleMapEmbed', () => ({
  GoogleMapEmbed: ({ center }: { center?: { latitude: number; longitude: number } }) => (
    <div data-latitude={center?.latitude} data-longitude={center?.longitude}>
      Map
    </div>
  ),
}));
vi.mock('@/hooks/useGooglePlaceData', () => ({
  useGooglePlaceData: () => ({ data: null, isLoading: false, error: null }),
}));
vi.mock('@/components/business/OpeningHoursDisplay', () => ({
  OpeningHoursDisplay: () => <div>Google-synced hours</div>,
}));

describe('Harris Boat Works brand page render', () => {
  it('answers who, where, and the next action in the first screen of markup', () => {
    const html = renderToStaticMarkup(
      <HelmetProvider>
        <MemoryRouter>
          <HarrisBoatWorks />
        </MemoryRouter>
      </HelmetProvider>,
    );

    expect(html).toContain('Harris Boat Works');
    expect(html).toContain('Gores Landing, Rice Lake');
    expect(html).toContain('5369 Harris Boat Works Rd');
    expect(html).toContain('Get directions');
    expect(html).toContain('Call 905-342-2153');
    expect(html).toContain('Build a Mercury quote');
    expect(html).toContain('Request service');
    expect(html).toContain('/quote/motor-selection');
    expect(html).toContain('https://hbw.wiki/service');
    expect(html).toContain('/blog/harris-boat-works-since-1947-rice-lake-institution');
    expect(html).toContain('not the family history');
    expect(html).toContain('Google-synced hours');
    expect(html).not.toContain('Monday to Saturday');
    expect(html).not.toContain('Sunday 9:00');
    expect(html).toContain('Who is Harris Boat Works?');
    expect(html).toContain('data-latitude="44.121684"');
    expect(html).toContain('data-longitude="-78.241502"');
    expect(html).not.toContain('\u2014');
    expect(html).not.toMatch(/Platinum/);
  });
});
