import { SITE_URL } from '@/lib/site';
import seoPageMetadata from '@/data/seoPageMetadata.json';

function absoluteHomeHubUrl(path: string): string {
  return path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}

export function renderHomeHubAlternates() {
  return seoPageMetadata.home.alternates.map(({ hrefLang, path }) => (
    <link
      key={hrefLang}
      rel="alternate"
      hrefLang={hrefLang}
      href={absoluteHomeHubUrl(path)}
    />
  ));
}
