import { describe, expect, it } from 'vitest';
import { getLocationBySlug } from '@/data/locations';

describe('Kawartha service boundary', () => {
  it('removes the failed service-geography treatment from both FAQ sources', () => {
    const location = getLocationBySlug('kawartha-lakes-mercury-outboards');
    const failedQuestion = 'Where can I get a Mercury outboard serviced in the Kawarthas?';

    expect(location?.faqs.some((faq) => faq.question === failedQuestion)).toBe(false);
    expect(location?.longForm?.faqs.some((faq) => faq.question === failedQuestion)).toBe(false);
  });

  it('keeps the location service boundary aligned with the canonical pickup policy', () => {
    const serviceBoundary = getLocationBySlug('kawartha-lakes-mercury-outboards')?.serviceBoundary;

    expect(serviceBoundary).toContain('We can generally arrange boat pickup');
    expect(serviceBoundary).toContain('Service work remains at our Gores Landing shop');
    expect(serviceBoundary).toContain('does not perform mobile service');
  });
});
