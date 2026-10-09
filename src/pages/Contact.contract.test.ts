import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('Contact page hours source', () => {
  it('reuses the shared Google Places hook and hours display instead of hardcoded store hours', () => {
    const page = read('src/pages/Contact.tsx');
    const seo = read('src/components/seo/ContactPageSEO.tsx');

    expect(page).toContain("from '@/hooks/useGooglePlaceData'");
    expect(page).toContain('useGooglePlaceData()');
    expect(page).toContain("from '@/components/business/OpeningHoursDisplay'");
    expect(page).toContain('<OpeningHoursDisplay');
    expect(page).toContain('openingHours={placeData?.openingHours}');
    expect(page).toContain('loading={hoursLoading}');
    expect(page).toContain('error={!!hoursError}');

    expect(page).not.toContain('Mon–Sat 8 AM – 5 PM');
    expect(page).not.toContain('Mon-Sat 8 AM – 5 PM');
    expect(page).not.toContain('Sun 9 AM – 4 PM');
    expect(page).not.toMatch(/in-season/);

    expect(seo).not.toContain('openingHoursSpecification');
    expect(seo).not.toContain('Mon–Sat');
    expect(seo).not.toContain('8 AM');
  });
});
