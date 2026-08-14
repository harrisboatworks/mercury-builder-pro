# Codex brief — mercuryrepower.ca fullstack audit

**For:** Codex (implement remaining open items)  
**From:** Cursor cloud agent, 2026-08-14  
**Repo:** `harrisboatworks/mercury-builder-pro`  
**Live:** https://www.mercuryrepower.ca  
**Source audit:** `docs/runbooks/fullstack-audit-2026-08-14.md`  
**Already-shipped PR:** https://github.com/harrisboatworks/mercury-builder-pro/pull/314 (`cursor/fullstack-site-audit-c83a`)

This file is the implementation brief. The runbook above is the evidence. Do not re-audit from scratch. Do not redo items marked **SHIPPED**. Do not write exploit PoCs.

---

## Mission

Close the remaining **High** and safe **Medium** findings from the 2026-08-14 fullstack audit of mercuryrepower.ca / mercury-builder-pro.

Work in small PRs. Prefer one theme per PR (edge hardening ≠ homepage CTA ≠ compare landings).

---

## Hard constraints

- **Do not regress** PR #314: `/financing` 301, `/admin/blog` `requireAdmin`, security headers, `security.txt` www Canonical, sitemap language hubs, GA4 comment.
- **Do not** `npm audit fix --force`.
- **Do not** add a Content-Security-Policy unless you can prove GA4, Stripe, Supabase, ElevenLabs voice, and Google Fonts still work.
- **Do not** restrict `Permissions-Policy` microphone (voice widget).
- **Do not** change pricing, inventory rules, Verado special-order policy, CAD-only, or pickup-only copy without Jay.
- **Do not** commit `service_role`, Stripe, Twilio, Resend, or Dropbox secrets.
- Origin check is **not** authentication (`supabase/functions/_shared/origin-check.ts`). Treat it as defense-in-depth only.
- Keep `prebuild` / publishing integrity green. If you touch sitemap routes, update **both** `scripts/static-prerender.mjs` (`staticSitemapEntries`) and `src/utils/generateSitemap.ts`.
- Tests: `npx vitest run` for any new contract tests. Pattern: `src/pages/fullstackAuditFixes.test.ts`.

---

## Do not regress (already strong)

- Apex + `quote.harrisboatworks.ca` → www 301; HTTP → HTTPS 308
- Financing: origin check, body cap, rate limits, `stripSin` on drafts, pgsodium encrypt, admin-only decrypt
- Stripe webhook signature verification; deposit path binds motor server-side
- `send-sms` uses `requireAdmin` + per-IP/recipient limits
- `MotorSelectionSEO` no longer hardcodes `motorCount = 128`
- Real `404.html` for unknown paths
- Public motors/agent APIs are intentionally CORS-open **reads**
- Retirement service worker at `/sw.js` (do not turn it back into a caching PWA)

---

## SHIPPED in PR #314 — do not redo

| ID | What landed |
|---|---|
| P1 | `vercel.json` 301 `/financing` → `/finance-calculator`; homepage rewrite removed |
| S4 | `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options: SAMEORIGIN`, `Permissions-Policy: camera=(), geolocation=()` |
| S7 | `/admin/blog` now `SecureRoute requireAdmin={true}` |
| P2 | `public/.well-known/security.txt` Canonical is www |
| P3 | `X-Robots-Tag: noindex, nofollow` on `/admin` and `/admin/(.*)` |
| P4 | Sitemap hubs: `/blog/zh`, `/fr`, `/ko`, `/es`, `/hi`, `/pa` |
| P5 | `index.html` GA4 comment (GTM not installed; do not double-count) |
| P10 | `robots.txt` date 2026-08-14 |

Regression tests live in `src/pages/fullstackAuditFixes.test.ts`. Keep them passing.

---

## Work packets (do these)

Each packet is a standalone Codex task. Mark **DO NOW** vs **ASK JAY**.

### Packet A — Edge function hardening (DO NOW, High)

**Goal:** Stop unauthenticated token leakage and SSRF. Do not break admin Dropbox image flow or legitimate quote emails.

#### A1. `dropbox-oauth` must not return raw tokens to anonymous callers

**File:** `supabase/functions/dropbox-oauth/index.ts`  
**Today:** Exchanges `code` for Dropbox `access_token`, returns it in JSON, `CORS *`, no `requireAdmin`.  
**Do:**

1. Read how `/admin/motor-images` (or Dropbox admin UI) calls this function before changing the contract.
2. Preferred: frontend receives the OAuth `code`, then calls this function **with admin JWT**; function uses `requireAdmin` from `supabase/functions/_shared/admin-auth.ts`.
3. Store tokens server-side (existing Dropbox config table / vault pattern in `get-dropbox-config`). Return `{ ok: true }` not `access_token`.
4. Restrict CORS to the browser-origin allowlist (`_shared/browser-origin.ts` / `_shared/cors.ts` pattern used by `create-payment`).
5. If the current flow is a Dropbox redirect **directly** onto this function (no JWT), do **not** blindly add `requireAdmin` — that will break OAuth. Use a signed `state` issued to an admin session instead.

**Done when:** Anonymous `POST`/`GET` with a fake code does not return a token shape. Admin path still works. Add a focused test or a comment + manual checklist in the PR if Deno tests are not wired.

#### A2. `send-quote-email` `pdfUrl` allowlist (SSRF)

**File:** `supabase/functions/send-quote-email/index.ts` (URL parse ~L31, `fetch(emailData.pdfUrl)` ~L246–269)  
**Do:**

1. Allow only HTTPS URLs on known hosts: this project's Supabase storage (`eutsoqdpjurknjsshxes.supabase.co`), `www.mercuryrepower.ca`, and any existing quote-PDF bucket host you find in code.
2. Reject `localhost`, private/link-local IPs, metadata hosts, non-HTTPS, and redirects off-allowlist.
3. Prefer fetching by storage path + service-role download instead of a raw URL if that path already exists.

**Done when:** A `pdfUrl` of `https://example.com/x.pdf` is rejected. A real quote PDF host still attaches.

#### A3. HTML-escape DB email template variables + stop unauth note writes

**Same file:** `send-quote-email/index.ts`

1. `replaceTemplateVariables` must run the existing `esc()` on every substituted value (customerName, motorModel, etc.). Hardcoded templates already escape — DB templates do not.
2. The `customer_quotes.notes` update by `quote_number` (~L277–283) must require admin JWT **or** prove quote ownership/session. No anonymous append.

**Done when:** `<img src=x>` in `customerName` cannot become a raw tag in the DB-template path; notes update without auth is 401/403.

---

### Packet B — Write-path auth (DO NOW, High, careful)

**Goal:** Origin is forgeable. Add a second factor on email/lead writes without breaking the public quote funnel.

**Files:**

- `supabase/functions/_shared/origin-check.ts` (read; do not pretend this is auth)
- `supabase/functions/send-quote-email/index.ts`
- `supabase/functions/send-saved-quote-email/index.ts`
- `supabase/functions/send-contact-inquiry/index.ts` (no origin check today)
- `supabase/functions/submit-quote-lead/index.ts` (no origin check today)

**Do (pick the lightest option that works):**

1. **Best:** signed short-lived token issued when the quote/session is created (server), required on send.
2. **Acceptable:** Turnstile/CAPTCHA on contact + quote-email.
3. **Minimum:** keep origin check **and** fail-closed rate limits + honeypot (lead already has honeypot) + per-recipient caps. Then document residual risk.

Also fail-closed on rate-limit DB errors for these write paths (`_shared/rate-limit.ts` currently fails open). Mirror `public-quote-api` `build_quote` fail-closed behavior.

**ASK JAY** before adding a visible CAPTCHA on the quote success email button.

**Done when:** A curl with `Origin: https://www.mercuryrepower.ca` and no session/CAPTCHA cannot send unbounded mail. Honest users on www still can.

---

### Packet C — Payments + admin-auth blast radius (DO NOW, Medium)

#### C1. Recompute quote line items in `create-payment`

**File:** `supabase/functions/create-payment/index.ts` (~L417–506)  
Motor price is validated. Accessories, installation, trade-in are still client-trusted (“server-validated in future iterations”).

**Do:** Recompute accessory + install + trade-in from catalog / quote row the same way the deposit path binds the motor. Reject mismatches.

**Done when:** Tampered `installationCost` / `accessoryCosts` / `tradeInCredit` cannot underprice a Stripe session.

#### C2. Stop treating service_role JWT as an admin user

**File:** `supabase/functions/_shared/admin-auth.ts` (~L24–29)

**Do:** Remove `if (jwt === serviceRoleKey) return { userId: 'service_role' }`. Cron/automation must use `x-internal-secret` (`EDGE_INTERNAL_SECRET` / `CRON_SECRET`) which is already supported at the top of `requireAdmin`. Grep callers that send service_role as Bearer and switch them to the internal secret header.

**Done when:** Bearer = service_role key is 401. `x-internal-secret` still works. Admin JWT still works.

---

### Packet D — Safe hygiene (DO NOW, Medium/Low)

Do these only if they stay mechanical.

| ID | Task | Files |
|---|---|---|
| S8 | Stop tracking `.env`. Add `.env.example` with placeholder keys only. Do **not** rewrite git history unless Jay asks. Confirm Vercel/CI already injects `VITE_SUPABASE_*`. | `.env`, `.gitignore`, new `.env.example` |
| S9 | Rate-limit `get-shared-quote`. Optional share token distinct from row UUID. Redact buyer on UCP GET if no session secret. | `supabase/functions/get-shared-quote/index.ts`, `ucp-checkout/index.ts` |
| S14 | Run FAQ HTML through DOMPurify like `src/pages/FAQ.tsx`. | `src/pages/landing/MercuryRepowerFAQ.tsx`, `src/components/repower/RepowerFAQ.tsx` |
| P6 / L2 | Prerender full privacy + terms into noscript (not a one-line stub). | `scripts/static-prerender.mjs`, `src/pages/Privacy.tsx`, `src/pages/Terms.tsx` |
| P7 | RSS `lastBuildDate` should track latest published article `dateModified` (generator already intends this — find why live RSS was 2026-08-11 vs sitemap 2026-08-13). | `src/utils/generateSitemap.ts` `generateRss`, `scripts/generate-rss.mjs` |
| P9 | Agent API `docs` / brand URLs must use `https://www.mercuryrepower.ca`, not apex. | `public-quote-api`, `agent-mcp-server`, `public/.well-known/mcp.json`, `llms.txt` |
| C2 (UX) | Mobile homepage: demote Call button to inline text link; keep “Build Your Quote” as the only filled CTA above the fold. Desktop can keep both. | `src/pages/Index.tsx` |
| C3 | Hedge warranty badge: “Up to 7-year warranty with current Mercury promotions” **or** bind to live promo data. No static “7-year warranty available” if promo can lapse. | Homepage + promo components; confirm against `/promotions` |

**ASK JAY** before S8 if any workflow still relies on committed `.env`.

---

### Packet E — ASK JAY before coding

| ID | Why Jay |
|---|---|
| C1 | Competitive compare landings (`/compare/mercury-vs-yamaha-outboards`, vs Honda, FourStroke vs Pro XS, 115 vs 150, Command Thrust vs standard). Blog already covers these. Needs sourced claims only. |
| C4 | Backfill `hero_image_url` on motors where `public-motors-api` `imageUrl` is null (live feed was 101 motors on 2026-08-14). Data/Dropbox, not a new scraper. |
| C5 | Human-facing motor page footnote: “Specs sourced from Mercury Marine official brochures · Last verified [date]”. |
| C6 | Install GTM. If yes, **remove** inline GA4 `G-0JNMHD89YJ` or traffic doubles. |
| F1 | Relax HTML cache from `s-maxage=1` to `s-maxage=60` + SWR on prerendered marketing pages only. |
| F2 | Self-host / subset Google Fonts (Inter, Inter Tight, Outfit, Playfair). |
| A1 | Full Lighthouse + keyboard pass on quote builder (not just financing). |
| D1 | `react-router-dom` ^6.30.1 open-redirect/XSS advisories. Upgrade only with a smoke of `/quote/*` and `/admin/*`. |
| L1 | Privacy policy wording for financing resume tokens + admin SIN access. |
| P8 | HSTS `includeSubDomains; preload` — only if no other `*.mercuryrepower.ca` hosts exist. |
| S13 | Narrow CORS `*` on HTML / write endpoints. Keep `*` on public catalog + markdown twins. |

---

## Full open-findings index (do not lose these)

Severity: High / Medium / Low / Info.

### Security

| ID | Sev | Packet | Finding |
|---|---|---|---|
| S1 | High | A1 | `dropbox-oauth` returns `access_token`, no admin, CORS `*` |
| S2 | High | A2 | `send-quote-email` fetches arbitrary `pdfUrl` |
| S3 | High | B | Email/lead writes trust forgeable Origin |
| S5 | Medium | C2 | `requireAdmin` accepts service_role Bearer as admin |
| S6 | Medium | C1 | `create-payment` trusts client accessories/install/trade-in |
| S8 | Medium | D | `.env` tracked (anon key only today) |
| S9 | Medium | D | Shared quote + UCP session GET leak PII given UUID |
| S10 | Medium | A3 | DB email templates unescaped |
| S11 | Medium | A3 | Unauth `customer_quotes.notes` append by quote number |
| S12 | Low | B | Rate limiter fails open on DB errors |
| S13 | Low | Jay | CORS `*` on HTML + most edge functions |
| S14 | Low | D | FAQ `dangerouslySetInnerHTML` without DOMPurify |
| S15 | Info | skip | `vercel.json` exposes Supabase project ref (expected) |

### SEO / live

| ID | Sev | Packet | Finding |
|---|---|---|---|
| P6 | Low | D | Privacy/terms noscript stubs |
| P7 | Low | D | RSS lastBuildDate lag |
| P8 | Info | Jay | HSTS no includeSubDomains/preload |
| P9 | Info | D | Agent JSON cites apex not www |

### Content / conversion

| ID | Sev | Packet | Finding |
|---|---|---|---|
| C1 | Medium | Jay | No Mercury-vs-Yamaha (etc.) landing pages |
| C2 | Medium | D | Mobile Call CTA competes with Build Quote |
| C3 | Medium | D | Static 7-year warranty copy is promo-conditional |
| C4 | Low | Jay | Motor feed images historically missing |
| C5 | Low | Jay | No human-facing spec provenance footnote |
| C6 | Info | Jay | GTM not installed |

### Perf / a11y / deps / compliance

| ID | Sev | Packet | Finding |
|---|---|---|---|
| F1 | Medium | Jay | HTML `s-maxage=1` |
| F2 | Low | Jay | Render-blocking Google Fonts |
| A1 | Medium | Jay | Quote-builder a11y pass still due |
| D1 | Medium | Jay | 19 high npm advisories, 0 critical; do not force-fix |
| L1 | Medium | Jay | Resume-token PII vs privacy policy |
| L2 | Low | D | Same as P6 |

---

## Suggested PR sequence

1. **codex/edge-hardening-oauth-ssrf** — Packet A  
2. **codex/write-path-auth** — Packet B  
3. **codex/payment-admin-auth** — Packet C  
4. **codex/audit-hygiene** — Packet D (CTA, FAQ purify, privacy prerender, www URLs, `.env.example`)  
5. Stop. Wait for Jay on Packet E.

---

## Acceptance (every Codex PR)

- [ ] `npx vitest run src/pages/fullstackAuditFixes.test.ts` passes
- [ ] No new `VITE_*` secrets; no service_role in `src/`
- [ ] `vercel.json` still 301s `/financing` → `/finance-calculator`
- [ ] `/repower/financing` and `/financing-application` still 200 after your changes
- [ ] PR description lists finding IDs closed (S1, S2, …)
- [ ] If you touch edge functions: note CORS + auth change and how to retest the admin or quote email path

## Live smoke (after deploy)

```bash
curl -sI https://www.mercuryrepower.ca/financing
# expect 301 Location: https://www.mercuryrepower.ca/finance-calculator

curl -sI https://www.mercuryrepower.ca/ | tr -d '\r' | grep -iE 'x-content-type-options|referrer-policy|x-frame-options|permissions-policy'

curl -s https://www.mercuryrepower.ca/.well-known/security.txt
# Canonical must be https://www.mercuryrepower.ca/.well-known/security.txt
```

---

## Context Jay already knows

- User: Jay, software engineer / Harris Boat Works.
- Domain: mercuryrepower.ca (www canonical). Repo name in GitHub is `mercury-builder-pro`.
- Stack: Vite React SPA, Vercel, Supabase edge functions, Lightspeed inventory, Stripe, Resend, ElevenLabs voice.
- Prior audits: `SECURITY_AUDIT_REPORT.md`, `FINAL_SECURITY_AUDIT_REPORT.md` (financing, Jan 2025); `docs/runbooks/customer-facing-audit-2026-05-01.md` (conversion/AI search). This brief is the 2026-08-14 delta plus implementation orders.
