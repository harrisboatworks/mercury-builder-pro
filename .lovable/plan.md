
# Agent-Ready Roadmap for mercuryrepower.ca

Codex's strategic direction is right, but firing his "do everything" prompt at once would produce shallow work. Here's a sequenced version that reflects what's *already built* vs. what's actually missing.

## Audit summary

**Already in place** (don't redo):
- All `.well-known/` discovery files (mcp.json, ai.txt, brand.json)
- llms.txt, sitemap.xml, robots.txt with full AI crawler allowlist
- `public-motors-api`, `public-quote-api`, `agent-mcp-server`, `agent-quote-api` edge functions
- `/agents` hub page documenting endpoints
- 78 blog articles + 4 articles now using real photos uploaded yesterday

**Missing — what these 3 phases will add:**
- Real "case studies" content surface using the photos
- IndexNow integration for fast freshness pings
- Unified agent-event taxonomy + CTA placement
- Local authority hub pages
- Cross-link audit from harrisboatworks.ca

---

## Phase 1 — Proof & Case Studies (highest ROI, builds the moat)

**Why first:** AI content is everywhere. Real local proof is what AI engines and humans both can't fake. You already have the photos sitting in `public/lovable-uploads/`.

**Scope:**
1. Create `src/data/caseStudies.ts` with structured type (id, slug, scenario, beforeMotor, afterMotor, hpJump, boatType, region, heroImage, detailImage, customerQuote, isIllustrative).
2. Seed with 5 entries matching the shot-list from yesterday:
   - CS01 Aluminum Fishing 60→90
   - CS02 Pontoon Family 40→115 CT
   - CS03 Bass Boat 150 2-stroke→Pro XS
   - CS04 Cedar-Strip 9.9 FourStroke
   - CS05 Walkaround Cuddy 90→115 EFI
   - For the 4 that have real photos, set `isIllustrative: false` and wire the existing `*-real.png` files. CS04 stays `isIllustrative: true` until cedar-strip photos arrive.
3. Build `/case-studies` index page + `/case-studies/[slug]` detail page with structured data (`Article` + `Product` schema).
4. Add "Get a quote like this" CTA on each detail page that deep-links to `/quote?prefill=cs01` (motor + HP pre-selected).
5. Add case-study links into the 4 already-updated blog articles ("See a real example: [CS link]").
6. Add `/case-studies/sitemap.xml` and include in main sitemap.
7. Add a `CreativeWork` JSON-LD entry per case study so AI engines can cite them.

**Files touched:** `src/data/caseStudies.ts` (new), `src/pages/CaseStudies.tsx` (new), `src/pages/CaseStudyDetail.tsx` (new), `src/App.tsx` (routes), `src/data/blogArticles.ts` (add cross-links), `public/sitemap.xml`.

**Out of scope:** writing new blog posts, redesigning the homepage.

---

## Phase 2 — Freshness Signals & IndexNow

**Why second:** Once you have new content (case studies), you want AI engines and Bing to pick it up in hours, not weeks.

**Scope:**
1. Generate an IndexNow API key (random 32-char hex), commit it as `public/{key}.txt` containing the key string itself (per IndexNow spec).
2. Add the key to `public/robots.txt` as a comment for visibility.
3. Create `supabase/functions/indexnow-ping/index.ts` that accepts an array of URLs and POSTs them to `api.indexnow.org/indexnow` with the host + key.
4. Auto-trigger the ping from:
   - Sitemap regeneration (when motors/promos/case studies change)
   - New case study published
   - Blog article published
5. Add an admin button in `AdminInventory.tsx` to manually re-ping all key URLs.
6. Add a daily cron job (`pg_cron`) that re-pings the homepage + sitemap so engines see a fresh `lastmod`.
7. Verify GPTBot, ClaudeBot, PerplexityBot are reaching the site (check edge function logs after deploy; add a lightweight `crawler-log` table if useful).

**Files touched:** `supabase/functions/indexnow-ping/` (new), `public/{indexnow-key}.txt` (new), `src/pages/AdminInventory.tsx` (admin button), one DB migration for cron job.

**Out of scope:** Bing Webmaster Tools account setup (manual), Google Search Console (manual).

---

## Phase 3 — Agent CTAs, Event Taxonomy, Local Hubs

**Why third:** With proof content + freshness in place, this phase is about conversion plumbing and local authority — the slower-burn items.

**Scope:**
1. **Unified agent-event taxonomy** in `agent_events` table — wire these events from the right components:
   - `agent_opened` — when AI chat or voice opens
   - `quote_generated` — when summary page loads with a complete quote
   - `quote_saved` — already partly wired, audit it
   - `lead_submitted` — contact form, save-quote dialog, financing app
   - `deposit_started` — Stripe checkout begins
   - `case_study_viewed` — new
2. **CTA audit** — make sure every motor page, every blog article, and every case study has at least one path into the quote agent. Add `<QuoteAgentCTA motor={...} />` reusable component.
3. **Local authority hubs** — 5 pages, lightweight but high-quality:
   - `/locations/peterborough-mercury-dealer`
   - `/locations/kawarthas-outboard-repower`
   - `/locations/rice-lake-mercury-service`
   - `/locations/cobourg-northumberland-marine`
   - `/locations/durham-gta-mercury`
   - Each with: real local landmarks, distance from Gores Landing, Google reviews snippet, LocalBusiness schema with `areaServed`, link to inventory + quote agent. NOT thin doorway pages — write 600-800 real words each.
4. **Cross-link audit document** — produce a markdown checklist (not code) of which harrisboatworks.ca URLs should link to which mercuryrepower.ca URLs, for the user's manual update on the legacy site.

**Files touched:** `src/components/QuoteAgentCTA.tsx` (new), `src/pages/locations/*.tsx` (5 new), `src/hooks/useAgentEvents.ts` (new), audit + wire-up across ~6-8 existing components, `/mnt/documents/cross-link-audit.md` artifact.

**Out of scope:** harrisboatworks.ca actual edits (different repo), Google Business Profile updates (manual).

---

## What I am NOT doing

- I'm not blindly re-running Codex's mega-prompt. Half of what it asks for is already built (mcp.json, brand.json, public APIs, /agents hub).
- I'm not adding more `.well-known/` files — coverage is already complete.
- I'm not generating fake case studies, fake reviews, or stock-photo "before/after" shots. Phase 1 only uses real photos you've delivered; CS04 (cedar-strip) stays flagged `isIllustrative: true` until you provide photos.
- I'm not building 20 blog posts. You have 78. The gap is *proof and conversion paths*, not more articles.

---

## Recommended order & how to approve

Approve **Phase 1 only** first. It's the highest-ROI, uses assets already on disk, and doesn't depend on the other two. Once it's live, approve Phase 2 (freshness pings the new content). Phase 3 can wait until you see Phase 1 + 2 driving traffic.

If you want to compress, Phase 1 + Phase 2 together is reasonable in one Lovable session. Phase 3 should always be its own session — it touches too many files.

Tell me which phase(s) you want to run and I'll switch out of plan mode and execute.
