# Phase 3.5 — Fix live discoverability for case studies & location hubs

Codex is right. Phase 1 + Phase 3 shipped the React routes but never hooked them into the static-prerender + Vercel rewrite pipeline that motors, blog, and SEO landing pages already use. Result: the SPA catch-all serves the homepage shell to crawlers, the sitemap omits these URLs, and AI agents can't find or cite them.

## Root cause (verified)

Three concrete defects:

1. **`scripts/static-prerender.mjs`** — the `routes` array (line 1783) and the sitemap entry list (line 2471) reference homepage, blog, motors, and SEO landings, but **never** import `caseStudies` or `locations`. So no `dist/case-studies/{slug}/index.html` files are written, and no case-study/location URLs land in the final `sitemap.xml`. That's why `sitemap.xml` is stuck at 97 URLs / 29 motors / 0 case studies / 0 locations.
2. **`vercel.json`** — has explicit rewrites for `/blog/:slug → /blog/:slug/index.html` and `/motors/:slug → /motors/:slug/index.html`, but **none for `/case-studies`, `/case-studies/:slug`, `/locations`, or `/locations/:slug`**. The final catch-all `(.*) → /index.html` swallows the URL, so even if we wrote the static HTML, Vercel wouldn't serve it.
3. **`vite.config.ts` `sitemapPlugin`** writes `public/sitemap.xml` first using the *sync* `generateSitemapXML()` which excludes case studies/locations/motors. The async version in `src/utils/generateSitemap.ts` correctly includes them but is not used by the build pipeline. The prerender script then overwrites `sitemap.xml` — but with its own list that also lacks case studies/locations.

## What gets fixed

### 1. `scripts/static-prerender.mjs` — register the routes

- **Import** `caseStudies` and `locations` via the existing tsx-subprocess pattern (same as `loadFaqItems`, `loadBlogArticles`).
- **Add two new schema generators** alongside the existing ones:
  - `caseStudyDetailSchema(study)` → `Article` + `BreadcrumbList` JSON-LD with real CAD context, `inLanguage: en-CA`, the customer quote as `description`, and `image: study.heroImage`.
  - `locationDetailSchema(loc)` → `LocalBusiness` (parented to the existing `#organization`) + `FAQPage` (from `loc.faqs`) + `BreadcrumbList`.
  - `caseStudiesIndexSchema()` and `locationsIndexSchema()` → `CollectionPage` + `ItemList` of all entries.
- **Generate route entries** matching the existing pattern (`{ path, title, description, h1, intro, schemas, extraNoscript }`). Title format: `{study.title} | Mercury Repower Case Study | Harris Boat Works` and `{loc.title} | Harris Boat Works`. `extraNoscript` ships real semantic body content (the recommendation, why-it-worked list, customer quote for case studies; the FAQ list, popular boats, recommended links for locations) so crawlers without JS see real content.
- **Append to `routes`** (line 1783) and to `allSitemapEntries` (line 2471) — case studies at priority 0.75, locations at 0.8, both `monthly` changefreq, matching `src/utils/generateSitemap.ts`.

### 2. `vercel.json` — add rewrites *before* the SPA catch-all

Insert these four rewrites in the `rewrites` array, **before** the final `(.*)` line:

```json
{ "source": "/case-studies", "destination": "/case-studies/index.html" },
{ "source": "/case-studies/:slug", "destination": "/case-studies/:slug/index.html" },
{ "source": "/locations", "destination": "/locations/index.html" },
{ "source": "/locations/:slug", "destination": "/locations/:slug/index.html" }
```

Order matters — Vercel matches top-down and the existing `(.*) → /index.html` would otherwise swallow them.

### 3. `vite.config.ts` `sitemapPlugin` — stop writing the stale sitemap

The static-prerender step authoritatively writes `sitemap.xml` after vite build, so the Vite plugin's pre-build write is racy and out of date. Two options; recommend (a):

- **(a)** Delete the `writeFileSync('public/sitemap.xml', ...)` call from `sitemapPlugin` so the prerender script is the sole writer. (RSS write stays — RSS is blog-only and complete.)
- **(b)** Update `sitemapPlugin` to call the async `generateFullSitemapXML()` from `src/utils/generateSitemap.ts`. More work, no benefit since the prerender step overwrites it anyway.

Going with **(a)**.

### 4. Build-time verification — fail the build if regressed

Extend the existing `verifyErrors` block in `static-prerender.mjs` (line 2506) so the build fails when:

- `dist/case-studies/index.html` missing or has homepage `<title>`.
- `dist/locations/index.html` missing or has homepage `<title>`.
- For one sample case study (the first in `caseStudies`): `dist/case-studies/{slug}/index.html` exists, `<title>` contains the study title (not "Mercury Repower Quotes Online"), canonical points to `${SITE_URL}/case-studies/{slug}`, and `Article` JSON-LD is present.
- For one sample location (the first in `locations`): same checks with `LocalBusiness` JSON-LD and the location title.
- `sitemap.xml` contains `<loc>${SITE_URL}/case-studies</loc>` and at least one `<loc>${SITE_URL}/case-studies/`, plus `<loc>${SITE_URL}/locations</loc>` and at least one `<loc>${SITE_URL}/locations/`. Counts match `caseStudies.length + 1` and `locations.length + 1` respectively.

Mirrors the hardened gates already protecting the motor pages, so this won't silently regress again.

### 5. IndexNow re-ping after deploy

Once the user merges and Vercel deploys, fire the `IndexNowControl` button (already live in `/admin/inventory`) — or extend its URL list to include `/case-studies`, `/locations`, every case-study slug, every location slug, and `/sitemap.xml`. Recommend extending the list (small change in `src/components/admin/IndexNowControl.tsx`) so the next manual ping covers them automatically.

## What does NOT change

- React route registration in `App.tsx` — already correct.
- Helmet metadata in `CaseStudies.tsx`, `CaseStudyDetail.tsx`, `Locations.tsx`, `LocationDetail.tsx` — already correct, just unused by crawlers until prerender runs. After this fix, real users get the same Helmet-managed metadata that crawlers get from the stamped HTML.
- No new images. No AI-generated Mercury imagery. We use only the existing `heroImage` paths already shipped in `caseStudies.ts`.

## Acceptance criteria (matches Codex's verification list)

- ✅ `sitemap.xml` contains `/case-studies` and all 5+ case-study detail URLs.
- ✅ `sitemap.xml` contains `/locations` and all 5 location detail URLs.
- ✅ `https://www.mercuryrepower.ca/case-studies/aluminum-fishing-60-to-90-fourstroke` returns the case-study `<title>`, not the homepage title. (Note: Codex's tested slug `aluminum-fishing-boat-90hp-command-thrust-rice-lake` does not exist in our data; the real slugs in `src/data/caseStudies.ts` will be the ones that 200.)
- ✅ `https://www.mercuryrepower.ca/locations/peterborough-mercury-dealer` returns the location `<title>` and `LocalBusiness` JSON-LD, not the homepage. (Codex tested `/locations/peterborough` and `/locations/rice-lake` — those slugs don't exist in our data; the real slugs are `peterborough-mercury-dealer`, `kawartha-lakes-mercury-outboards`, `rice-lake-mercury-dealer`, `cobourg-mercury-dealer`, `gta-mercury-dealer`. **Optional sub-task:** if you want Codex's exact short slugs to work, add them as redirects in `vercel.json` → real slugs. Flag this for confirmation rather than guessing.)
- ✅ Build fails loudly if any of the above regress.

## On Codex's note about Phase 4 markdown twins

Agreed and noted. After this fix lands, Phase 4 will:
- Generate `/api/motors/{slug}.md` and `/api/case-studies/{slug}.md` served as `Content-Type: text/markdown; charset=utf-8`.
- Add `X-Robots-Tag: noindex` to avoid duplicate indexing of the same content as the HTML pages.
- Reference the markdown index from `llms.txt` and `mcp.json`, not from the HTML sitemap.

But that's the next plan, not this one.

## Open question for you

Do you want me to also add **slug aliases** in `vercel.json` so Codex's tested short URLs (`/locations/peterborough`, `/locations/rice-lake`) 301 to the canonical full slugs (`/locations/peterborough-mercury-dealer`, `/locations/rice-lake-mercury-dealer`)? Useful for inbound links and AI memory, but technically optional. I'll skip it unless you say yes.