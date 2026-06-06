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

const QUICK_LINKS: Array<{ label: string; to: string; sublabel: string; external?: boolean }> = [
  { label: "Build a Mercury quote", to: "/quote/motor-selection", sublabel: "Live CAD pricing, no forms" },
  { label: "Mercury pricing reference", to: "/pricing-reference", sublabel: "Every model, every HP class" },
  { label: "Repower cost in Ontario", to: "/repower/cost", sublabel: "What a Mercury repower really costs" },
  { label: "Frequently asked questions", to: "/faq", sublabel: "24 of the questions we get most" },
  { label: "Contact HBW", to: "/contact", sublabel: "Phone, email, address, hours" },
];

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
        <title>Page not found | Harris Boat Works</title>
        <meta name="description" content="The page you are looking for has moved or no longer exists. Browse the Mercury quote builder, pricing reference, repower cost guide, or contact Harris Boat Works." />
        <meta name="robots" content="noindex, follow" />
        <meta httpEquiv="status" content="404" />
      </Helmet>
      <RepowerHeader />

      <main className="flex-1 container mx-auto px-6 md:px-14 py-14 md:py-20 pt-[calc(64px+3.5rem)] lg:pt-[calc(72px+5rem)]">
        <div className="max-w-[760px] mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-5">
            <span className="h-px w-8 bg-repower-mercury-red" />
            <p className="font-sans font-semibold text-[11px] uppercase tracking-[0.24em] text-repower-mercury-red">
              404, page not found
            </p>
          </div>

          <h1
            className="font-display font-bold text-repower-navy-900 mb-6"
            style={{ fontSize: 'clamp(36px, 5vw, 56px)', letterSpacing: '-0.025em', lineHeight: 1.05 }}
          >
            Lost on the lake
          </h1>

          <p className="font-sans text-[18px] text-repower-navy-900/70 max-w-[58ch] mx-auto leading-relaxed mb-10">
            That page is not where we left it. Could be a bad link, an old URL, or one of our older posts moved when we rebuilt the site this year. Try one of these instead, or call us at{' '}
            <a href="tel:9053422153" className="font-semibold text-repower-mercury-red hover:underline">
              905-342-2153
            </a>{' '}
            and we will point you the right way.
          </p>

          <div className="grid sm:grid-cols-2 gap-3 max-w-[640px] mx-auto mb-10 text-left">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex flex-col px-5 py-4 bg-white border border-repower-navy-900/10 rounded-lg hover:border-repower-mercury-red hover:shadow-sm transition-all"
              >
                <span className="font-display font-bold text-repower-navy-900 mb-1">{link.label}</span>
                <span className="font-sans text-sm text-repower-navy-900/60">{link.sublabel}</span>
              </Link>
            ))}
            <a
              href="tel:9053422153"
              className="flex flex-col px-5 py-4 bg-repower-mercury-red text-white rounded-lg hover:bg-repower-mercury-red-deep transition-colors"
            >
              <span className="font-display font-bold mb-1">Call 905-342-2153</span>
              <span className="font-sans text-sm text-white/85">Mon to Fri, talk to a person</span>
            </a>
          </div>

          <div className="h-px w-16 bg-repower-navy-900/15 mx-auto mb-6" />

          <p className="font-sans text-sm text-repower-navy-900/55 max-w-[52ch] mx-auto">
            Family-owned since 1947, Mercury dealer since 1965, Mercury Platinum Dealer.<br />
            5369 Harris Boat Works Rd, Gores Landing, Rice Lake, Ontario.
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default NotFound;
