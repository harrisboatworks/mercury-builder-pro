# Twilio webhook #332 — remaining source delta and release plan

Source-only. This document does not authorize a migration apply, secret change, customer SMS, or Edge deploy.

**Head this note was written against:** `557a8da7e27ced6b52d2659bc82d6a513d5e53c5` (behavior). Later documentation-only commits on this branch do not change handlers.

## Migration claim (corrected)

Do **not** reapply `supabase/migrations/20260830230000_add_twilio_sms_status_tracking.sql`.

Fresh production ledger (project `eutsoqdpjurknjsshxes`, 2026-09-11, names only):

| Ledger field | Value |
| --- | --- |
| `supabase_migrations.schema_migrations.version` | `20260910005522` |
| `name` | `add_twilio_sms_status_tracking` |

The source filename uses `20260830230000`. The deploy matcher treats a file as applied when the 14-digit version, full stem, **or name suffix** matches an applied `version` or `name`. The name suffix is `add_twilio_sms_status_tracking`, so this file is already applied.

Live schema (not inferred from the filename):

- `public.sms_logs.message_sid` text, nullable
- `public.sms_logs.error_code` text, nullable
- unique index `sms_logs_message_sid_uidx` on `message_sid` where not null

PR **#512** merged the migration and baseline tracking. Reconcile by **name and schema**, not by re-running the timestamped filename.

This remaining #332 range versus `origin/main` does **not** change that migration file.

## Remaining source delta versus current main

Nine files, handler/config/tests only:

| File | Remaining unique work |
| --- | --- |
| `_shared/twilio-signature.ts` | Canonical signed URL from `TWILIO_WEBHOOK_URL`; inbound query allowlists only `sms_log_id`; `decideNotificationWebhook` / `readNotificationWebhookFields` |
| `_shared/twilio-status.ts` | Callback builder uses the same configured URL; retry fragment `#rp=ct,rt,5xx&rc=2` (Twilio strips it before signing) |
| `send-sms/index.ts` | `buildSmsStatusCallbackUrl(Deno.env.get('TWILIO_WEBHOOK_URL'), outbox.id)` |
| `notification-webhook/index.ts` | `configuredWebhookUrl: Deno.env.get('TWILIO_WEBHOOK_URL')`; service-role client after validation |
| tests / types / shim | HMAC known-answer, allowlist, ErrorCode, generated `message_sid` / `error_code` types |

Already on main and kept: `#507` signature gate, `#512` `applyTwilioStatusToSmsLog`, consultation SMS policy, `requireAdmin`, rate limits, zero-row mapping (`503` / `409` / `200`).

## Canonical callback URL (configuration, not a change)

`resolveConfiguredTwilioWebhookUrl` accepts only HTTPS, no username/password, no query, no hash. The exact public function URL that must match Twilio’s configured StatusCallback **base** is:

`https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/notification-webhook`

Outbound send-sms then appends `?sms_log_id=<uuid>` and the retry fragment. Inbound signing uses the configured base plus that one allowlisted query. Request/proxy host and path never participate.

Owner/Codex (credential-owning environment, do not paste values into chat):

1. Confirm Edge secret **name** `TWILIO_WEBHOOK_URL` is present.
2. Confirm its value equals the canonical URL above (byte-for-byte after trim). Do not print it.
3. Confirm `TWILIO_AUTH_TOKEN` is present (name only).
4. Do **not** change `TWILIO_WEBHOOK_URL` from this note.

If the secret is missing or not that exact URL, callbacks fail closed (`503` “Twilio webhook is not configured”).

## Paired deployment plan (not authorized here)

After this PR merges, deploy `send-sms` and `notification-webhook` **together**. One-sided deploy splits signing (new URL) from send-sms callback construction (or the reverse).

These two slugs are **not** in the `#538` pair-hold set. Deploy still fails closed when `TWILIO_WEBHOOK_URL` is absent from the Edge secret-name list (`SUPABASE_EDGE_SECRET_NAMES` or `listSecretNames`). The workflow still never applies migrations. The tracking migration is already applied by name, so the deploy job must not treat it as unapplied.

Do not send live Twilio messages as proof. Source verification is the HMAC suite plus Edge typecheck.

## #300

`send-notification` remains a separate lane. Releasing #332 does not add tracked callbacks to that sender.
