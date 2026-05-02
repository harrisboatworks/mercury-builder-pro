## Goal

Add an agent-friendly `/pricing-reference.md` generated from the same live data source the quote builder uses (`public-motors-api`), strengthen explicit negative service definitions in `catalog.md` and `llms.txt`, and confirm there are no stale duplicate markdown artifacts.

## Findings from exploration

- Markdown twins are generated at build time by `scripts/generate-markdown-twins.mjs` (wired into `package.json` `build` script before `vite build`).
- That script already loads motors via `loadMotors()` → `https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/public-motors-api` (the same public source the quote builder uses), with a Supabase fallback. Verado is filtered out, matching "curated quote-builder/listed motors only".
- The script already wipes and regenerates `public/motors`, `public/case-studies`, `public/locations`, `public/blog`, and `public/catalog.md` on every build — so there is no risk of stale ` 2.md` / ` 3.md` artifacts being kept around.
- Audit ran: `find public -name "* 2.md" -o -name "* 3.md" -o -name "* [0-9].md" -o -name "*copy*.md"` → **zero hits**. Nothing to delete.
- `public/llms.txt` and `public/catalog.md` already mention "pickup only" and Verado-special-order, but do not have a single explicit, scannable "What we do NOT do" block. We will add one to both.

## Changes

### 1. Extend `scripts/generate-markdown-twins.mjs`

- Add a new `pricingReferenceMarkdown(motorRecords)` function. Build it from the **same `motorRecords` array** already loaded for motor twins (so it stays in lockstep with the quote builder's data source). Filter out Verado just like motor twins do.
- For each curated/listed motor, include: model display, Mercury family, HP, model number, shaft / control notes (when present in API), in-stock vs special-order status, selling price in CAD (using `resolveMotorSellingPrice`), MSRP if higher than selling, motor twin link `/motors/{slug}.md`, and quote-builder deep link `/quote/motor-selection?motor={id}`.
- Group output by family (FourStroke, Pro XS, SeaPro), then by HP ascending. Render as a markdown table per family for fast LLM scanning.
- Write to `public/pricing-reference.md`. Frontmatter: canonical `https://www.mercuryrepower.ca/pricing-reference.md`, `last_updated`, `currency: CAD`, `pickup_only: true`, `delivery_offered: false`, `verado_status: special-order only`, `data_source: public-motors-api (same source as /quote/motor-selection)`, `index_type: pricing_reference`.
- Add a "What is NOT in this reference" section: Verado (special order), sterndrives (not sold on this site), used motors, parts/accessories.
- Add a `verifyPublicMd('/pricing-reference.md', ...)` call covering: `currency: CAD`, `pickup_only: true`, `## FourStroke`, `## Pro XS`, and the negative-definitions block.
- Refuse-empty guard: throw if zero priced motors were found.

### 2. Update `catalogMarkdown(...)` in the same script

- Add an explicit "What we do NOT offer" bullet block after the existing "Business rules" section, with these exact items:
  - Pickup only at Gores Landing, ON — no delivery, no shipping of outboards.
  - No mobile service, no on-site installs, no dock/marina/driveway visits.
  - No sterndrives sold on mercuryrepower.ca (outboards only).
  - Verado is special order only — not part of default inventory and not actively promoted.
  - No non-Mercury outboards (no Yamaha / Honda / Suzuki / Tohatsu).
- Add a new top-level link to `/pricing-reference.md` under a "## Pricing reference" section, positioned right after "## Public quote API".

### 3. Update `public/llms.txt` (hand-edited file, not script-generated)

- Add a new section **"What we do NOT offer (negative definitions)"** with the same 5 bullets as above, near the top so agents see it before product lists.
- Add `/pricing-reference.md` to the "Markdown twins for AI agents" section as: `Pricing reference (curated, listed motors only): https://www.mercuryrepower.ca/pricing-reference.md`.
- Keep all other content untouched (REST API URLs, MCP info, contact, etc.).

### 4. Duplicate-artifact audit

- Already verified clean. Add a one-line note to the script header comment: "This generator wipes the target dirs before each run; no ` 2.md` / ` 3.md` duplicates can persist."
- No files to delete.

## Explicitly NOT touched

- `src/pages/quote/*` and the motor selection flow.
- Pricing logic (`src/lib/pricing.ts`, `useQuoteRunningTotal`, `build-accessory-breakdown`).
- Inventory filters, motor data tables, Supabase schema, edge functions, cron jobs, auth.
- No new regional pages, no new per-motor pages.
- No changes to existing motor / case-study / location / blog twin formats.

## Files changed

- `scripts/generate-markdown-twins.mjs` — add pricing-reference generator + extend catalog content.
- `public/llms.txt` — add negative-definitions section + pricing-reference link.

## Files created (at build time)

- `public/pricing-reference.md`

## Verification (will be reported after implementation)

- `public/pricing-reference.md` exists, has CAD prices, lists only curated/listed motors, excludes Verado.
- `public/catalog.md` includes the pricing-reference link and the explicit "What we do NOT offer" block.
- `public/llms.txt` includes the same negative-definitions block and the pricing-reference link.
- `find public -name "* [0-9].md"` returns empty.
- `/quote/motor-selection`, pricing logic, inventory filters, Supabase, and cron are untouched (diff scope is limited to the two files above).
