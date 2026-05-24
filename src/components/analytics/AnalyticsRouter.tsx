import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { PageMeta } from '@/components/seo/PageMeta';
import {
  ensureQuoteId,
  getDeviceType,
  getPageCategory,
  getPageId,
  trackEvent,
} from '@/lib/analytics';

/**
 * Per-route analytics + meta injection. Mounts inside the Router so it can use
 * useLocation. Handles:
 *  - <meta name="page-id"> / <meta name="page-category">
 *  - quote_start on /quote/motor-selection from external referrer
 *  - location_page_view on /locations/*
 */
export function AnalyticsRouter() {
  const location = useLocation();
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    const path = location.pathname;
    const prev = previousPathRef.current;
    const pageId = getPageId(path);
    const pageCategory = getPageCategory(path);

    // quote_start: external referrer landing on motor-selection
    if (
      (path === '/quote/motor-selection' || path === '/quote') &&
      prev === null
    ) {
      const referrer = typeof document !== 'undefined' ? document.referrer : '';
      const sameHost =
        referrer && typeof window !== 'undefined'
          ? (() => {
              try { return new URL(referrer).host === window.location.host; }
              catch { return false; }
            })()
          : false;
      if (!sameHost) {
        ensureQuoteId();
        trackEvent('quote_start', {
          entry_page: referrer || '(direct)',
          entry_cta: 'external_referrer',
          page_category: pageCategory,
          device_type: getDeviceType(),
        });
      }
    }

    // location_page_view on every /locations/<slug> page mount
    if (path.startsWith('/locations/') && path.split('/').length >= 3) {
      const slug = path.replace(/^\/locations\//, '').replace(/\/$/, '');
      trackEvent('location_page_view', {
        location_slug: slug,
        location_id: pageId,
        location_county: '',
        page_category: pageCategory,
      });
    }

    previousPathRef.current = path;
  }, [location.pathname]);

  return <PageMeta pathname={location.pathname} />;
}
