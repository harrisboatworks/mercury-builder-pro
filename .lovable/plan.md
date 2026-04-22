

## Mercuryrepower.ca AX — Wave D: Crawler-Visible HTML + Schema Hygiene

Approved scope, ready to ship in default mode.

### Implementation steps (in order)

**1. Clean up `index.html`**
- Remove the `<noscript><meta http-equiv="refresh">` block (lines 46-48) — it forces crawlers to redirect away from `/`
- Remove the dead iframe-targeting `<script>` at the bottom (lines 78-110) — targets an iframe that doesn't exist
- Add `<meta name="msvalidate.01" content="BING_VERIFICATION_TBD" />` placeholder
- Verify `https://mercuryrepower.ca/social-share.jpg` resolves; if not, swap `og:image` and `twitter:image` to `/assets/harris-logo-black.png` (known-good)

**2. Normalize all schema `@id` URLs to `mercuryrepower.ca`**
- `src/components/seo/RepowerPageSEO.tsx`: replace every `https://harrisboatworks.ca/...` `@id`, `url`, `provider`, `breadcrumb item` with `https://mercuryrepower.ca/...`
- `src/components/seo/GlobalSEO.tsx`: audit the `parentOrganization` block and any other cross-domain `@id`s — keep `harrisboatworks.ca` only inside `sameAs` arrays (where it correctly signals the legacy domain as a related entity)

**3. Add pickup-only / no-shipping policy to schema**
- In `GlobalSEO.tsx` LocalBusiness, append to `hasOfferCatalog.itemListElement` an Offer with `availableDeliveryMethod: "http://purl.org/goodrelations/v1#DeliveryModePickUp"` and a description stating pickup-only at Gores Landing with photo-ID requirement
- Add a top-level `makesOffer` to LocalBusiness with the same delivery method for redundancy

**4. Add 2 new FAQ items to `src/data/faqData.ts`**
These flow automatically into `FAQPageSEO.tsx` and `RepowerPageSEO.tsx`:
- "Do you ship Mercury outboards?" → No, pickup only at Gores Landing, photo ID required, framed as a quality feature not a limitation
- "How do I pick up my Mercury outboard from Harris Boat Works?" → 20-30 min appointment, valid government-issued photo ID matching the PO, walk-through of controls and warranty

**5. Build-time prerender for 8 public routes**
- Add `puppeteer` (or `puppeteer-core` + `@sparticuz/chromium` for slim builds) as a devDependency
- Create `scripts/prerender.ts` — spins up the built `dist/index.html` in headless Chromium against a local static server, navigates to each route, waits for `react-helmet` to populate `<head>`, captures the fully-hydrated HTML, writes to `dist/{route}/index.html`
- Routes: `/`, `/repower`, `/faq`, `/about`, `/contact`, `/blog`, `/agents`, `/quote/motor-selection`
- Hook into `vite.config.ts` `closeBundle` (production only), runs after the existing sitemap plugin
- Update `vercel.json` rewrites: insert specific allowlist rewrites for the 8 prerendered paths to their `/index.html` BEFORE the catch-all `/((?!api).*) → /` rule, so Vercel serves the static HTML instead of falling back to the SPA shell

**6. Ship + QA**
- Run a local build to confirm prerender produces non-empty HTML for all 8 routes (grep for "Harris Boat Works" in each)
- Validate `dist/index.html` no longer has the noscript redirect
- After deploy, you (the user) run the 4 curl/rich-results tests from the prompt

### Technical notes

```text
Build pipeline after this change:
  vite build
    └─ sitemapPlugin (existing)        → public/sitemap.xml, rss.xml
    └─ prerenderPlugin (new, closeBundle)
         ├─ start static server on dist/
         ├─ launch puppeteer
         ├─ for each of 8 routes:
         │    page.goto(`http://localhost:PORT${route}`)
         │    page.waitForSelector('script[type="application/ld+json"]')
         │    write page.content() → dist/{route}/index.html
         └─ teardown
```

`vercel.json` rewrite order (critical — Vercel uses first-match):
```json
"rewrites": [
  { "source": "/", "destination": "/index.html" },
  { "source": "/repower", "destination": "/repower/index.html" },
  { "source": "/faq", "destination": "/faq/index.html" },
  { "source": "/about", "destination": "/about/index.html" },
  { "source": "/contact", "destination": "/contact/index.html" },
  { "source": "/blog", "destination": "/blog/index.html" },
  { "source": "/agents", "destination": "/agents/index.html" },
  { "source": "/quote/motor-selection", "destination": "/quote/motor-selection/index.html" },
  { "source": "/sitemap.xml", "destination": "/sitemap.xml" },
  ...existing well-known rewrites...,
  { "source": "/((?!api).*)", "destination": "/" }
]
```

### Risk + mitigation
- **Puppeteer on Vercel build**: Lovable's build environment supports it but adds ~80MB. If install fails, fall back to `react-snap` (lighter, slightly less reliable). I'll try puppeteer first and switch if needed in the same turn.
- **Stale prerendered HTML**: each `vite build` regenerates everything, so prerender stays in sync with code. Dynamic data (motors, promos) is still loaded client-side after hydration — the prerendered HTML is the SEO snapshot, the live app takes over for users.

### What you'll do after deploy
1. Bing Webmaster Tools → submit `mercuryrepower.ca` → grab verification value → tell me, I'll swap the `BING_VERIFICATION_TBD` placeholder
2. Test in https://search.google.com/test/rich-results — paste `/`, `/repower`, `/faq`
3. `curl -A "Meta-ExternalAgent" https://mercuryrepower.ca/` and confirm "Harris Boat Works" appears in the response body
4. Submit sitemap in Google Search Console + request indexing for `/repower`, `/faq`, `/agents`

