# Full Site Audit — mercuryrepower.ca

**Handoff for Codex review**  
**Date:** 2026-08-15  
**Current ownership refresh:** 2026-08-30 against `origin/main` `61864aa3`
**Auditor:** Cursor Cloud Agent (code + live-site read, no production writes)  
**Repo:** `harrisboatworks/mercury-builder-pro`  
**Live origin:** https://www.mercuryrepower.ca  
**Lovable project:** https://lovable.dev/projects/bc5f0a45-f6d8-495a-8ac7-81047b4a4121  
**Constraint for this document:** audit only. This PR adds and corrects the report. It does not change product code, pricing, inventory, auth, Edge Functions, cron, or MCP contracts.

---

## 0. How Codex should use this

This is a review brief, not a punch list to blindly implement.

1. Treat **Section 2 (do not regress)** as hard constraints.
2. Treat **Section 0.1 (ownership)** before Section 5. Do not re-implement work already owned on another draft PR.
3. Treat **Section 5 (P0/P1)** as historical evidence plus the current ownership refresh below. Confirm each finding against current `main` before coding. Several original P0s were reclassified on 2026-08-15, and their owner lanes changed again by 2026-08-30.
4. Ask Jay before anything in **Section 8 (business decisions)** or **Section 0.1 JAY DECISION REQUIRED**.
5. Prefer the smallest safe change. Do not start a rewrite of `blogArticles.ts`, the quote funnel, or the prebuild pipeline unless Jay explicitly scopes it.
6. After any change, run the relevant existing contract tests listed in Section 10. Do not invent a new test framework.
7. Do not treat stale reports, old promotion copy, or archived plans as current findings without cache-busted production verification.

---

## 0.1 Execution-order ownership (refreshed 2026-08-30)

Re-inspected against current `origin/main` (`61864aa3`) and the exact PR state/diffs. PR #314 is closed and unmerged. PR #315 is still based on the exact #314 head rather than `main`, so it is not a merge-ready current-main owner until it is retargeted/refreshed. Merged PRs #331 and #333 changed two findings that this audit originally called unowned. PR #335 is the verified current-main successor for the safe route/header subset of #314.

### ALREADY OWNED — do not duplicate

| PR | Exact overlap | Current status |
| --- | --- | --- |
| **#300** | `send-notification` trust boundary: service-role/internal caller gate, payload policy, and tests | Open, ready, current-main, and clean. Do not re-auth that function here. |
| **#335** | `/admin/blog` UI authorization plus safe baseline response headers | Open, ready, current-main, and clean. This supersedes the safe #314 subset. `/admin/blog` remains defense-in-depth; the baseline headers remain hardening, not a demonstrated exploit. |
| **#315** | Dropbox OAuth/import/config plus quote-email hardening | Open draft, but still stacked on closed/unmerged #314. Preserve the lane, but do not treat it as merge-ready or duplicate its work; refresh it onto current `main` first. |
| **#290** | Shared-quote data minimization, expiry, soft-lead exclusion, atomic `increment_saved_quote_access` (migration drafted, not applied) | Open, ready, current-main, and clean. Keep shared-quote findings separate from financing-resume. |
| **#288** | Financing table write authority. Drops anon/user write policies on `financing_applications`. **Explicitly keeps** `anon` execute on `encrypt_sin`. | Open, ready, current-main, and clean. Do **not** revoke anon execute on `encrypt_sin`. |

### Implementations opened from this audit

| PR | Audit surface | Current status |
| --- | --- | --- |
| **#331** | Remove public quote-builder Lightspeed sync triggers and unsafe README service-role-key instructions | **Merged** into `main` as `45e25b3a`. The server-side Edge Function still creates a service-role client without caller authentication; #331 did not change that function or the anon-JWT cron contract. |
| **#332** | Validate Twilio `notification-webhook` signatures and target status updates safely | Refreshed draft at current-main head `f3fcabd3`; clean/mergeable with exact-head CI, protected preview, Codex, Kimi, and security gates passed for signature, early-callback, monotonic status, URL-normalization, repeated-key, duplicate-row, targeting, and error-code behavior. It remains draft for the #300/migration/config/function release sequence. Do not duplicate it. |
| **#333** | Derive quote-funnel and legacy SMS warranty copy from promotion data | **Merged** into `main` as `6e482d84`. Current main uses the shared warranty-display contract and focused tests; the quote UI selects the applied promotion, while retained SMS templates accept explicit extra-year data. The original hardcoded-badge finding is resolved. |

### CORRECTIONS to the original report

- **Do not recommend revoking anon execute on `encrypt_sin`.** The public financing flow currently requires it. Moving encryption server-side would need an atomic replacement design, not a revoke-first change.
- **`/admin/blog` is missing a UI gate on `main`,** but RLS and `send-blog-notification` authorization reduce the severity. Classify as **defense-in-depth**, already owned by **#335**. PR #314 is closed and unmerged.
- **The disabled client login limiter** in `SecureAuth.tsx` is **not** proof that Supabase Auth lacks server-side rate limiting. It is a dead client TODO only.
- **Missing response security headers** are confirmed hardening work, not an independently demonstrated P0 exploit. The safe baseline is owned by **#335**, not closed PR #314.
- **Public service-role endpoints using explicit `select` lists** are not current `select(*)` vulnerabilities. Keep the lists explicit; do not file them as live select-star bugs.
- **Separate shared-quote findings from financing-resume findings.** Shared-quote is #290. Financing resume TTL / capability-URL work is a different surface and is not owned by #290.
- **Production `/promotions` presented Summer Savings coherently, including 2.99% financing, in the 2026-08-15 cache-busted check.** The obsolete 5.48% *visible-rate* claim is removed from this report. Do not revive either historical state as a current claim without a new cache-busted production check.
- **`/quote/motor-selection` rendered successfully** in desktop and 390×844 mobile verification with **no overflow or lazy-load failure**. Retain the headless `LazyRouteBoundary` (“Couldn't load this page”) only as **unconfirmed monitoring evidence**.
- **Do not treat stale reports, old promotion copy, or archived plans as current findings** without cache-busted production verification.

### Current execution state

1. **Lightspeed is partially resolved.** Merged #331 removed every public quote-builder trigger and the unsafe README curl. The remaining server-side function still creates a service-role client without caller authentication; changing that contract is blocked on the scheduler-auth decision below.
2. **Twilio is owned by accepted draft #332.** Preserve its exact current-main implementation and explicit release sequence; do not create a duplicate implementation.
3. **Promotion-derived warranty copy is resolved.** Merged #333 covers the quote UI and related displays through the applied promotion, while retained `get7_*` SMS templates use the same display helper with explicit extra-year data.

### JAY DECISION REQUIRED (do not silently change)

**Lightspeed cron auth contract is proven and is currently anon JWT.** `docs/runbooks/post-rotation-cron-rewrite.sql` job `lightspeed-motor-models-sync-daily` (jobid 19) posts `Authorization: Bearer <ANON_JWT>` and `{}`. `docs/runbooks/jwt-signing-keys-migration-audit.md` §2.1 says Lightspeed jobs use anon JWT and none use `requireAdmin`; migrating them to `x-internal-secret` was deferred as a separate sprint. Browser `supabase.functions.invoke` also sends the public anon JWT, so anon cannot distinguish cron from a quote-builder visit. Tightening the function to admin / internal-secret / service-role **preserves the scheduled caller only after production cron is rewritten**. That rewrite is a production config change and is **not authorized in this order**. Implementation PRs may add the function gate and must flag the cron rewrite as a merge/deploy gate — they must not execute cron SQL or place an internal secret in frontend code.

**Jay Harris** is the owner (software engineer / dealer operator). Business facts that look "wrong" in copy are often intentional (Verado special-order, pickup-only, CAD-only, no delivery).

---

## 1. What this site is

`mercuryrepower.ca` is Harris Boat Works' Mercury outboard quote and content site. The dealer is a family marina in Gores Landing on Rice Lake, Ontario (Mercury dealer since 1965, family-owned since 1947, Premier Dealer, Legend Boats dealer). The sister brand site is `harrisboatworks.ca` (rentals, used boats, Legend inventory). An older content domain, `mercuryoutboards.ca`, still ranks and cannibalizes some head terms.

**Primary conversion path**

1. Land on `/` or a content/landing page  
2. Enter `/quote/motor-selection`  
3. Configure motor → purchase path (loose vs installed) → boat info → trade-in → installation → promo → summary  
4. Reserve with Stripe deposit and/or apply for TD/Dealerplan financing  
5. Schedule / success / saved quote

**Secondary surfaces**

- Public tools at `/tools` (trade-in, repower cost, Boost eligibility, shaft length)
- Financing calculator + 7-step application (SIN encrypted at rest)
- Blog (~199 English guides plus FR/ZH/KO/ES/HI/PA/UR/TL indexes)
- Geo and HP landing pages
- Public AI agent APIs (`/api/agents/*`) + markdown twins
- Large admin console under `/admin/*`

**Stack**

| Layer | Choice |
| --- | --- |
| App | Vite 5 + React 18 + TypeScript + React Router 6 + Tailwind + shadcn/Radix |
| Data | Supabase (`eutsoqdpjurknjsshxes`) — Postgres, Auth, Edge Functions, Storage |
| Hosting | Vercel (`vercel.json` + `middleware.ts`) |
| Payments | Stripe Checkout deposits (`create-payment`, `stripe-webhook`) |
| Inventory | Lightspeed DMS → `sync-lightspeed-inventory` → `motor_models` |
| Trade-in | Canonical HBW valuation at `valuation.mercuryrepower.ca` via `hbw-valuation-proxy` |
| Chat / voice | Custom AI chat + ElevenLabs |
| SEO | `react-helmet-async`, static prerender (`scripts/static-prerender.mjs`), IndexNow, RSS, sitemap |

`package.json` name is still the Lovable scaffold (`vite_react_shadcn_ts`). README is still mostly Lovable boilerplate plus a Lightspeed sync curl.

---

## 2. Snapshot of what is already strong — do not regress

These are working systems. A "cleanup" that breaks them is a failed review.

### Conversion and pricing integrity

- Quote funnel has an explicit UX contract test: `src/pages/quote/__tests__/quote-funnel-ux-contract.test.ts`. It locks deposit refund language, 9.9 MH express `$100` path, payment origin allowlists, and webhook binding. **Do not weaken these assertions.**
- Frozen pricing snapshot in `QuoteContext` (`FrozenPricing`) exists so shared/QR quotes do not drift when promos change.
- Trade-in authority is documented in `docs/valuation-architecture.md`. Browser never sees the HBW API key. Local `trade_valuation_*` tables are retired compatibility data — do not start querying them again.
- Payment origin allowlists were recently hardened (`#303`, `#306`). `create-payment` uses `resolveAllowedBrowserOrigin`. Keep fail-closed.
- Stripe webhook verifies `stripe-signature` against `STRIPE_WEBHOOK_SECRET`.

### SEO / AI discovery (unusually mature for a dealer site)

- Live `/llms.txt` (HTTP 200), `/.well-known/ai.txt`, `/.well-known/mcp.json`, `/.well-known/brand.json`
- Markdown twins for motors, locations, case studies, blog, pricing, maintenance
- Public motors + quote APIs + MCP server, CORS-open by design
- Static prerender writes per-route `index.html` for crawlers
- `MotorSelectionSEO` no longer hardcodes `motorCount = 128` (May 2026 audit item #7 is fixed)
- `llms.txt` Verado example URL is gone (May 2026 audit item #5 is fixed)
- Homepage warranty copy is now "3 years factory-backed, extended available" (May 2026 audit item #9 is fixed)
- Comparison *content* exists as blog posts (Yamaha / Honda / Suzuki)
- `/agents`, `/tools`, shaft-length and cost estimators exist (May 2026 audit item #10 is partly done)
- `ai.txt` freshness policy and Lightspeed source-of-truth line are current

### Auth and sensitive data (financing)

- Admin role is checked via `has_role` RPC, not a client-writable profile flag (`AuthProvider.tsx`)
- Most `/admin/*` routes use `<SecureRoute requireAdmin={true}>`
- Dev/staging/test routes are gated with `import.meta.env.DEV` in `src/App.tsx` (good — they are tree-shaken from production)
- HuggingFace transformers / ONNX background removal is documented as DEV-only
- Financing application is `noindex`; SIN path uses pgsodium + `sin_audit_log` (see older `SECURITY_AUDIT_REPORT.md` — treat those reports as historical, re-verify before trusting "all green")

### Build hygiene

- `prebuild` is a long integrity gauntlet: lockfile, pricing drift, blog leaks/TODOs, hreflang, ZH structure, assets, OG images, responsive images
- `build` then prerenders, checks blog OG images in `dist`, validates schema.org
- Do not disable these gates to "make CI green" without replacing the invariant they encode

---

## 3. Historical live-site snapshot (2026-08-15; revalidate before use)

Checked from this environment against `https://www.mercuryrepower.ca` on 2026-08-15. The figures and response observations in this section are historical evidence, not a current-production attestation. Revalidate exact production identity and cache-busted rendered behavior before acting on them.

| URL | Result |
| --- | --- |
| `/` | 200. Hero + dual CTAs (Build Quote + Call). Trust/process/heritage sections render. |
| `/quote/motor-selection` | 200. **Cache-busted rendered verification succeeded** on desktop and 390×844 mobile: page rendered, no overflow, no lazy-load failure. A headless fetch also surfaced the `LazyRouteBoundary` card ("Couldn't load this page"). Keep that only as **unconfirmed monitoring evidence** — it is not a confirmed production outage and is not a current P0/P1 by itself. |
| `/promotions` | 200. **On 2026-08-15, production presented Summer Savings coherently, including 2.99% financing.** Do not cite an obsolete 5.48% visible-rate claim from older prerender/TD copy as a current finding. Re-verify with a cache-busted render before claiming offer drift again. |
| `/blog` | 200. ~199 English guides. Cover story + cluster rails look healthy. |
| `/llms.txt` | 200. Policy text is current. Motor examples are non-Verado. |
| `/robots.txt` | 200. Last updated 2026-07-15. Allows AI crawlers. Disallows `/admin` and `/api/` after allowing `/api/agents/`. |
| `/sitemap.xml` | **200 via curl** (`content-length: 231649`, 543 `<loc>` entries, `lastmod` 2026-08-15). A markdown fetch tool returned 500 — likely a client parser issue, not a live outage. Still: `Cache-Control: public, max-age=0, s-maxage=1` on the sitemap is hostile to crawlers. |
| `/api/agents/motors` | 200. `count: 101`. CAD prices present. Verado excluded. |

**Response-header pattern on HTML and sitemap**

```
cache-control: public, max-age=0, s-maxage=1, must-revalidate
access-control-allow-origin: *
strict-transport-security: max-age=63072000
server: Vercel
```

Current-main source was rechecked on 2026-08-30: the safe baseline is still absent from `vercel.json` (the unused `SECURITY_HEADERS` object is not applied at the edge). This is **confirmed hardening**, not an independently demonstrated P0 exploit. Baseline headers without a guessed CSP and without blocking microphone/payment are **owned by PR #335**.

**Public motors feed (historical 2026-08-15 live read)**

- 101 motors (May 2026 audit said 25 — catalog is now brochure-complete, not "in-stock only")
- 16 in stock, 85 special order
- 65 motors with `imageUrl: null`
- 5 motors with **relative** image paths (`/images/motors/...`, `/motors/...`) that AI clients and some schema consumers will treat as broken
- `shaftLength` and `controlType` null on 100 / 101 motors
- Every motor `url` is apex `https://mercuryrepower.ca/...` while the site 301s to `www`

---

## 4. Architecture map (for reviewers)

### 4.1 Quote funnel

| Step | Route | Page |
| --- | --- | --- |
| 1 Motor | `/quote`, `/quote/motor-selection` | `MotorSelectionPage.tsx` (1778 lines) + `MotorSelection.tsx` (2084 lines) |
| 2 Options | `/quote/options` | `OptionsPage.tsx` |
| 3 Path | `/quote/purchase-path` | `PurchasePathPage.tsx` (`loose` \| `installed`) |
| 4 Boat | `/quote/boat-info` | `BoatInfoPage.tsx` |
| — | `/quote/fuel-tank` | Redirect → options |
| 5 Trade-in | `/quote/trade-in` | `TradeInPage.tsx` |
| 6 Install | `/quote/installation` | `InstallationPage.tsx` |
| 7 Promo | `/quote/promo-selection` | `PromoSelectionPage.tsx` |
| — | `/quote/package-selection` | Redirect → summary |
| 8 Summary | `/quote/summary` | `QuoteSummaryPage.tsx` (1372 lines) |
| 9 Schedule | `/quote/schedule` | `SchedulePage.tsx` |
| 10 Success | `/quote/success` | `QuoteSuccessPage.tsx` |
| Saved | `/quote/saved/:quoteId` | `SavedQuotePage.tsx` |

State lives in `src/contexts/QuoteContext.tsx` (846 lines). Several fields are still `any` (`tradeInInfo`, `fuelTankConfig`, `installConfig`). Later steps redirect to motor-selection if prior state is missing — correct, but easy to break with a new deep link.

`vercel.json` 301s `/quote` → `/quote/motor-selection`. React still mounts `MotorSelectionPage` on both paths. Keep them equivalent.

### 4.2 Auth gates

| Component | Behavior |
| --- | --- |
| `SecureRoute` | Requires user; optional `requireAdmin` via `has_role` |
| `ProtectedRoute` | Requires user only; redirects to `/auth` (not `/login`) |

Inconsistencies:

- `/dashboard` uses `SecureRoute` **without** `requireAdmin`
- `/settings` uses `ProtectedRoute`
- `/admin/blog` uses `SecureRoute` **without** `requireAdmin` on current `main` — **defense-in-depth**, already owned by **#335**. RLS + `send-blog-notification` `requireAdmin` reduce severity.
- Login paths: `/auth` and `/login` both exist

### 4.3 Admin surface

~25 admin routes (quotes, financing, SIN test, Zapier, email, SMS, inventory, stock sync, connectors, growth agent, SEO health, options catalog, pricing import, image update, blog). On current `main`, all except `/admin/blog` set `requireAdmin={true}`. The blog UI gate is already owned by **#335**.

`/admin/sin-encryption-test` is admin-gated but is a production-reachable diagnostic page. Prefer removing from the production router or hiding behind `DEV`.

### 4.4 Backend

~97 Edge Functions under `supabase/functions/`. Highest-risk / highest-traffic:

| Function | Role | Notes |
| --- | --- | --- |
| `public-motors-api` | Read catalog | CORS `*`, uses **service role**, caches ~5 min |
| `public-quote-api` | Agent quotes + lead insert | Rate-limited on `build_quote`; service role |
| `agent-mcp-server` | Public MCP | CORS-open by design |
| `create-payment` | Stripe Checkout | Origin allowlist + Zod |
| `stripe-webhook` | Payment fulfillment | Signature verified |
| `hbw-valuation-proxy` | Trade-in | Adds private key server-side |
| `sync-lightspeed-inventory` | Inventory SoT | Cron 05:00 UTC + SMS on failure |
| `financing-application-api` | Credit app | SIN encryption path |
| `ai-chatbot-stream` | Chat | Knowledge + parts regex |
| `ucp-checkout` | Agent checkout | Exposed at `/api/agents/ucp` |

`vercel.json` rewrites `/api/agents/*` to those functions. Public project ref is visible in rewrite URLs (`eutsoqdpjurknjsshxes.supabase.co`). That is normal for this stack; do not treat the anon key as a secret.

### 4.5 Build / publish pipeline (fragility)

`prebuild` runs ~25 sequential generators and checkers, then `build` runs more generators, Vite, prerender, OG checks, schema validation, then `postbuild` IndexNow.

Risks:

- Slow, flaky CI. One content typo fails the whole production build.
- `scripts/static-prerender.mjs` is huge and is the **real sitemap writer**. `public/sitemap.xml` is overwritten at build time.
- Hardcoded fallback **anon** Supabase keys exist in `scripts/static-prerender.mjs` and `scripts/generate-markdown-twins.mjs`. Anon-only, but they should read env only.
- `.env` is **tracked in git** and **not in `.gitignore`**. Contents are the public anon key + project URL. Still a process smell; a future secret will get committed.

---

## 5. Findings (prioritized)

Severity:

- **P0** — security / PII / money / production auth. Fix or confirm-closed first.
- **P1** — conversion, SEO head terms, live data quality, buyer-facing inconsistency.
- **P2** — maintainability, dead code, polish.

Each item has: evidence, why it matters, suggested Codex action, and a "do not" if relevant.

---

### P0 — Security and money path

Status key: **ALREADY OWNED** / **HARDENING (not a demonstrated exploit)** / **STILL UNOWNED** / **DO NOT DO**.

#### P0-1. `/admin/blog` UI gate — ALREADY OWNED by #335 (defense-in-depth)

**Evidence on `main`:** `src/App.tsx` still mounts `/admin/blog` as `<SecureRoute>` without `requireAdmin={true}`.

This is **not** an open implement-now P0. RLS on `blog_subscriptions` and `requireAdmin` inside `send-blog-notification` reduce severity. The missing React gate is **defense-in-depth**.

**Owner:** ready current-main **PR #335** adds `requireAdmin={true}` with a focused route-security contract. Closed PR #314 is not the active owner. Do not duplicate.

**Do not** treat the `main` snippet as proof the hole is unowned.

#### P0-2. Disabled client login limiter — not proof of missing Auth rate limits

**Evidence:** `src/components/auth/SecureAuth.tsx` short-circuits a client-side counter (`return true` + TODO).

That is a dead client TODO. It is **not** evidence that Supabase Auth lacks server-side rate limiting (IP / email / project-level). Do not file “Auth has no rate limit” from this snippet alone.

**Action (low priority hygiene):** delete the misleading TODO or replace it with a comment that server-side Auth limits are the real control. Do not re-enable a client-only counter and call it done.

#### P0-3. Missing response security headers — confirmed hardening, owned by #335

**Evidence:** `src/lib/securityMiddleware.ts` exports `SECURITY_HEADERS`, but current-main `vercel.json` does not apply that set. The 2026-08-15 live snapshot also lacked the baseline; revalidate live production after any deployment.

This is **confirmed hardening**, not an independently demonstrated P0 exploit (no clickjacking/MIME-sniff PoC was produced). The unused object also has a CSP/`Permissions-Policy` that would break Stripe and ElevenLabs if applied raw.

**Owner:** ready current-main **PR #335** adds a tested baseline (`nosniff`, Referrer-Policy, `X-Frame-Options: SAMEORIGIN`, microphone-safe/payment-safe Permissions-Policy). Do not copy-paste `SECURITY_HEADERS` onto HTML.

#### P0-4. README service-role-key curl — RESOLVED by merged #331

**Historical evidence:** the old `README.md` "Manual Inventory Sync Trigger" block instructed operators to paste a service-role key into curl.

**Current main:** merged #331 removed that command, warns against public quote-builder invocation and local service-role-key use, and points manual work to authenticated admin surfaces. Keep that contract. The separate server-side function-auth gap remains under P0-8/P0-9.

#### P0-5. Public Edge Functions run as service role with CORS `*` — not a current select-star bug

**Evidence:** `public-motors-api`, `public-quote-api`, MCP, UCP. Intentional for AI agents. Current queries use **explicit `select` lists**, not `select('*')`.

**Action:** Keep the column list explicit. Add a comment + test that PII tables are never queried here. Do **not** file these as live select-star vulnerabilities. Do not "simplify" to `select('*')`. `public-quote-api` `build_quote` rate limit must stay fail-closed.

#### P0-6. Financing / SIN — treat older audit reports as stale

`SECURITY_AUDIT_REPORT.md` and `FINAL_SECURITY_AUDIT_REPORT.md` are dated January 2025 and claim "all medium findings resolved." They are useful history, not a current attestation.

**Already owned nearby:** draft **PR #288** restricts `financing_applications` write authority and **keeps** anon execute on `encrypt_sin`.

**Separate, still unowned:** financing **resume-token** TTL / capability-URL hardening (see P0-10b). Do not fold that into #288 or #290.

**Action for a later read-only pass:**

- Re-read `encrypt_sin` / `decrypt_sin` / `has_role` / `sin_audit_log` migrations
- Confirm resume tokens expire and are single-use
- Confirm `financing_applications` cannot be listed by anon
- Confirm `/admin/sin-encryption-test` cannot be reached by a non-admin and consider removing it from prod

Do **not** write exploit PoCs. Do **not** log real SINs. Do **not** revoke anon `encrypt_sin` (see P0-11).

#### P0-7. Stripe deposit amounts are mapped in code

**Evidence:** `supabase/functions/create-payment/index.ts` `DEPOSIT_PRICES` maps `"100"|"200"|"500"|"1000"|"2500"` to Stripe price IDs. Express `$100` is bound to motor id `e920cfdf-223a-408a-850b-6f112e15c4d7` / model `1A10201LK`.

**Action:** If touching payments, keep the express-motor binding and origin allowlist tests green. Do not accept arbitrary dollar amounts from the client.

#### P0-8. Unauthenticated write Edge Functions — split by owner

Deep-dive confirmed several functions use the service role and accept unauthenticated POSTs with CORS `*`. **Do not treat the whole table as one unowned P0.**

| Function | Status |
| --- | --- |
| `send-notification` | **ALREADY OWNED by #300** |
| `get-dropbox-config`, `dropbox-oauth` (and related import/config) | **OWNED by #315, but dependency-blocked** — the draft still targets closed/unmerged #314 and must be refreshed onto current `main`. |
| `sync-lightspeed-inventory` | **PARTIALLY RESOLVED by merged #331** — public quote-builder triggers are gone, but current-main function source still creates the service-role client without caller authentication. Cron contract is proven anon JWT (Jay decision before changing that contract). |
| `notification-webhook` | **OWNED by refreshed draft #332** — current main still accepts unsigned Twilio-style body data, while #332's current-main head implements the signature, early-callback, monotonic-status, canonical-URL, repeated-key, duplicate-row, targeting, and error-code contracts. Keep the release sequence explicit. |
| `sync-inventory-api`, `mark-out-of-stock`, `scrape-mercury-portal`, `migrate-motor-images`, `motor-health-monitor` | Review later. Not in this execution order. Confirm each before changing — some may already gate. |

**Remaining action in this order:** preserve #332 and its release order; make the scheduler-auth decision before opening a separate Lightspeed function-auth patch. Do not re-do #300/#315 or the merged #331 browser removal.

#### P0-9. Quote motor-selection auto-invokes Lightspeed sync — BROWSER HALF RESOLVED by merged #331

**Historical evidence:** old `MotorSelection.tsx` called `sync-lightspeed-inventory` on load, hourly, and through `?runScrape=1`.

**Current main:** merged #331 removed those triggers and added a focused trust-boundary contract. Current-main quote code contains no `sync-lightspeed-inventory`, `lastInventoryUpdate`, `updateInventory`, or `runScrape` path. The Edge Function itself still creates a service-role client without authenticating the caller, so the server-side half is not resolved.

Legitimate admin callers to **keep:** `AdminStockSync.tsx`, `UnifiedInventoryDashboard.tsx`, `InventoryMonitor.tsx`, `InventoryDiagnostics.tsx`.

**Proven scheduler:** `lightspeed-motor-models-sync-daily` uses **anon JWT**, not `requireAdmin` / `x-internal-secret`. Anon JWT is also what the public browser sends. See §0.1 JAY DECISION REQUIRED.

**Remaining action:** preserve #331's browser removal and admin UI. After Jay selects and stages a compatible scheduler credential, enforce authorization **before** creating/using the inventory service-role client (admin JWT, configured internal secret, or service-role bearer). Never put an internal secret in frontend code. Do not execute a real sync in tests. Do not rewrite production cron in this documentation PR.

#### P0-10a. Shared-quote capability URL — ALREADY OWNED by #290

**Evidence:** `get-shared-quote` is unauthenticated and historically returned extra quote/customer fields.

**Owner:** draft **PR #290** minimizes the public DTO, adds expiry / soft-lead exclusion, and drafts atomic `increment_saved_quote_access` (not applied). Do not duplicate.

#### P0-10b. Financing resume capability URL — SEPARATE, not owned by #290

**Evidence:** `financing-application-api` `load` — 30-day `resumeToken` in email URLs returns employment/financial/applicant data (SIN stripped). January 2025 audits claimed 7-day expiry; that claim is **stale**. Code is 30 days.

**Action (later, not #290):** confirm current TTL with a code read; consider shortening; do not put tokens in referrer-leaking query strings if a POST/fragment option exists. Do not mix this finding with shared-quote.

#### P0-11. `encrypt_sin` executable by `anon` — DO NOT REVOKE

**Evidence:** `supabase/migrations/20260514171742_88ee4320-42c3-4abc-9301-fddac5420d3e.sql` grants `EXECUTE` on `encrypt_sin(text)` to `anon` and `authenticated`. Decrypt is admin-gated inside the function.

The **public financing flow currently requires anon execute**. Draft **PR #288** explicitly keeps that grant (its test asserts the migration does not contain `REVOKE EXECUTE ON FUNCTION public.encrypt_sin`).

**Do not** revoke anon execute. Moving encryption server-side would need an **atomic replacement design** (Edge Function encrypts, client stops calling the RPC, then revoke). Revoke-first would break production applications.

#### P0-12. Quote-funnel warranty badges — RESOLVED by merged #333

**Historical evidence:** `PromoSummaryCard`, `PromoSelectionBadge`, and retained `get7_*` templates hardcoded seven-year wording even when the applied promotion did not grant four extra years.

**Current main:** merged #333 routes the quote displays through `src/lib/warranty-display.ts`, using the applied promotion's `warranty_extra_years` and a three-year standard term. Retained SMS templates use the same helper with caller-supplied extra-year data. It added focused UI/helper tests and removed the stale card/badge literals.

**Legacy SMS boundary:** `get7_campaign` / `get7_reminder` now accept promotion-derived extra years and fall back to standard warranty wording. `send-get7-campaign` remains a separate admin-gated Edge Function and was not part of #333. Do not send customer messages while verifying copy.

**Action:** keep #333's applied-promotion selection and no-extension fallback contract green. Reopen only with new current-main or rendered evidence.

---

### P1 — Conversion, SEO, live data, buyer trust

#### P1-1. Homepage still targets a zero-volume phrase

**Evidence:** `src/data/seoPageMetadata.json`

```json
"title": "Mercury Repower Cost Ontario: Real Prices in 2 Minutes"
```

`docs/seo/mercury-repower-ontario-semrush-audit-2026-06-29.md` Move 1 said this exact title has ~0 CA volume and should become **Mercury Outboards Ontario**, with "Harris Boat Works" in the title. That rewrite has not shipped. Live H1 is a rotating lifestyle line ("Get your weekends back" / etc.) in `HeroRepower.tsx`, which hydrates to a **random** ending. SSR H1 is stable; post-hydration H1 is not.

**Action (needs Jay copy approval):**

1. Change `<title>` / meta description per the Semrush note.
2. Keep one stable H1 for SEO (rotating endings can stay in a visually secondary line, not the `h1`).
3. Do not drop the 70/30 positioning or the quote CTA.

#### P1-2. Organization / LocalBusiness schema points at the wrong site and the wrong type

**Evidence:** `src/components/seo/GlobalSEO.tsx`

- `Organization.url` and `LocalBusiness.url` are `https://www.harrisboatworks.ca/`
- `LocalBusiness` is typed `["LocalBusiness", "Store", "AutoRepair"]`

This is a marina / outboard dealer, not an auto shop. Google may attach reviews and NAP to the wrong domain.

**Action:** Confirm with Jay whether mercuryrepower.ca should have its own `LocalBusiness` or a `Department` of HBW. Then fix `@type` (e.g. `LocalBusiness` + `SportsActivityLocation` / marine equivalent — **not** `AutoRepair` unless Jay wants it). Keep `sameAs` links to both domains.

#### P1-3. Historical motor-feed quality gap — revalidate current data before action

Historical live `/api/agents/motors` read (2026-08-15): 65 / 101 images missing; 5 relative URLs; shaft/control almost entirely null; all canonical URLs were apex.

Relative to the May 2026 audit (22/25 missing images), the gap was worse in that August 15 snapshot. This is not a current count or current-production status; revalidate the feed and current-main source before opening work.

**Conditional action after revalidation**

1. Backfill `hero_image_url` / `image_url` via existing Dropbox sync (data, not a new feature).
2. In `public-motors-api`, absolutize relative paths against `https://www.mercuryrepower.ca`.
3. Emit `www` URLs, not apex (apex 301s).
4. Populate shaft/control from `shaft` / `shaft_code` / `control_type` already selected in the query — the columns are fetched and then dropped.

#### P1-4. Promotions page — do not cite obsolete 5.48% visible-rate drift

**Corrected 2026-08-15:** cache-busted production `/promotions` presented **Summer Savings coherently, including 2.99% financing** on that date. The earlier “visible hero is 5.48% while prerender says 2.99%+$700” claim was obsolete then and is not current proof now; revalidate before changing offer copy.

`src/components/promotions/TDAlwaysOnOffer.tsx` still contains dated TD program copy and a 2027 TODO. That is source/archive material, not proof of what production renders.

**Action:** Do not “fix” live offer drift from this stale claim. If offer copy is touched later, one source of truth (`useActivePromotions` / promo tables) for hero, rebate matrix, FAQ, `llms.txt`, and prerender. Re-verify with a cache-busted render before filing a new inconsistency.

#### P1-5. Footer hours contradict `ai.txt`

Live footer: "Contact us for current hours."  
`public/.well-known/ai.txt`: in-season Mon–Sat 8–5, Sun 9–4; marina closed Dec 1–Apr 1.

**Action:** Bind hours to the same Google Places cache already used in `GlobalSEO` (`src/data/google-places-cache.json`) or a single constants module. Do not leave AI and humans with different hours.

#### P1-6. Dual primary CTAs above the fold (still open from May 2026)

Live homepage hero still stacks **Build My Quote** and **Call (905) 342-2153** as peer actions. May 2026 customer-facing audit #2 asked to demote the call button on mobile.

**Action:** One filled CTA (Build Quote). Call becomes a text link / `tel:` under the trust row on small viewports. Desktop can keep both if visually unequal.

#### P1-7. Homepage / quote chrome is crowded

Global mounts in `src/App.tsx`: consent banner, AI chat, sticky quote bar, pricing ribbon, Google rating badge, comparison button, CTA tracker, toasters.

On mobile this competes with the quote CTA and the cookie banner. `GlobalStickyQuoteBar` already hides on many routes; chat does not.

**Action:** Define a chrome budget per template (marketing vs quote vs financing vs admin). Financing and quote-summary should not fight a chat launcher + cookie + rating badge.

#### P1-8. Quote motor-selection is a large page — lazy-load failure is unconfirmed

`MotorSelectionPage.tsx` (1778) + `MotorSelection.tsx` (2084) + configurator modal (939) + details sheet/modal (1100–1266). This is the money page.

**Rendered verification (2026-08-15):** desktop and 390×844 mobile both rendered successfully. No overflow. No lazy-load failure.

A headless fetch also surfaced `LazyRouteBoundary` (“Couldn't load this page”), which only fires when a lazy import throws. Keep that as **unconfirmed monitoring evidence**, not a current production outage and not a reason to split the page.

**Action (only if monitoring repeats in a real browser):** check console for `Failed to fetch dynamically imported module`. `lazyWithRetry` is already used for TradeIn — extend the same pattern if a real failure is confirmed. Do **not** start a visual redesign. Keep the UX contract tests green.

#### P1-9. Semrush head-term gaps that are still open (2026-06-29 plan)

| Move | Status | Notes |
| --- | --- | --- |
| 1 Homepage title / H1 | **Open** | See P1-1 |
| 2 Brand "Harris Boat Works" in title | **Open** | Title does not end with the brand |
| 3 Serial-number decoder | **Open** | `/tools` has Boost serial *eligibility*, not a year/model decoder. No `/tools/mercury-serial-decoder` |
| 4 HP hub pages | **Partial** | Have portable, 40–60, 90–115, 115 Pro XS, 150, 250 Pro XS, pontoon. Missing dedicated 9.9 / 15 / 20 / 25 / 40 / 60 / 90 / 200 / 300 hubs |
| 5 Repower cost calculator | **Partial** | `/tools#repower-cost` exists. Semrush asked for `/tools/repower-cost-calculator` as a titled landing |
| 6 Trent-Severn hub | **Open** | No `/trent-severn` route |
| 7 Backlinks | **Off-site** | Not a code task |
| 8 Cannibalization | **Open** | `/quote/motor-selection`, `/mercury-outboards-ontario`, `/pricing-reference`, blog price guides, and `mercuryoutboards.ca` still overlap |

**Action:** Do Move 1 + a cannibalization map before more translated blogs. Semrush explicitly said to deprioritize more FR/ZH/KO until English head terms are fixed — the repo has continued to invest in multilingual blogs anyway.

#### P1-10. Comparison landings are blog-only

May 2026 asked for `/compare/mercury-vs-yamaha-outboards` etc. Those URLs do not exist. Content lives at:

- `/blog/mercury-vs-yamaha-outboards-ontario`
- `/blog/mercury-vs-honda-outboards-honest-ontario-dealer-comparison-2026`
- `/blog/mercury-vs-suzuki-outboard-reliability-2026`
- `/blog/fourstroke-vs-pro-xs`

`/compare` is a **motor-vs-motor configurator**, not a brand comparison landing.

**Action:** Either 301 the Semrush-style URLs to the blog posts, or add thin landing wrappers that reuse the articles. Do not duplicate the essays.

#### P1-11. Cache-Control `s-maxage=1` on all HTML and the sitemap

**Evidence:** `vercel.json` headers for `/(.*)`.

This defeats CDN caching. Sitemap and marketing HTML revalidate every second. Combined with a 231 KB sitemap, crawlers and TTFB suffer.

**Action:** Keep HTML short-cache if inventory must be fresh, but give `/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/assets/*` (already immutable), and markdown twins a real `s-maxage` (sitemap: 1h; twins already have 300/3600). The catch-all `/(.*)` rule currently **overrides** more specific rules depending on Vercel merge order — verify the actual live header per path after any change.

#### P1-12. Apex vs www still leaks into APIs and schema

Middleware + `vercel.json` 301 apex and `quote.harrisboatworks.ca` → www. Good.

Still emitting apex:

- `public-motors-api` `SITE_URL = 'https://mercuryrepower.ca'`
- `public-quote-api` `SITE_URL` default
- Motor `url` fields in the live feed

**Action:** One constant: `https://www.mercuryrepower.ca`. Use it in Edge Functions, prerender, and JSON-LD.

#### P1-13. Accessibility / UX nits on the money pages

- `HeroRepower.tsx` decorative image uses `alt=""` — OK if truly decorative; the heritage photo on the homepage does have a real alt.
- Rotating H1 + framer-motion scroll opacity: `prefers-reduced-motion` is respected for rotation, good. Confirm video is not autoplayed when reduced-motion / Save-Data (code intends this).
- Cookie banner + chat + phone + quote CTA on first paint (mobile).
- Financing form has `AccessibleFormWrapper` — keep it; do not regress when editing steps.
- Quote steps redirect aggressively; a refresh mid-funnel can dump the user back to motor-selection if persistence fails. Confirm `QuoteContext` localStorage / resume still works after a hard refresh on `/quote/summary`.

#### P1-14. Content / offer drift risk in the 40k-line blog blob

`src/data/blogArticles.ts` is **40,364 lines / ~3.0 MB** with 155 slugs. FR/ZH/KO/ES files add thousands more. Prebuild leak/price-hygiene scripts exist because this file is dangerous.

**Action:** Do not "split the file" as a drive-by. If touching blog, use the existing generators and hygiene scripts. Never hardcode a dollar amount or APR in a new article — use the live tokens the hygiene checker already understands (`{{LIVE_RATE_PCT}}` etc.).

---

### P2 — Maintainability and dead weight

#### P2-1. Dead duplicate pages

- `src/pages/MyQuotes.tsx` is unused. Router uses `src/pages/account/MyQuotesPage.tsx`.
- `src/pages/quote/PackageSelectionPage.tsx` still exists; route redirects to summary.
- Landing files `MercuryDealerPeterborough.tsx` / `Cobourg` / `GTA` still exist; public URLs 301 to `/locations/...`. Confirm they are unused and delete or keep as redirects only.

#### P2-2. `QuoteContext` `any` fields

`tradeInInfo`, `fuelTankConfig`, `installConfig` should share types with the valuation + install components. This is how silent quote-total bugs happen.

#### P2-3. Two PDF stacks

`@react-pdf/renderer` **and** `jspdf` + `html2canvas`. Quote PDF contract tests target the react-pdf path. Do not add a third.

#### P2-4. Edge Function sprawl (~97)

Voice, Dropbox, scrape-mercury-*, ElevenLabs, growth-agent, Zapier, SMS, etc. Many look like one-off ops tools. Each is an auth-review surface.

**Action:** Inventory which are invoked in production cron / UI. Mark the rest `verify_jwt = true` and remove from public docs.

#### P2-5. Scaffold leftovers

- Package name `vite_react_shadcn_ts`
- README Lovable template
- `SECURITY_HEADERS` unused on the real site
- `/index` route duplicates `/`

#### P2-6. Test coverage shape

~96 test files. Strong on **contracts** (pricing, promo dates, deposits, valuation routing, blog hygiene). Weaker on **interactive** quote-builder rendering and admin. Prefer adding one contract test next to a fix rather than a broad Playwright suite unless Jay asks.

#### P2-7. `AdminSINEncryptionTest` in production router

Admin-only, but it is a live page that exercises decrypt + audit log. Move behind `import.meta.env.DEV` or delete after the next SIN re-verify.

---

## 6. Status of prior audits (so Codex does not re-do finished work)

### Customer-facing audit — 2026-05-01 (`docs/runbooks/customer-facing-audit-2026-05-01.md`)

| # | Item | Status 2026-08-15 |
| --- | --- | --- |
| 1 | Motor images missing | **Open in the 2026-08-15 snapshot** (65/101); current feed status requires revalidation. |
| 2 | Mobile dual CTA | **Still open** |
| 3 | Competitive comparison pages | **Partial** (blog, not `/compare/...` routes) |
| 4 | Markdown twins vs catalog | **Improved** (generator in build). Confirm twins for all 101 feed slugs. |
| 5 | Verado example in `llms.txt` | **Fixed** |
| 6 | Stale `ai.txt` date | **Fixed** (Lightspeed line present) |
| 7 | `motorCount = 128` | **Fixed** |
| 8 | Provenance footnote on motor pages | **Unknown / likely open** — confirm on a live `/motors/{slug}` |
| 9 | "7-year warranty available" on homepage | **Resolved on current main.** Homepage/selection work was followed by merged #333, which covers the remaining quote displays and retained SMS templates. |
| 10 | Missing tools / Legend / agents | **Partial** (`/tools`, `/agents` exist; no `/legend-boats`; no serial decoder) |

### Semrush plan — 2026-06-29

Moves 1, 2, 3, 6, 8 still open. 4 and 5 partial. 7 is outreach, not code.

### Financing security reports — Jan 2025

Historical. Re-verify. Do not cite them as current proof. Do not use them to justify revoking anon `encrypt_sin`. Draft **#288** is the current financing write-authority owner.

---

## 7. Suggested Codex execution order

If Jay says "start fixing," do this sequence. Stop after each band for a review.

### Band A — active owner lanes and the remaining auth decision

1. **Twilio half of P0-8** — preserve accepted draft PR #332 and its release sequence. Its exact-head implementation verifies signatures against a configured canonical URL (not `Host`/forwarded-host), early callbacks, monotonic/out-of-order statuses, repeated keys, duplicate rows, signed-row/`MessageSid` targeting, and error-code retention. Draft migrations only; do not apply them here.
2. **Lightspeed server half of P0-8/P0-9** — merged #331 already removed public browser triggers and the README key instruction. Pause before the remaining function-auth patch until Jay selects and stages a scheduler credential compatible with the deployed cron.
3. **#315 dependency repair** — preserve its Dropbox/quote-email scope, but retarget/rebuild it from current `main` rather than closed PR #314.
4. Add `.env` to `.gitignore` (keep a committed `.env.example` with empty values; do not rewrite history unless Jay asks)
5. P1-12 www URLs in public motors/quote APIs
6. P1-3 absolutize image URLs + pass through shaft/control already in the query
7. P1-5 hours from one source
8. P1-11 sitemap / `llms.txt` cache headers (after checking Vercel header merge)

**Do not put in Band A:** P0-1/P0-3 (`#335`), merged #331 browser/docs work, merged #333 warranty work, P0-8 `send-notification` (`#300`), P0-10a shared-quote (`#290`), or P0-11 revoke `encrypt_sin` (**never** as a first step). Preserve #315's scope while repairing its base.

### Band B — needs a 10-minute Jay copy/business nod

1. P1-1 homepage title + stable H1
2. P1-2 schema URL + `@type`
3. P1-4 promotions copy — only after a new cache-busted production check; do not “fix” the obsolete 5.48% claim
4. P1-6 mobile CTA hierarchy
5. Security-header *CSP* (safe baseline headers are #335; a real CSP will break something if guessed)

### Band C — only with an explicit scope

1. Motor image backfill (data / Dropbox, not a new uploader)
2. Serial decoder tool (Semrush Move 3)
3. HP hub pages for missing classes
4. Cannibalization 301 map (`/mercury-outboards-ontario` vs `/` vs `/quote/motor-selection` vs `mercuryoutboards.ca`)
5. Quote page split — only if a real-browser lazy-load failure is confirmed (headless `LazyRouteBoundary` is unconfirmed)
6. Unify quote step IDs (UI stepper 1–10 vs reducer guards 1–7 in `QuoteContext` / `quote-progress-steps.ts`)
7. SIN / RLS re-audit (do not revoke `encrypt_sin` without an atomic replacement)
8. Edge Function inventory (skip functions already owned by #300/#315)
9. Financing-resume TTL / capability-URL (P0-10b). Shared-quote is already #290.

---

## 8. Ask Jay before doing

- Homepage title/H1 rewrite (brand vs "repower" positioning)
- Whether mercuryrepower.ca should host Legend boat sales content
- Whether `LocalBusiness` should live on this domain or only on harrisboatworks.ca
- Summer Savings / TD copy: the 2026-08-15 snapshot presented Summer Savings + 2.99% coherently; revalidate current production and ask before changing the offer story
- Lightspeed cron rewrite from anon JWT → `x-internal-secret` or service-role **before** deploying a `requireAdmin` gate on `sync-lightspeed-inventory` (see §0.1)
- 2027 TD program codes (`TDAlwaysOnOffer.tsx` TODO — Sean Beamish / Mercury Canada)
- Whether brochure / special-order motors should stay in the public feed (101 vs the old 25 in-stock feed). This changes schema `numberOfItems`, AI quotes, and buyer expectations.
- Whether to 301 more geo city pages (Semrush said stop adding them)
- Destructive drop of retired `trade_valuation_*` tables — do not

---

## 9. Explicitly out of scope unless Jay expands it

- Rewriting the quote reducer
- Changing deposit dollar amounts or Stripe price IDs
- Changing trade-in formulas
- New multilingual blog posts
- Enabling Verado in default inventory
- Delivery / shipping copy
- Applying the unused `SECURITY_HEADERS` CSP as-is
- Deleting Edge Functions without an invoke inventory
- Splitting `blogArticles.ts` as a drive-by refactor

---

## 10. How to verify (commands and URLs)

```bash
# unit / contract
npm test -- src/pages/quote/__tests__/quote-funnel-ux-contract.test.ts
npm test -- src/pages/nonFunnelAuditFixes.test.ts
npm test -- src/lib/__tests__/browser-origin.test.ts
npm test -- src/lib/__tests__/deposit.test.ts
npm test -- src/lib/valuation-routing-contract.test.ts

# content / SEO gates (subset; full prebuild is long)
npm run check:publishing-integrity
npm run check:structured-data
npm run check:schema-org
npm run check:blog-price-hygiene
```

**Live probes**

```bash
curl -sI https://www.mercuryrepower.ca/ | tr -d '\r' | grep -iE 'HTTP/|cache-control|content-security|x-frame|x-content-type'
curl -sI https://www.mercuryrepower.ca/sitemap.xml | head
curl -s https://www.mercuryrepower.ca/api/agents/motors | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['count'], sum(1 for m in d['motors'] if not m.get('imageUrl')))"
```

Manual:

- Chrome mobile 390×844: `/`, `/quote/motor-selection`, `/promotions`, `/financing-application`
- Confirm cookie banner + chat + quote CTA do not stack over the primary button
- Hard-refresh mid-quote and confirm resume
- `/admin/blog` UI gate is owned by #335 — confirm on that PR, not by re-implementing on `main`

---

## 11. Key file index

| Path | Why it matters |
| --- | --- |
| `src/App.tsx` | Full route table, DEV gates; `/admin/blog` UI gate owned by #335 |
| `src/contexts/QuoteContext.tsx` | Quote state machine |
| `src/pages/quote/*` | Funnel |
| `src/pages/quote/__tests__/quote-funnel-ux-contract.test.ts` | Do not break |
| `src/components/auth/SecureRoute.tsx` | Admin gate |
| `src/components/auth/SecureAuth.tsx` | Disabled *client* limiter — not proof Auth lacks server limits |
| `src/components/seo/GlobalSEO.tsx` | Org / LocalBusiness JSON-LD |
| `src/components/seo/HomepageSEO.tsx` | Title wiring |
| `src/data/seoPageMetadata.json` | Homepage title |
| `src/components/repower/HeroRepower.tsx` | H1 rotation, dual CTA |
| `src/pages/Index.tsx` | Homepage composition |
| `src/components/promotions/TDAlwaysOnOffer.tsx` | Archived TD program copy — not current `/promotions` visible-rate proof |
| `src/lib/securityMiddleware.ts` | Unused header set |
| `vercel.json` | Redirects, rewrites, cache |
| `middleware.ts` | Apex / legacy host 301 |
| `supabase/functions/public-motors-api/index.ts` | Public catalog |
| `supabase/functions/public-quote-api/index.ts` | Public quotes / leads |
| `supabase/functions/create-payment/index.ts` | Deposits |
| `supabase/functions/stripe-webhook/index.ts` | Fulfillment |
| `docs/valuation-architecture.md` | Trade-in SoT |
| `docs/seo/mercury-repower-ontario-semrush-audit-2026-06-29.md` | SEO plan still in force |
| `docs/runbooks/customer-facing-audit-2026-05-01.md` | Prior audit |
| `public/llms.txt` | AI business rules |
| `public/.well-known/ai.txt` | Agent policy |
| `README.md` | Service-role curl |

---

## 12. One-page summary for Jay

The site is a real production system: live CAD quotes, Stripe deposits, financing with SIN encryption, a large Ontario-focused blog, and an AI-agent surface most dealers do not have. The May/June audits already fixed the worst SEO lies (Verado URL, fake 128-motor count, unconditional homepage 7-year badge). Current owner lanes #300, #335, #315, #290, #288, and #332 cover several original P0s — do not duplicate them. PR #314 is closed/unmerged; #315 must be rebuilt or retargeted off that closed base. PRs #331 and #333 are merged.

What remains actionable:

1. **Lightspeed server authorization remains.** Merged #331 removed browser-triggered sync and unsafe README instructions, but `sync-lightspeed-inventory` still creates a service-role client without caller auth. Cron uses **anon JWT**, so Jay must select and stage a compatible scheduler credential before the function gate can deploy.
2. **Twilio webhook hardening is owned by accepted draft #332.** Current main still lacks signature validation; #332 is current-main, clean/mergeable, and exact-head verified, but remains draft for release sequencing.
3. **Route/header hardening is owned by ready #335.** Do not revive closed PR #314.
4. **Dropbox/quote-email hardening is dependency-blocked in #315.** Preserve its scope, but rebuild it from current `main` instead of closed #314.
5. **Homepage still ranks for a phrase nobody searches**; H1 rotates after hydration.
6. **The historical 101-motor feed snapshot** was image-poor, shaft-blind, and used apex URLs; revalidate current production before coding from those counts.
7. **Build/content** is held together by a very large `blogArticles.ts` and a long prebuild gauntlet. That is a feature until someone bypasses it.

What is **not** a current open P0 (corrected):

- `/admin/blog` UI gate and baseline security headers — **#335** (defense-in-depth / hardening). Closed #314 is superseded for this safe subset.
- `send-notification` — **#300**.
- Dropbox OAuth/import/config + quote-email — **#315**, after current-main dependency repair.
- Shared-quote minimization / expiry / atomic access count — **#290**.
- Financing table write authority — **#288**. Do **not** revoke anon `encrypt_sin`.
- Public quote-builder Lightspeed triggers and the README service-role curl — **resolved by merged #331**. The separate Edge Function auth gap remains.
- Quote-funnel and retained SMS warranty derivation — **resolved by merged #333**.
- Twilio `notification-webhook` — **owned by refreshed draft #332**, not unowned.
- Financing resume tokens are a **separate** capability-URL topic from shared-quote.
- On 2026-08-15, production `/promotions` presented Summer Savings coherently, including 2.99% financing. Revalidate before citing either that state or obsolete 5.48% drift as current.
- On 2026-08-15, `/quote/motor-selection` rendered on desktop and 390×844 with no overflow or lazy-load failure. Headless `LazyRouteBoundary` was unconfirmed monitoring evidence only; revalidate any current claim.
- Explicit `select` lists on public service-role APIs are not live select-star bugs.
- A disabled client login limiter is not proof Supabase Auth lacks server-side rate limiting.

Codex should preserve and review the already-ready current-main lanes (#300, #290, #288, and #335), preserve accepted draft #332 and its release sequence, repair #315's closed-base dependency, and pause for Jay's Lightspeed cron-credential decision before changing the function gate.

---

## 13. Deep-dive addenda (2026-08-15)

Three parallel read-only passes (architecture/funnel, security/privacy, SEO/UX) added P0-8 through P0-12. The 2026-08-15 execution-order review then **reclassified** several of those items (see §0.1). Extra notes that did not need their own P0:

- **Dual quote step numbering:** UI stepper IDs in `src/components/quote-builder/quote-progress-steps.ts` (1–10) do not match `isStepAccessible` / `COMPLETE_STEP` in `QuoteContext.tsx` (1–7). Unify before adding funnel analytics.
- **`/motor-selection` hub** (`MotorSelectionHub.tsx`) still targets “Mercury Boats Canada” and canonicalizes to `/quote/motor-selection` — leftover cannibalization from Semrush Move 8.
- **Legacy IndexNow key files** still sit in `public/` (`49bc7cd00f19df4a2f94c8d0b3d227a9.txt`, `6d0483cd20672e0e2b1cebf7f74c5a8f.txt`). Active key is `03999430e4bae3d7d7be108f62646dbf`.
- **FAQ pages** (`FAQ.tsx` is DOMPurify’d; `MercuryRepowerFAQ.tsx` / `RepowerFAQ.tsx` are not) use `dangerouslySetInnerHTML` on static `faqData`. Fine until that data is CMS-editable.
- January 2025 security reports are **stale**: they claim 7-day resume tokens (now 30), `ProtectedRoute` on all admin (now mixed), and “no client-side role checks” (false). Archive or stamp them historical. Do not use them to revoke `encrypt_sin` or to treat shared-quote and financing-resume as one finding.

---

*End of handoff. No production behavior was changed by this audit. Implementation belongs on separate branches from `origin/main`, not on this documentation PR.*
