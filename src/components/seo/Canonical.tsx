import { Helmet } from '@/lib/helmet';
import { useLocation } from 'react-router-dom';
import { canonicalPathFor, canonicalUrlFor } from '@/lib/canonicalUrl';
import { renderHomeHubAlternates } from '@/components/seo/homeHubAlternates';

const HOME_HUB_PATHS = new Set(['/', '/fr', '/zh']);

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
