import { useEffect } from 'react';
import {
  ensureQuoteId,
  getDeviceType,
  getPageCategory,
  trackEvent,
} from '@/lib/analytics';

/**
 * Global click delegate for CTA tracking.
 * Reads data-cta="quote-start" and data-cta-location="..." attributes from
 * the nearest matching ancestor of the click target.
 * Also picks up tel: / mailto: links with a data-cta-location attribute.
 */
export function GlobalCtaTracker() {
  useEffect(() => {
    const handler = (ev: MouseEvent) => {
      const target = ev.target as HTMLElement | null;
      if (!target) return;

      const ctaEl = target.closest<HTMLElement>('[data-cta="quote-start"]');
      if (ctaEl) {
        const location = ctaEl.getAttribute('data-cta-location') || 'unknown';
        const pathname = window.location.pathname;
        ensureQuoteId();
        trackEvent('quote_start', {
          entry_page: pathname || '(direct)',
          entry_cta: location,
          page_category: getPageCategory(pathname),
          device_type: getDeviceType(),
        });
        return;
      }

      const link = target.closest<HTMLAnchorElement>('a[href]');
      if (!link) return;
      const href = link.getAttribute('href') || '';
      const loc = link.getAttribute('data-cta-location');
      if (!loc) return;
      if (href.startsWith('tel:')) {
        trackEvent('phone_click', {
          entry_cta: loc,
          page_category: getPageCategory(window.location.pathname),
        });
      } else if (href.startsWith('mailto:')) {
        trackEvent('email_click', {
          entry_cta: loc,
          page_category: getPageCategory(window.location.pathname),
        });
      }
    };

    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, []);

  return null;
}
