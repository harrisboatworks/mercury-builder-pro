import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

const SESSION_KEY = 'quote_activity_session_id';
const UTM_KEY = 'quote_activity_utm';

function getOrCreateSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      const arr = new Uint8Array(12);
      crypto.getRandomValues(arr);
      id = `qa_${Array.from(arr, b => b.toString(16).padStart(2, '0')).join('')}`;
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `qa_fallback_${Date.now()}`;
  }
}

function getUtmParams() {
  try {
    const cached = sessionStorage.getItem(UTM_KEY);
    if (cached) return JSON.parse(cached);
  } catch { /* ignore */ }

  const params = new URLSearchParams(window.location.search);
  const utm = {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
    utm_term: params.get('utm_term'),
    utm_content: params.get('utm_content'),
    referrer: document.referrer || null,
  };
  try { sessionStorage.setItem(UTM_KEY, JSON.stringify(utm)); } catch { /* ignore */ }
  return utm;
}

function getDeviceType(): string {
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

// Map paths to friendly names
function getPageTitle(path: string): string {
  const map: Record<string, string> = {
    '/': 'Home',
    '/quote': 'Motor Selection',
    '/quote/motor-selection': 'Motor Selection',
    '/quote/options': 'Options',
    '/quote/purchase-path': 'Purchase Path',
    '/quote/trade-in': 'Trade-In',
    '/quote/financing': 'Financing',
    '/quote/summary': 'Quote Summary',
    '/compare': 'Motor Comparison',
    '/finance-calculator': 'Finance Calculator',
    '/financing-application': 'Financing Application',
    '/contact': 'Contact',
    '/blog': 'Blog',
    '/my-quotes': 'My Quotes',
    '/deposits': 'Deposits',
  };
  if (map[path]) return map[path];
  if (path.startsWith('/blog/')) return 'Blog Article';
  if (path.startsWith('/quote/saved/')) return 'Saved Quote';
  if (path.startsWith('/admin')) return 'Admin';
  return path;
}

/**
 * Tracks every page view across the entire site.
 * Records page path, time on page, device type, and traffic source.
 * Should be placed in the app root layout (inside BrowserRouter).
 */
export function usePageViewTracker() {
  const location = useLocation();
  const { user } = useAuth();
  const sessionId = useRef(getOrCreateSessionId());
  const pageEnteredAt = useRef<number>(Date.now());
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    const currentPath = location.pathname;

    // Send time-on-page for the PREVIOUS page when navigating away
    if (lastPath.current && lastPath.current !== currentPath) {
      const timeOnPage = Math.round((Date.now() - pageEnteredAt.current) / 1000);
      if (timeOnPage > 1) {
        sendEvent('page_exit', lastPath.current, getPageTitle(lastPath.current), timeOnPage);
      }
    }

    // Record page_view for the new page
    lastPath.current = currentPath;
    pageEnteredAt.current = Date.now();

    // Don't track admin pages
    if (currentPath.startsWith('/admin') || currentPath.startsWith('/test') || currentPath.startsWith('/staging')) {
      return;
    }

    sendEvent('page_view', currentPath, getPageTitle(currentPath), null);
  }, [location.pathname]);

  // Track site exit (beforeunload) with time on last page
  useEffect(() => {
    const handleUnload = () => {
      if (!lastPath.current) return;
      const timeOnPage = Math.round((Date.now() - pageEnteredAt.current) / 1000);
      const path = lastPath.current;
      const utm = getUtmParams();

      const payload = JSON.stringify({
        session_id: sessionId.current,
        user_id: user?.id ?? null,
        event_type: 'site_exit',
        page_path: path,
        page_title: getPageTitle(path),
        time_on_page_seconds: timeOnPage,
        device_type: getDeviceType(),
        screen_width: window.innerWidth,
        event_data: {},
        motor_model: null,
        motor_hp: null,
        quote_value: null,
        utm_source: utm.utm_source,
        utm_medium: utm.utm_medium,
        utm_campaign: utm.utm_campaign,
        utm_term: utm.utm_term,
        utm_content: utm.utm_content,
        referrer: utm.referrer,
      });

      const url = `${(supabase as any).supabaseUrl}/rest/v1/quote_activity_events`;
      const apiKey = (supabase as any).supabaseKey;
      try {
        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: apiKey,
            Authorization: `Bearer ${apiKey}`,
            Prefer: 'return=minimal',
          },
          body: payload,
          keepalive: true,
        });
      } catch { /* best effort */ }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [user?.id]);

  function sendEvent(eventType: string, path: string, title: string, timeOnPage: number | null) {
    const utm = getUtmParams();
    try {
      (supabase as any).from('quote_activity_events').insert({
        session_id: sessionId.current,
        user_id: user?.id ?? null,
        event_type: eventType,
        page_path: path,
        page_title: title,
        time_on_page_seconds: timeOnPage,
        device_type: getDeviceType(),
        screen_width: window.innerWidth,
        event_data: {},
        motor_model: null,
        motor_hp: null,
        quote_value: null,
        utm_source: utm.utm_source,
        utm_medium: utm.utm_medium,
        utm_campaign: utm.utm_campaign,
        utm_term: utm.utm_term,
        utm_content: utm.utm_content,
        referrer: utm.referrer,
      }).then(() => {});
    } catch { /* silent */ }
  }
}
