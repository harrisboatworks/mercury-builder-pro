## Audit: current state

Two parallel "location" systems exist today and they are inconsistent:

1. **Data-driven hub** (`/locations` + `/locations/:slug`)
   - Source: `src/data/locations.ts` (5 entries: peterborough, kawartha-lakes, rice-lake, cobourg-northumberland, durham-gta)
   - Renderer: `src/pages/LocationDetail.tsx` (clean, has `LocalBusiness` + `FAQPage` JSON-LD)
   - Auto-included in sitemap (`src/utils/generateSitemap.ts`)
   - Auto-emits markdown twins to `public/locations/*.md` via `scripts/generate-markdown-twins.mjs`
   - Auto-prerendered by `scripts/static-prerender.mjs`
   - Quality of copy: thin/generic for Peterborough, Kawartha, Cobourg, Durham/GTA. Only Rice Lake reads premium.
   - Some FAQ wording on Cobourg ("Is pickup at the coast?") is awkward.

2. **Hand-built landing pages** (`/mercury-dealer-peterborough`, `/mercury-dealer-cobourg`, `/mercury-dealer-gta`)
   - One bespoke `.tsx` + matching `*SEO.tsx` per page
   - Premium design, FAQ accordion, factbox, JSON-LD
   - Not in `/locations` hub, duplicates Peterborough/Cobourg/GTA topics → competing URLs

**Problems**
- Two systems cover the same cities with different URLs → keyword cannibalization, AI-citation confusion.
- The data-driven hub is the right scaling model but its content is too thin to be premium.
- No coverage at all for Whitby, Ajax, Oshawa, Pickering, Bowmanville/Courtice — the core Durham cities the old HarrisBoatWorks.ca pages ranked for.
- No clear policy in the schema about "we do NOT come to your city" — risky for AI summaries.
- `caseStudies.heroImage` is referenced in sitemap but field name should be verified; not blocking.

---

## Proposed URL structure

**Single canonical system** = the data-driven `/locations/:slug` hub. The hand-built `/mercury-dealer-*` pages stay live but become 301-style React redirects to the new canonical `/locations/...` slugs (handled with `<Navigate>`), so existing AI citations don't break.

Canonical slug convention: `/locations/{city-or-region}-mercury-{intent}` where intent is one of `dealer`, `repower`, `pickup`, `outboards`.

```text
/locations                                      (hub index — already exists)
/locations/rice-lake-mercury-repower            (exists, premium — keep)
/locations/peterborough-mercury-dealer          (exists — rewrite premium)
/locations/cobourg-northumberland-mercury       (exists — rewrite + rename to cobourg-mercury-dealer; keep old slug as redirect)
/locations/kawartha-lakes-mercury-outboards     (exists — rewrite premium)
/locations/durham-gta-mercury-pickup            (exists — rewrite as regional hub)

# NEW Durham-region city pages (priority for old HBW.ca parity)
/locations/whitby-mercury-dealer
/locations/ajax-mercury-dealer
/locations/oshawa-mercury-dealer
/locations/pickering-mercury-dealer
/locations/bowmanville-courtice-mercury-dealer

# NEW GTA umbrella
/locations/gta-mercury-outboards               (regional — links to each Durham city)
```

Redirects (kept for backlinks / AI memory):
- `/mercury-dealer-peterborough` → `/locations/peterborough-mercury-dealer`
- `/mercury-dealer-cobourg` → `/locations/cobourg-northumberland-mercury`
- `/mercury-dealer-gta` → `/locations/gta-mercury-outboards`
- `/mercury-outboards-whitby` (if anyone hits it from old HBW backlinks) → `/locations/whitby-mercury-dealer`

---

## Upgraded data model

Extend `src/data/locations.ts` `LocationPageData` so every page has the same premium fields. Markdown twin + JSON-LD generators read from this — no per-city bespoke React components needed.

```ts
export interface LocationPageData {
  slug: string;
  title: string;                  // <title> + H1
  metaDescription: string;        // <meta name="description">
  region: string;                 // "Whitby", "Durham & GTA", etc
  regionType: 'city' | 'region';
  keyword: string;
  driveTime: string;              // "about 75 minutes from Gores Landing via 401"
  driveRoute?: string;            // "401 East → Cobourg → County Rd 18"
  intro: string;                  // 2–3 sentence premium intro
  localContext: string[];         // bullet facts about local boating (lakes, marinas they boat from, NOT services we deliver there)
  popularBoats: string[];
  popularHpRanges: string[];      // e.g. ["9.9–25 HP kicker", "60–90 HP fishing", "115–150 HP family"]
  whyChooseUs: string[];          // trust facts (since 1947, Platinum since 1965, CAD pricing, lake-tested)
  recommendedLinks: { label: string; href: string }[];
  relatedCaseStudySlugs?: string[]; // explicit pin instead of fuzzy match
  faqs: { question: string; answer: string }[];
  // Strict policy block — rendered verbatim and used in schema description
  pickupPolicy: string;           // canonical sentence about pickup-only at Gores Landing
  serviceBoundary: string;        // canonical "we do NOT travel to {city}" disclaimer, phrased politely
}
```

---

## Wording rules baked into the template

The `LocationDetail.tsx` component will render two fixed banners on every page so we cannot accidentally imply mobile service:

1. **Pickup policy banner** (already exists, keep):
   > Pickup only at 5369 Harris Boat Works Rd, Gores Landing, ON. We do not deliver or ship outboards.

2. **Service boundary banner** (NEW):
   > Harris Boat Works does not perform mobile service, on-site installs, or driveway/marina visits in {city}. Customers from {city} bring their boat to our Gores Landing shop, or pick up a loose Mercury motor for self-install.

All copy in `localContext`, `whyChooseUs`, `intro`, and `faqs` will use approved phrasing only:
- "serving buyers from Whitby"
- "customers from Oshawa can build a quote online"
- "pickup and installation are handled at Harris Boat Works in Gores Landing"
- "bring the boat to our Gores Landing shop"

Forbidden phrases (added as a build-time lint in `generate-markdown-twins.mjs` so future edits can't reintroduce them):
- "we service {city}", "mobile service", "on-site repower", "in your driveway", "at your marina", "delivery to", "we come to", "ship to"

---

## Schema upgrades on each page

`LocationDetail.tsx` will emit a richer `@graph`:

1. `LocalBusiness` — Harris Boat Works (real address = Gores Landing; `areaServed` lists the region/city as a *sales catchment*, not a service area).
2. `Service` — name = "Mercury Outboard Sales & Repower", `serviceType: "Sales"`, `availableAtOrFrom` = the Gores Landing PostalAddress, `areaServed` = the city, `provider.@id` points to the LocalBusiness. Explicitly **omit** `ServiceArea` for "service calls" — this prevents AI from inferring mobile service.
3. `WebPage` with `breadcrumb` BreadcrumbList → Home › Service Areas › {City}.
4. `FAQPage` from `faqs[]`.
5. `Place` for the city (with name + containedInPlace = Ontario) so AI knows the city we mean.

---

## Markdown twin upgrades

`scripts/generate-markdown-twins.mjs` `locationMarkdown()` will be extended to emit the new fields (drive route, popular HP ranges, why-choose, service boundary line, related case studies). Frontmatter gains:

```yaml
service_area_type: sales-catchment
mobile_service_offered: false
on_site_install_offered: false
delivery_offered: false
```

These flags are explicit signals AI scrapers can read.

---

## Sitemap

Already auto-pulls from `locations[]`, so adding 6 new entries (Whitby, Ajax, Oshawa, Pickering, Bowmanville-Courtice, GTA umbrella) automatically inserts them. No code change needed beyond data.

---

## Implementation steps

1. **Extend types & banners**: update `LocationPageData`, rewrite `LocationDetail.tsx` to render the new sections (factbox, drive route, popular HP, why-choose, service boundary banner, richer schema graph).
2. **Rewrite existing 5 entries** in `src/data/locations.ts` to populate the new fields with premium, factual copy. Cobourg FAQ "Is pickup at the coast?" gets fixed.
3. **Add 6 new entries**: Whitby, Ajax, Oshawa, Pickering, Bowmanville/Courtice, GTA umbrella. Each gets distinct intro / drive route / local lakes referenced (e.g., Whitby boaters often launch on Lake Ontario, Scugog, Simcoe; Bowmanville near Rice Lake/Scugog access). No duplicated paragraphs across cities.
4. **Add redirects** in `src/App.tsx` from the 3 old `/mercury-dealer-*` routes and `/mercury-outboards-whitby` to the new `/locations/...` canonicals using `<Navigate replace>`. The bespoke `MercuryDealerPeterborough.tsx` / `MercuryDealerCobourg.tsx` / `MercuryDealerGTA.tsx` files stay in repo but unmount from routes (or are kept as the redirect target's source — we'll just unmount and remove the routes).
5. **Update `Locations.tsx`** hub to group cards by region (Northumberland & Kawarthas / Durham / GTA umbrella).
6. **Markdown twin script**: extend `locationMarkdown()` for new fields + add the forbidden-phrases lint that throws if any twin contains banned wording.
7. **Sitemap**: no code change — verifies the 6 new URLs appear after `npm run` build.
8. **Static prerender**: `scripts/static-prerender.mjs` already iterates `locations[]` for `locationDetailSchema` — extend that schema function to emit the new `Service` + `Place` nodes.
9. **QA**: visit each new route in preview, confirm copy reads premium and schema validates, confirm `/quote/motor-selection` is unchanged.

---

## Out of scope (explicitly not touched)

- `/quote/motor-selection` and the entire quote builder
- Pricing logic, inventory rules, motor filters
- Verado / SeaPro recommendations
- No mention of sterndrives anywhere
- No new edge functions or DB changes

---

## Deliverable summary

One canonical, premium, scalable location system at `/locations/:slug` with 11 pages (5 rewritten + 6 new), strict "no mobile service" wording enforced by template + lint, full JSON-LD graph including a `Service` node that signals sales-only, markdown twins, and sitemap inclusion. Old `/mercury-dealer-*` URLs preserved via redirects so existing AI citations still resolve.
