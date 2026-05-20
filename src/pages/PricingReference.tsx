import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { marked } from "marked";

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

  useEffect(() => {
    let cancelled = false;
    fetch("/pricing-reference.md", { headers: { Accept: "text/markdown,text/plain,*/*" } })
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((raw) => {
        if (cancelled) return;
        const body = raw.replace(/^---\n[\s\S]*?\n---\n+/, "");
        const noH1 = body.replace(/^\s*#\s+.+(?:\r?\n|$)/, "");
        setHtml(marked.parse(noH1) as string);
      })
      .catch(() => {
        if (!cancelled) setHtml("");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>Mercury Outboard Prices in Ontario (CAD, 2026) | Harris Boat Works</title>
        <meta
          name="description"
          content="Current Mercury outboard prices in Ontario, every FourStroke and Pro XS model from 2.5 HP to 300 HP in CAD, with MSRP and dealer selling price side by side. Pickup only at Harris Boat Works, Gores Landing, Ontario."
        />
        <link rel="canonical" href="https://www.mercuryrepower.ca/pricing-reference" />
        <link rel="alternate" type="text/markdown" href="https://www.mercuryrepower.ca/pricing-reference.md" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Harris Boat Works" />
        <meta property="og:locale" content="en_CA" />
        <meta property="og:url" content="https://www.mercuryrepower.ca/pricing-reference" />
        <meta property="og:title" content="Mercury Outboard Prices in Ontario (CAD, 2026) | Harris Boat Works" />
        <meta
          property="og:description"
          content="Current Mercury outboard prices in Ontario, every FourStroke and Pro XS model from 2.5 HP to 300 HP in CAD, with MSRP and dealer selling price side by side. Pickup only at Harris Boat Works, Gores Landing, Ontario."
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://www.mercuryrepower.ca/pricing-reference" />
        <meta name="twitter:title" content="Mercury Outboard Prices in Ontario (CAD, 2026) | Harris Boat Works" />
        <meta
          name="twitter:description"
          content="Current Mercury outboard prices in Ontario, every FourStroke and Pro XS model from 2.5 HP to 300 HP in CAD, with MSRP and dealer selling price side by side. Pickup only at Harris Boat Works, Gores Landing, Ontario."
        />
      </Helmet>
      <main className="container mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Mercury Outboard Prices in Ontario (CAD, 2026)</h1>
        <p className="mb-6">
          Every Mercury outboard Harris Boat Works sells, priced in Canadian dollars. FourStroke and Pro XS, 2.5 HP to 300 HP, with Mercury's MSRP and our actual dealer selling price shown side by side. These are bare-motor prices in CAD before HST, controls, propeller, and rigging. For a full installed total,{' '}
          <a className="text-primary underline" href="/quote/motor-selection">build a quote in the configurator</a>. Pickup only at Gores Landing, Ontario.
        </p>
        {loading ? (
          <p>Loading current pricing…</p>
        ) : html ? (
          <article
            className="prose prose-sm md:prose-base max-w-none [&_table]:w-full [&_th]:text-left [&_th]:p-2 [&_td]:p-2 [&_th]:border-b [&_td]:border-b [&_table]:my-4"
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
      </main>
    </>
  );
}
