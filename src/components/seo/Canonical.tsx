import { Helmet } from '@/lib/helmet';
import { useLocation } from 'react-router-dom';
import { canonicalUrlFor } from '@/lib/canonicalUrl';

export function Canonical() {
  const { pathname } = useLocation();

  return (
    <Helmet>
      <link rel="canonical" href={canonicalUrlFor(pathname)} />
    </Helmet>
  );
}
