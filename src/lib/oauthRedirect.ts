import { STAFF_QUOTE_PREVIEW_ORIGIN } from '../../supabase/functions/_shared/browser-origin';
import { SITE_URL } from './site';

// Keep canonical URLs and existing explicit quote-success callbacks unchanged.
// Only the verified staff preview receives a different default OAuth callback.
// Supabase Auth must allow this exact URL, including the trailing slash.
export function oauthRedirectUrl(origin: string, redirectTo?: string): string {
  return redirectTo || `${origin === STAFF_QUOTE_PREVIEW_ORIGIN ? origin : SITE_URL}/`;
}
