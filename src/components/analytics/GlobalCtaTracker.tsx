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
 * Also tracks every phone, text, and email handoff link. A data-cta-location
 * value improves attribution, but is not required for the action to count.
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
      const href = (link.getAttribute('href') || '').trim().toLowerCase();
      const explicitLocation = link.getAttribute('data-cta-location')?.trim();
      const pathname = window.location.pathname;
      const commonParams = {
        entry_page: pathname || '(direct)',
        page_category: getPageCategory(pathname),
        device_type: getDeviceType(),
      };

      if (href.startsWith('tel:')) {
        trackEvent('phone_click', {
          ...commonParams,
          entry_cta: explicitLocation || 'untagged_phone_link',
        });
      } else if (href.startsWith('sms:')) {
        trackEvent('sms_click', {
          ...commonParams,
          entry_cta: explicitLocation || 'untagged_sms_link',
        });
      } else if (href.startsWith('mailto:')) {
        const recipient = href.slice('mailto:'.length).split('?', 1)[0].trim();
        if (!recipient) return;

        trackEvent('email_click', {
          ...commonParams,
          entry_cta: explicitLocation || 'untagged_email_link',
        });
      }
    };

    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, []);

  return null;
}
