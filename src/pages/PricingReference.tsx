import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { marked } from "marked";
import { ALL_SEGMENTS } from "@/data/landing/mercuryLineupLandings";
import { CANONICAL_LAST_UPDATED } from "@/lib/canonical-pricing";

marked.setOptions({ gfm: true, breaks: false });

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
        setHtml(marked.parse(noDateLine) as string);
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
    <>
      <Helmet>
        <title>Mercury Outboard Prices in Ontario (CAD, 2027) | Harris Boat Works</title>
        <meta
          name="description"
          content="Live Mercury outboard prices in CAD, listed FourStroke and Pro XS models, 2.5-300 HP. MSRP vs dealer price, Gores Landing pickup only."
        />
        <link rel="canonical" href="https://www.mercuryrepower.ca/pricing-reference" />
        <link rel="alternate" type="text/markdown" href="https://www.mercuryrepower.ca/pricing-reference.md" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Harris Boat Works" />
        <meta property="og:locale" content="en_CA" />
        <meta property="og:url" content="https://www.mercuryrepower.ca/pricing-reference" />
        <meta property="og:title" content="Mercury Outboard Prices in Ontario (CAD, 2027) | Harris Boat Works" />
        <meta
          property="og:description"
          content="Live Mercury outboard prices in CAD, listed FourStroke and Pro XS models, 2.5-300 HP. MSRP vs dealer price, Gores Landing pickup only."
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://www.mercuryrepower.ca/pricing-reference" />
        <meta name="twitter:title" content="Mercury Outboard Prices in Ontario (CAD, 2027) | Harris Boat Works" />
        <meta
          name="twitter:description"
          content="Live Mercury outboard prices in CAD, listed FourStroke and Pro XS models, 2.5-300 HP. MSRP vs dealer price, Gores Landing pickup only."
        />
        {schemaJson && (
          <script type="application/ld+json">{schemaJson}</script>
        )}
      </Helmet>
      <main className="container mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Mercury Outboard Prices in Ontario (CAD, 2027)</h1>
        {/* Intro paragraph renders once, from /pricing-reference.md (the canonical
            source). Do not duplicate it here. Visible date below is wired to the
            generated canonical pricing last_updated value. */}
        <p className="text-sm text-muted-foreground mb-6">Last updated {CANONICAL_LAST_UPDATED}.</p>
        {loading ? (
          <p>Loading current pricing…</p>
        ) : html ? (
          <article
            className="prose prose-sm md:prose-base max-w-none [&_table]:w-full [&_th]:text-left [&_th]:p-2 [&_td]:p-2 [&_th]:border-b [&_td]:border-b [&_table]:my-4 [&_tbody_td:nth-child(2)]:font-semibold [&_tbody_td:nth-child(2)]:text-[1.1em]"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <p>
            Pricing data is temporarily unavailable. See{' '}
            <a className="text-primary underline" href="/pricing-reference.md">
              /pricing-reference.md
            </a>{' '}
            or call (905) 342-2153.
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
      </main>
    </>
  );
}
