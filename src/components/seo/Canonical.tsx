import { Helmet } from '@/lib/helmet';
import { useLocation } from 'react-router-dom';
import { canonicalPathFor, canonicalUrlFor } from '@/lib/canonicalUrl';
import { renderHomeHubAlternates } from '@/components/seo/homeHubAlternates';
import seoPageMetadata from '@/data/seoPageMetadata.json';

const HOME_HUB_PATHS = new Set(
  seoPageMetadata.home.alternates.map(({ path }) => path),
);

export function Canonical() {
  const { pathname } = useLocation();
  const canonicalPath = canonicalPathFor(pathname);

  return (
    <Helmet>
      <link rel="canonical" href={canonicalUrlFor(pathname)} />
      {HOME_HUB_PATHS.has(canonicalPath) ? renderHomeHubAlternates() : null}
    </Helmet>
  );
}
