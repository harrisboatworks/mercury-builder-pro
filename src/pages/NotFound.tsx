import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { RepowerHeader } from "@/components/repower/RepowerHeader";
import { SiteFooter } from "@/components/ui/site-footer";

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
    <div className="min-h-screen flex flex-col bg-repower-paper">
      <RepowerHeader />

      <main className="flex-1 pt-[64px] lg:pt-[72px]">
        <div className="max-w-[720px] mx-auto py-32 px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="h-px w-8 bg-repower-mercury-red" />
            <p className="font-sans font-semibold text-[11px] uppercase tracking-[0.24em] text-repower-mercury-red">
              404
            </p>
            <span className="h-px w-8 bg-repower-mercury-red" />
          </div>

          <h1
            className="font-display font-bold text-repower-navy-900 mb-6"
            style={{ fontSize: 'clamp(48px, 6vw, 80px)', letterSpacing: '-0.025em', lineHeight: 1.05 }}
          >
            Off course.
          </h1>

          <p className="font-sans text-[18px] text-repower-navy-900/65 max-w-[60ch] mx-auto leading-relaxed mb-10">
            That page does not exist or has moved. Let us get you back on the water.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center justify-center bg-repower-mercury-red text-repower-cream px-7 py-4 font-sans font-bold text-[13px] uppercase tracking-[0.14em] hover:bg-repower-mercury-red-deep transition-colors"
            >
              Go Home
            </Link>
            <Link
              to="/quote/motor-selection"
              className="inline-flex items-center justify-center px-7 py-4 font-sans font-bold text-[13px] uppercase tracking-[0.14em] text-repower-navy-900 hover:text-repower-mercury-red transition-colors"
            >
              Browse Motors
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default NotFound;
