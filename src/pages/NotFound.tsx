import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { RepowerHeader } from "@/components/repower/RepowerHeader";
import { SiteFooter } from "@/components/ui/site-footer";
import { Helmet } from "@/lib/helmet";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );

    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_not_found', {
        page_path: location.pathname,
        page_location: window.location.href,
      });
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-repower-paper flex flex-col">
      <Helmet>
        <title>Page Not Found</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <RepowerHeader />

      <main className="flex-1 container mx-auto px-6 md:px-14 py-14 md:py-20 pt-[calc(64px+3.5rem)] lg:pt-[calc(72px+5rem)]">
        <div className="max-w-[700px] mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-5">
            <span className="h-px w-8 bg-repower-mercury-red" />
            <p className="font-sans font-semibold text-[11px] uppercase tracking-[0.24em] text-repower-mercury-red">
              Page Not Found
            </p>
          </div>

          <h1
            className="font-display font-bold text-repower-navy-900 mb-5"
            style={{ fontSize: 'clamp(48px, 6vw, 80px)', letterSpacing: '-0.025em', lineHeight: 1 }}
          >
            404
          </h1>

          <h2
            className="font-display font-bold text-repower-navy-900 mb-5"
            style={{ fontSize: 'clamp(24px, 3vw, 32px)', letterSpacing: '-0.02em' }}
          >
            That page got away from us.
          </h2>

          <p className="font-sans text-[18px] text-repower-navy-900/65 max-w-[55ch] mx-auto leading-relaxed mb-10">
            The page you were looking for may have moved, been renamed, or never existed. No harm done — here's where to go next.
          </p>

          <div className="grid sm:grid-cols-3 gap-4 max-w-[640px] mx-auto mb-12">
            <Link
              to="/blog"
              className="flex flex-col items-center justify-center px-6 py-5 bg-white border border-repower-navy-900/10 rounded-lg hover:border-repower-mercury-red transition-colors"
            >
              <span className="font-display font-bold text-repower-navy-900 mb-1">Blog</span>
              <span className="font-sans text-sm text-repower-navy-900/60">Buying guides & how-tos</span>
            </Link>
            <Link
              to="/quote/motor-selection"
              className="flex flex-col items-center justify-center px-6 py-5 bg-repower-mercury-red text-white rounded-lg hover:bg-repower-mercury-red-deep transition-colors"
            >
              <span className="font-display font-bold mb-1">Build a Quote</span>
              <span className="font-sans text-sm text-white/80">Mercury motors, real CAD prices</span>
            </Link>
            <a
              href="https://hbw.wiki/service"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center px-6 py-5 bg-white border border-repower-navy-900/10 rounded-lg hover:border-repower-mercury-red transition-colors"
            >
              <span className="font-display font-bold text-repower-navy-900 mb-1">Service</span>
              <span className="font-sans text-sm text-repower-navy-900/60">Request a booking</span>
            </a>
          </div>

          <div className="h-px w-16 bg-repower-navy-900/15 mx-auto mb-6" />

          <p className="font-sans text-sm text-repower-navy-900/55 max-w-[50ch] mx-auto">
            Harris Boat Works · Gores Landing, Rice Lake · (905) 342-2153<br />
            Mercury Platinum dealer since 1965 · Family marina since 1947
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default NotFound;
