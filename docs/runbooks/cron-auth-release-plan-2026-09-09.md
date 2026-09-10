# Release prerequisites for promotion and Lightspeed cron authentication

Status: **draft source-only patch; not releasable.** Handler gates, explicit `verify_jwt = false` config, and an enforceable unresolved deployment prerequisite are present in source. No SQL was run against a database, no credentials were read or changed, no function was invoked or deployed, and **no caller migration was authored**. Source baseline: `bc79d6dc9323df8cd97fc73340d75ba9329a1275`. This document does not close the anonymous-access findings.

This patch cannot be released until the prerequisites below are concretely completed and independently approved.

## Sanitized live observations

The following are sanitized planning facts provided for this draft. They are **not** authority for live operations, scheduler writes, secret creation, or a caller migration.

| Observed job | Target endpoint | Schedule | Active | Credential shape | Gateway |
| --- | --- | --- | --- | --- | --- |
| `check-expiring-promotions-daily` | `check-expiring-promotions` | `0 13 * * *` | yes | anon bearer; no internal header; no vault reference | `verify_jwt` false |
| `lightspeed-motor-models-sync-daily` | `sync-lightspeed-inventory` | `15 2 * * *` | yes | anon bearer; no internal header; no vault reference | `verify_jwt` false |

**MATERIAL RELEASE BLOCKER:** no approved protected database secret reference has been established, and no matching Edge secret presence has been established. The selected `x-internal-secret` contract (`EDGE_INTERNAL_SECRET || CRON_SECRET`, first wins, not either independently) therefore has no approved source to name in a migration.

Because those contracts are unknown, this draft **stops** the caller-migration portion. It does not invent a secret reference, an existing-caller migration filename/version, a replacement cron job, or a successful migration receipt.

## Verified source and missing authority

| Function | Verified repository evidence | Required live evidence before an implementation release |
| --- | --- | --- |
| `check-expiring-promotions` | Historical committed SQL defined `check-expiring-promotions-daily`, `0 13 * * *`, an HTTP POST with a public anon bearer, and an empty JSON body. The handler now returns `requireAdmin` immediately after OPTIONS, before environment reads, clients, promotion reads, digest send, or alert-state writes. | Owner-approved caller inventory, an approved protected secret reference, matching Edge secret presence, and an authored-then-applied caller migration. A migration file is not evidence that its schedule is still deployed. Sanitized observations above do not replace that approval. |
| `sync-lightspeed-inventory` | A historical unexecuted draft described `lightspeed-motor-models-sync-daily` using an anon bearer. The handler now returns `requireAdmin` immediately after OPTIONS, before service-role client creation, cron-log inserts, inventory writes, or admin SMS. | The same missing contracts as above, scoped to this exact endpoint. Do not rewrite the other Lightspeed endpoints or assume historical job IDs, schedules, or credentials are still valid without owner approval. |

`src/pages/AdminStockSync.tsx` invokes the Lightspeed function through the authenticated Supabase client. `src/App.tsx` protects `/admin/stock-sync` with `SecureRoute requireAdmin={true}`. `UnifiedInventoryDashboard.tsx`, `InventoryMonitor.tsx`, and `InventoryDiagnostics.tsx` also contain admin invocation sites. The public builder must not trigger sync (`README.md`, inventory section). Adding the existing admin gate preserves a valid admin session; a public anon bearer alone must be rejected.

Both functions now have explicit `[functions.<slug>] verify_jwt = false` blocks in `supabase/config.toml`, in the same source change as the in-function gates. A header-only internal secret still cannot succeed until a matching Edge secret exists and the scheduler sends that header. Deploying the gate before the caller rewrite would 401 the current anon-bearer jobs.

## Credential-redacted inventory still required for a real caller migration

The earlier redacted scheduler inventory shape remains the required input for an eventual migration: job identity, target, schedule, active state, and header-shape hints only. Do not collect raw command text, credential values, HTTP bodies, or contact records. Hints do not prove that a credential is valid or matches the Edge secret; resolve that separately without printing secrets. No matching job would be a finding requiring owner clarification, not permission to create a guessed schedule.

The sanitized observations in this draft fill the planning table only. They are not an approved write-back and do not name a secret store key.

## Concrete implementation and release sequence

1. **Resolve owners and exact callers.** Jay approves the release owner and credential contract after an authorized sanitized readback. Inventory all matches, duplicates, external callers, preserved schedules/body/active state, and current gateway behavior. Preserve the existing admin browser JWT path.
2. **Prepare a matching server credential securely.** Prefer the existing `x-internal-secret` contract. `_shared/admin-auth.ts` selects `EDGE_INTERNAL_SECRET || CRON_SECRET`: when both are present, the first wins; it does **not** accept either independently. Confirm the selected secret matches the scheduler's protected credential source. Do not put a value in source, a PR, shell arguments, or logs. Prefer a protected database secret reference to embedding a literal in stored cron text; verify the available secret store before writing SQL.
3. **Prepare a narrow transactional migration from observed rows.** This step is **blocked** until step 2 has an approved secret reference and Edge secret presence. Then assert the exact observed job identities, target, schedule/body/active state, and expected prior configuration before updating. Abort on drift, missing or duplicate matches, or missing secret references. Change only the two endpoints' credential construction and preserve scheduling behavior. The committed migration must contain no credential values. Keep a protected rollback reference outside the repository.
4. **Stage a compatible transition before enforcing the handler gate.** Live gateway settings are already false for both slugs. Still confirm the scheduler will send the internal header (and retain any still-needed Authorization header) before an approved deploy. Do not remove a bearer first if compatibility is unproven. Applying a caller migration is a production change requiring explicit approval.
5. **Keep the handler/config patch together.** This draft imports `requireAdmin` and returns its rejection immediately after OPTIONS, before environment-dependent work, clients, logging inserts, body parsing, or outbound calls. Explicit `verify_jwt = false` entries ship with those gates so a header-only internal caller can reach them. Never deploy the gateway setting by itself. Preserve OPTIONS, existing business logic, and admin JWT/service-role acceptance.
6. **Keep the deployment prerequisite enforceable.** `scripts/lib/cron-auth-release-prerequisites.json` maps both slugs. The committed mapping is **unresolved** and names no migration path or version. Push-range reporting (`buildDeployRequiredReport` / `deployTargetsFromDiff`) and manual single-function deploy (`releaseRequirementsForSlug` / `runDeploy`) both consult it. Missing manifest entries, malformed or unreadable manifests, absent or unreadable referenced migration files, and unapplied resolved mappings fail closed. Unrelated functions keep the existing inferred dependency path. When a real caller migration later exists, set `status=resolved` with that path and version; deploy then uses the ordinary applied-migration checks. Do not invent a filename or applied version now.
7. **Accept the authorized release by outcome.** First run offline handler tests for missing/anon/non-admin denial before side effects, OPTIONS, matching internal secret, service role, and admin JWT; typecheck both entrypoints. Following the approved deployment, prefer observing the next scheduled executions and existing logs over triggering extra emails, SMS, or inventory writes. Verify the intended credential route, successful scheduler and HTTP outcomes, and correct business effects. Any manual functional invocation needs explicit authorization because these functions send and write. Verify the admin UI separately with an authorized operation. Only then retire the legacy bearer if the verified gateway/handler contract permits it.

## Exact remaining release blockers

- No approved protected database secret reference for the selected internal secret.
- No established matching Edge secret presence for that selected secret.
- No owner-approved caller-migration write: current jobs still use an anon bearer and do not mention an internal header or vault reference.
- No authored caller SQL, therefore no applied-migration version that can resolve the explicit mapping.
- No independent approval to apply a future caller migration or to deploy these two functions.
- Sanitized observations are planning facts only; they do not authorize production writes or a guessed schedule/credential rewrite.

Until those are completed, deploying the handler gates would reject the current scheduled callers.

## Deployment-guard gap and the explicit mapping

`scripts/lib/supabase-deploy-required.mjs::requiredMigrationsForSlug` still infers dependencies from the function's referenced tables/RPCs and objects created by added SQL migrations. That inference is unchanged. `scripts/deploy-supabase-functions.mjs` still consumes that inferred `requiredMigrations` list and still never applies migrations.

An in-memory synthetic migration containing only `SELECT cron.alter_job(job_id := 1, command := 'SELECT 1');` still returns `[]` for **both** functions when passed to the actual dependency matcher. Therefore a future caller rewrite would not, by itself, stop the gate deploying first. The explicit prerequisite file is required: unresolved status blocks these two slugs on push-range and manual deploy; a later resolved path/version uses the existing applied-migration checks.

The workflow intentionally never applies migrations. See `.github/workflows/supabase-functions-deploy.yml` and `scripts/deploy-supabase-functions.mjs`. Preserve that separation.

## Hold and rollback conditions

Hold before release when current jobs, gateway settings, secret selection, prerequisite enforcement, or approved write authority are missing. After an approved release, credential-related failures require an approved coordinated caller/gateway rollback or repair. Preserve evidence and scheduling intent; do not automatically remove the authentication gate, replay a successful send, rotate a shared secret, or restore a historical job definition. A rollback decision must account for reopening the anonymous spend/write path.

The older pre-migration secret script targets seven other service-role jobs and explicitly excludes Lightspeed; do not execute it as a substitute for this work.
