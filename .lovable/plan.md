## Phase 3 — Agent CTAs, Event Taxonomy & Local Authority Hubs

The `agent_events` table already exists in the DB (created in a prior migration) but **nothing in the frontend writes to it yet**, and there are no local hub pages. This phase wires both up.

---

### Part A — Unified Agent Event Taxonomy

**1. Tracking helper** — `src/lib/agentEvents.ts` (new)
- Single function `trackAgentEvent({ event_type, source?, motor_id?, motor_hp?, motor_model?, quote_value?, metadata? })`.
- Auto-fills `session_id` (reuses existing `session_id` from localStorage created by `useQuoteActivityTracker`), `user_id` (if logged in), `page_path`.
- Fire-and-forget insert into `public.agent_events` via supabase client (RLS already permits anon insert).
- Detects agent source via `?utm_source=ai` / `?ref=chatgpt` / `?ref=perplexity` / known UA hints → tags `source` field.

**Standardized event_type vocabulary:**
| Event | Fired from |
|---|---|
| `agent_opened` | Chat widget mount + voice agent session start |
| `motor_viewed` | MotorPage.tsx mount |
| `quote_started` | First step of quote builder (motor selected) |
| `quote_generated` | Quote summary page mount with valid pricing |
| `quote_saved` | SaveQuoteDialog success |
| `quote_pdf_downloaded` | PDF generator success |
| `lead_submitted` | Phone capture / save-quote completion |
| `deposit_started` | Stripe checkout redirect |
| `case_study_viewed` | CaseStudyDetail.tsx mount |
| `agent_api_called` | (server) public-quote-api / public-motors-api → already has its own logging, will mirror |

**2. Wiring points** (small surgical inserts):
- `src/components/chat/GlobalAIChat.tsx` → fire `agent_opened` in `openChat()`.
- `src/pages/MotorPage.tsx` → fire `motor_viewed` on load.
- `src/pages/quote/MotorSelectionPage.tsx` → fire `quote_started` on motor pick.
- `src/pages/quote/QuoteSummaryPage.tsx` (or equivalent) → fire `quote_generated`.
- `src/components/auth/SaveQuotePrompt.tsx` + `useAutoSaveQuoteOnAuth.ts` → fire `quote_saved` + `lead_submitted`.
- `src/pages/CaseStudyDetail.tsx` → fire `case_study_viewed`.
- Stripe deposit handler → fire `deposit_started`.

**3. Admin funnel dashboard** — `src/pages/admin/AgentFunnel.tsx` (new, wired in App.tsx)
- Simple table: counts per event_type for last 7d / 30d.
- Source breakdown (chatgpt vs perplexity vs direct vs google).
- Top 10 motors by `motor_viewed`.
- Conversion: `motor_viewed → quote_generated → lead_submitted` ratios.
- Linked from `AdminInventory.tsx` next to the IndexNow control.

---

### Part B — 5 Local Authority Hub Pages

**Routes & target keywords:**
| Slug | H1 | Primary keyword |
|---|---|---|
| `/locations/peterborough-mercury-dealer` | Mercury Outboards & Repower in Peterborough, ON | "mercury dealer peterborough" |
| `/locations/kawartha-lakes-mercury-outboards` | Mercury Outboards for the Kawartha Lakes | "kawartha lakes outboard motor" |
| `/locations/rice-lake-mercury-repower` | Rice Lake Mercury Repower Specialists | "rice lake outboard repower" |
| `/locations/cobourg-northumberland-mercury` | Mercury Sales & Service — Cobourg & Northumberland | "cobourg outboard motor" |
| `/locations/durham-gta-mercury-pickup` | Mercury Outboard Pickup for Durham & GTA | "mercury outboard durham" |

**Implementation:**
1. **Data file** — `src/data/locations.ts` with structured entries (slug, region, intro, drive time from Gores Landing, popular boat types, top 3 recommended motors, local landmark photo path, JSON-LD `LocalBusiness` + `Service` schema).
2. **Page component** — `src/pages/LocationDetail.tsx` (one component, slug-driven). Renders:
   - Hero with region + drive time + "Pickup at Gores Landing"
   - Why Harris Boat Works for [Region] (real proof: since 1947, Mercury since 1965)
   - Popular boat types in that region → motor recommendations linked to `/quote/motor-selection?motor=...`
   - Embedded case study cards filtered by region tag
   - FAQ block tailored per location (3 Qs)
   - JSON-LD: `LocalBusiness` + `BreadcrumbList` + `FAQPage`
   - **Strict pickup-only language** (per memory: no delivery promises)
3. **Index page** — `src/pages/Locations.tsx` listing all 5 with map.
4. **Routes** added in `src/App.tsx`: `/locations` and `/locations/:slug` (lazy-loaded).
5. **Sitemap** — extend `src/utils/generateSitemap.ts` to include `/locations` + 5 detail URLs with `priority: 0.7`.
6. **Cross-linking** — add "Service Area" links from `Index.tsx` footer + `Contact.tsx` to relevant location pages, and from each location page back to relevant case studies.
7. **Tag case studies** — add optional `regions: string[]` field to `caseStudies.ts` so location pages can pull matching ones.

---

### Part C — Strategic guardrails (per memory)

- Never recommend Verado proactively (special-order only).
- All pricing CAD, no USD.
- "Pickup Only" language strictly enforced in location copy — no transport/delivery offers.
- Financing minimums respected ($5k threshold) where mentioned.
- Each location page declares Harris Boat Works as the legal entity, mercuryrepower.ca as the source.

---

### What this delivers

- **Measurable agent funnel**: you'll see how many AI-referred sessions convert to quotes vs leads vs deposits.
- **Local SEO authority**: 5 schema-rich pages targeting high-intent regional terms.
- **Internal linking graph**: case studies ↔ locations ↔ motors ↔ quote builder — the "agent-readable spine" pattern.
- **Admin visibility**: new `/admin/agent-funnel` page so you can spot trends.

---

### Out of scope (defer)

- Google Business Profile syncing (manual).
- Real customer reviews import (needs API connector).
- Multilingual versions of location pages (FR/ZH) — can fork later.

---

**On approval I'll:**
1. Create `agentEvents.ts` helper + wire 8 fire points.
2. Create `locations.ts` data + `LocationDetail.tsx` + `Locations.tsx` + register routes.
3. Add `regions` tags to existing case studies.
4. Create `AdminAgentFunnel.tsx` and link from `AdminInventory.tsx`.
5. Extend sitemap.
6. Verify with `tsc --noEmit`.