## Goal
Make raw server HTML (what Googlebot, Bing, Meta scraper, ChatGPT, Perplexity see *before* JS runs) carry per-route metadata for **every important route — especially `/promotions` and every `/blog/:slug`** — and silence the noisy `useGooglePlaceData` warning in production.

## Why this matters
Today our prerender script (`scripts/static-prerender.mjs`) stamps `<title>`, `<meta description>`, `<link canonical>`, and JSON-LD per route — but it does **not** touch any of the `og:*` / `twitter:*` tags. Those still sit in `index.html` hard-coded to the homepage values, so every prerendered page (including `/promotions` and every blog post) ships to crawlers with **homepage Open Graph tags**.

On top of that, `/promotions` and `/blog/:slug` are not in the prerender route list at all — so they only get the unmodified shell (homepage title + homepage OG + no per-page JSON-LD) until the React app hydrates. Crawlers and link unfurlers (Slack/iMessage/Facebook/X) generally do not execute JS, so they see the wrong title/description/image.

## What I will change

### 1. `scripts/static-prerender.mjs` — stamp social tags + add missing routes

**A. New `stampSocial` helper** (called from inside `stamp(route)`)

For each route, replace or insert these tags with `data-rh="true"` markers (so `react-helmet-async` adopts them on hydration instead of duplicating):

- `<meta property="og:title" content="…" />`
- `<meta property="og:description" content="…" />`
- `<meta property="og:url" content="https://www.mercuryrepower.ca{path}" />`
- `<meta property="og:image" content="…" />` (route-specific if provided, else default `/social-share.jpg`)
- `<meta property="og:type" content="website|article" />`
- `<meta name="twitter:title" content="…" />`
- `<meta name="twitter:description" content="…" />`
- `<meta name="twitter:image" content="…" />`

The route config object gets two new optional fields: `ogImage` and `ogType` (default `"website"`). Default image stays the existing `/social-share.jpg`.

**B. Add `/promotions` to the routes array**

Title / description / OG mirror what `PromotionsPageSEO` already produces for the no-active-promo state (a static snapshot — fine for crawlers, the React component still hydrates the dynamic offer-catalog JSON-LD when there are live promos). Includes a `genericPageSchema('/promotions', …)` JSON-LD block.

**C. Loop over `getPublishedArticles()` and stamp every blog post**

Spawn `npx tsx` once (same pattern already used for `loadFaqItems`) to dump every published article's `slug`, `title`, `description`, `image`, `datePublished`, `dateModified`, `keywords`, `faqs`, `howToSteps`. For each one:

- Path: `/blog/{slug}`
- Title: `{article.title} | Harris Boat Works Blog`
- Description: `article.description`
- `ogImage`: `${SITE_URL}${article.image}` (absolute URL, mandatory for unfurlers)
- `ogType`: `"article"`
- Schema graph: same shape `BlogSEO.tsx` builds (Article + WebPage + optional HowTo + optional FAQPage). Refactored into a shared `blogArticleSchema(article)` function in the script so it stays in sync with `BlogSEO.tsx`.
- `noscript` body: H1 + first paragraph of content (or article description) so crawlers see real text even with no JS.

Also add a top-level `/blog` route (the index page) — already in routes list, but verify the `og:type` is `website` and the OG description matches the index. ✓ (already present at line 1338 — just add social tags.)

### 2. `index.html` — set defaults to canonical domain

Update the hard-coded social tags to reference `https://www.mercuryrepower.ca/` instead of `https://mercuryrepower.ca/` (consistent with the canonical domain we settled on). These are only the *fallback* values — the prerender now overrides them per route — but they should still be correct for any route we forget to prerender.

### 3. `src/hooks/useGooglePlaceData.ts` — gate the warning

The `console.warn('[useGooglePlaceData] Could not fetch place data …')` fires on every page load when the `google-places` Edge Function is rate-limited / cold-starting / returning a transient error. It is harmless (the UI degrades gracefully to defaults) but noisy in production logs and Sentry-style aggregators.

Change:
```ts
} catch (err) {
  if (import.meta.env.DEV) {
    console.warn('[useGooglePlaceData] …', err);
  }
  return null;
}
```
Same treatment for the `data?.error` warning a few lines above.

(I am **not** touching the Edge Function itself in this pass — it works in production for the majority of requests and the cache layer absorbs failures. If you later want me to harden the function itself, I can — but the user-visible UX is already correct and the warning is just log noise.)

## Files edited
- `scripts/static-prerender.mjs` — add `stampSocial`, add `/promotions`, loop over published blog articles, share `blogArticleSchema()` helper
- `index.html` — normalize the fallback OG/Twitter URLs to `www.mercuryrepower.ca`
- `src/hooks/useGooglePlaceData.ts` — gate warnings behind `import.meta.env.DEV`

## Files NOT edited (intentionally)
- `src/components/seo/BlogSEO.tsx`, `src/components/seo/BlogIndexSEO.tsx`, `src/components/seo/PromotionsPageSEO.tsx` — these already emit the right tags via `react-helmet-async` for the live React app. The prerender stamp uses `data-rh="true"` markers so Helmet adopts them on hydration without duplication. No changes needed.
- Edge Function `google-places` — out of scope; warning suppression is sufficient.

## Verification after build
1. `bun run build` (Vercel will run this on deploy)
2. `curl -s https://www.mercuryrepower.ca/promotions | grep -E 'og:title|og:url|canonical|application/ld'` → should show `/promotions`-specific values
3. Same for `/blog/how-to-choose-right-horsepower-boat` → article-specific OG title, image, type=article, Article JSON-LD
4. Facebook Sharing Debugger / Twitter Card Validator on a blog URL → article-specific preview, not homepage
5. `dist/promotions/index.html` and `dist/blog/{slug}/index.html` exist after build
6. No `[useGooglePlaceData]` warning in production console (still appears in `bun run dev`)
