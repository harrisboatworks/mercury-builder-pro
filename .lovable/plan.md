

## Replace JSON-LD on Home, About, and Contact pages

Three SEO components hold the existing `<script type="application/ld+json">` blocks. Per your instructions, I will **replace** the `structuredData` object in each — no merging, no second block — keeping the existing `Helmet` / meta / og / twitter tags intact.

### Files changed

| Page | File | What changes |
|---|---|---|
| `/` | `src/components/seo/GlobalSEO.tsx` | Replace the entire `structuredData` `@graph` (currently 4 nodes: Organization, LocalBusiness, WebSite, second Organization) with the new 5-node graph (WebSite, WebPage, Organization, LocalBusiness+Store+AutoRepair, Service). Keep the `hreflang` `<link>` tags and the `Helmet` wrapper. |
| `/about` | `src/components/seo/AboutPageSEO.tsx` | Replace `structuredData` with the new 2-node graph (AboutPage, Organization). Keep `<title>`, `<meta>`, OG, Twitter, canonical. |
| `/contact` | `src/components/seo/ContactPageSEO.tsx` | Replace `structuredData` with the new 2-node graph (ContactPage, LocalBusiness+Store+AutoRepair with two ContactPoints). Keep `<title>`, `<meta>`, OG, Twitter, canonical. |

JSON is pasted exactly as provided in `lovable-schema-prompt-2.md` — same `@id`s, same URLs, same fields, same casing. `SITE_URL` is not used; the new schema hardcodes `https://mercuryrepower.ca` per your spec.

### Things you should know before I ship

1. **You're trading away some signals on the home page.** The current `GlobalSEO` graph includes `aggregateRating` (4.9 / 127 reviews), `openingHoursSpecification`, a 12-item `hasOfferCatalog`, and a `WebSite.potentialAction` SearchAction. The new graph drops all of those in favor of a leaner, cleaner Organization + LocalBusiness + Service shape. Your instruction says "replace, do not merge" — confirming I'll do exactly that. If you'd rather keep the rating + hours + offer catalog and merge them in, say so before approval.

2. **Logo URL.** New schema points to `https://www.harrisboatworks.ca/logo.png`. The current code points to `${SITE_URL}/assets/harris-logo-black.png`. I'll use the new path verbatim. The TODO at the bottom of your prompt acknowledges this — flagging so you can confirm `harrisboatworks.ca/logo.png` actually resolves.

3. **Geo coordinates differ.** New: `44.1122, -78.0245`. Existing: `44.1456, -78.2542` (GlobalSEO) and `44.1167, -78.2500` (About/Contact). I'll use the new ones as instructed; your prompt notes they're approximate.

4. **No opening hours.** New schema intentionally omits hours (seasonal). Existing About + Contact hardcode Mon–Fri 8–5, Sat 9–2. Those will be removed. Confirming this is intentional per your prompt.

5. **Out of scope, but worth noting.** `AboutPageSEO.tsx` still has a `FAQPage` block that mentions `Verado` in an answer (line 163). Your new schema for About drops the FAQPage entirely, so this gets removed as a side effect — which actually aligns with the Verado exclusion memory. Net positive.

### Deploy

Commit pushes to GitHub `harrisboatworks/mercury-builder-pro`; Vercel auto-deploys. After deploy, verify each page with the Rich Results Test:
- `https://mercuryrepower.ca/`
- `https://mercuryrepower.ca/about`
- `https://mercuryrepower.ca/contact`

Then re-submit the home URL in GSC → URL Inspection → Request Indexing.

