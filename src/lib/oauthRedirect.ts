import { SITE_URL } from './site';

// Keep canonical URLs and existing explicit quote-success callbacks unchanged.
export function oauthRedirectUrl(_origin: string, redirectTo?: string): string {
  return redirectTo || `${SITE_URL}/`;
}
