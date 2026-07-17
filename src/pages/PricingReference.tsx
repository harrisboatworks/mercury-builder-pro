import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { marked } from "marked";
import { RepowerHeader } from "@/components/repower/RepowerHeader";
import { SiteFooter } from "@/components/ui/site-footer";
import { BlogInlineCTA } from "@/components/blog/BlogInlineCTA";
import { ALL_SEGMENTS } from "@/data/landing/mercuryLineupLandings";
import { CANONICAL_LAST_UPDATED } from "@/lib/canonical-pricing";


marked.setOptions({ gfm: true, breaks: false });

function annotatePricingReferenceCtas(rawHtml: string) {
  if (typeof DOMParser === 'undefined') return rawHtml;
  const doc = new DOMParser().parseFromString(rawHtml, 'text/html');
  doc.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((link) => {
    const href = link.getAttribute('href') || '';
    try {
      const url = new URL(href, 'https://www.mercuryrepower.ca');
      if (url.pathname === '/quote' || url.pathname.startsWith('/quote/')) {
        link.setAttribute('data-cta', 'quote-start');
        link.setAttribute('data-cta-location', 'pricing_reference_table_build');
      }
    } catch {
      // Leave malformed or non-URL links as rendered by marked.
    }
  });

  // Keep the long reference notes available without making customers scroll
  // through four documentation sections before seeing the first real price.
  const collapsibleHeadings = new Set([
    'How to use this page',
    'What is NOT in this reference',
    'Pickup & service boundary',
    'AI Agent Interfaces',
  ]);
  Array.from(doc.querySelectorAll('h2')).forEach((heading) => {
    if (!collapsibleHeadings.has(heading.textContent?.trim() || '')) return;
    const details = doc.createElement('details');
    details.className = 'pricing-reference-details';
    const summary = doc.createElement('summary');
    summary.textContent = heading.textContent || 'Reference notes';
    details.appendChild(summary);

    let sibling = heading.nextSibling;
    heading.replaceWith(details);
    while (sibling && !(sibling instanceof HTMLHeadingElement && sibling.tagName === 'H2')) {
      const next = sibling.nextSibling;
      details.appendChild(sibling);
      sibling = next;
    }
  });

  // Wide model tables scroll within their own region on phones. This prevents
  // a single model number or quote URL from widening the entire document.
  Array.from(doc.querySelectorAll('table')).forEach((table, index) => {
    const wrapper = doc.createElement('div');
    wrapper.className = 'pricing-table-scroll';
    if (index === 0) wrapper.id = 'current-prices';
    table.parentNode?.insertBefore(wrapper, table);
    wrapper.appendChild(table);
  });
  return doc.body.innerHTML;
}

/**
 * /pricing-reference — HTML twin of /pricing-reference.md
 *
 * The .md file is the canonical machine-readable source generated at build time
 * by scripts/generate-markdown-twins.mjs. This React page fetches that same .md,
 * strips the YAML frontmatter, and renders the body as HTML for human visitors.
 *
 * Crawlers receive a fully-stamped HTML page from scripts/static-prerender.mjs
 * (the noscript fallback contains the rendered table). The SPA hydrates over
 * that and replaces the noscript content with this client-rendered version.
 */
export default function PricingReference() {
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [schemaJson, setSchemaJson] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/pricing-reference.md", { headers: { Accept: "text/markdown,text/plain,*/*" } })
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((raw) => {
        if (cancelled) return;
        const body = raw.replace(/^---\n[\s\S]*?\n---\n+/, "");
        const noH1 = body.replace(/^\s*#\s+.+(?:\r?\n|$)/, "");
        // Strip the markdown body's "_Last updated ..._" line; the page renders
        // a single visible date wired to the canonical pricing last_updated.
        const noDateLine = noH1.replace(/^_Last updated .+?_\s*$/m, "");
        setHtml(annotatePricingReferenceCtas(marked.parse(noDateLine) as string));
      })
      .catch(() => {
        if (!cancelled) setHtml("");
      })
      .finally(() => !cancelled && setLoading(false));
    // Load Product+Offer JSON-LD generated at build time so SPA navigations
    // (e.g. from /quote/motor-selection) also expose machine-readable pricing.
    fetch("/pricing-reference.schema.json", { headers: { Accept: "application/json" } })
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((text) => {
        if (!cancelled) setSchemaJson(text);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-repower-paper">
      <Helmet>
        <title>Mercury Outboard Prices Ontario (CAD) | Harris Boat Works</title>
        <meta
          name="description"
          content="Live Mercury outboard prices in CAD, listed FourStroke and Pro XS models, 2.5-300 HP. MSRP vs dealer price, drop-off at our Gores Landing shop."
        />
        <link rel="alternate" type="text/markdown" href="https://www.mercuryrepower.ca/pricing-reference.md" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Harris Boat Works" />
        <meta property="og:locale" content="en_CA" />
        <meta property="og:title" content="Mercury Outboard Prices Ontario (CAD) | Harris Boat Works" />
        <meta
          property="og:description"
          content="Live Mercury outboard prices in CAD, listed FourStroke and Pro XS models, 2.5-300 HP. MSRP vs dealer price, drop-off at our Gores Landing shop."
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://www.mercuryrepower.ca/pricing-reference" />
        <meta name="twitter:title" content="Mercury Outboard Prices Ontario (CAD) | Harris Boat Works" />
        <meta
          name="twitter:description"
          content="Live Mercury outboard prices in CAD, listed FourStroke and Pro XS models, 2.5-300 HP. MSRP vs dealer price, drop-off at our Gores Landing shop."
        />
        {schemaJson && (
          <script type="application/ld+json">{schemaJson}</script>
        )}
      </Helmet>
      <RepowerHeader />
      <div className="pt-[64px] lg:pt-[72px]" aria-hidden />
      <main className="container mx-auto max-w-5xl min-w-0 overflow-hidden px-4 py-6 md:py-8">
        <h1 className="text-3xl font-bold mb-3 break-words">Mercury Outboard Prices in Ontario (CAD): Live HBW Dealer Pricing</h1>

        {/* Intro paragraph renders once, from /pricing-reference.md (the canonical
            source). Do not duplicate it here. Visible date below is wired to the
            generated canonical pricing last_updated value. */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>Last updated {CANONICAL_LAST_UPDATED}.</p>
          <a href="#current-prices" className="font-semibold text-repower-mercury-red underline underline-offset-4">
            Jump to current prices
          </a>
        </div>

        <BlogInlineCTA
          variant="inline"
          heading="These are our real CAD prices. Want an itemized quote for your boat?"
          body="The table below shows motor-only pricing. Your installed number depends on rigging, controls, and your boat. Build a quote in about two minutes and a person here reviews it."
          primaryLabel="Build Your Quote"
          primaryHref="/quote/motor-selection"
          ctaLocation="pricing_reference_inline"
        />

        {loading ? (
          <p>Loading current pricing…</p>
        ) : html ? (
          <article
            className="prose prose-sm md:prose-base min-w-0 max-w-none break-words [&_.pricing-reference-details]:my-2 [&_.pricing-reference-details]:rounded-md [&_.pricing-reference-details]:border [&_.pricing-reference-details]:border-repower-navy-900/10 [&_.pricing-reference-details]:bg-white/60 [&_.pricing-reference-details]:px-4 [&_.pricing-reference-details]:py-3 [&_.pricing-reference-details_summary]:cursor-pointer [&_.pricing-reference-details_summary]:font-semibold [&_.pricing-reference-details_summary]:text-repower-navy-900 [&_.pricing-table-scroll]:my-4 [&_.pricing-table-scroll]:max-w-full [&_.pricing-table-scroll]:overflow-x-auto [&_.pricing-table-scroll]:overscroll-x-contain [&_.pricing-table-scroll]:rounded-md [&_.pricing-table-scroll]:border [&_.pricing-table-scroll]:border-repower-navy-900/10 [&_.pricing-table-scroll]:bg-white [&_table]:my-0 [&_table]:min-w-[720px] [&_table]:w-full [&_th]:whitespace-nowrap [&_th]:text-left [&_th]:p-2 [&_td]:p-2 [&_th]:border-b [&_td]:border-b [&_tbody_td:nth-child(2)]:font-semibold [&_tbody_td:nth-child(2)]:text-[1.1em]"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <p>
            Pricing data is temporarily unavailable. See{' '}
            <a className="text-primary underline" href="/pricing-reference.md">
              /pricing-reference.md
            </a>{' '}
            or{' '}
            <a className="text-primary underline" href="tel:9053422153" data-cta-location="pricing_reference_unavailable_phone">
              call (905) 342-2153
            </a>.
          </p>
        )}
        <section className="mt-12 mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            Mercury prices by segment
          </h2>
          <p className="text-muted-foreground mb-4">
            Browse detailed pricing and availability for every Mercury horsepower band.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {ALL_SEGMENTS.map((segment) => (
              <a
                key={segment.path}
                href={segment.path}
                className="block p-4 rounded-lg border bg-card text-card-foreground shadow-sm hover:bg-muted/30 transition-colors"
              >
                <span className="font-medium">{segment.name}</span>
                {segment.price && (
                  <span className="block text-sm text-muted-foreground">from {segment.price} CAD</span>
                )}
              </a>
            ))}
          </div>
        </section>
        <section className="mb-8 rounded-lg border border-border bg-muted/30 p-5">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Repowering your boat?
          </h2>
          <p className="text-muted-foreground mb-3">
            See the full{' '}
            <a href="/repower" className="text-primary underline">
              HBW Boat Repower Guide
            </a>{' '}
            for cost ranges, process, brand-conversion notes, and the complete article directory.
          </p>
          <p className="text-muted-foreground">
            Next steps:{' '}
            <a
              href="/quote/motor-selection"
              className="text-primary underline"
              data-cta="quote-start"
              data-cta-location="pricing_reference_next_steps"
            >
              Build Your Quote
            </a>
            {' '}·{' '}
            <a href="/repower" className="text-primary underline">repower process</a>
            {' '}·{' '}
            <a href="/promotions" className="text-primary underline">current financing offers</a>.
          </p>
        </section>

        <BlogInlineCTA
          variant="banner"
          heading="See your real number on a Mercury repower"
          body="Build a quote in about two minutes and a person at Harris Boat Works reviews it. Real Canadian pricing, no pressure."
          primaryLabel="Build Your Quote"
          primaryHref="/quote/motor-selection"
          phone="905-342-2153"
          ctaLocation="pricing_reference_banner"
          phoneCtaLocation="pricing_reference_banner_phone"
        />

      </main>
      <SiteFooter />

    </div>
  );
}
