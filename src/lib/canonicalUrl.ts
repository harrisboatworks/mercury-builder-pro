import { SITE_URL } from '@/lib/site';

const CANONICAL_PATH_ALIASES: Readonly<Record<string, string>> = {
  '/mercury-repower-faq': '/faq',
  '/motor-selection': '/quote/motor-selection',
};
const CASE_NORMALIZED_PATHS = new Set(['/repower']);

export function canonicalPathFor(pathname: string): string {
  const path = pathname || '/';
  const withoutTrailingSlash = path === '/' ? '/' : path.replace(/\/+$/, '');
  const pathLookup = withoutTrailingSlash.toLowerCase() || '/';

  return CANONICAL_PATH_ALIASES[pathLookup]
    ?? (CASE_NORMALIZED_PATHS.has(pathLookup) ? pathLookup : withoutTrailingSlash);
}

export function canonicalUrlFor(pathname: string): string {
  const canonicalPath = canonicalPathFor(pathname);
  return canonicalPath === '/' ? `${SITE_URL}/` : `${SITE_URL}${canonicalPath}`;
}
