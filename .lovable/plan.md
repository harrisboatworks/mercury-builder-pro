

## Abandon Puppeteer — Switch to Static HTML Stamping

The Round 3 build proved the diagnosis: even with Chromium downloaded into the cached path, Vercel's build container is missing `libnspr4.so` (and ~20 other shared libs Chromium dynamically links against). Amazon Linux 2023 build sandboxes don't let us `apt-get install` them. **No puppeteer-based prerender will ever launch on a Vercel build.** Time to change approach.

### What we're switching to

Instead of running a real browser, stamp out per-route HTML files at build time by cloning `dist/index.html` (the SPA shell Vite produces) and injecting per-route `<title>`, `<meta name="description">`, JSON-LD schema, and a `<noscript>` fallback. Crawlers (Googlebot, Meta-ExternalAgent, Perplexity, ChatGPT) get real page-specific content. Real users still get the React app — it hydrates over the stamped shell exactly like before.

No browser. No shared libraries. No cache directory. Pure Node.

### Changes

**1. Delete the puppeteer pipeline**
- Delete `scripts/prerender.ts`
- Delete `.puppeteerrc.cjs`
- Remove `prerenderPlugin()` from `vite.config.ts` (drop the function definition + the line that includes it in the plugins array; keep `sitemapPlugin` untouched)
- `package.json` `build` script → `vite build && node scripts/static-prerender.mjs` (drop the `npx puppeteer browsers install chrome &&` prefix; do **not** add `tsc -b` — current build has never run it and adding it now would surface unrelated TS errors)
- Remove deps: `puppeteer`, `puppeteer-core`, `@sparticuz/chromium`, `sirv` (sirv was only used by the prerender server). Keep `tsx` (used elsewhere) and `@vercel/node`.

**2. New file: `scripts/static-prerender.mjs`**

A ~150-line Node ESM script that:
- Reads `dist/index.html`
- Iterates over an 8-route config (`/`, `/repower`, `/faq`, `/about`, `/contact`, `/blog`, `/agents`, `/quote/motor-selection`) — same routes Vercel's `vercel.json` already rewrites
- For each route: replaces `<title>`, replaces/inserts `<meta name="description">`, injects JSON-LD `<script>` blocks before `</head>`, injects a `<noscript>` semantic fallback (`<h1>` + key paragraph + for FAQ a Q&A list) into `<div id="root">`
- Writes output to `dist/{route}/index.html` (and overwrites `dist/index.html` for `/`)
- Includes a sanity check: each output ≥ 30 KB and contains the expected title; non-zero exit on failure → fails the build

**3. Schema content — extracted from existing React components**

The schema objects already exist in `src/components/seo/*SEO.tsx` (FAQPageSEO, RepowerPageSEO, HomepageSEO, etc.) and in `src/data/faqData.ts`. The script will **import** these directly rather than duplicating them:
- `import { getAllFAQItems } from '../src/data/faqData.ts'` (loaded via `tsx` if needed, or read as a static JSON dump produced as part of the script)
- For complex schemas (Repower's HowTo + LocalBusiness + Service), copy the JSON-LD object literal from the matching `*SEO.tsx` into a new `scripts/seo-schemas.mjs` module that's the single source of truth, then `import` it from both the React component and the prerender script

This avoids drift: schema lives in one place, both runtime React (for users with JS) and build-time stamping (for crawlers) use the same data.

**4. `vercel.json` — already correct**

The `rewrites` array already maps each of the 8 routes to its `/{route}/index.html`. No change needed. (The catch-all `/((?!api).*)` → `/` falls through correctly for unknown routes.)

### Acceptance

After deploy, build log should show:
```
[static-prerender] wrote dist/index.html (NN KB)
[static-prerender] wrote dist/repower/index.html (NN KB)
... 8 routes ...
[static-prerender] ✓ 8 routes prerendered
```

Then:
```bash
# 8 distinct SHAs
for r in / /repower /faq /about /contact /blog /agents /quote/motor-selection; do
  curl -A Googlebot -s "https://mercuryrepower.ca$r" | shasum
done

# Schema present
curl -A Googlebot -s https://mercuryrepower.ca/faq | grep -c '"@type":"FAQPage"'   # ≥ 1
curl -A Googlebot -s https://mercuryrepower.ca/repower | grep -c '"@type":"Service"' # ≥ 1
```

### Risk & trade-offs

- **No JS-rendered content in the stamped HTML.** Whatever React generates dynamically (e.g. live promo prices, motor counts) won't appear in crawler-visible HTML. For SEO/AI-discovery purposes this is fine — the fixed schema and meta tags are what crawlers index. If you ever want live data in the prerendered HTML, the script can `fetch()` from Supabase at build time (separate follow-up).
- **Schema must stay manually synced** if React components change. Mitigated by extracting to `scripts/seo-schemas.mjs` as the single source of truth (step 3).
- Build is now ~30 seconds faster (no Chromium download) and uses ~250 MB less in `node_modules`.

