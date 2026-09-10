# Release prerequisites for promotion and Lightspeed cron authentication

Status: reviewable source-only plan; no SQL was run against a database, no credentials were read or changed, and no function was invoked or deployed. Source baseline: `ef4aa4d73ec12f8a55ee7889a58fb05e5a3f130c`. This document does not close the anonymous-access findings.

## Verified source and missing authority

| Function | Verified repository evidence | Required live evidence before an implementation release |
| --- | --- | --- |
| `check-expiring-promotions` | `supabase/migrations/20260518230012_f9a01cef-794e-4bae-90b1-e6c11ff0bdf3.sql` defines `check-expiring-promotions-daily`, `0 13 * * *`, an HTTP POST with a public anon bearer, and an empty JSON body. The handler creates service-role/Resend clients, reads promotions, sends a digest, and updates alert state without authenticating the caller. | Every current job targeting this endpoint, its active state, schedule, body shape, gateway setting, credential source, and last outcome. A migration is not evidence that its schedule is still deployed. |
| `sync-lightspeed-inventory` | The handler creates a service-role client before caller validation, writes cron logs/inventory, and can invoke admin SMS. `post-rotation-cron-rewrite.sql` describes `lightspeed-motor-models-sync-daily`, job 19, `15 2 * * *`, using an anon bearer. This is an unexecuted historical draft, not current scheduler authority. | Every current job targeting this exact endpoint and the same fields above. Do not rewrite the other Lightspeed endpoints or assume historical job IDs, schedules, or credentials are still valid. |

`src/pages/AdminStockSync.tsx` invokes the Lightspeed function through the authenticated Supabase client. `src/App.tsx` protects `/admin/stock-sync` with `SecureRoute requireAdmin={true}`. `UnifiedInventoryDashboard.tsx`, `InventoryMonitor.tsx`, and `InventoryDiagnostics.tsx` also contain admin invocation sites. The public builder must not trigger sync (`README.md`, inventory section). Adding the existing admin gate preserves a valid admin session; a public anon bearer alone must be rejected.

Neither function has a `[functions.<slug>]` block in `supabase/config.toml`. Their deployed gateway JWT settings are unknown. A header-only internal secret cannot cross a gateway that requires a JWT.

## Credential-redacted inventory to request

After read-only production inspection is authorized, start with a bounded query like this. It selects metadata and header-shape hints, never the command text or credential values. Hints do not prove that a credential is valid or matches the Edge secret; resolve that separately without printing secrets. It intentionally finds all jobs containing either endpoint instead of trusting historical IDs.

```sql
SELECT jobid, jobname, schedule, active,
       CASE
         WHEN command LIKE '%/functions/v1/check-expiring-promotions%'
           THEN 'check-expiring-promotions'
         ELSE 'sync-lightspeed-inventory'
       END AS target_hint,
       (command ILIKE '%x-internal-secret%') AS mentions_internal_header,
       (command ILIKE '%Authorization%') AS mentions_authorization,
       (command ILIKE '%vault.%') AS mentions_vault
FROM cron.job
WHERE command LIKE '%/functions/v1/check-expiring-promotions%'
   OR command LIKE '%/functions/v1/sync-lightspeed-inventory%'
ORDER BY jobid;
```

Also obtain a sanitized function registry read of the two exact slugs and their deployed `verify_jwt` values, secret *presence* (not values), and recent scheduler/HTTP outcome codes. Do not include raw `cron.job.command`, HTTP response bodies, contact records, or a complete cron CSV in a handoff. No matching job is a finding requiring owner clarification, not permission to create a guessed schedule.

## Concrete implementation and release sequence

1. **Resolve owners and exact callers.** Jay approves the release owner and credential contract after the sanitized readback. Inventory all matches, duplicates, external callers, preserved schedules/body/active state, and current gateway behavior. Preserve the existing admin browser JWT path.
2. **Prepare a matching server credential securely.** Prefer the existing `x-internal-secret` contract. `_shared/admin-auth.ts` selects `EDGE_INTERNAL_SECRET || CRON_SECRET`: when both are present, the first wins; it does **not** accept either independently. Confirm the selected secret matches the scheduler's protected credential source. Do not put a value in source, a PR, shell arguments, or logs. Prefer a protected database secret reference to embedding a literal in stored cron text; verify the available secret store before writing SQL.
3. **Prepare a narrow transactional migration from observed rows.** Assert the exact observed job identities, target, schedule/body/active state, and expected prior configuration before updating. Abort on drift, missing or duplicate matches, or missing secret references. Change only the two endpoints' credential construction and preserve scheduling behavior. The committed migration contains no credential values. Keep a protected rollback reference outside the repository.
4. **Stage a compatible transition before enforcing the handler gate.** If a gateway still requires JWT, retain its existing valid Authorization header while adding the internal header; confirm this dual-header route is compatible before changing the scheduler. Do not remove the bearer first. If the existing bearer is invalid or compatibility cannot be proven, stop and design an approved coordinated gateway/caller transition; do not guess. Applying the migration is a production change requiring explicit approval.
5. **Prepare the handler/config patch together.** Import `requireAdmin` and return its rejection immediately after OPTIONS, before environment-dependent work, clients, logging inserts, body parsing, or outbound calls. Add explicit `verify_jwt = false` entries for both functions **in the same release** as these in-function identity gates so a header-only internal caller can reach them. Never deploy the gateway relaxation by itself. Preserve OPTIONS, existing business logic, and admin JWT/service-role acceptance.
6. **Make the deployment prerequisite enforceable.** Add an explicit mapping from each slug to the actual caller-migration filename/version and ensure both push-range and manual single-function deployment consult it. Test missing/unreadable/unapplied prerequisites as blocked. Do not invent a filename or applied version in this plan. Apply and read back the caller migration before the approved Edge deployment. A successful CI run is not proof that the prerequisite exists in production.
7. **Accept the authorized release by outcome.** First run offline handler tests for missing/anon/non-admin denial before side effects, OPTIONS, matching internal secret, service role, and admin JWT; typecheck both entrypoints. Following the approved deployment, prefer observing the next scheduled executions and existing logs over triggering extra emails, SMS, or inventory writes. Verify the intended credential route, successful scheduler and HTTP outcomes, and correct business effects. Any manual functional invocation needs explicit authorization because these functions send and write. Verify the admin UI separately with an authorized operation. Only then retire the legacy bearer if the verified gateway/handler contract permits it.

## Deployment-guard gap proved offline

At this baseline there is no explicit cron-auth dependency manifest. `scripts/lib/supabase-deploy-required.mjs::requiredMigrationsForSlug` infers dependencies from the function's referenced tables/RPCs and objects created by added SQL migrations. `scripts/deploy-supabase-functions.mjs` consumes that inferred `requiredMigrations` list. It does not automatically connect a `cron.alter_job` credential rewrite to either handler.

An in-memory synthetic migration containing only `SELECT cron.alter_job(job_id := 1, command := 'SELECT 1');` returned `[]` for **both** functions when passed to the actual dependency matcher. This was an offline string fixture, not a database command. Therefore merely adding a cron migration alongside a gate would not reliably stop the gate deploying first. The explicit prerequisite mechanism in step 6 is required before this plan becomes a releasable runtime patch.

The workflow intentionally never applies migrations. See `.github/workflows/supabase-functions-deploy.yml` and `scripts/deploy-supabase-functions.mjs`. Preserve that separation.

## Hold and rollback conditions

Hold before release when current jobs, gateway settings, secret selection, prerequisite enforcement, or approved write authority are missing. After an approved release, credential-related failures require an approved coordinated caller/gateway rollback or repair. Preserve evidence and scheduling intent; do not automatically remove the authentication gate, replay a successful send, rotate a shared secret, or restore a historical job definition. A rollback decision must account for reopening the anonymous spend/write path.

This plan deliberately contains no runnable production migration or runtime gate patch: current live caller identities and gateway behavior remain unverified. The older pre-migration secret script targets seven other service-role jobs and explicitly excludes Lightspeed; do not execute it as a substitute for this work.
