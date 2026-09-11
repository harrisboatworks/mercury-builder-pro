# Release prerequisites for promotion and Lightspeed cron authentication

Status: **review-ready source patch; not releasable.** Handler gates, explicit `verify_jwt = false` config, a guarded caller-migration file, and an enforceable unresolved deployment prerequisite are present in source. SQL validation ran only against disposable local fake-table PostgreSQL fixtures; no SQL ran against Supabase, no credentials were read or changed, no function was invoked or deployed, and the caller migration is **not** marked applied or resolved. Source baseline for the parent checkout: `bc79d6dc9323df8cd97fc73340d75ba9329a1275`. Draft head at the start of this follow-up: `1905c8fe264903dab8d8c44d6a003ef0265b1c34`. This document does not close the anonymous-access findings.

A review-ready source patch is distinct from authorization or readiness to release. The release hold remains in force while runtime prerequisites are unverified.

## Exact secure caller contract

| Surface | Contract | Source evidence |
| --- | --- | --- |
| Internal header | `x-internal-secret` must equal the selected server secret. | `supabase/functions/_shared/admin-auth.ts` lines 11–14 |
| Secret precedence | `EDGE_INTERNAL_SECRET \|\| CRON_SECRET` (first wins; empty string is unset). Not either independently. | same file, line 11; empty/incorrect/precedence coverage in `src/lib/__tests__/cron-auth-gate.test.ts` |
| Rejected callers | Missing Authorization after a failed internal check; public anon bearer; signed-in non-admin. No privileged reads/writes before the gate. | `admin-auth.ts` lines 16–64; both handlers return `requireAdmin` immediately after OPTIONS |
| Accepted callers | Matching internal header (`userId: 'internal'`), service-role bearer (`userId: 'service_role'`), or admin JWT + `user_roles`. | `admin-auth.ts` lines 12–29 and 52–66 |
| Promo handler | `check-expiring-promotions` gates before env reads, clients, promotion reads, digest send, or alert-state writes. | `supabase/functions/check-expiring-promotions/index.ts` lines 27–32 |
| Lightspeed handler | `sync-lightspeed-inventory` gates before service-role client creation, cron-log inserts, inventory writes, or admin SMS. | `supabase/functions/sync-lightspeed-inventory/index.ts` lines 10–21 |
| Gateway | Both slugs have `[functions.<slug>] verify_jwt = false` so a custom header can reach the in-function gate. Do not deploy these entries without the handler gates. Header-only traffic through the live gateway is **unproven**; retain Authorization until an owner proves otherwise. | `supabase/config.toml` lines 288–295 |
| Promo job | `check-expiring-promotions-daily`, `0 13 * * *`, POST `.../functions/v1/check-expiring-promotions`, body `'{}'::jsonb`. | Historical `supabase/migrations/20260518230012_f9a01cef-794e-4bae-90b1-e6c11ff0bdf3.sql` lines 14–26; sanitized planning row below |
| Lightspeed job | `lightspeed-motor-models-sync-daily`, `15 2 * * *`, POST `.../functions/v1/sync-lightspeed-inventory`, body `'{}'::jsonb`. Do not rewrite the other Lightspeed endpoints. | Unexecuted `docs/runbooks/post-rotation-cron-rewrite.sql` lines 163–177; sanitized planning row below |
| Admin UI | Browser `supabase.functions.invoke('sync-lightspeed-inventory')` remains the admin JWT path. `/admin/stock-sync` stays behind `SecureRoute requireAdmin={true}`. Public builder must not trigger sync. | `src/pages/AdminStockSync.tsx`; `README.md` inventory section |
| Protected secret reference | Vault lookup by name, never a literal in repository source. Uppercase `EDGE_INTERNAL_SECRET` / `CRON_SECRET` are a **proposed new Vault naming contract** that requires owner acceptance. They are not an established Vault convention, and Edge env names do not imply Vault names. Established Vault names in source are `service_role_key`, `dropbox-oauth-token`, `sin-encryption-key`, and `vercel_pricing_deploy_hook_url`. `service_role_key` is the JWT used as `Authorization: Bearer` for other callers; `requireAdmin` does not compare `x-internal-secret` to that JWT, so this header path cannot reuse it. | `supabase/migrations/20260910140000_rewrite_promo_lightspeed_cron_internal_secret.sql` |
| Deploy gate | Push-range and manual single-function deploy fail closed while the manifest stays `unresolved` with `path: null` / `version: null`. An `alter_job`-only file is not an inferred table/RPC dependency. | `scripts/lib/cron-auth-release-prerequisites.json`; `scripts/lib/cron-auth-release-prerequisites.mjs`; `scripts/deploy-supabase-functions.mjs` (never applies migrations) |

## Sanitized live observations

The following are sanitized planning facts provided for the original draft. They are **not** authority for live operations, scheduler writes, secret creation, or applying the caller migration.

| Observed job | Target endpoint | Schedule | Active | Credential shape | Gateway |
| --- | --- | --- | --- | --- | --- |
| `check-expiring-promotions-daily` | `check-expiring-promotions` | `0 13 * * *` | yes | anon bearer; no internal header; no vault reference | `verify_jwt` false |
| `lightspeed-motor-models-sync-daily` | `sync-lightspeed-inventory` | `15 2 * * *` | yes | anon bearer; no internal header; no vault reference | `verify_jwt` false |

**MATERIAL RELEASE BLOCKER:** no owner-verified protected database secret reference has been established, and no matching Edge secret presence has been established for this release. A September 2026 drift audit recorded the Edge *name* `EDGE_INTERNAL_SECRET` among production secret names (values not read). That is not current owner verification, not a Vault row, and not value parity. The selected `x-internal-secret` contract therefore still has no approved source to treat as already provisioned.

## What this follow-up authored

This follow-up authors a transactional, fail-closed rewrite at `supabase/migrations/20260910140000_rewrite_promo_lightspeed_cron_internal_secret.sql` and keeps the deploy mapping unresolved. **Not every prerequisite is established.** The proposed Vault names, live command grammar, and Edge/Vault parity all still require owner verification.

The migration, if an owner later accepts the names and applies it:

1. Counts proposed Vault names explicitly and aborts on duplicates, empty values, or catalog/value count drift. It does not use a single-row limiter to pick one duplicate. It does not create a secret. `EDGE_INTERNAL_SECRET` is used only when that proposed name exists; `CRON_SECRET` is used only when it does not.
2. Locks each target `cron.job` row, then requires exactly one matching job name, the preserved schedule, and no extra jobs that mention the same URL.
3. Accepts only a single `SELECT net.http_post` whose entire text matches the supported original grammar: named `url` / `headers` / `body`, `jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer <jwt>')`, `'{}'::jsonb`, optional numeric `timeout_milliseconds`, `AS request_id`. Extra statements, unknown parameters, timeout expressions, different bodies, extra calls, comment-only matches, and duplicate auth keys abort.
4. Inserts exactly one internal-header clause into that validated header constructor. Every other byte, including bearer, timeout, schedule, job identity, and active state, stays unchanged. `cron.alter_job` is command-only.
5. Treats a rerun as already applied only when removing that exact clause recovers a strictly valid original and reinserting it at the Authorization pair reproduces the complete current command. Any other preexisting `x-internal-secret` aborts.
6. Resolves the runtime secret with a scalar subquery that requires exactly one non-empty value and raises before `net.http_post` if missing, empty, or duplicated. Secret values are never interpolated into notices or exception text.

This file is not a successful migration receipt. Do not apply it from this patch.

## Concrete implementation and release sequence

1. **Resolve owners and exact callers.** Jay approves the release owner and credential contract after an authorized sanitized readback. Inventory all matches, duplicates, external callers, preserved schedules/body/active state, and current gateway behavior. Preserve the existing admin browser JWT path.
2. **Prepare a matching server credential securely.** Prefer the existing `x-internal-secret` contract and the precedence above. Confirm the selected Edge secret matches the scheduler's protected Vault name and value without printing either. Confirm each existing cron job execution role can read the selected Vault reference at runtime; migration-owner access alone does not prove this. Do not broaden grants as a shortcut. Do not put a value in source, a PR, shell arguments, or logs. Prefer a Vault reference to embedding a literal in stored cron text. A Vault row must be created or confirmed by the owner; this patch does not invent one as already provisioned.
3. **Apply the guarded migration only after step 2.** Assert the live rows still match the identities in this document. Abort on drift, missing or duplicate matches, or missing secret references. Keep a protected rollback snapshot of the current commands outside the repository.
4. **Stage a compatible transition before enforcing the handler gate.** Live gateway settings are already false for both slugs. Still confirm the scheduler will send the internal header and retain any still-needed Authorization header before an approved deploy. Do not remove a bearer first if compatibility is unproven. Applying the caller migration is a production change requiring explicit approval.
5. **Keep the handler/config patch together.** Both functions import `requireAdmin` and return its rejection immediately after OPTIONS. Explicit `verify_jwt = false` entries ship with those gates. Never deploy the gateway setting by itself. Preserve OPTIONS, existing business logic, and admin JWT/service-role acceptance.
6. **Keep the deployment prerequisite enforceable.** `scripts/lib/cron-auth-release-prerequisites.json` maps both slugs and remains **unresolved** with no path or version. Push-range reporting (`buildDeployRequiredReport` / `deployTargetsFromDiff`) and manual single-function deploy (`releaseRequirementsForSlug` / `runDeploy`) both consult it. Missing manifest entries, malformed or unreadable manifests, absent or unreadable referenced migration files, and unapplied resolved mappings fail closed. Unrelated functions keep the existing inferred dependency path. After an authorized apply, set `status=resolved` with `supabase/migrations/20260910140000_rewrite_promo_lightspeed_cron_internal_secret.sql` and version `20260910140000`; deploy then uses the ordinary applied-migration checks. Do not resolve the mapping from this source-only follow-up.
7. **Accept the authorized release by outcome.** Offline handler tests cover missing/anon/non-admin denial before side effects, OPTIONS, matching internal secret, service role, admin JWT, empty/incorrect secrets, and header precedence. Typecheck both entrypoints if handlers change. Those tests do **not** prove live secret parity or deployment readiness. Following an approved deployment, prefer observing the next scheduled executions and existing logs over triggering extra emails, SMS, or inventory writes. Verify the intended credential route, successful scheduler and HTTP outcomes, and correct business effects. Any manual functional invocation needs explicit authorization because these functions send and write. Verify the admin UI separately with an authorized operation. Only then retire the legacy bearer if the verified gateway/handler contract permits it.

## Exact remaining release blockers

- Owner has not accepted the proposed uppercase Vault names. Edge env names do not establish those Vault names.
- No owner-verified Vault row for the accepted name, and no owner-verified matching Edge secret presence or value parity. The September 2026 name-only Edge listing is not that verification.
- Current jobs, per sanitized observations, still use an anon bearer and do not mention an internal header or vault reference.
- The authored caller SQL is unapplied. The explicit mapping therefore stays unresolved, so automatic push-range and manual single-function deploy remain blocked.
- No independent approval to apply the caller migration or to deploy these two functions.
- Custom-header-only gateway compatibility is unproven; Authorization is retained until an owner proves the header alone reaches the function.
- Sanitized observations are planning facts only; they do not authorize production writes or a guessed schedule/credential rewrite.

Until those are completed, deploying the handler gates would reject the current scheduled callers.

## Deployment-guard gap and the explicit mapping

`scripts/lib/supabase-deploy-required.mjs::requiredMigrationsForSlug` still infers dependencies from the function's referenced tables/RPCs and objects created by added SQL migrations. That inference is unchanged. `scripts/deploy-supabase-functions.mjs` still consumes that inferred `requiredMigrations` list and still never applies migrations.

The authored caller rewrite uses only `cron.alter_job` and creates no tables/RPCs, so it still returns `[]` from the dependency matcher. The explicit prerequisite file is required: unresolved status blocks these two slugs on push-range and manual deploy; a later resolved path/version uses the existing applied-migration checks.

The workflow intentionally never applies migrations. See `.github/workflows/supabase-functions-deploy.yml` and `scripts/deploy-supabase-functions.mjs`. Preserve that separation.

## Hold and rollback conditions

Hold before release when current jobs, gateway settings, secret selection, prerequisite enforcement, or approved write authority are missing. After an approved release, credential-related failures require an approved coordinated caller/gateway rollback or repair. Restore the snapshotted `cron.job.command` for the same `jobid` with `cron.alter_job`; do not replay a historical JWT from git. Preserve evidence and scheduling intent; do not automatically remove the authentication gate, replay a successful send, rotate a shared secret, or restore a historical job definition from this repository. A rollback decision must account for reopening the anonymous spend/write path.

The older pre-migration secret script targets seven other service-role jobs and explicitly excludes Lightspeed; do not execute it as a substitute for this work. The post-rotation rewrite still embeds bearer tokens and is not the caller contract for these two endpoints.

## Independent validation, 2026-09-10

Codex accepted the Cursor patch from clean current main `bc79d6dc9323df8cd97fc73340d75ba9329a1275` plus draft head `1905c8fe264903dab8d8c44d6a003ef0265b1c34`. Cursor CLI `2026.09.08-6caf4ff`, model `cursor-grok-4.6-xhigh-fast`, received committed source only and returned successful JSON results. Codex independently reviewed the SQL and corrected a PostgreSQL planning-time constant error expression and the exact rerun insertion-position check. Tests execute the actual SQL, not a JavaScript reproduction of the migration.

- `npm ci --ignore-scripts --no-audit --no-fund`: installed the repository lockfile; Vitest 4.1.11.
- `npx vitest run src/lib/__tests__/cron-auth-caller-migration.test.ts src/lib/__tests__/cron-auth-gate.test.ts src/lib/__tests__/admin-edge-auth-hardening.test.ts src/test/supabaseDeployRequired.test.ts src/test/supabaseFunctionsDeploy.test.ts`: 5 files / 241 tests passed.
- `npm run verify:small`: both TypeScript checks passed; 248 unit-test files / 1,738 tests passed, none skipped.
- `npm run typecheck:edge -- supabase/functions/check-expiring-promotions/index.ts supabase/functions/sync-lightspeed-inventory/index.ts`: both entrypoints passed. The follow-up does not change their code or shared auth.
- `git diff --check`: passed.

The migration test contains 24 PostgreSQL behavior cases and one manifest assertion. PostgreSQL 17.11 ran against new temporary fake `cron`, `vault`, and `net` schemas through a private Unix socket with TCP disabled. Tests replace only extension setup with fixtures, execute the authored DO block, and never invoke an actual scheduler or HTTP client. They verify exact command-byte/metadata preservation, inactive jobs, unrelated rows, numeric timeout, reruns, rollback after second-job failure, duplicate/missing callers and references, unsupported command shapes, valid runtime lookup, and missing/empty/duplicate runtime references failing before fake HTTP. Clusters are stopped and removed afterward.

Reproduction requires `pg_config`, `initdb`, `pg_ctl`, and `psql`. The PostgreSQL group explicitly skips when server binaries are absent; a run with those tests skipped is not migration acceptance evidence. Local validation above ran all of them. The fixtures do not establish installed Supabase extension behavior, the live job execution roles' Vault access, secret parity, or production readiness.

Before any later release, independently verify the existing cron execution roles can read the selected accepted Vault reference. Do not infer runtime access from the migration owner's privileges or broaden grants as a shortcut. Preserve the unresolved manifest until the contract, caller readback, authorized apply and applied-migration evidence are established. No merge, Supabase migration apply, deployment, live cron alteration, secret rotation, or promotion dispatch was performed for this follow-up.

## Live metadata readback 2026-09-11 (Cursor, names/flags only)

Sanitized production metadata was already read against project `eutsoqdpjurknjsshxes`. This section records names, schedules, and presence flags only. It does not reprint commands, credentials, or secret values. It is not authorization to apply the caller migration, deploy handlers, or resolve the prerequisite mapping. The mapping must remain `status=unresolved`, `path=null`, `version=null`.

Public-function pair holds from #538 have landed on `main`. This hold branch merged that work and must keep both systems: cron-auth unresolved slugs stay skipped, and chat/realtime pairs stay UNVERIFIED-held.

### In-scope scheduled callers

| jobid | name | schedule | active | target endpoint | mentions_internal_header | mentions_authorization | mentions_vault |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 46 | `check-expiring-promotions-daily` | `0 13 * * *` | true | `check-expiring-promotions` | false | true | false |
| 19 | `lightspeed-motor-models-sync-daily` | `15 2 * * *` | true | `sync-lightspeed-inventory` | false | true | false |

Exactly one caller exists for each of those two endpoints.

### Sister job and out-of-scope Lightspeed jobs

| jobid | name | schedule | active | mentions_internal_header | mentions_authorization | mentions_vault | note |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 37 | `promo-notifications-daily` | `0 14 * * *` | true | true | false | false | Different endpoint; already uses `x-internal-secret`. Do not rewrite it in this PR. |

Other Lightspeed jobs (customers, units, parts, service, deals, open-ros, parts-invoices) are Authorization-only and remain out of scope.

### Vault names and migration ledger

Vault secret names present: `service_role_key`, `sin-encryption-key`, `vercel_pricing_deploy_hook_url`, plus one unnamed (`null`) row. Vault names **not** present: `EDGE_INTERNAL_SECRET`, `CRON_SECRET`. The proposed Vault contract is therefore still unaccepted and unprovisioned. A prior Edge-secret-name audit that `EDGE_INTERNAL_SECRET` exists as an Edge env name is **not** a Vault row.

Migration `20260910140000` is **not** in `supabase_migrations.schema_migrations`.

### Why this stay-held conclusion is unchanged

- Deploying the gated handlers before the caller migration would 401 the two scheduled jobs, which still send Authorization and do not mention an internal header or Vault reference.
- Applying the caller migration now would abort or be wrong because Vault lacks the proposed names.
- The explicit prerequisite JSON therefore stays unresolved. This update does not apply the caller migration, does not deploy, and does not resolve that mapping.

## Precise remaining prerequisites (2026-09-11)

Head this list was reconciled against: `23b9194270cb92ab776a9033fc2a2e386a027e97`. Manifest stays `status=unresolved`, `path=null`, `version=null`. Do not invent a Vault value. Do not reuse the ElevenLabs / `ELEVENLABS_MCP_SECRET` credential. Secret provisioning belongs to Codex/the owner through secure storage. Do not request or expose raw values in cloud chat.

### Already verified in source or sanitized live readback

| Item | Status | Evidence |
| --- | --- | --- |
| Job identity + schedule | Verified | jobid 46 `check-expiring-promotions-daily` `0 13 * * *` active; jobid 19 `lightspeed-motor-models-sync-daily` `15 2 * * *` active |
| Duplicate callers on those two URLs | Verified none extra | Exactly one `cron.job` row each |
| Sister / out-of-scope jobs | Verified | jobid 37 `promo-notifications-daily` already uses `x-internal-secret`; other Lightspeed jobs untouched |
| Gateway `verify_jwt` | Verified false | Live registry for both slugs |
| Execution role identity | Verified | Both in-scope jobs run as `username=postgres`, `database=postgres`, `nodename=localhost` |
| Execution-role Vault table grants | Verified at privilege level | `postgres` has `SELECT` on `vault.secrets` and `vault.decrypted_secrets` (same for `service_role`). This is **not** proof a selected secret row exists. |
| Proposed Vault names | Absent | No `EDGE_INTERNAL_SECRET` or `CRON_SECRET` row in `vault.secrets` |
| Caller migration ledger | Absent | `20260910140000` not in `schema_migrations` |
| Handler + deploy gate | Source ready | `requireAdmin` before side effects; unresolved manifest skips both slugs; `#538` pair holds coexist |
| Selected-secret precedence (source contract) | Documented | `requireAdmin` uses `EDGE_INTERNAL_SECRET \|\| CRON_SECRET` (first nonempty wins). Migration prefers a Vault row named `EDGE_INTERNAL_SECRET`, else `CRON_SECRET` only if that is the only proposed name. |

### Still required before anyone applies SQL or deploys handlers

1. **Owner accepts the Vault naming contract** (`EDGE_INTERNAL_SECRET` preferred) or names a different accepted Vault reference that still matches the selected Edge env name. Established Vault names (`service_role_key`, `sin-encryption-key`, `vercel_pricing_deploy_hook_url`) are the wrong contract for `x-internal-secret`.
2. **Codex/owner provisions exactly one nonempty Vault row** for the accepted name via secure storage. Zero rows: migration aborts. Duplicate rows: migration aborts. Empty/unreadable decrypted value: migration aborts.
3. **Selected-secret precedence proof** (credential-owning environment, names/presence/parity only):
   - List Edge secret **names** on project `eutsoqdpjurknjsshxes`.
   - If both `EDGE_INTERNAL_SECRET` and `CRON_SECRET` exist on Edge, the Vault row must be `EDGE_INTERNAL_SECRET` and must match that Edge value.
   - If only `CRON_SECRET` exists on Edge, Vault must be `CRON_SECRET` and Edge must also select it (no nonempty `EDGE_INTERNAL_SECRET`).
   - Compare presence and equality without printing values. Edge-name presence alone is not Vault provisioning.
4. **Preserved command/schedule/body/options snapshot** taken in the credential-owning environment. This chat verified schedule, active, job name, and header-shape flags only. It did **not** read `cron.job.command`. Owner must confirm the live command still matches the migration’s supported `SELECT net.http_post(url := '<exact function URL>', headers := jsonb_build_object('Content-Type','application/json','Authorization', 'Bearer <jwt>'), body := '{}'::jsonb [, timeout_milliseconds := <int>]) AS request_id;` grammar, then store a **protected rollback snapshot** outside git (same `job_id`, current command). Do not paste command text or JWTs into GitHub or this chat.
5. **Duplicate / external callers beyond `cron.job`**. In-database extra URL callers are none. Owner still confirms no GitHub Action, Vercel cron, or external scheduler hits these two slugs with a different credential.
6. **Authorize and apply** `supabase/migrations/20260910140000_rewrite_promo_lightspeed_cron_internal_secret.sql` only after steps 1–5. Read back ledger `version` + `name`. Confirm each job still has the same `jobid`, schedule, active state, and that the new command adds exactly one `x-internal-secret` Vault clause while retaining the existing Authorization pair.
7. **Observe the next scheduled runs** (13:00 UTC promo; 02:15 UTC Lightspeed) or an explicitly authorized manual invoke. Success + HTTP 2xx before anyone deploys the gated handlers.
8. **Then** set both manifest entries to `status=resolved`, `path=supabase/migrations/20260910140000_rewrite_promo_lightspeed_cron_internal_secret.sql`, `version=20260910140000` (both fields required) and deploy `check-expiring-promotions` + `sync-lightspeed-inventory` together. Deploying handlers before step 6/7 401s the current Authorization-only callers.

Release hold remains. Review-ready source is not release authorization.
