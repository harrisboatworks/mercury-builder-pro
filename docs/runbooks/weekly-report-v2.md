# Weekly report v2

The weekly report aggregates four complete, nonoverlapping weeks in PostgreSQL rather than downloading event rows through the PostgREST row cap. The existing Monday 07:00 UTC cron, authentication and recipients are unchanged. Default periods end at the most recent Monday 07:00 UTC, so scheduler jitter does not create overlapping windows.

The opening paragraph is deterministic plain language assembled from verified aggregates. It replaces the unconstrained AI interpretation: the report cannot infer affordability, intent, human identity or why someone left from these events. No customer contact fields or conversation content leave the aggregation function.

## Definitions and limits

- Sessions are distinct nonempty stored session identifiers, not unique people. The motor-to-summary count requires both events in the same week and session, with a summary at/after motor selection. Optional steps are never drop-offs. Submission telemetry is separate from persisted contactable quote records.
- Events explicitly marked `is_test`, `is_bot`, or a test/development/preview environment exclude that session in that week. Untagged automation remains. Sub-second motor-to-summary sessions are shown as suspicious, not excluded or labelled verified bots.
- Public API quotes and admin quotes are separate from website quote metrics. Only explicit test markers and reserved example/test email domains classify test quotes; API origin alone does not. Test and admin exclusion counts can overlap.
- Contactable quote records have a non-placeholder email or a phone. This is recorded contact data, not verified deliverability or a count of unique people. Quoted value is not revenue. Model fallback supports current nested motor/selectedMotor objects and API `items[0].name` as well as legacy fields; unrecoverable names remain “Not recorded.”
- Trade valuations, contact inquiries, chat conversations/recorded phones, and quote sources are separate record counts; they may overlap. Pending status is the current status at generation time, not a historical reconstruction. No false total of distinct leads is produced.
- Paid motor deposits use `saved_quotes.deposit_status='paid'` and `deposit_paid_at`, including quotes created before the report period. Pending requests, deposit amounts entered in a calculator, other payment flows and offline sales are not counted as paid motor deposits. Untagged test payments cannot be distinguished retrospectively.
- Anonymous PDF snapshots are saved before PDF generation. They are not proof of a completed download. Phone/text clicks are not proof of a completed conversation.
- Blog attribution requires a blog page view before motor selection in the same session/week; multiple articles can receive credit. It is association, not causal attribution. Query strings/fragments are removed from article labels. Traffic source is the first event in the reporting week, not guaranteed lifetime acquisition source.
- Four weeks are recalculated with the same definitions. Missing/invalid aggregate data aborts sending instead of becoming zero. Tracking outages and unmarked automation remain possible.

## Validation

- `npm run typecheck:edge -- supabase/functions/weekly-quote-report/index.ts`
- `npx vitest run src/test/weekly-report-v2.test.ts`
- `npm run typecheck`
- Run `supabase/tests/weekly-report-v2.sql` with `psql -v ON_ERROR_STOP=1 -f ...` only in an empty disposable PostgreSQL database. It refuses a database containing public tables and rolls back its synthetic fixture. Covers >1,000 events, interval boundaries, full-session test exclusion, retained fast sessions, optional steps, API/test/admin separation, contact checks, model fallback, paid timestamps, blog chronology and RPC privileges.
- The aggregate SELECT can be evaluated read-only without creating the RPC. Keep operational results outside Git. Compare a fixed week against independent counts; render SMS/email locally without sending.

## Release gate

Owner approval is required before merging, applying the migration or deploying the Edge function. Apply only `20260921160000_weekly_report_v2.sql`, then deploy `weekly-quote-report` with its relative dependencies and existing auth configuration. Do not push the entire migration backlog. No scheduler edit is required.

After approved deployment, invoke an authenticated `POST` with `{"dry_run":true,"end_at":"<fixed ISO timestamp>"}`. This reads aggregates and returns rendered SMS/email without calling Resend or Twilio. Validate a known period before the next natural scheduled run. A historical `end_at` is rejected unless dry_run is true. Do not send a test SMS/email without separate authorization.

Provider acceptance is reported separately for email and SMS. A configured phone alone never proves submission, and provider acceptance never proves delivery. Repeating a send after partial failure can duplicate the already-accepted channel; this change does not introduce automatic retries or an exactly-once outbox. For acceptance, check the next natural report's actual provider delivery status and rendered content.

Rollback: redeploy the prior Edge version. The new read-only, service-role-only RPC can remain unused; it changes no existing data or policies. The old report retains the defects this change fixes, so communicate rollback status explicitly.
