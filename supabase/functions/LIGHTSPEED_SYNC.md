# HBW Lightspeed mirror repair, October 1, 2026

These three functions were recovered from deployed sources because current Git main did not contain them. The original deployed versions inspected were lightspeed-sync v43, lightspeed-sync-service v39 and lightspeed-sync-new-feeds v34. Credential literals were removed before saving source. LIGHTSPEED_USERNAME and LIGHTSPEED_PASSWORD must be configured in Supabase secrets; JWT verification remains enabled. No credential values belong in this repository.

Handlers reject a request before creating a database handle, calling Lightspeed, writing a sync log, or running SQL unless the bearer exactly matches a nonempty `SUPABASE_SERVICE_ROLE_KEY` or the `x-internal-secret` header exactly matches the first nonempty `EDGE_INTERNAL_SECRET` or `CRON_SECRET`. Missing or empty configuration fails closed. Anon, ordinary, and admin JWTs are not accepted. Unit sync still upserts validated rows, but omitted-unit deletion stays disabled because this source has no independent snapshot-completeness proof; results report `purged: 0` and `purge_status: "held"`. Scheduled anon callers are not retargeted here.

Source JSON preserves integers above JavaScript’s exact range as decimal strings, preventing 64-bit writer/technician IDs from rounding. Customer and service upserts refresh all inserted nonkey source fields. Customer consent is validated before customer writes. Scheduled service selection includes recent lastmodifieddate, closedate or datein; it pages with stable ROHeaderID order, refetches full nested detail by exact keys, writes each page in a transaction, and records failed/incomplete imports accurately. This preserves the source's known paginated Unit[] workaround.

This repair does not delete retained customers or missing historical service child rows, perform a historical backfill, change invoice arithmetic, change SMS, rotate the source login or replace the existing VoIP owner lane. New-feeds retains its existing feed behavior and uses configured secrets rather than embedded fallbacks.

Verification:

- npm run typecheck:edge -- supabase/functions/lightspeed-sync/index.ts supabase/functions/lightspeed-sync-service/index.ts supabase/functions/lightspeed-sync-new-feeds/index.ts
- npx --yes deno@2.9.5 test --allow-env --no-config --node-modules-dir=none supabase/functions/_shared/server-caller-auth_test.ts supabase/functions/lightspeed-sync-service/sync_test.ts supabase/functions/lightspeed-sync/customer_test.ts supabase/functions/_shared/lightspeed-json_test.ts
- Live authorized customer-only and service-only runs; unauthorized requests denied; fresh direct source/mirror comparisons recorded as counts only in the canonical HBW Vault remediation report.

Privacy migration restricts 24 audited private read RPCs while retaining service-role access. It deliberately preserves quote/auth helper permissions and separately secret-gated worker write RPCs. Existing callers must use their authorized connector or server-side credentials; never restore public execution as a compatibility fix.
