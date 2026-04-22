

## Hydration overwrite fix — stop GlobalSEO from polluting per-page schema

### Root cause

`<GlobalSEO />` is mounted globally in `src/App.tsx` (line 557, inside the `<App>` shell, runs on every route). It injects a JSON-LD `@graph` containing 5 nodes — including a **homepage `WebPage @id="…/#webpage"`** with `name: "Mercury Repower Quotes Online…"` — into every page after hydration.

The prerender ships the correct per-page `@graph` (e.g. `WebPage @id="…/mercury-pro-xs#webpage"` + `FAQPage @id="…/mercury-pro-xs#faqpage"`). After hydration the global block adds a second JSON-LD script, so Google sees both copies side-by-side. That's why Rich Results Test reports everything 2× and flags "Duplicate field FAQPage" on Pro XS (the page's own `MercuryProXSSEO` also adds `WebPage @id=…#webpage`, `FAQPage @id=…#faqpage`, etc., which collide once GlobalSEO fires the global homepage graph).

The "homepage title in live DOM" is most likely the `name` field of the global WebPage JSON-LD node (which reads `Mercury Repower Quotes Online — Real Prices, No Forms…`) being mistaken for `<title>` in Claude's report. Per-page `<Helmet><title>` is correctly set by every landing page's SEO component (verified in MercuryProXSSEO line 110). Either way, the fix is the same: stop GlobalSEO from writing page-level schema on non-home routes.

### The fix — 3 targeted changes

**1. Slim down `src/components/seo/GlobalSEO.tsx`**

Strip the page-level nodes. Keep only the truly site-wide nodes that are safe to duplicate across every page:

- Keep: `WebSite @id=#website`, `Organization @id=#organization`, `LocalBusiness @id=#localbusiness`
- Remove: `WebPage @id=#webpage` (page-level — must come from each route's SEO component)
- Remove: `Service @id=#quote-service` (move to `HomepageSEO` only)

Keep the hreflang `<link rel="alternate">` tags as-is (those are safe site-wide).

Result: every page gets `WebSite + Organization + LocalBusiness` as global context (these have stable `@id`s and Google handles duplicates fine), and each route adds its own `WebPage`, `BreadcrumbList`, `FAQPage`, `ProductGroup`, etc. on top. No conflicts.

**2. Move the `Service @id=#quote-service` node into `src/components/seo/HomepageSEO.tsx`**

Add it to the `@graph` array there. It only describes the homepage's online quote service — it shouldn't appear on `/mercury-pro-xs` or any other route.

**3. Fix `MercuryProXSSEO.tsx` ProductGroup variants — add `image` field**

Each entry in `PRO_XS_STATIC_OFFERS` needs an image URL for Merchant Listings eligibility. Use the Mercury family hero already on the site (or a per-HP placeholder if available). Add an `image` field to `PRO_XS_STATIC_OFFERS` and reference it in the variant Offer object:

```ts
{
  "@type": "Product",
  "name": v.name,
  "image": v.image,        // NEW
  "brand": { ... },
  "category": "Outboard Motor",
  "offers": { ... }
}
```

I'll use `${SITE_URL}/assets/mercury-pro-xs-hero.jpg` if it exists in `src/assets/` or `public/`, otherwise fall back to the Mercury logo / Harris logo as a temporary valid URL. I'll grep `src/assets` and `public/lovable-uploads` first to pick a real existing image.

### Files touched

| # | File | Action |
|---|---|---|
| 1 | `src/components/seo/GlobalSEO.tsx` | Remove `WebPage` + `Service` nodes from `@graph`. Keep `WebSite`, `Organization`, `LocalBusiness`, hreflang. |
| 2 | `src/components/seo/HomepageSEO.tsx` | Add `Service @id=#quote-service` node to its `@graph`. |
| 3 | `src/components/seo/MercuryProXSSEO.tsx` | Add `image` field to `PRO_XS_STATIC_OFFERS` and to each `hasVariant` Product. |

### Out of scope (not changing)

- The prerender script (`scripts/static-prerender.mjs`) — it's correct already.
- The 30+ other per-page SEO components — they're correct, they just got drowned out by GlobalSEO. Once GlobalSEO is slimmed they'll stand alone cleanly.
- Updating other Product schemas — only Pro XS uses `ProductGroup`/`hasVariant`. Other landing pages use `Service` and `FAQPage` which don't require `image`.

### Verification (post-deploy, manual)

```
for url in / /mercury-pro-xs /mercury-outboards-ontario /mercury-pontoon-outboards \
          /mercury-repower-faq /how-to-repower-a-boat /mercury-dealer-peterborough \
          /mercury-dealer-cobourg /mercury-dealer-gta /agents /contact /about; do
  echo "=== $url ==="
  curl -s "https://www.mercuryrepower.ca$url" | grep -oE '"@id":"[^"]*#webpage"' | sort -u
done
```

Each URL should return exactly **one** `#webpage` `@id`, matching the URL (e.g. `…/mercury-pro-xs#webpage`, never bare `…/#webpage` on a non-home page). Then re-run Google Rich Results Test on `/mercury-pro-xs`:
- FAQ: 1 valid (was 2 invalid)
- Merchant listings: 4 valid (was 8 invalid)
- Duplicate field FAQPage error: gone

