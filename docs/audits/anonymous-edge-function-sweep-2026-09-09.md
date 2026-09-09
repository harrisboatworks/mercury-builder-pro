# Anonymous edge-function sweep — 2026-09-09

**Tree:** `origin/main` at `d23209b84` (`#519`)
**This document only reports.** It does not change product code, workflows, or migrations. It does not probe production. A live unauthenticated POST to `cron-failure-notifications` already sent a real Resend email today; this audit is the systematic check that should have happened before that.

Related:

- [#497](https://github.com/harrisboatworks/mercury-builder-pro/pull/497) hardened eight customer-facing send/spend paths this morning (origin and/or rate limit). It deliberately skipped four items that cannot be gated from this repo alone.
- [#520](https://github.com/harrisboatworks/mercury-builder-pro/pull/520) (`cursor/gate-cron-failure-notifications-20260909`) is the in-flight `requireAdmin` fix for `cron-failure-notifications`. Do not re-solve it here.

---

## Method (re-run this)

No production HTTP. Classification is from source only.

### Inventory

```sh
# Every deployable entry point in this tree
find supabase/functions -mindepth 2 -maxdepth 2 -name index.ts | wc -l

# Per-function platform JWT setting
rg -n '\[functions\.|verify_jwt' supabase/config.toml
```

This tree has **101** functions with `index.ts`. `supabase/config.toml` names **84**. Nineteen source functions have no `[functions.<slug>]` block. Two config slugs have no source (`firecrawl-inventory-agent`, `scrape-motor-images`).

The remembered “~140 deployed” figure was not re-checked. The Management API was not queried. Live registry slugs that exist only in production, or source slugs that were never deployed, are **undetermined**. A later Management API list would settle the gap; do not curl the functions themselves.

### How “anonymous-reachable” was decided

A function is **anonymous-reachable** when an internet caller who has only the **public anon key** (it is in the frontend and in historical cron SQL) can invoke the handler and reach a side effect.

These in-code gates count as *not* anonymous:

| Gate | Helper / pattern | Counts as |
| --- | --- | --- |
| Admin / cron / service-role identity | `_shared/admin-auth.ts` `requireAdmin` | Strong |
| Service-role bearer only | `_shared/send-notification-policy.ts` `handleServiceRoleRequest`, or a local `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` compare | Strong |
| Shared secret header | `x-internal-secret` === `EDGE_INTERNAL_SECRET` or `CRON_SECRET` (also accepted inside `requireAdmin`) | Strong |
| Dedicated bearer | `grok-supabase-read/security.ts` `authorize`, `x-agent-key` on `agent-quote-api` | Strong |
| Webhook signature | `_shared/twilio-signature.ts` `gateTwilioStatusCallback`; Stripe `stripe-signature` + `STRIPE_WEBHOOK_SECRET` | Strong |
| Origin allowlist | `_shared/origin-check.ts` `isAllowedOrigin` | **Not identity.** Stops casual browser cross-origin use. Any non-browser client can forge `Origin` / `Referer`. |
| Rate limit | `_shared/rate-limit.ts` `checkRateLimit`, or a direct `check_rate_limit` RPC | Volume bound only |

`requireAdmin` already accepts (1) `x-internal-secret`, (2) service-role bearer, (3) a user JWT whose `user_roles.role = admin`. That is the mechanical gate for internal jobs once their cron is rewritten to send the secret.

Inline copies of the same admin JWT + `user_roles` check (`universal-pricing-import`, `seo-health-check`, `auth-tiktok-callback`) were treated as equivalent to `requireAdmin`.

Capability tokens (unsubscribe token, email-open token, shared-quote UUID, `chat_<64hex>` session id) are not identity. They are listed under **intentional public**, not P1.

### What `verify_jwt` is set to

There is **no project-wide default** in `supabase/config.toml`. Every listed function sets `verify_jwt` itself.

**`verify_jwt = true` is not an authentication gate for this project.** The publishable anon key *is* a JWT signed with the project secret. The gateway accepts `Authorization: Bearer <anon key>`. `send-get7-campaign` already documents this:

> `verify_jwt = true` only proves the caller holds *a* valid JWT, and the anon …

So a function with only `verify_jwt = true` and no in-code gate is still anonymous-reachable to anyone who can load the website. That is easy to get wrong; several P1/P2 rows are in that bucket.

| `verify_jwt` in `config.toml` | Slugs |
| --- | --- |
| `true` (7) | `auth-health-summary`, `send-notification`, `mark-out-of-stock`, `scrape-mercury-portal`, `send-deposit-confirmation-email`, `send-get7-campaign`, `quote-document-api` |
| `false` (77) | every other `[functions.*]` block |
| Unlisted (19) | CLI default when deploying via `config.toml` is `true`. **Live value undetermined** without a Management API read. Treated here as “anon JWT still satisfies the gateway if the live flag is true; if it is false, the function is even more open.” |

Unlisted source slugs: `auto-image-enhancer`, `check-expiring-promotions`, `dropbox-chooser-upload`, `dropbox-file-handler`, `dropbox-oauth`, `fetch-part-images`, `get-dropbox-config`, `growth-agent-audit`, `indexnow-ping`, `migrate-motor-images`, `motor-health-monitor`, `optimize-motor-images`, `scrape-mercury-public`, `seo-health-check`, `sync-dropbox-folder`, `sync-inventory-api`, `sync-lightspeed-inventory`, `ucp-checkout`, `voice-create-quote`.

### Side-effect classes

Read each `index.ts` (and siblings in the same directory) for Resend / Twilio / OpenAI / ElevenLabs / Perplexity / Google / Firecrawl / Locally / Stripe / IndexNow calls, and for `.insert` / `.update` / `.delete` / `.upsert` / storage uploads.

- **SPENDS or SENDS** — money or a human contact (email, SMS, paid upstream).
- **WRITES** — database or storage mutation.
- **READS** — returns data. Flagged when the body looks like PII or dealer-internal fields.
- **NONE** — static / compute only.

### What was not done

- No `curl` or browser hit against `*.supabase.co/functions/v1/*`.
- No Management API compare of the live function list or live `verify_jwt`.
- No deploy. No fix PRs from this branch.

---

## Coverage

**Reviewed:** all **101** source functions that have `supabase/functions/<slug>/index.ts`. Shared helpers under `_shared/` were read when a function imported them for a gate.

**Not reviewed as source (no `index.ts` in this tree):**

| Slug | Why undetermined | What would settle it |
| --- | --- | --- |
| `firecrawl-inventory-agent` | Named in `config.toml` only | Find the source, or confirm the live function is a leftover and remove it |
| `scrape-motor-images` | Named in `config.toml` only | Same |
| Any live slug not in this tree | User-cited ~140 vs 101 source | Management API function list (read-only). Do not invoke them. |

If a deleted-but-still-deployed function is in that leftover set, this document cannot classify it.

---

## P1 — anonymous AND (SPENDS or SENDS)

One row per function. None of these have `requireAdmin`, a service-role/secret inbound check, a webhook signature, an origin allowlist, or a rate limit. An empty or minimal POST with the public anon bearer is enough, from source.

| Function | `verify_jwt` | Exact side effect | Consequence | Gate to add | Status |
| --- | --- | --- | --- | --- | --- |
| `cron-failure-notifications` | `false` | Resend to `info@harrisboatworks.ca` via `noreply@mercuryrepower.ca`; insert `cron_job_logs` | Anyone can send staff mail and write cron logs. Confirmed live today. | `_shared/admin-auth.ts` `requireAdmin` | **Fix in flight** [#520](https://github.com/harrisboatworks/mercury-builder-pro/pull/520). Do not re-solve. |
| `check-expiring-promotions` | unlisted | Resend admin digest; update `promotions.details` | Anyone can force the expiry mail and flip alert state. Daily cron in `20260518230012_*.sql` sends the **public anon bearer** (same JWT the website uses). | `requireAdmin` **after** the cron is rewritten to `x-internal-secret`. Gating first breaks the 13:00 UTC job. | Skipped by #497 for that reason. Still open. |
| `elevenlabs-mcp-server` | `false` | `tools/call` with no inbound auth. `schedule_callback` / `set_reminder` / follow-up hit Twilio via the voice functions using a **service-role** bearer the MCP injects. `email_quote_to_customer` calls `send-quote-email` the same way (service-role bypasses origin). Direct Resend on some paths. | Anyone who can POST JSON-RPC can SMS staff/customers and send quote mail. | No existing helper matches the ElevenLabs dashboard secret. Closest pattern: `grok-supabase-read/security.ts` `authorize()` (timing-safe bearer). `requireAdmin` would break the agent. Secret must be set in ElevenLabs *and* here. | Skipped by #497. Still open. |
| `voice-create-quote` | unlisted | Injects `AGENT_QUOTE_API_KEY` and calls `agent-quote-api` `create_quote` with `send_customer_email` default **true** | Anonymous email relay + CRM quote row. Caller: `src/lib/RealtimeVoice.ts`. Missed by #497. | `_shared/origin-check.ts` `isAllowedOrigin` + `isServiceRoleBearer`, then `_shared/rate-limit.ts` `checkRateLimit` (same shape as the three #497 voice writers). | New. |
| `sync-lightspeed-inventory` | unlisted | Service-role upsert of `motor_models` / logs; `send-sms` to admin on suspicious drop or failure (invoke uses the function’s service-role client, which `requireAdmin` on `send-sms` accepts) | Anyone can rewrite live inventory and page staff. README already forbids the public builder from calling this. Admin UI *and* Lightspeed cron (anon bearer) both call it. | `requireAdmin`. Cron must send `x-internal-secret` first (`docs/runbooks/pre-migration-cron-internal-secret-rewrite.sql` pattern). Admin `functions.invoke` already sends the user JWT. | New. Same cron-rewrite trap as the promo digest. |
| `scrape-mercury-portal` | `true` | Firecrawl (paid) with `MERCURY_DEALER_EMAIL` / `MERCURY_DEALER_PASSWORD`; upload `motor-images`; upsert `motor_media` / `motor_models` | Anon JWT is enough. Burns Firecrawl, logs into the dealer portal, overwrites images. Admin callers: `UpdateMotorImages.tsx`. | `requireAdmin` | New. `verify_jwt = true` does not save this. |
| `scrape-mercury-public` | unlisted | Firecrawl (paid); storage upload; `motor_models` image updates | Same spend/write without dealer login. Admin callers: `UpdateImages.tsx`, `UpdateMotorImages.tsx`. | `requireAdmin` | New. |
| `fetch-part-images` | unlisted | Firecrawl search + scrape. Empty `{}` uses a hardcoded seven-part default list | Unauthenticated Firecrawl burn. No frontend caller in `src/`. | `requireAdmin` | New. |
| `locally-inventory` | `false` | Proxies `LOCALLY_API_KEY` to Locally.com (`discover` / `search` / `store_data`) | Unauthenticated paid-API proxy. Callers: `useLocallyInventory.ts`, `useElevenLabsVoice.ts` (public / voice). | `isAllowedOrigin` + `checkRateLimit`, plus `isServiceRoleBearer` if the voice/MCP path has no Origin. | New. Do **not** use `requireAdmin` — that breaks the public parts lookup. |
| `generate-spec-sheet-insights` | `false` | Perplexity `sonar` completion when `PERPLEXITY_API_KEY` is set | Unauthenticated Perplexity spend. Caller: public `SpecSheetPDFDownload.tsx`. | `isAllowedOrigin` + `checkRateLimit`. Not `requireAdmin`. | New. |

`indexnow-ping` is an unauthenticated admin IndexNow POST (free protocol, not a bill we pay). It is not P1. See residual notes.

---

## P2 — anonymous AND WRITES

No strong identity gate, no origin allowlist, no rate limit. These do not themselves send mail/SMS or call a paid API (except IndexNow, which is free).

| Function | `verify_jwt` | Write | Consequence | Gate to add |
| --- | --- | --- | --- | --- |
| `mark-out-of-stock` | `true` | `motor_models.in_stock = false` for given keys, or **all brochure models** when `all_brochure_models: true`; IndexNow ping | Anon JWT can take the public catalogue offline. | `requireAdmin` |
| `sync-inventory-api` | unlisted | Upserts `motor_models` from harrisboatworks.ca `inventory.php`; IndexNow on changes | Anonymous rewrite of live prices/availability. | `requireAdmin` |
| `auto-image-enhancer` | unlisted | Updates `motor_models` images; invokes another scrape function | Anonymous image mutation. No `src/` caller found. | `requireAdmin` |
| `migrate-motor-images` | unlisted | Rewrites image URLs / storage | Anonymous image mutation. Admin: `IssueDetailsModal.tsx`. | `requireAdmin` |
| `optimize-motor-images` | unlisted | Storage rewrite for one `motor_id` | Anonymous image mutation. No `src/` caller found. | `requireAdmin` |
| `motor-health-monitor` | unlisted | Optional `fixIssues` updates motors; optional `notifications` insert | Anonymous health run / auto-fix. Admin: `AutomationDashboard.tsx`, `IssueDetailsModal.tsx`. | `requireAdmin` |
| `sync-dropbox-folder` | unlisted | Dropbox pull → storage + `motor_media` / sync config | Anonymous Dropbox ingest if a `config_id` is known. | `requireAdmin` |
| `dropbox-chooser-upload` | unlisted | Fetches caller-supplied `fileUrl`, uploads `motor-images`, inserts `motor_media` | SSRF-shaped fetch + storage write. No `src/` caller found. | `requireAdmin` |
| `track-share-event` | `false` | Insert `share_analytics` | Analytics spam. Callers: blog share buttons (intentional write, zero bound). | `checkRateLimit` (and optionally `isAllowedOrigin`). Not `requireAdmin`. |

`scrape-mercury-portal`, `scrape-mercury-public`, `sync-lightspeed-inventory`, `check-expiring-promotions`, and `cron-failure-notifications` also write. They are P1 because they spend or send; they are not repeated here.

Unsubscribe endpoints, the email open pixel, chat-history, UCP checkout, and session-scoped voice proxy also write. They are **intentional public** (token, session, or rate limit). See below.

---

## P3 — anonymous READS of non-public data, or paid API with no rate limit

The paid-API-and-no-rate-limit clause is already the P1 spend rows (`generate-spec-sheet-insights`, `fetch-part-images`, `locally-inventory`, both Mercury scrapes). They are not duplicated as new work.

What remains is residual read risk that is **not** a missing-auth send/spend bug:

| Function | Gate today | What an anonymous caller gets | Treat as |
| --- | --- | --- | --- |
| `elevenlabs-conversation-token` | `checkRateLimit` 15/10 min, **no origin** | ElevenLabs conversation token **and the full `systemPrompt`** | Intentional voice mint (#497 moved the limiter above warmup). Residual: prompt leak. Do not file as a P1 auth miss. |
| `get-shared-quote` | UUID in the body | Customer name / notes / quote for that id | Intentional capability URL. Residual if a UUID leaks. |
| `voice-inventory-lookup` | **none** | Customer selling prices and stock (response uses `resolveCustomerSellingPrice`; `dealer_price` / `base_price` are selected but not returned by `buildMotorResponse`) | Intentional voice catalogue. Residual: unbounded service-role reads. Add `checkRateLimit` (and origin-or-service-role if the widget sends Origin). |
| `indexnow-ping` | **none** | GET returns host + key location; POST submits up to 10 000 URLs to IndexNow | Admin control (`IndexNowControl.tsx`). Not a paid API we bill. Gate with `requireAdmin` when convenient. |

`public-motors-api` and `motors-md` select `dealer_price` / `base_price` internally and **strip them** before the response (`sellingPrice` / markdown only). Not P3.

`file-proxy` allows only the `motor-images` bucket and rejects `..` paths. Not P3.

---

## Intentionally anonymous (correctly so)

These must stay callable without an admin JWT. Flagging them as P1 would waste a sprint. What protects each:

### Public quote funnel

| Function | Why public | What protects it |
| --- | --- | --- |
| `submit-quote-lead` | Buyer submits a quote | `isAllowedOrigin`; Turnstile when `TURNSTILE_SECRET_KEY` is set; honeypot; fail-closed IP + email `checkRateLimit` |
| `public-quote-api` | Agent / site quote reads + contact | `checkRateLimit`; `build_quote` is fail-closed 10/10 min |
| `public-motors-api` | Public motor JSON feed | GET only; response is the public contract (no dealer cost) |
| `motors-md` | Public markdown catalogue | GET only |
| `send-quote-email` | Quote delivery | `isAllowedOrigin` **or** internal secret / service-role; IP + recipient `checkRateLimit`; `documentId` path is internal-only |
| `send-saved-quote-email` | “Email me this quote” | `isAllowedOrigin` + IP + recipient `checkRateLimit` |
| `send-repower-guide-email` | #497 | `isAllowedOrigin` + fail-closed `checkRateLimit` |
| `send-financing-confirmation-email` | #497 | `isAllowedOrigin` + fail-closed IP + recipient limits |
| `send-financing-resume-email` | Resume link | **Logged-in user JWT** via `auth.getUser` (not admin) + per-email RPC limit. Not anonymous. |
| `financing-application-api` | Guest financing draft | `isAllowedOrigin` + IP / token / submit `checkRateLimit` |
| `create-payment` | Stripe deposit | `resolveAllowedBrowserOrigin` + `checkRateLimit`; quote path also needs a user JWT |
| `consultation-document-api` | PDF from email link | `isAllowedOrigin` + fail-closed IP + token `checkRateLimit` + capability token |
| `quote-document-api` | Quote PDF | `verify_jwt = true` (anon JWT passes gateway) + `isAllowedOrigin` + rate limit; download needs `getUser` |
| `ucp-checkout` | UCP quote sessions | In-function `check_rate_limit` 120/10 min; optional UCP profile when `UCP_STRICT_PROFILES=true` |
| `hbw-valuation-proxy` | Public trade-in | `checkRateLimit` 20/10 min + input validation |
| `generate-motor-spec-sheet` | Spec HTML | `isAllowedOrigin` only (no rate limit; no paid API) |
| `get-shared-quote` | Shared quote link | Unguessable quote UUID |
| `subscribe-walkaround` | #497 | `isAllowedOrigin` + fail-closed `checkRateLimit` |
| `subscribe-blog` | Blog form | Inline `check_rate_limit` 10/hour. **No origin.** Same class as the public forms; not a cron-shaped P1. |
| `subscribe-promo-reminder` | Promo watch form | Inline `check_rate_limit` 10/hour. **No origin.** May invoke `send-sms` (service-role). Hardening gap vs #497, still a buyer form. |
| `send-contact-inquiry` | Contact page | Inline `check_rate_limit` 5/hour. **No origin.** Resend + Twilio to staff. Same: intentional form, thinner than #497. |
| `capture-chat-lead` | Chat callback | Inline `check_rate_limit` 5/hour. **No origin.** Resend + `send-sms`. Same. |
| `unsubscribe-blog` / `unsubscribe-promo-reminder` / `unsubscribe-email-sequence` | One-click unsubscribe | Secret unsubscribe token in body or query |
| `track-email-event` | Open/click pixel | Unsubscribe token; always returns a GIF / redirect |

### Voice / chat agents

| Function | Why public | What protects it |
| --- | --- | --- |
| `voice-send-follow-up` | #497 voice SMS | `isAllowedOrigin` **or** `isServiceRoleBearer`; fail-closed `checkRateLimit` |
| `voice-schedule-callback` | #497 | Same |
| `voice-create-reminder` | #497 | Same |
| `voice-perplexity-lookup` | Voice facts | `checkRateLimit` 30/10 min. **No origin.** |
| `voice-inventory-lookup` | Voice catalogue | **Nothing.** See P3 residual. |
| `elevenlabs-conversation-token` | #497 token mint | `checkRateLimit` 15/10 min above warmup. **No origin** (live-check posts `knowledgeProbe` without one). |
| `realtime-session` | Site OpenAI voice | `isAllowedOrigin` + `checkRateLimit` 5/10 min |
| `realtime-sdp-exchange` | SDP handshake | `checkRateLimit` 20/10 min. **No origin.** Needs an ephemeral key from `realtime-session`. |
| `ai-chatbot` / `ai-chatbot-stream` | Site chat | `checkRateLimit` 30/10 min. Paid OpenAI / Perplexity. **No origin.** |
| `chat-history` | Anonymous chat transcript | `chat_<64hex>` session id + `checkRateLimit` |
| `voice-sessions-proxy` | Voice session rows | Session-id format + ownership match |
| `perplexity-prefetch` | Chat prefetch | `checkRateLimit` 20/10 min |
| `mercury-parts-lookup` | Public parts | `checkRateLimit` 60/10 min |
| `google-places` | #497 homepage reviews | `checkRateLimit` 60/10 min + 10/hour upstream |
| `agent-mcp-server` | Public MCP over `public-quote-api` | `checkRateLimit` per tool |
| `elevenlabs-mcp-server` | ElevenLabs tools | **Nothing inbound.** This is P1, not “correctly anonymous.” |
| `voice-create-quote` | Voice quote + email | **Nothing.** This is P1, not “correctly anonymous.” |

### Other public / webhook / partner

| Function | Why it exists | What protects it |
| --- | --- | --- |
| `file-proxy` | Public motor images | GET; `motor-images` bucket allowlist; path traversal reject |
| `stripe-webhook` | Stripe events | `stripe-signature` + `STRIPE_WEBHOOK_SECRET` |
| `notification-webhook` | Twilio status | `_shared/twilio-signature.ts` via `handleNotificationWebhook` (this is on current `main`; #497 left it to draft #332, which has since landed in the handler) |
| `agent-quote-api` | Trusted agent quotes | `x-agent-key` === `AGENT_QUOTE_API_KEY`. Not anonymous. |
| `grok-supabase-read` | Grok MCP aggregates | Timing-safe `GROK_SUPABASE_READ_TOKEN` + `checkRateLimit` |
| `grok-supabase-oauth` | Grok OAuth | Client id, redirect allowlist, PKCE, in-memory limit |
| `send-notification` | Internal notify + optional SMS | `handleServiceRoleRequest` + `verify_jwt = true` |
| `send-deposit-confirmation-email` | Deposit mail | Service-role bearer compare + `verify_jwt = true` |

Origin is **not** authentication. #497 said that plainly. The public senders above are accepted as public *because* they are buyer flows, and because origin + rate limit (or a token) is the agreed cost-raiser — not because Origin proves identity.

---

## Strongly gated (not anonymous)

These import `requireAdmin` or an equivalent strong check. They are out of P1/P2. Listed so the 101-function claim can be challenged.

`admin-consultation-document`, `attach-brochure-pdf`, `audit-price-list`, `auth-health-summary`, `auth-tiktok-callback` (inline admin), `browse-dropbox-folders`, `check-partial-financing-apps`, `consultation-document-retention`, `download-control-images`, `dropbox-file-handler`, `dropbox-oauth`, `get-dropbox-config`, `growth-agent-audit`, `process-email-sequence`, `process-notifications`, `scrape-mercury-accessories`, `scrape-mercury-catalog`, `send-blog-notification`, `send-get7-campaign`, `send-notification`, `send-promo-notifications`, `send-sms`, `seo-health-check` (inline admin), `start-abandoned-quote-sequence`, `stripe-webhook`, `sync-dropbox-motor-folders`, `sync-elevenlabs-kb`, `sync-elevenlabs-static-kb`, `trigger-zapier-webhooks`, `universal-pricing-import` (inline admin), `update-motor-images`, `upload-hero-image`, `weekly-quote-report`.

`send-quote-email` is mixed (public origin path + internal secret path) and is in the intentional table.

---

## Mechanical fix map (P1 / P2 only)

Use the existing helper. Do not invent a third auth style.

| Helper | Use for |
| --- | --- |
| `_shared/admin-auth.ts` `requireAdmin` | Internal / admin / cron: `cron-failure-notifications` (already #520), `check-expiring-promotions`, `sync-lightspeed-inventory`, `scrape-mercury-portal`, `scrape-mercury-public`, `fetch-part-images`, `mark-out-of-stock`, `sync-inventory-api`, `auto-image-enhancer`, `migrate-motor-images`, `optimize-motor-images`, `motor-health-monitor`, `sync-dropbox-folder`, `dropbox-chooser-upload`, `indexnow-ping` |
| `_shared/origin-check.ts` `isAllowedOrigin` + `isServiceRoleBearer` and `_shared/rate-limit.ts` `checkRateLimit` | Browser-or-voice public spend that must not take an admin gate: `voice-create-quote`, `locally-inventory`, `generate-spec-sheet-insights` |
| `grok-supabase-read/security.ts` `authorize` (copy the timing-safe bearer) | `elevenlabs-mcp-server` only, after a secret is configured in the ElevenLabs dashboard. There is no shared “ElevenLabs secret” helper today. |

Cron jobs that today send the **anon** bearer will 401 the moment `requireAdmin` lands. Rewrite those jobs to `x-internal-secret` in the same change, using the draft in `docs/runbooks/pre-migration-cron-internal-secret-rewrite.sql`. Do not embed JWTs in SQL.

Known anon-bearer crons from source / runbooks (headers not live-read):

- `check-expiring-promotions-daily` → `check-expiring-promotions`
- Lightspeed suite → `sync-lightspeed-inventory` (and other Lightspeed slugs that are not in this tree)
- `cron-failure-notifications` — **no** `http_post` to it exists in migrations. Live cron headers are still unknown. That is why #497 skipped it and why #520 is a coordinated fix.

---

## What #497 already covered (do not re-file)

`voice-send-follow-up`, `voice-schedule-callback`, `voice-create-reminder`, `send-financing-confirmation-email`, `send-repower-guide-email`, `subscribe-walkaround`, `elevenlabs-conversation-token` (limiter hoist), `google-places` (cache limiter).

Deliberately skipped then, still true now: `elevenlabs-mcp-server`, `check-expiring-promotions`, `cron-failure-notifications`. `notification-webhook` now has Twilio signature verification on `main`.

Thinner public forms that #497 did not touch (`send-contact-inquiry`, `capture-chat-lead`, `subscribe-blog`, `subscribe-promo-reminder`) have inline rate limits and no origin. They are intentional buyer flows. Optional follow-up: bring them to the #497 origin + shared `checkRateLimit` shape. They are not P1.

---

## Residual notes (not P1)

- **Origin is forgeable.** Every “intentional + origin” sender can still be driven by a script that spoofs `Origin: https://www.mercuryrepower.ca`. Rate limits are the remaining bound.
- **`send-sms` production drift** is a separate deploy decision (`docs/audits/edge-function-drift-2026-09-09.md`). This audit classifies **source**. If production `send-sms` is still the pre-`requireAdmin` build, any function that `functions.invoke`s it is a live SMS relay until that deploy happens.
- **`indexnow-ping`** GET discloses the public IndexNow key location (the key file is meant to be public). POST is unbounded.
- Config orphans `firecrawl-inventory-agent` and `scrape-motor-images`: if they are still deployed, treat them as undetermined P1/P2 until source exists or they are removed.

---

## Appendix — all 101 source functions

| Function | `verify_jwt` | In-code gate | Class | Bucket |
| --- | --- | --- | --- | --- |
| `admin-consultation-document` | false | `requireAdmin` + origin + rate | READS/WRITES | gated |
| `agent-mcp-server` | false | `checkRateLimit` | READS / spend via upstream | intentional |
| `agent-quote-api` | false | `x-agent-key` | WRITES | gated (partner key) |
| `ai-chatbot` | false | `checkRateLimit` | SPENDS OpenAI | intentional |
| `ai-chatbot-stream` | false | `checkRateLimit` | SPENDS OpenAI/Perplexity | intentional |
| `attach-brochure-pdf` | false | `requireAdmin` | WRITES | gated |
| `audit-price-list` | false | `requireAdmin` | SPENDS Resend | gated |
| `auth-health-summary` | true | `requireAdmin` | READS | gated |
| `auth-tiktok-callback` | false | inline admin JWT | WRITES | gated |
| `auto-image-enhancer` | unlisted | none | WRITES | **P2** |
| `browse-dropbox-folders` | false | `requireAdmin` | READS | gated |
| `capture-chat-lead` | false | inline RPC limit | SENDS + WRITES | intentional (thin) |
| `chat-history` | false | session id + rate | READS/WRITES | intentional |
| `check-expiring-promotions` | unlisted | none | SENDS + WRITES | **P1** |
| `check-partial-financing-apps` | false | `requireAdmin` | SENDS | gated |
| `consultation-document-api` | false | origin + rate + token | READS/WRITES | intentional |
| `consultation-document-retention` | false | `requireAdmin` + rate | WRITES | gated |
| `create-payment` | false | origin + rate | SPENDS Stripe | intentional |
| `cron-failure-notifications` | false | none | SENDS + WRITES | **P1** (fix in flight) |
| `download-control-images` | false | `requireAdmin` | WRITES | gated |
| `dropbox-chooser-upload` | unlisted | none | WRITES | **P2** |
| `dropbox-file-handler` | unlisted | `requireAdmin` | READS | gated |
| `dropbox-oauth` | unlisted | `requireAdmin` | WRITES | gated |
| `elevenlabs-conversation-token` | false | `checkRateLimit` | SPENDS ElevenLabs | intentional / P3 residual |
| `elevenlabs-mcp-server` | false | none inbound | SENDS + SPENDS | **P1** |
| `fetch-part-images` | unlisted | none | SPENDS Firecrawl | **P1** |
| `file-proxy` | false | bucket allowlist | READS public | intentional |
| `financing-application-api` | false | origin + rate | WRITES / SENDS | intentional |
| `generate-motor-spec-sheet` | false | origin | READS | intentional |
| `generate-spec-sheet-insights` | false | none | SPENDS Perplexity | **P1** |
| `get-dropbox-config` | unlisted | `requireAdmin` | READS | gated |
| `get-shared-quote` | false | UUID | READS PII | intentional / P3 residual |
| `google-places` | false | `checkRateLimit` | SPENDS Google | intentional |
| `grok-supabase-oauth` | false | OAuth client + PKCE | WRITES codes | gated |
| `grok-supabase-read` | false | dedicated token + rate | READS aggregates | gated |
| `growth-agent-audit` | unlisted | `requireAdmin` | SPENDS Perplexity | gated |
| `hbw-valuation-proxy` | false | `checkRateLimit` | SPENDS HBW API | intentional |
| `indexnow-ping` | unlisted | none | IndexNow POST | residual (not P1) |
| `locally-inventory` | false | none | SPENDS Locally | **P1** |
| `mark-out-of-stock` | true | none | WRITES | **P2** |
| `mercury-parts-lookup` | false | `checkRateLimit` | READS/WRITES cache | intentional |
| `migrate-motor-images` | unlisted | none | WRITES | **P2** |
| `motor-health-monitor` | unlisted | none | WRITES | **P2** |
| `motors-md` | false | GET only | READS public | intentional |
| `notification-webhook` | false | Twilio signature | WRITES | gated (signature) |
| `optimize-motor-images` | unlisted | none | WRITES | **P2** |
| `perplexity-prefetch` | false | `checkRateLimit` | SPENDS Perplexity | intentional |
| `process-email-sequence` | false | `requireAdmin` | SENDS | gated |
| `process-notifications` | false | `requireAdmin` | WRITES | gated |
| `public-motors-api` | false | GET only | READS public | intentional |
| `public-quote-api` | false | `checkRateLimit` | READS / WRITES contact | intentional |
| `quote-document-api` | true | origin + rate + user on GET | WRITES/READS | intentional |
| `realtime-sdp-exchange` | false | `checkRateLimit` | SPENDS OpenAI | intentional |
| `realtime-session` | false | origin + rate | SPENDS OpenAI | intentional |
| `scrape-mercury-accessories` | false | `requireAdmin` | WRITES | gated |
| `scrape-mercury-catalog` | false | `requireAdmin` | SPENDS / WRITES | gated |
| `scrape-mercury-portal` | true | none | SPENDS Firecrawl + WRITES | **P1** |
| `scrape-mercury-public` | unlisted | none | SPENDS Firecrawl + WRITES | **P1** |
| `send-blog-notification` | false | `requireAdmin` | SENDS | gated |
| `send-contact-inquiry` | false | inline RPC limit | SENDS + WRITES | intentional (thin) |
| `send-deposit-confirmation-email` | true | service-role bearer | SENDS | gated |
| `send-financing-confirmation-email` | false | origin + rate | SENDS | intentional |
| `send-financing-resume-email` | false | user `getUser` + RPC limit | SENDS | gated (any user) |
| `send-get7-campaign` | true | `requireAdmin` | SENDS | gated |
| `send-notification` | true | `handleServiceRoleRequest` | SENDS | gated |
| `send-promo-notifications` | false | `requireAdmin` | SENDS | gated |
| `send-quote-email` | false | origin **or** internal/service-role + rate | SENDS | intentional |
| `send-repower-guide-email` | false | origin + rate | SENDS | intentional |
| `send-saved-quote-email` | false | origin + rate | SENDS | intentional |
| `send-sms` | false | `requireAdmin` + rate | SENDS | gated |
| `seo-health-check` | unlisted | inline admin | SPENDS PageSpeed | gated |
| `start-abandoned-quote-sequence` | false | `requireAdmin` | WRITES | gated |
| `stripe-webhook` | false | Stripe signature | WRITES | gated (signature) |
| `submit-quote-lead` | false | origin + Turnstile + rate | WRITES / SENDS | intentional |
| `subscribe-blog` | false | inline RPC limit | SENDS + WRITES | intentional (thin) |
| `subscribe-promo-reminder` | false | inline RPC limit | SENDS + WRITES | intentional (thin) |
| `subscribe-walkaround` | false | origin + rate | WRITES (Mailchimp) | intentional |
| `sync-dropbox-folder` | unlisted | none | WRITES | **P2** |
| `sync-dropbox-motor-folders` | false | `requireAdmin` | WRITES | gated |
| `sync-elevenlabs-kb` | false | `requireAdmin` | SPENDS ElevenLabs | gated |
| `sync-elevenlabs-static-kb` | false | `requireAdmin` | SPENDS ElevenLabs | gated |
| `sync-inventory-api` | unlisted | none | WRITES | **P2** |
| `sync-lightspeed-inventory` | unlisted | none | SENDS + WRITES | **P1** |
| `track-email-event` | false | tracking token | WRITES | intentional |
| `track-share-event` | false | none | WRITES | **P2** |
| `trigger-zapier-webhooks` | false | `requireAdmin` | SPENDS Zapier | gated |
| `ucp-checkout` | unlisted | RPC rate limit | WRITES | intentional |
| `universal-pricing-import` | false | inline admin | WRITES | gated |
| `unsubscribe-blog` | false | unsubscribe token | WRITES | intentional |
| `unsubscribe-email-sequence` | false | unsubscribe token | WRITES | intentional |
| `unsubscribe-promo-reminder` | false | unsubscribe token | WRITES | intentional |
| `update-motor-images` | false | `requireAdmin` | WRITES | gated |
| `upload-hero-image` | false | `requireAdmin` | WRITES | gated |
| `voice-create-quote` | unlisted | none | SENDS + WRITES | **P1** |
| `voice-create-reminder` | false | origin-or-srole + rate | WRITES | intentional |
| `voice-inventory-lookup` | false | none | READS catalogue | intentional / P3 residual |
| `voice-perplexity-lookup` | false | `checkRateLimit` | SPENDS Perplexity | intentional |
| `voice-schedule-callback` | false | origin-or-srole + rate | SENDS + WRITES | intentional |
| `voice-send-follow-up` | false | origin-or-srole + rate | SENDS + WRITES | intentional |
| `voice-sessions-proxy` | false | session id | READS/WRITES | intentional |
| `weekly-quote-report` | false | `requireAdmin` | SENDS | gated |

Counts from this appendix: **P1 10** (one in flight), **P2 9**, strongly gated **33**, intentional public / partner **49**.
