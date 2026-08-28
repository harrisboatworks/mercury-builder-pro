// Vercel Edge Middleware
// Forces a permanent 301 redirect from apex (mercuryrepower.ca) to www.
// This runs BEFORE Vercel's platform-level domain redirect (which is 307/308
// and not configurable on this plan), so it wins and gives us a real 301
// for SEO link-equity consolidation.

export const config = {
  matcher: '/:path*',
};

export default function middleware(request: Request) {
  const url = new URL(request.url);
  const host = request.headers.get('host') || '';

  // Never redirect the service-worker script URLs. Browsers refuse to update
  // a registered service worker when the script response is a redirect, which
  // would strand legacy PWA clients on stale hosts (quote.harrisboatworks.ca,
  // apex mercuryrepower.ca) forever. Serve the retirement worker from those
  // hosts as a 200 so it can unregister itself and let the next navigation
  // follow the 301 below.
  if (url.pathname === '/sw.js' || url.pathname === '/service-worker.js') {
    return;
  }

  // Apex → www (permanent 301)
  if (host === 'mercuryrepower.ca') {
    url.host = 'www.mercuryrepower.ca';
    return Response.redirect(url.toString(), 301);
  }

  // Legacy quote subdomain → www (permanent 301)
  if (host === 'quote.harrisboatworks.ca') {
    url.host = 'www.mercuryrepower.ca';
    return Response.redirect(url.toString(), 301);
  }

  // Otherwise pass through
  return;
}
