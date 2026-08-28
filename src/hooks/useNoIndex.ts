import { useEffect } from 'react';

/**
 * Imperatively sets <meta name="robots" content="noindex, nofollow"> on the
 * document head for gated / transactional / per-session SPA routes that
 * must never be indexed. Cleans up on unmount.
 *
 * Prefer this hook over a <Helmet> tag for pages whose JSX shape makes
 * inserting a component sibling awkward. The SSR/prerender pipeline never
 * hits these routes anyway (they're SPA-only), so head mutation is enough
 * for crawlers that execute JS. Purely SPA-only routes are additionally
 * shielded from non-JS crawlers because there is no prerendered HTML for
 * them at all.
 */
export function useNoIndex() {
  useEffect(() => {
    const ensure = (attr: 'name', value: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${value}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, value);
        document.head.appendChild(el);
      }
      const prev = el.getAttribute('content');
      el.setAttribute('content', 'noindex, nofollow');
      return () => {
        if (prev == null) el?.remove();
        else el?.setAttribute('content', prev);
      };
    };
    const restore1 = ensure('name', 'robots');
    const restore2 = ensure('name', 'googlebot');
    return () => { restore1(); restore2(); };
  }, []);
}
