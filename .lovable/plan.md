# Duplicate-content diagnostic — findings and fix plan

Investigation done, no code touched. Answers to your four questions first, plan at the end.

---

## 1. Why doesn't the `quote.harrisboatworks.ca` redirect fire?

**It does fire, right now, server-side.** Direct probes from this sandbox:

```
curl -I https://quote.harrisboatworks.ca/repower
→ HTTP/2 301, location: https://www.mercuryrepower.ca/repower, server: Vercel

curl -I https://mercuryrepower.ca/
→ HTTP/2 301, location: https://www.mercuryrepower.ca/, server: Vercel
```

Both hosts return a real 301 from Vercel. The `vercel.json` host-conditional redirect wins before the SPA rewrite (Vercel evaluates `redirects` before `rewrites`), and `middleware.ts` is a backup that also fires. Neither is being shadowed.

So the browser behaviour you saw at `quote.harrisboatworks.ca/repower` (full app rendered, two canonicals) is **not** an active Vercel misconfig. Most likely causes, in order:

1. **Stale service worker.** `public/service-worker.js` and `public/sw.js` exist; if a visitor installed the SW at that host months ago, the SW serves a cached shell (with the old canonicals) before the network 301 is ever consulted. This is by far the most common cause of "the redirect isn't working but curl says it is."
2. **HSTS or disk cache pinned to old response.** Chrome will happily serve a cached 200 for a URL that later returns 301, until the cache entry expires.
3. **Not the config.** The catch-all rewrite (`/((?!api/|...).*)`) doesn't shadow redirects on Vercel — redirects run first.

**Not a DNS issue either:** DNS resolves to Vercel, Vercel is doing the 301. It's a **client-side stale cache/SW at `quote.harrisboatworks.ca`.**

---

## 2. Where the canonical / og:url comes from — and why you'd see two

Emitters (verified by grep):

| Source | Behaviour |
|---|---|
| `index.html` | Static single canonical `https://www.mercuryrepower.ca/` |
| `scripts/static-prerender.mjs` (lines 5294-5304, 5324-5354) | Rewrites the shell canonical + og:url per route, keyed off `SITE_URL` (always `https://www.mercuryrepower.ca`), tags with `data-rh="true"` |
| `src/lib/site.ts` | `SITE_URL` is hardcoded to `https://www.mercuryrepower.ca` and rejects stale `VITE_SITE_URL` env values. Origin is **never** derived from `window.location` here. |
| Per-page Helmet SEO components (`RepowerPageSEO`, `HubPageSEO`, `BoatInfoPageSEO`, `ContactPageSEO`, `FAQPageSEO`, `MotorPageSEO`, `PromotionsPageSEO`, `QuoteSummaryPageSEO`, `MotorSelectionSEO`, `TradeInValuePage`, `Terms`, `Privacy`, `Locations`, `LocationDetail`, `MandarinLanding`, `FrenchLanding`, `MotorPage`, `CaseStudyDetail`, `ToolsIndex`, `PricingReference`, `AboutJayHarris`, plus every localized blog page) | Each emits its own `<link rel="canonical">` and `<meta property="og:url">` through `react-helmet-async`. |
| `src/App.tsx` line 198-215 `<Canonical>` fallback | Uses `SITE_URL` (good), and short-circuits if a canonical already exists. |
| **`src/components/QuoteBuilder.tsx` line 192-198** | **Grabs the existing canonical and OVERWRITES its href to `window.location.origin + '/'`** — this is host-derived and page-agnostic. |
| Also runtime host-derived: `src/pages/AdminQuotes.tsx:111`, `src/pages/FinanceCalculator.tsx:67`, `src/pages/StagingImageSizing{,V2,Final}.tsx` | Set canonical from `window.location.origin` / `.href` |

**Why two canonicals appear on `/repower`:**

`react-helmet-async` deduplicates `<meta>` tags by `name` / `property`, but **does not deduplicate `<link>` tags by `rel`** (this is a known Helmet behaviour, noted in the project's own `head-meta` knowledge). Sequence on `/repower`:

1. Prerender writes `<link data-rh="true" rel="canonical" href="https://www.mercuryrepower.ca/repower">` into the shell.
2. React hydrates. `RepowerPageSEO` runs and Helmet appends **another** `<link rel="canonical" href="https://www.mercuryrepower.ca/repower">` — same href, but a **second element**.
3. If any code path also runs `QuoteBuilder`'s effect (or one of the other runtime canonical mutators), it locates the *first* `<link rel=canonical>` and rewrites its `href` to `window.location.origin + '/'` — which on `quote.harrisboatworks.ca` becomes `https://quote.harrisboatworks.ca/`, and on `harrisboatworks.ca` becomes `https://harrisboatworks.ca/repower`. That's exactly the "second canonical pointing to a wrong domain" you observed.

The two `<meta property="og:url">` tags come from the same Helmet-vs-prerender adoption gap: some pages carry Helmet `og:url` while the prerender has already stamped one; if Helmet's tag doesn't dedupe against the `data-rh` marker on hydration (it usually does for meta, but not always for cached routes / different attribute orderings), you can end up with two.

**Bottom line:** the duplication is not caused by DNS. It's caused by (a) the runtime mutators that use `window.location.origin`, and (b) Helmet not deduping `<link rel=canonical>`.

---

## 3. Cleanest fix (single source of truth)

Make `SITE_URL` the only origin used anywhere for canonicals/og:url, and let the prerender's `data-rh` tag be the only canonical element on the page.

Files to change (no code written yet):

1. **`src/components/QuoteBuilder.tsx`** (~L192-198) — delete the runtime canonical mutator entirely. The route already has its own SEO component; there's no reason to rewrite the canonical from `window.location.origin`.
2. **`src/pages/AdminQuotes.tsx`** (L111) — same: remove the runtime `canonical.href = window.location.origin + '/admin/quotes'` (admin is not indexable anyway).
3. **`src/pages/FinanceCalculator.tsx`** (L67) — replace `window.location.origin + '/finance-calculator'` with `${SITE_URL}/finance-calculator` from `@/lib/site`. Better: delete and rely on a `<Helmet><link rel="canonical" href={`${SITE_URL}/finance-calculator`} /></Helmet>` in the SEO component (there's a prerender entry for it already).
4. **`src/pages/StagingImageSizing.tsx`, `StagingImageSizingV2.tsx`, `StagingImageSizingFinal.tsx`** — these set `canonical` to `window.location.href`. They are staging pages; add `<meta name="robots" content="noindex">` and drop the canonical mutation. If they must have one, use `${SITE_URL}/staging-...`.
5. **All Helmet-based SEO components** that emit `<link rel="canonical">` — audit whether they should still ship a Helmet canonical at all, given the prerender already stamps one with `data-rh`. Two safe options:
   - **Preferred:** delete the Helmet canonical from every SEO component and let the prerender be authoritative. Result: exactly one `<link rel=canonical>` in the DOM, always from `SITE_URL`.
   - **Alternative:** keep Helmet canonical but strip the prerendered one on hydration by giving the SEO components the same `data-rh="true"` attribute (Helmet already does this) AND adding a small `useEffect` in `src/main.tsx` that removes any extra `link[rel=canonical]` beyond the first. Uglier; not recommended.
6. **Service worker.** Update `public/service-worker.js` and `public/sw.js` to (a) claim clients aggressively and (b) delete any cached HTML for the `quote.harrisboatworks.ca` origin on activate. Or, simpler: bump the SW version so old clients unregister on next visit and revalidate. This is what will actually make legacy `quote.*` visitors stop seeing the stale shell.
7. **Lovable second host (`mercuryrepower.lovable.app`).** This is Lovable's own preview/publish, not Vercel. It currently serves 200 with a clean canonical pointing to www.mercuryrepower.ca (verified), so it will not steal ranking — but it *is* a second indexable copy. Two mitigations:
   - Add `X-Robots-Tag: noindex` for the `.lovable.app` host (has to be set in Lovable publish settings, not in repo).
   - Or unpublish the Lovable copy entirely, since production is Vercel per your project memory.

---

## 4. H1 theory — confirmed

Prerendered routes have H1s (either via React + Helmet or via the `<noscript>` fallback the prerender injects). Routes present in `<Route>` in `src/App.tsx` but **not** in `scripts/static-prerender.mjs`'s `routes` array serve only the empty `<div id="root">` shell to crawlers, with no `<h1>` at all.

Indexable-looking routes that are client-rendered only (no prerender entry, no `robots noindex`):

- `/how-to-repower-a-boat`
- `/electric/mercury-avator`
- `/lakes`
- `/accessories`
- `/mercury/250-pro-xs` (note: `/mercury/pro-xs-250` IS prerendered — near-duplicate)
- `/mercury-outboards-ajax`, `/-bowmanville`, `/-oshawa`, `/-pickering`, `/-whitby`
- `/motor-selection` (legacy path; `/quote/motor-selection` is prerendered)
- `/fr` (French landing — not in prerender excerpt)
- `/blog/tl`, `/blog/tl/:slug`, `/blog/ur`, `/blog/ur/:slug`, `/blog/zh-hant`, `/blog/zh-hant/:slug` (only fr/zh/ko/es/hi/pa language indexes are prerendered)
- `/case-studies/:slug` (index is prerendered, individual slugs are not)
- `/locations/:slug` (index is prerendered, individual slugs are not — need to verify)

These are almost certainly Bing's 40 "missing H1" pages. Fix: add each to the prerender routes array in `scripts/static-prerender.mjs`, or noindex the ones that shouldn't be in the index (staging, /n, /dev, /agents, /financing/success, /payment-canceled, /my-quotes, admin routes, /auth, /login).

---

## Plan (files, in order)

1. **Kill runtime canonical mutators** using `window.location.origin`:
   - `src/components/QuoteBuilder.tsx` (delete the effect block that touches `<link rel=canonical>`)
   - `src/pages/AdminQuotes.tsx` (same)
   - `src/pages/FinanceCalculator.tsx` (switch to `SITE_URL` or delete and let the SEO component own it)
   - `src/pages/StagingImageSizing.tsx`, `StagingImageSizingV2.tsx`, `StagingImageSizingFinal.tsx` (delete + add robots noindex)

2. **Pick one canonical owner per route.** Decide between "prerender-only" (cleanest — delete Helmet canonicals from SEO components) or "Helmet-only" (delete prerender canonical writer and let Helmet stamp on hydration; loses the raw-HTML canonical for crawlers, so **not** recommended). Recommend prerender-only, since it's the only source that survives no-JS crawlers.

3. **Deduplicate the SPA-shell `og:url`** the same way: leave prerender as the single source, drop Helmet `og:url` from the per-page SEO components, or make the SEO components skip emitting them when a `data-rh="true"` `og:url` is already in the head at mount.

4. **Bust the stale SW at `quote.harrisboatworks.ca`.** Bump the SW version constant in `public/service-worker.js` and `public/sw.js`, and register a one-shot self-unregister for hosts other than `www.mercuryrepower.ca`. This is what makes real users' browsers actually see the 301.

5. **Retire `mercuryrepower.lovable.app`** or noindex it via Lovable publish settings — done outside the repo.

6. **Fix the H1-missing set.** Add `/how-to-repower-a-boat`, `/electric/mercury-avator`, `/lakes`, `/accessories`, the five `mercury-outboards-<city>` pages, `/motor-selection`, `/fr`, the tl/ur/zh-hant blog hubs and slug renderers, and per-slug case-study/location pages to the prerender routes array in `scripts/static-prerender.mjs`. Noindex the utility/admin routes listed above.

7. **Bing sitemap cleanup** (outside repo): remove the `quote.harrisboatworks.ca/sitemap.xml` and `mercuryrepower.ca/sitemap.xml` submissions from Bing Webmaster Tools; keep only `https://www.mercuryrepower.ca/sitemap.xml`.

No code will be written until you approve.
