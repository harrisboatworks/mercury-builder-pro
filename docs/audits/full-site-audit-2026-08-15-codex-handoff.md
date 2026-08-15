# Full Site Audit — mercuryrepower.ca

**Handoff for Codex review**  
**Date:** 2026-08-15  
**Auditor:** Cursor Cloud Agent (code + live-site read, no production writes)  
**Repo:** `harrisboatworks/mercury-builder-pro`  
**Live origin:** https://www.mercuryrepower.ca  
**Lovable project:** https://lovable.dev/projects/bc5f0a45-f6d8-495a-8ac7-81047b4a4121  
**Constraint for this document:** audit only. This PR adds the report. It does not change product code, pricing, inventory, auth, Edge Functions, cron, or MCP contracts.

---

## 0. How Codex should use this

This is a review brief, not a punch list to blindly implement.

1. Treat **Section 2 (do not regress)** as hard constraints.
2. Treat **Section 5 (P0/P1)** as the work queue. Confirm each finding before coding.
3. Ask Jay before anything in **Section 8 (business decisions)**.
4. Prefer the smallest safe change. Do not start a rewrite of `blogArticles.ts`, the quote funnel, or the prebuild pipeline unless Jay explicitly scopes it.
5. After any change, run the relevant existing contract tests listed in Section 10. Do not invent a new test framework.

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

## 3. Live-site snapshot (2026-08-15)

Checked from this environment against `https://www.mercuryrepower.ca`.

| URL | Result |
| --- | --- |
| `/` | 200. Hero + dual CTAs (Build Quote + Call). Trust/process/heritage sections render. |
| `/quote/motor-selection` | 200 HTML (~14 KB prerender). Headless fetch also surfaced the `LazyRouteBoundary` card ("Couldn't load this page"). Treat as a **hydration / chunk-load risk**, not a confirmed production outage. Verify in a real browser and in Lighthouse. |
| `/promotions` | 200. Visible hero is TD 5.48% APR through 2026-12-31. Prerendered SEO block still describes a Summer Savings rebate (Jul 15–Aug 31, 2026) and 2.99% / 24 mo. Mixed offer story. |
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

Missing on HTML (defined in code but not applied at the edge): `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.

**Public motors feed (live)**

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
- `/admin/blog` uses `SecureRoute` **without** `requireAdmin` — see P0
- Login paths: `/auth` and `/login` both exist

### 4.3 Admin surface

~25 admin routes (quotes, financing, SIN test, Zapier, email, SMS, inventory, stock sync, connectors, growth agent, SEO health, options catalog, pricing import, image update, blog). All except `/admin/blog` set `requireAdmin={true}`.

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

#### P0-1. `/admin/blog` is not admin-gated

**Evidence:** `src/App.tsx` line ~629:

```tsx
<Route path="/admin/blog" element={<SecureRoute><AdminBlog /></SecureRoute>} />
```

Every other `/admin/*` route passes `requireAdmin={true}`. `AdminBlog` (`src/pages/AdminBlog.tsx`) queries `blog_subscriptions` (emails, names) and can trigger send-notification.

**Action**

1. Add `requireAdmin={true}`.
2. Confirm RLS on `blog_subscriptions` denies non-admin SELECT/UPDATE even if the route is hit.
3. Confirm the notify Edge Function also checks `has_role`.

**Do not** rely on the React gate alone.

#### P0-2. Client login rate-limit is intentionally disabled

**Evidence:** `src/components/auth/SecureAuth.tsx`

```ts
// Rate limiting check - temporarily disabled for debugging
// TODO: Implement proper rate limiting with IP-based tracking
return true;
```

**Action:** Do not re-enable a client-only counter and call it done. Rate-limit on the Supabase Auth / Edge side (IP + email). Then delete the dead TODO so it does not look implemented.

#### P0-3. Browser security headers are defined but not served on the site

**Evidence:** `src/lib/securityMiddleware.ts` exports `SECURITY_HEADERS` (CSP, `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy, Permissions-Policy). Live HTML responses from Vercel do **not** include them. They are only applied in a few `/api/*.js` serverless files.

Also: the unused CSP allows `'unsafe-eval'` and `cdn.jsdelivr.net`, and `Permissions-Policy` disables `microphone` and `payment` — applying that CSP/Permissions-Policy blindly would break Stripe and ElevenLabs voice.

**Action:** Add a **tested** header set in `vercel.json` (or middleware) that matches what the app actually loads (Supabase, Stripe.js, analytics, fonts, voice). Do not copy-paste the current `SECURITY_HEADERS` object onto HTML.

Minimum safe first pass:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: DENY` or CSP `frame-ancestors 'none'` (confirm no legit iframe embed)
- Then a CSP in report-only

#### P0-4. README still tells operators to curl Lightspeed sync with the service role key

**Evidence:** `README.md` "Manual Inventory Sync Trigger" block.

**Action:** Replace with an admin-UI or authenticated function invoke. Never document pasting `SERVICE_ROLE_KEY` into a local terminal in the public repo.

#### P0-5. Public Edge Functions run as service role with CORS `*`

**Evidence:** `public-motors-api`, `public-quote-api`, MCP, UCP. Intentional for AI agents, but any future column added to the `select(...)` list becomes world-readable. `public-quote-api` can insert leads (`build_quote`) behind a fail-closed rate limit — good, keep it fail-closed.

**Action:** Audit every `.select(...)` on these functions. Keep the column list explicit. Add a comment + test that PII tables are never queried here. Do not "simplify" to `select('*')`.

#### P0-6. Financing / SIN — treat older audit reports as stale

`SECURITY_AUDIT_REPORT.md` and `FINAL_SECURITY_AUDIT_REPORT.md` are dated January 2025 and claim "all medium findings resolved." They are useful history, not a current attestation.

**Action for Codex security pass (read-only first):**

- Re-read `encrypt_sin` / `decrypt_sin` / `has_role` / `sin_audit_log` migrations
- Confirm resume tokens expire and are single-use
- Confirm `financing_applications` cannot be listed by anon
- Confirm `/admin/sin-encryption-test` cannot be reached by a non-admin and consider removing it from prod

Do **not** write exploit PoCs. Do **not** log real SINs.

#### P0-7. Stripe deposit amounts are mapped in code

**Evidence:** `supabase/functions/create-payment/index.ts` `DEPOSIT_PRICES` maps `"100"|"200"|"500"|"1000"|"2500"` to Stripe price IDs. Express `$100` is bound to motor id `e920cfdf-223a-408a-850b-6f112e15c4d7` / model `1A10201LK`.

**Action:** If touching payments, keep the express-motor binding and origin allowlist tests green. Do not accept arbitrary dollar amounts from the client.

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

#### P1-3. Motor feed quality is still weak for AI + Product schema

Live `/api/agents/motors` (2026-08-15): 65 / 101 images missing; 5 relative URLs; shaft/control almost entirely null; all canonical URLs are apex.

May 2026 audit #1 (22/25 missing images) is **not fixed** — the catalog grew and the gap grew with it.

**Action**

1. Backfill `hero_image_url` / `image_url` via existing Dropbox sync (data, not a new feature).
2. In `public-motors-api`, absolutize relative paths against `https://www.mercuryrepower.ca`.
3. Emit `www` URLs, not apex (apex 301s).
4. Populate shaft/control from `shaft` / `shaft_code` / `control_type` already selected in the query — the columns are fetched and then dropped.

#### P1-4. Promotions page tells two stories at once

Live hero: **5.48% APR through Dec 31, 2026**.  
Prerendered / schema-ish block: **Summer Savings rebate up to $700 + 2.99% / 24 months, Jul 15–Aug 31, 2026**.

Today is 2026-08-15, so the summer window may still be live — but the hero does not mention it. Buyers and AI agents will quote different offers.

**Action:** One source of truth (`useActivePromotions` / promo tables). Hero, rebate matrix, FAQ, `llms.txt`, and prerender must render the **same** active offers. If summer rebate is live, it belongs in the hero. If it expired, purge the prerender copy.

`src/components/promotions/TDAlwaysOnOffer.tsx` already has a dated `OFFER_END_ISO` and a 2027 TODO. Use that pattern for every promo block.

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

#### P1-8. Quote motor-selection is a god page

`MotorSelectionPage.tsx` (1778) + `MotorSelection.tsx` (2084) + configurator modal (939) + details sheet/modal (1100–1266). This is the money page. Headless fetch hit `LazyRouteBoundary`, which only fires when a lazy import throws.

**Action (careful):**

1. Reproduce in Chrome + Safari + a mid-range Android. Check console for chunk `Failed to fetch dynamically imported module`.
2. If real, `lazyWithRetry` is already used for TradeIn — extend the same pattern to `MotorSelectionPage`.
3. Do **not** start a visual redesign. Split only if Jay wants a maintainability pass, and keep the UX contract tests green.

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
| 1 | Motor images missing | **Still open** (worse: 65/101) |
| 2 | Mobile dual CTA | **Still open** |
| 3 | Competitive comparison pages | **Partial** (blog, not `/compare/...` routes) |
| 4 | Markdown twins vs catalog | **Improved** (generator in build). Confirm twins for all 101 feed slugs. |
| 5 | Verado example in `llms.txt` | **Fixed** |
| 6 | Stale `ai.txt` date | **Fixed** (Lightspeed line present) |
| 7 | `motorCount = 128` | **Fixed** |
| 8 | Provenance footnote on motor pages | **Unknown / likely open** — confirm on a live `/motors/{slug}` |
| 9 | "7-year warranty available" on homepage | **Fixed** (3-year + extended) |
| 10 | Missing tools / Legend / agents | **Partial** (`/tools`, `/agents` exist; no `/legend-boats`; no serial decoder) |

### Semrush plan — 2026-06-29

Moves 1, 2, 3, 6, 8 still open. 4 and 5 partial. 7 is outreach, not code.

### Financing security reports — Jan 2025

Historical. Re-verify. Do not cite them as current proof.

---

## 7. Suggested Codex execution order

If Jay says "start fixing," do this sequence. Stop after each band for a review.

### Band A — close the obvious holes (low design risk)

1. P0-1 admin blog `requireAdmin`
2. P0-4 README service-role curl
3. Add `.env` to `.gitignore` (keep a committed `.env.example` with empty values; do not rewrite history unless Jay asks)
4. P1-12 www URLs in public motors/quote APIs
5. P1-3 absolutize image URLs + pass through shaft/control already in the query
6. P1-5 hours from one source
7. P1-11 sitemap / `llms.txt` cache headers (after checking Vercel header merge)

### Band B — needs a 10-minute Jay copy/business nod

1. P1-1 homepage title + stable H1
2. P1-2 schema URL + `@type`
3. P1-4 promotions hero vs summer rebate
4. P1-6 mobile CTA hierarchy
5. P0-3 security headers (CSP will break something if guessed)

### Band C — only with an explicit scope

1. Motor image backfill (data / Dropbox, not a new uploader)
2. Serial decoder tool (Semrush Move 3)
3. HP hub pages for missing classes
4. Cannibalization 301 map (`/mercury-outboards-ontario` vs `/` vs `/quote/motor-selection` vs `mercuryoutboards.ca`)
5. Quote page split / LazyRouteBoundary investigation
6. SIN / RLS re-audit
7. Edge Function inventory

---

## 8. Ask Jay before doing

- Homepage title/H1 rewrite (brand vs "repower" positioning)
- Whether mercuryrepower.ca should host Legend boat sales content
- Whether `LocalBusiness` should live on this domain or only on harrisboatworks.ca
- Summer Savings rebate: still sell it or kill the prerender copy
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
- Admin: confirm `/admin/blog` redirects a non-admin user to `/`

---

## 11. Key file index

| Path | Why it matters |
| --- | --- |
| `src/App.tsx` | Full route table, DEV gates, admin blog miss |
| `src/contexts/QuoteContext.tsx` | Quote state machine |
| `src/pages/quote/*` | Funnel |
| `src/pages/quote/__tests__/quote-funnel-ux-contract.test.ts` | Do not break |
| `src/components/auth/SecureRoute.tsx` | Admin gate |
| `src/components/auth/SecureAuth.tsx` | Disabled rate limit |
| `src/components/seo/GlobalSEO.tsx` | Org / LocalBusiness JSON-LD |
| `src/components/seo/HomepageSEO.tsx` | Title wiring |
| `src/data/seoPageMetadata.json` | Homepage title |
| `src/components/repower/HeroRepower.tsx` | H1 rotation, dual CTA |
| `src/pages/Index.tsx` | Homepage composition |
| `src/components/promotions/TDAlwaysOnOffer.tsx` | 5.48% program + expiry |
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

The site is a real production system: live CAD quotes, Stripe deposits, financing with SIN encryption, a large Ontario-focused blog, and an AI-agent surface most dealers do not have. The May/June audits already fixed the worst SEO lies (Verado URL, fake 128-motor count, unconditional 7-year badge).

What is still hurting:

1. **Auth hole** on `/admin/blog` (any logged-in user).
2. **Homepage still ranks for a phrase nobody searches**; H1 rotates after hydration.
3. **101-motor public feed** is image-poor, shaft-blind, and uses apex URLs.
4. **Promotions** can say 5.48% and 2.99%+$700 in the same response.
5. **Security headers** exist in a file and not on the site; the file's CSP would break payments/voice if applied raw.
6. The **quote page is oversized** and showed a lazy-load error boundary to a headless client — needs a real-browser confirm.
7. **Build/content** is held together by a very large `blogArticles.ts` and a long prebuild gauntlet. That is a feature until someone bypasses it.

Codex should start at Band A, then pause for copy/business calls on Band B.

---

*End of handoff. No production behavior was changed by this audit.*
