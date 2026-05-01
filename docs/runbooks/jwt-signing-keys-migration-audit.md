# JWT Signing Keys Migration — Impact Audit

**Project:** `eutsoqdpjurknjsshxes` (mercuryrepower.ca)
**Status:** AUDIT ONLY — no rotation, no "Migrate JWT secret" click, no SQL execution.
**Audit date:** 2026-05-01
**Auditor scope:** repo + Supabase config + cron.job table + secrets list. No production change made.

---

## 0. TL;DR

Clicking **Project → Settings → JWT → JWT Signing Keys → "Migrate JWT secret"** on this project today will, in roughly this order:

1. **Break all 16 cron jobs** that embed a legacy HS256 anon/service_role JWT in their `cron.job.command`.
   Verified: every bearer token in `cron.job` has `iss: supabase`, `iat: 1754552472` (Aug 7 2025) — pure legacy HS256, no `kid`. Once Supabase moves the project to asymmetric signing keys, those tokens stop verifying at the gateway and every protected internal Edge Function call returns 401.
2. **Force a redeploy / env update of every Edge Function that calls `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')` or `SUPABASE_ANON_KEY`** if Supabase replaces the secret values handed to functions. Code in this repo reads them at request time, so a function restart is enough — no code change required, but they MUST restart with the new env values.
3. **Force the frontend (`src/integrations/supabase/client.ts`) and Vercel API routes (`api/quotes.js`, `api/heartbeat.js`) to receive the new publishable/anon key via env vars** before users get logged-out / 401s. The repo already reads from env (no hardcoded JWT in `src/` or `api/` — verified via `rg`). The risk is purely in Vercel / `.env` propagation.
4. **Possibly invalidate currently-active end-user Supabase Auth sessions** depending on how Supabase handles in-flight access tokens during the migration. Refresh tokens stay valid; access tokens signed by the old HS256 secret will fail verification once the project flips to the new key set unless Supabase keeps the old key in the JWKS during a transition window.
5. **NOT** affect functions that don't use bearer auth or supabase keys (see §1.3).

The previous runbook (`docs/runbooks/post-rotation-cron-rewrite.sql`) is still **structurally correct** for fixing the 16 cron rows — but it assumes you have the new tokens in hand. With the new Signing Keys flow you actually want to migrate the cron jobs to **`x-internal-secret`** instead, because the new system makes legacy-style long-lived embedded JWTs an anti-pattern. See §5.

**Recommendation: do NOT click "Migrate JWT secret" yet.** Pre-flight changes in §5 should land first.

---

## 1. Edge Function audit (91 functions)

### 1.1 `verify_jwt = true` (hard gate at the Supabase function gateway)

These functions REJECT requests at the gateway unless the caller presents a JWT signed by a key the gateway trusts. After Signing Keys migration, ONLY tokens signed with the new key set will pass. Legacy HS256 anon/service_role JWTs embedded in `cron.job` will be rejected here first.

| Function | verify_jwt | Risk on migration |
| --- | --- | --- |
| `auth-health-summary` | true | Low — admin-only, called from authenticated browser. Browser will get fresh JWT after env update. |
| `mark-out-of-stock` | true | Low — admin browser call. |
| `scrape-mercury-portal` | true | Low — admin/manual. |
| `send-get7-campaign` | true | Low — admin/manual. |

None of these are called by cron, so the gateway-level break is contained.

### 1.2 `verify_jwt = false` but in-code admin gate

`supabase/functions/_shared/admin-auth.ts` is the in-code gate used by admin functions. It currently:

1. Accepts `x-internal-secret` header if `EDGE_INTERNAL_SECRET` or `CRON_SECRET` is set.
   **Finding:** neither secret exists in the project (verified via `secrets--fetch_secrets`). So this bypass is **dead code today**. Internal callers cannot use it.
2. Accepts `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>` raw equality match.
   **Finding:** this is what every internal cron job currently relies on. After Signing Keys migration the token IN `cron.job` will not equal the new `SUPABASE_SERVICE_ROLE_KEY` env value, so admin-auth's `if (jwt === serviceRoleKey)` short-circuit will fail and it will fall through to JWT validation, which will also fail. Result: 401.
3. Falls back to `auth.getUser(jwt)` + `user_roles` admin check. Works for real end-user admins after they get a new JWT.

Functions importing `requireAdmin`:
```
audit-price-list, weekly-quote-report, sync-google-sheets-inventory,
start-abandoned-quote-sequence, check-partial-financing-apps,
process-email-sequence, trigger-zapier-webhooks, scrape-mercury-catalog,
send-promo-notifications
```
These were the 9 functions deployed in the prior hardening sprint. All 9 are called by cron — see §2.

### 1.3 `verify_jwt = false` and no Supabase key dependency

Public endpoints / webhooks:
- `stripe-webhook`, `notification-webhook`, `auth-tiktok-callback` (uses ANON for getUser only), `dropbox-oauth`, `realtime-sdp-exchange`, `realtime-session`, `elevenlabs-conversation-token`, etc.

These either validate their own signature (Stripe, Twilio) or are public reads. Migration impact: low, as long as their internal `createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)` re-reads env after the function restart.

### 1.4 Functions that read `SUPABASE_SERVICE_ROLE_KEY` internally (78 functions)

Verified via grep — see audit run for full list. None hard-code the value; all use `Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')`. **No code change needed.** They will pick up the new value automatically as Supabase rotates the env injected into the function runtime. A cold restart may be required.

### 1.5 Functions that read `SUPABASE_ANON_KEY` / `SUPABASE_PUBLISHABLE_KEY` internally

Only 7 files:
- `_shared/admin-auth.ts`
- `auth-tiktok-callback`, `create-payment`, `send-financing-confirmation-email`, `send-financing-resume-email`, `universal-pricing-import`, `voice-sessions-proxy`

All use `Deno.env.get`. Same story — no code change, just runtime env propagation.

---

## 2. Cron job audit (`cron.job`, 18 rows)

Decoded every bearer JWT in `cron.job.command` (full table queried). Findings:

| Count | Token kind | iss / iat | Affected by Signing Keys migration? |
| --- | --- | --- | --- |
| 7 | legacy HS256 service_role | `iss=supabase`, `iat=1754552472` | **YES — will 401 immediately** |
| 9 | legacy HS256 anon | `iss=supabase`, `iat=1754552472` | **YES — will 401 immediately** |
| 2 | no Authorization header (`hbw-review-monitor`, `sms-ai-weekly-review`) | n/a | No |

Job → token mapping:

**service_role legacy JWT (will break):**
- `check-partial-financing-apps-hourly` (jobid 36)
- `google-sheets-inventory-daily` (33)
- `mercury-catalog-data-refresh` (7)
- `price-list-weekly-audit` (38)
- `promo-notifications-daily` (37)
- `start-abandoned-quote-sequence-daily` (35)
- `weekly-quote-activity-report` (34)

**anon legacy JWT — Lightspeed (will break):**
- `lightspeed-motor-models-sync-daily` (19), `lightspeed-sync-customers-daily` (15), `lightspeed-sync-deals-daily` (29), `lightspeed-sync-open-ros-daily` (30), `lightspeed-sync-open-ros-noon` (31), `lightspeed-sync-parts-daily` (17), `lightspeed-sync-parts-invoices-daily` (32), `lightspeed-sync-service-daily` (18), `lightspeed-sync-units-daily` (16)

**No Authorization (unaffected):** `hbw-review-monitor`, `sms-ai-weekly-review`.

### 2.1 Could these safely move to internal secret instead?

YES, and this is the **recommended** path for the 7 service_role jobs. They all hit `verify_jwt = false` functions that route through `requireAdmin`, which already supports `x-internal-secret`. Concrete plan in §5.

The 9 Lightspeed jobs target `sync-lightspeed-inventory`, `lightspeed-sync`, `lightspeed-sync-new-feeds`, `lightspeed-sync-service` — none currently use `requireAdmin`. Safest no-behavior-change move is to keep them as anon for this rotation and re-embed the **new** anon JWT (per the user's existing constraint). Migration to `x-internal-secret` for Lightspeed should be a separate hardening sprint.

---

## 3. Frontend & API runtime audit

| Surface | Key in use | Hardcoded? | Risk |
| --- | --- | --- | --- |
| `src/integrations/supabase/client.ts` | `VITE_SUPABASE_PUBLISHABLE_KEY` from `import.meta.env` | No (verified via `rg 'eyJhbGciOi' src/`) | Low — Vercel env update + redeploy required |
| `api/quotes.js` | `process.env.SUPABASE_ANON_KEY` / `SUPABASE_PUBLISHABLE_KEY` (chain) | No | Low — Vercel env update |
| `api/heartbeat.js` | `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | **Medium** — env name differs from the rest. Confirm Vercel actually sets `NEXT_PUBLIC_SUPABASE_ANON_KEY`, otherwise heartbeat already silently fails auth. |
| `api/quotes-list.js`, `api/quotes-seed.js`, `api/test-endpoint.ts` | env-driven | (assume same pattern — sample-checked) | Low |
| `src/lib/invokeEdge.ts` | uses `supabase.auth.getSession()` access_token, not anon | n/a | Low |
| `src/lib/streamParser.ts` | env | No | Low |
| `.env` (committed for build) | publishable anon key only — confirmed safe to ship to browser | n/a | Update required after migration so `npm run build` produces a bundle with the new key |

**Service role exposure check:** `rg 'service_role' src/ api/` — no occurrences. Confirmed not exposed to browser or to Vercel public bundles.

**Hardcoded JWT check:** `rg 'eyJhbGciOi' src/ api/` returned **0 matches**. Clean.

---

## 4. Will clicking "Migrate JWT secret" cause…

| Question | Answer | Why |
| --- | --- | --- |
| Invalidate existing legacy anon/service_role JWTs? | **Yes**, at the moment Supabase removes the legacy HS256 key from JWKS. There is usually a transition window where both keys verify; do not rely on it without confirming in the dashboard. | Signing Keys system replaces the symmetric secret with asymmetric keys; old tokens lack the new `kid`. |
| Require immediate frontend env changes? | **Yes, before users hit the new JWKS-only state.** | The browser's persisted session will refresh against the new key set; if Vercel still ships the old publishable key, end users will see auth errors. |
| Require Edge Function redeploys? | **Maybe.** Code is env-driven so no source change. But functions cache env across cold starts; a redeploy or restart guarantees they pick up new SERVICE_ROLE/ANON values. | Verified all 78 functions use `Deno.env.get`. |
| Break cron Authorization headers? | **Yes — 16 of 18 jobs.** | All 16 embed legacy HS256 JWTs. |
| Affect Supabase Auth user sessions? | **Likely briefly.** Refresh tokens survive; access tokens signed by old HS256 secret will fail mid-request once JWKS no longer publishes the legacy key. | Standard JWT key rotation behaviour. |
| Affect `agent-mcp-server` (verify_jwt=false, public)? | **No** for unauthenticated `tools/list`. **Yes** for any tool call that internally hits PostgREST with the service role — handled if env updates propagate. |
| Affect `public-quote-api` / `public-motors-api` (verify_jwt=false)? | **No**, they use service-role internally and don't require caller JWT. Only risk is env propagation. |
| Affect AI chat (`ai-chatbot`, `ai-chatbot-stream`)? | **Low.** verify_jwt=false. Internal Supabase calls use service role from env. |
| Affect admin pages / quote builder? | **Yes briefly** — admins will need fresh sessions; in-flight quotes that rely on the browser's anon key will fail until the new publishable key ships in the Vercel bundle. |
| Affect `auth-health-summary` / `mark-out-of-stock` / `scrape-mercury-portal` / `send-get7-campaign` (verify_jwt=true)? | **Yes** — gateway will reject any request carrying a legacy JWT. Admins must re-auth post-migration. |

---

## 5. Revised safe migration plan

### 5.1 Pre-flight (DO BEFORE clicking "Migrate JWT secret")

1. **Add an internal cron secret** (one-time, no auth impact):
   - Add `EDGE_INTERNAL_SECRET` to Supabase Edge Function secrets (already supported by `_shared/admin-auth.ts`).
   - Generate a 32+ char random string. Do not paste into chat.
2. **Re-key the 7 service_role cron jobs to use `x-internal-secret` instead of an embedded JWT.** This makes those jobs **immune to JWT rotation forever.**
   - Draft SQL provided in §5.5 below — DO NOT EXECUTE until secret is added and you approve.
3. **Confirm Vercel env vars exist and are settable** for: `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_ANON_KEY`, `SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (heartbeat), `VITE_SUPABASE_URL`. List them; do not change yet.
4. **Identify the post-migration anon JWT delivery path for the 9 Lightspeed cron jobs.** Either:
   - (a) keep them as anon and re-embed the new anon JWT after migration (matches user's stated constraint), OR
   - (b) also move them to `x-internal-secret` if their target functions are wrapped in `requireAdmin` (currently they are NOT — would need code change). **Recommend (a) for this rotation.**
5. **Snapshot current `cron.job` table** to a CSV in `/mnt/documents/` for rollback reference.
6. **Confirm there is a maintenance window** of ~10 min where a brief cron miss + admin re-login is acceptable.

### 5.2 Exact dashboard action

Only after steps 1–5:
- Project → Settings → JWT → JWT Signing Keys → **Migrate JWT secret**.
- Immediately copy the new **publishable (anon) key** and new **service_role key** to a secure location. Do not paste into chat.

### 5.3 Exact post-migration actions (in order)

1. **Vercel env update** (Production + Preview + Development):
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = new publishable
   - `SUPABASE_PUBLISHABLE_KEY` = new publishable
   - `SUPABASE_ANON_KEY` = new publishable
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = new publishable
   - `SUPABASE_SERVICE_ROLE_KEY` = new service role (only if Vercel functions need it; current `api/*` files do NOT)
   - Trigger a Vercel redeploy.
2. **Local `.env`** in the repo — update `SUPABASE_PUBLISHABLE_KEY` and `VITE_SUPABASE_PUBLISHABLE_KEY` for local dev / next build.
3. **Edge Functions** — Supabase auto-rotates `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` env values for functions. Force a redeploy of the 9 admin-gated functions to guarantee cold restart:
   `audit-price-list, weekly-quote-report, sync-google-sheets-inventory, start-abandoned-quote-sequence, check-partial-financing-apps, process-email-sequence, trigger-zapier-webhooks, scrape-mercury-catalog, send-promo-notifications`.
4. **Cron rewrite SQL** — execute (after edits in §5.5):
   - 7 service_role jobs → switch to `x-internal-secret` header (no JWT embedded)
   - 9 Lightspeed jobs → re-embed NEW anon JWT (per the existing `post-rotation-cron-rewrite.sql`, but ONLY the Lightspeed half)
5. **Manually validate** per checklist in §5.6.

### 5.4 Env var update matrix

| Key name | Used by | New value |
| --- | --- | --- |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Vite build, browser bundle | new publishable |
| `SUPABASE_PUBLISHABLE_KEY` | `.env`, `api/quotes.js` chain | new publishable |
| `SUPABASE_ANON_KEY` | `api/quotes.js` chain, edge function fallbacks | new publishable |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `api/heartbeat.js` ONLY | new publishable |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Function runtime (auto), Vercel if used | new service role |
| `EDGE_INTERNAL_SECRET` (NEW) | `_shared/admin-auth.ts` + 7 cron jobs | one-time random |

### 5.5 Revised cron rewrite — DRAFT, DO NOT EXECUTE

The current `docs/runbooks/post-rotation-cron-rewrite.sql` re-embeds a new service_role JWT in the 7 admin jobs. **Recommend changing those 7 to `x-internal-secret` instead** so the next JWT rotation is a no-op for them. Lightspeed half is unchanged.

Sketch (NOT executed):

```sql
-- For each of the 7 service_role jobs, replace the Authorization Bearer header with:
--   'x-internal-secret', :'EDGE_INTERNAL_SECRET'
-- Example (DRAFT):
SELECT cron.schedule(
  'google-sheets-inventory-daily',
  '0 6 * * *',
  format($cmd$
    SELECT net.http_post(
      url := 'https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/sync-google-sheets-inventory',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-internal-secret', %L
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $cmd$, :'EDGE_INTERNAL_SECRET')
);
-- repeat for the other 6 service_role jobs

-- 9 Lightspeed jobs: keep existing anon-JWT block from post-rotation-cron-rewrite.sql,
-- substituting :'NEW_ANON_JWT'.
```

If you prefer to keep the simpler "just re-embed new JWTs" approach for this rotation (lowest behaviour-change risk), the existing `docs/runbooks/post-rotation-cron-rewrite.sql` is still valid. The trade-off: you'll do this exact migration again the next time JWTs rotate.

### 5.6 Verification checklist (post-migration)

1. `psql` decode every `cron.job.command` JWT — verify NONE has `iat=1754552472`.
2. For service_role jobs migrated to `x-internal-secret`: confirm `command` no longer contains the substring `Bearer eyJ`.
3. `cron.job_run_details` shows status `succeeded` for the next scheduled run of each of the 16 jobs.
4. `supabase--curl_edge_functions` (anonymous) → `sync-google-sheets-inventory` returns **401** (proves admin gate still works).
5. `supabase--curl_edge_functions` → `public-motors-api` returns **24 motors**.
6. `agent-mcp-server` → `tools/list` returns **5 tools**.
7. `mercuryrepower.ca` loads, no Supabase auth/key console errors.
8. `/api/quotes` returns 200 (or proper 401 for unauth) — not 500.
9. AI chat responds.
10. Admin login works; `auth-health-summary` (verify_jwt=true) accepts the new JWT.
11. Edge Function logs over the next 1h: no spike in 401/403.
12. Anonymous POSTs to the 9 internal-cron functions still return 401 (no regression of the prior hardening).

### 5.7 Rollback / failure plan

- **If admin functions 401 in cron:** if you used the `x-internal-secret` path, double-check the `EDGE_INTERNAL_SECRET` value in Supabase secrets matches the literal embedded in cron commands. Re-run the cron rewrite SQL with the corrected literal. No JWT rollback needed.
- **If frontend logs out users en masse:** re-deploy Vercel with the new publishable key. There is no "unrotate" — Supabase migration is one-way once the legacy key leaves JWKS. Mitigation is forward-only.
- **If a cron job keeps failing:** `SELECT cron.unschedule('<jobname>')` to stop noise, then re-issue `cron.schedule(...)` with corrected command. The previous SQL also remains.
- **If `auth-health-summary` / other `verify_jwt=true` functions reject all admin tokens:** confirm gateway shows the new JWKS. If Supabase support is needed, do not click "Migrate" again — request key list via support.

---

## 6. Summary of what is safe to do now (no production change)

- ✅ Add `EDGE_INTERNAL_SECRET` to Supabase Edge Function secrets (no production behaviour change today; just enables the bypass path that's currently dead).
- ✅ Snapshot `cron.job` table to `/mnt/documents/`.
- ✅ Draft the revised cron rewrite SQL (see §5.5) and have it ready alongside `post-rotation-cron-rewrite.sql`.
- ✅ Confirm Vercel env var names and access.
- ⛔ Do NOT click "Migrate JWT secret".
- ⛔ Do NOT execute either cron rewrite SQL.
- ⛔ Do NOT change `verify_jwt` settings.
