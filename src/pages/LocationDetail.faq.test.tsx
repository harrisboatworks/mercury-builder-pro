import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { renderInlineInternalLinks, stripInlineInternalLinks } from '@/components/location/InlineInternalLinks';
import { getLocationBySlug } from '@/data/locations';

const LOCKED_QUESTION = 'Where can I get a Mercury outboard serviced in the Kawarthas?';

describe('Kawartha service-geography FAQ', () => {
  it('keeps the hydrated long-form source aligned with the canonical FAQ source', () => {
    const location = getLocationBySlug('kawartha-lakes-mercury-outboards');
    const canonicalFaq = location?.faqs.find((faq) => faq.question === LOCKED_QUESTION);
    const hydratedFaq = location?.longForm?.faqs.find((faq) => faq.question === LOCKED_QUESTION);

    expect(canonicalFaq).toBeDefined();
    expect(hydratedFaq).toEqual(canonicalFaq);
  });

  it('renders the approved maintenance link while keeping schema text markup-free', () => {
    const answer = getLocationBySlug('kawartha-lakes-mercury-outboards')?.longForm?.faqs.find(
      (faq) => faq.question === LOCKED_QUESTION,
    )?.answer;

    expect(answer).toBeDefined();
    expect(stripInlineInternalLinks(answer!)).not.toContain('](/maintenance)');

    const html = renderToStaticMarkup(
      <MemoryRouter>{renderInlineInternalLinks(answer!)}</MemoryRouter>,
    );
    expect(html).toContain('href="/maintenance"');
    expect(html).toContain('maintenance and service page');
  });
});
