## Goal
Fix the 5 outstanding SEO/AI issues with stronger build-time and post-deploy safeguards so a broken deploy cannot pass silently.

---

### Priority 1 — Per-motor prerendered pages (`/motors/{slug}`)

**Source of truth**: Load motor list from the **public motors API** (`https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/public-motors-api`) inside `scripts/static-prerender.mjs`. This is already public, requires no key, and matches what AI agents see.

- Fallback to Supabase only if the API fails. If falling back, require `VITE_SUPABASE_PUBLISHABLE_KEY` (or `SUPABASE_PUBLISHABLE_KEY`) and **fail the build loudly** if missing.
- For each motor, prerender `dist/motors/{slug}/index.html` containing:
  - Unique `<title>`, `<meta name="description">`, `<link rel="canonical" href="https://www.mercuryrepower.ca/motors/{slug}">`
  - `og:title`, `og:description`, `og:url`, `twitter:card`
  - JSON-LD **Product** + **Offer** with: `brand: "Mercury"`, `name` (modelDisplay), `mpn` (modelNumber), `category` (family), `additionalProperty` (horsepower), `priceCurrency: "CAD"`, `price`, `availability`, `url`
  - **Image policy (safeguard #3)**: only include `image` in Product schema and `og:image` if `imageUrl` is non-null AND points to a verified Mercury/Harris asset. If null → omit `image` entirely. Never synthesize or guess an image URL.
  - Visible static `<noscript>` block with H1, spec list, semantic `<table>` of specs, and a CTA link to `/quote/motor-selection?motor={slug}`.
- Update `vercel.json` rewrites so `/motors/:slug` serves `/motors/:slug/index.html` *before* the SPA catch-all.
- Update `scripts/generate-sitemap.ts` to include every motor URL from the same API source.

---

### Priority 2 — Verado policy: single source of truth

Decision: **keep "Verado is special-order only"** (matches existing memory `mem://ai-safety/product-exclusion-verado-v2`).

- Edit `supabase/functions/public-motors-api/index.ts` `notice` field — remove the line "We do not sell or service Mercury Verado." Replace with: *"Mercury Verado is special-order only and not in the default inventory feed. Contact us by phone or email for Verado quotes."*
- Verify `llms.txt`, `brand.json`, `mcp.json`, `ai.txt` all use the same special-order language. No file may contradict another.

---

### Priority 3 — Clean `/.well-known/ai.txt`

- Remove the entire `multilingual_content:` block (the `/fr`, `/zh`, `/blog/fr/...`, `/blog/zh/...` entries) — those routes are not in the live sitemap.
- Add `last_updated: 2026-04-25`.
- Keep: pickup-only, CAD, Ontario, Mercury dealer since 1965, Legend dealer, no Sunday hours.

---

### Priority 4 — Real semantic `<table>` elements in prerendered HTML

For each of the 6 routes below, inject an actual `<table>` (not div grid) into the prerender `extraNoscript` block AND make sure the React component also renders a real `<table>` so the DOM matches:

- `/repower` — HP tier vs install cost range vs typical boat size
- `/mercury-outboards-ontario` — Series vs HP range vs CAD MSRP range vs best use
- `/mercury-pontoon-outboards` — Pontoon length vs recommended HP vs Command Thrust required
- `/blog/mercury-repower-cost-ontario-2026-cad` — HP vs motor price vs install vs total CAD
- `/blog/cheapest-mercury-outboard-canada-2026` — Model vs HP vs MSRP vs sale price CAD
- `/blog/mercury-115-vs-150-hp-outboard-ontario` — Spec/feature vs 115 vs 150 comparison

Tables use `<thead>`, `<tbody>`, `<th scope="col">`, `<caption>` for accessibility + LLM extraction.

---

### Priority 5 — Hardened build verification (safeguard #1)

At the end of `scripts/static-prerender.mjs`, run these checks. **Any failure throws and aborts the build** (non-zero exit so Vercel shows it as failed):

1. **Hard guard**: `if (motorPageRoutes.length === 0) throw new Error('No motor routes generated — refusing to ship empty SEO')`.
2. **API parity**: assert `motorPageRoutes.length === motorsLoadedFromApi.length` (no silent dropouts).
3. **Sitemap motor count**: parse `dist/sitemap.xml`, assert it contains a `/motors/` URL for **every** loaded motor (not just `>=` motorPageRoutes — exact match).
4. **Sample page integrity**: read `dist/motors/fourstroke-9-9hp-9-9eh-fourstroke/index.html` (or first slug if naming differs) and assert it contains:
   - its own non-homepage `<title>`
   - `<link rel="canonical" href="https://www.mercuryrepower.ca/motors/...">` (NOT the bare homepage)
   - `"@type":"Product"` and `"@type":"Offer"` JSON-LD
   - `"priceCurrency":"CAD"`
5. **Verado policy consistency**: scan `dist/llms.txt`, `dist/.well-known/brand.json`, `dist/.well-known/mcp.json`, `dist/.well-known/ai.txt` for any "do not sell" / "do not service" Verado phrase → fail if found. Confirm "special-order" appears in all four.
6. **ai.txt cleanup**: assert `dist/.well-known/ai.txt` does NOT contain `/fr`, `/zh`, or `multilingual_content`.
7. **Semantic tables**: for each of the 6 SEO pages above, assert `dist/{route}/index.html` contains at least one `<table>` tag with `<thead>` and `<tbody>`.

---

### Post-deploy verification (safeguard #4)

After Vercel deploy completes, fetch the **live production URLs** (not just `dist/`) and verify:

- `curl https://www.mercuryrepower.ca/sitemap.xml | grep -c '/motors/'` → equals motor count from API (~29)
- `curl https://www.mercuryrepower.ca/motors/fourstroke-9-9hp-9-9eh-fourstroke` → has its own `<title>`, canonical to itself (NOT to `https://www.mercuryrepower.ca/`), Product+Offer JSON-LD
- `curl https://www.mercuryrepower.ca/.well-known/ai.txt` → no `/fr`, `/zh`, or `multilingual_content`; has `last_updated: 2026-04-25`
- Verado policy strings match across all 4 discovery files + the public-motors-api `notice`
- Each of the 6 SEO pages returns raw HTML containing real `<table>` markup

I'll report each check with a pass/fail line after deploy.

---

### Files to edit

- `scripts/static-prerender.mjs` — API loader, motor prerender, hardened verification, table noscript blocks
- `scripts/generate-sitemap.ts` — pull from public API
- `vercel.json` — explicit `/motors/:slug` rewrite ahead of catch-all
- `supabase/functions/public-motors-api/index.ts` — fix Verado notice
- `public/.well-known/ai.txt` — drop multilingual block, add last_updated
- `src/pages/Repower.tsx` — replace HP grid with `<table>`
- `src/pages/landing/MercuryOutboardsOntario.tsx` — replace pricing grid with `<table>`
- `src/pages/landing/MercuryPontoonOutboards.tsx` — pontoon sizing `<table>`
- `src/data/blogArticles.ts` — ensure 3 blog articles render real markdown/HTML tables (not just text)

Approve and I'll execute.