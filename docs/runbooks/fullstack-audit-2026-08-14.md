# Full-stack audit — mercuryrepower.ca

**Date:** 2026-08-14  
**Repo:** [harrisboatworks/mercury-builder-pro](https://github.com/harrisboatworks/mercury-builder-pro)  
**Live:** https://www.mercuryrepower.ca  
**Build probed:** `8cbf8edf507c7fad885d74e641bdcd531b745308`  
**Scope:** Security, SEO/crawl, content integrity, performance, accessibility, conversion, backend/ops, deploy/CI, compliance.  
**Method:** Live HTTP probes + source review + existing check/script inventory. No exploit PoCs.

This is a delta audit. Financing security (Jan 2025) and the May 2026 customer-facing audit remain the baselines; this pass verifies what is still true on production.

---

## Executive summary

The site is a mature Vite + Vercel + Supabase stack with unusually strong publishing integrity (blog checks, markdown twins, agent APIs, prerender). Production is up: apex → www 301s, quote funnel and blog prerender, public motors API (`count: 101`), 543 sitemap URLs.

The highest-impact live bug was **`/financing` serving homepage HTML** (same etag as `/`). Client-side it redirected to `/finance-calculator`; crawlers and no-JS users saw a homepage clone. That is fixed in this PR as a 301.

No critical data-exposure (SIN decrypt remains admin-gated; anon key only in the client). Three **High** findings remain in edge functions (Dropbox OAuth token return, quote-email SSRF via `pdfUrl`, origin-only email gates). Those need a dedicated hardening PR — not patched here because they change auth contracts.

---

## What is already strong

| Area | Evidence |
|---|---|
| Host consolidation | `mercuryrepower.ca` and `quote.harrisboatworks.ca` 301 → www; HTTP 308 → HTTPS |
| HSTS | `max-age=63072000` on Vercel HTML |
| Quote / motors APIs | `/api/agents/motors` 200, CAD, CORS-open by design |
| Publishing gates | `prebuild` runs leak, hygiene, hreflang, range, links, ZH, timeline, credibility, pricing drift, OG, responsive images |
| Financing | Origin check, body cap, rate limits, `stripSin` on drafts, pgsodium encrypt, admin-only decrypt |
| Payments | Stripe webhook signature; deposit path binds motor server-side |
| SMS | `requireAdmin` + per-IP/recipient limits |
| Admin UI | Most `/admin/*` routes use `SecureRoute requireAdmin={true}` |
| Schema / AI surface | `/llms.txt`, `/.well-known/ai.txt`, `/.well-known/mcp.json`, motor/location/case-study `.md` twins |
| LCP | Homepage preloads `/assets/optimized/landing-step-pick-800w.webp` |
| Unknown URLs | Real `404.html` (not homepage) |
| Motor count schema | `MotorSelectionSEO` no longer hardcodes 128 |

---

## Findings

Severity: **High** / **Medium** / **Low** / **Info**.  
Status: **Fixed in this PR** or **Open**.

### Security

| ID | Sev | Status | Finding |
|---|---|---|---|
| S1 | High | Open | `dropbox-oauth` exchanges a code and returns `access_token` with no admin JWT and `CORS *`. Gate with `requireAdmin` or signed state; store tokens server-side. `supabase/functions/dropbox-oauth/index.ts` |
| S2 | High | Open | `send-quote-email` fetches caller-supplied `pdfUrl` (SSRF). Allowlist storage/CDN hosts; reject private IPs. `supabase/functions/send-quote-email/index.ts` |
| S3 | High | Open | Email/lead functions treat `Origin`/`Referer` as auth. `origin-check.ts` documents this is forgeable. Need JWT, signed session, or CAPTCHA on write paths. |
| S4 | Medium | **Fixed** | No `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, or `Permissions-Policy` on HTML. Added in `vercel.json`. CSP deferred (GA4 / Stripe / Supabase / ElevenLabs / fonts). |
| S5 | Medium | Open | `requireAdmin` accepts raw `SUPABASE_SERVICE_ROLE_KEY` as a Bearer token. Prefer `EDGE_INTERNAL_SECRET` / `CRON_SECRET` only. `supabase/functions/_shared/admin-auth.ts` |
| S6 | Medium | Open | `create-payment` validates motor price; accessories / install / trade-in still trusted from the client. |
| S7 | Medium | **Fixed** | `/admin/blog` used `SecureRoute` without `requireAdmin`. RLS should still block data; UI is now admin-gated. |
| S8 | Medium | Open | `.env` is tracked (publishable/anon key only today). Add `.env` to `.gitignore` + `.env.example` so a future service-role commit cannot land. |
| S9 | Medium | Open | `get-shared-quote` and UCP `GET /checkout-sessions/{id}` return PII given only a UUID. Add rate limits + share secrets. |
| S10 | Medium | Open | DB email templates in `send-quote-email` substitute user fields without `esc()`. Hardcoded templates already escape. |
| S11 | Medium | Open | `send-quote-email` can append `customer_quotes.notes` by `quote_number` with no ownership check. |
| S12 | Low | Open | Rate limiter fails open on DB errors (except `public-quote-api` `build_quote`). Fail closed on email/SMS/lead writes. |
| S13 | Low | Open | Widespread `Access-Control-Allow-Origin: *` on edge functions and live HTML. Keep `*` on public catalog; restrict write endpoints. |
| S14 | Low | Open | FAQ landing pages use `dangerouslySetInnerHTML` without DOMPurify (`FAQ.tsx` already purifies). |
| S15 | Info | Open | `vercel.json` publishes the Supabase project ref and function names (expected for agent APIs). |

### SEO / crawl / live production

| ID | Sev | Status | Finding |
|---|---|---|---|
| P1 | High | **Fixed** | `/financing` returned homepage HTML (`page-id=HOME`, same etag as `/`). App already `<Navigate to="/finance-calculator">`. Edge now 301s. Real explainer remains `/repower/financing`. |
| P2 | Medium | **Fixed** | `security.txt` Canonical still pointed at `quote.harrisboatworks.ca` (which 301s to www). |
| P3 | Medium | **Fixed** | `/admin` and `/admin/*` served 200 homepage HTML. `robots.txt` already disallows `/admin`; added `X-Robots-Tag: noindex, nofollow`. Auth remains client-side after JS (expected SPA). |
| P4 | Medium | **Fixed** | Language blog indexes (`/blog/zh`, `/fr`, `/ko`, `/es`, `/hi`, `/pa`) were live but missing from sitemap static entries. Posts were listed; hubs were not. |
| P5 | Low | **Fixed** | GTM placeholder comment contradicted live GA4 `G-0JNMHD89YJ`. Comment now says: do not add GTM without removing inline gtag. |
| P6 | Low | Open | `/privacy` and `/terms` have correct titles but stub noscript bodies. Fine after JS; weak for no-JS / some crawlers. Prerender full legal text. |
| P7 | Low | Open | RSS `lastBuildDate` 2026-08-11 vs sitemap lastmod 2026-08-13. |
| P8 | Info | Open | HSTS lacks `includeSubDomains` / `preload`. Confirm no other apex subdomains before enabling. |
| P9 | Info | Open | Agent API JSON still cites `https://mercuryrepower.ca/agents` (apex; 301s). Prefer www. |
| P10 | Info | **Fixed** | `robots.txt` “Last updated” was 2026-07-15. |

### Content / conversion / UX

| ID | Sev | Status | Finding |
|---|---|---|---|
| C1 | Medium | Open | May 2026 audit: no dedicated `/compare/mercury-vs-yamaha` (etc.) landing pages. `/compare` is an in-catalog motor comparer, not competitive SEO pages. Blog covers the topics. |
| C2 | Medium | Open | Homepage still stacks a full-width “Call (905) 342-2153” next to “Build Your Quote” (`Index.tsx`). Dilutes primary CTA on mobile. |
| C3 | Medium | Open | “7-year warranty” copy is promo-conditional. Bind to live promo data or hedge (“up to 7-year with current promotions”). |
| C4 | Low | Open | May item: public motors feed historically missing images for most SKUs. Re-check `imageUrl` on the live 101-motor feed and backfill `hero_image_url`. |
| C5 | Low | Open | Human-facing motor pages still lack a “specs sourced from Mercury Marine brochures · verified [date]” footnote (AI surfaces already say this). |
| C6 | Info | Open | GTM still not installed. If marketing needs it, add a container and remove inline GA4. |

### Performance

| ID | Sev | Status | Finding |
|---|---|---|---|
| F1 | Medium | Open | HTML `Cache-Control: public, max-age=0, s-maxage=1` — correct for freshness, expensive for TTFB/CDN. Consider `s-maxage=60` + stale-while-revalidate on prerendered marketing pages. |
| F2 | Low | Open | Render-blocking Google Fonts stylesheet (Inter + Inter Tight + Outfit + Playfair). Subset / self-host / `font-display: optional` for LCP. |
| F3 | Info | OK | Homepage HTML ~13 KB; LCP webp ~15 KB, immutable cache. Asset hashing looks healthy. |

### Accessibility

| ID | Sev | Status | Finding |
|---|---|---|---|
| A1 | Medium | Open | Financing a11y work (Phase E.9, Nov 2025) is form-scoped. Marketing/quote builder needs a current Lighthouse + keyboard pass (focus order, skip link, contrast on `bg-primary/80` CTA bands). |
| A2 | Low | Open | `color-scheme: light only` is fine; confirm form errors are not color-only. |

### Backend / ops / CI

| ID | Sev | Status | Finding |
|---|---|---|---|
| O1 | Info | OK | CI: Vitest on PR/main; scheduled blog integrity, pricing drift, growth, promo-quote, chat-voice, live readback. Strong. |
| O2 | Info | Open | 100+ edge functions. Several admin scrapers/syncs (`scrape-mercury-*`, Dropbox, Lightspeed) must stay `requireAdmin` or cron-secret gated — spot-check any new function the same way as `send-sms`. |
| O3 | Info | Open | Service-worker is a retirement worker (correct). `/manifest.json` 404s; live file is `/site.webmanifest`. |

### Dependencies (`npm audit --omit=dev`)

| ID | Sev | Status | Finding |
|---|---|---|---|
| D1 | Medium | Open | 19 high, 0 critical in production tree (2026-08-14). Notable: `react-router` / `@remix-run/router` XSS + open-redirect advisories; `vite` dev-middleware file serve; `ws` memory issues; `lodash` / `serialize-javascript` injection. Most are transitive. Do **not** `npm audit fix --force`. Review `react-router-dom` upgrade path first (this app uses `^6.30.1`). |

### Compliance

| ID | Sev | Status | Finding |
|---|---|---|---|
| L1 | Medium | Open | Financing resume token is the sole gate to employment/financial PII (SIN stripped on draft load — good). Confirm privacy policy describes token links, retention, and admin SIN access. |
| L2 | Low | Open | Privacy/terms not fully in prerendered HTML (see P6). |

---

## Fixes shipped in this PR

1. **301 `/financing` → `/finance-calculator`** in `vercel.json`; removed the `/index.html` rewrite that cloned the homepage.
2. **`requireAdmin` on `/admin/blog`**.
3. **Baseline security headers** on all routes (nosniff, referrer, SAMEORIGIN, camera/geolocation Permissions-Policy). Microphone left unrestricted for voice.
4. **`X-Robots-Tag: noindex, nofollow` on `/admin`**.
5. **`security.txt` Canonical → www**.
6. **Sitemap language hubs** in both `static-prerender.mjs` and `generateSitemap.ts`.
7. **GA4/GTM comment** aligned with production.
8. **`robots.txt` date** bumped.

Not changed here (need product/auth design): S1–S3, S5–S6, S8–S12, payment line-item recompute, CSP, GTM install, competitive compare landings, homepage CTA stack.

---

## Suggested next hardening PR (priority order)

1. Lock `dropbox-oauth` (S1) and allowlist `pdfUrl` (S2).
2. Signed tokens or CAPTCHA on `send-quote-email` / `send-saved-quote-email` / contact/lead writes (S3).
3. Server-recompute accessories + install + trade-in in `create-payment` (S6).
4. Stop treating service_role JWT as an admin user (S5).
5. Prerender full privacy/terms; add competitive compare landings if Jay wants that SEO bet.
6. Review `react-router-dom` / Vite advisories (D1) before a blanket audit-fix.

---

## How to re-run this audit

```bash
# Live headers / redirects
curl -sI https://mercuryrepower.ca/
curl -sI https://www.mercuryrepower.ca/financing
curl -sI https://www.mercuryrepower.ca/.well-known/security.txt

# Repo gates (subset; full `npm run build` is the source of truth)
npm test
npm run check:publishing-integrity
npm run check:structured-data
```

Existing live canaries: `growth:check`, `check:promo-quote-live`, `check:quote-activity-live`, `check:chat-voice-knowledge-live`, `check:blog-live-readback`.
