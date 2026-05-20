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
