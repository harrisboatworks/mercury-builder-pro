# Deposit deal-packet staged acceptance

PR 371, isolated worktree `mercury-deposit-recovery-main-5406efd`, branch `cursor/deposit-deal-packet-20260823`.

Feature HEAD: `0696eb91f650382290bcc48fa63d69189fd36efd`. First harness commit: `b90f6e6818d5a7da2635d2a4f27bd0ba1aeb2863`. This document is the acceptance artifact after closing the local PostgreSQL and Deno gates.

Live I/O: none. Synthetic fixtures only (`ada@example.com`, quote `11111111-1111-4111-8111-111111111111`, deal `22222222-2222-4222-8222-222222222222`). No Stripe sessions, Resend sends, SMS, or remote Supabase mutations. The PostgreSQL cluster is created under `.tmp/deposit-deal-packet-pg`, listens on `127.0.0.1:55432`, and is deleted on exit. Homebrew's default datadir is never started.

## How to reproduce

```bash
npm run test:deposit-acceptance:all
# equivalent:
node scripts/run-deposit-deal-packet-acceptance.mjs

# individual gates
npm run test:deposit-acceptance
npm run test:deposit-acceptance:pg
npm run test:deposit-acceptance:deno
npx tsc -p tsconfig.app.json --noEmit
npm run build:dev
git diff --check
npm test
cmp -s src/lib/deposit-identity.ts supabase/functions/_shared/deposit-identity.ts
node scripts/scan-deposit-deal-packet-secrets.mjs
```

`npm run test:deposit-acceptance` runs the same 12 Vitest files as before. The large helper now lives at `src/lib/__tests__/helpers/deposit-deal-packet-acceptance.ts` and is not imported by production app code.

The PostgreSQL harness bootstraps only the required roles, `auth` stubs, `app_role` / `has_role`, and pre-migration `saved_quotes` / `customer_quotes` columns, then applies `supabase/migrations/20260823120000_deposit_deal_packet.sql` unmodified.

## What ran (executable proof)

| Command | Result |
| --- | --- |
| `npx vitest run src/lib/__tests__/deposit-deal-packet-acceptance.test.ts` | **1/1 files, 9/9 tests passed** |
| `npm run test:deposit-acceptance` | **12/12 files, 105/105 tests passed** |
| `npm run test:deposit-acceptance:pg` | **47/47 SQL+concurrency assertions passed**, cluster cleaned up |
| `npm run test:deposit-acceptance:deno` | **exit 0** (Deno 2.9.5 `check` of 3 functions + 4 shared modules) |
| `node scripts/run-deposit-deal-packet-acceptance.mjs` | **exit 0** |
| `npm test` | **115 passed + 1 skipped files; 644 passed + 1 skipped tests** |
| `npx tsc -p tsconfig.app.json --noEmit` | **exit 0** |
| `npm run build:dev` | **exit 0** |
| `git diff --check` | **exit 0** |
| identity twin | **IDENTICAL** (`a4762e98608f0e78a1b8735023b51fc98b6f8c39171c7b3f96f8a17b7ce67832`) |
| `node scripts/scan-deposit-deal-packet-secrets.mjs` | **exit 0** |
| `package-lock.json` SHA-256 | `ca455d6283a1267fa1a41332bf45d6742da9a25025c40be3479db5640c1d050c` |

The skipped full-suite file/test is pre-existing and unrelated.

## Passed runtime gates

1. Focused Vitest suite, including three-audience synthetic attachments, in-memory claim races, recovery planner, and historical non-send.
2. **Local PostgreSQL 17.11** on `127.0.0.1:55432`:
   - Historical 9.9-style JSON promoted join/session/PI IDs and did **not** promote `payment_status`, `payment_paid_at`, billing, or `deposit_status`.
   - Migration seeded **zero** `deposit_email_deliveries` rows. An orphan saved-quote UUID was not written to `saved_quote_id`.
   - Nested helpers `deposit_authority_caller` / `deposit_quote_data_authority_changed` are executable by `anon`, `authenticated`, and `service_role`. Direct EXECUTE on `enforce_*` and claim RPCs is denied to `anon` / `authenticated` / admin JWT.
   - Real trigger errors: anon INSERT `payment_status`, authenticated deposit INSERT, saved_quote_id UPDATE, quote_data authority UPDATE, and buyer DELETE all raised `42501` with the business messages, not missing-EXECUTE failures.
   - Delivery table: anon SELECT denied; non-admin SELECT is empty RLS; admin SELECT allowed; authenticated INSERT denied; `service_role` DELETE denied.
   - Claim RPC: first token wins; second token denied while leased; wrong token cannot complete or fail; correct token marks `sent`; sent rows cannot be reclaimed.
   - Two concurrent `service_role` sessions: exactly one winner.
3. **Deno check** of `create-payment`, `stripe-webhook`, `send-deposit-confirmation-email`, `deposit-deal-record.ts`, `deposit-email-deliveries.ts`, `deposit-identity.ts`, and `deposit-payment-guard.ts`.
4. Identity twin and secret scan of the acceptance surface.

## Production fix required by the PostgreSQL gate

`claim_deposit_email_delivery` / `complete_deposit_email_delivery` / `fail_deposit_email_delivery` use `SET search_path = pg_catalog`. `COALESCE`, `NULLIF`, and `GREATEST` are SQL constructs, not `pg_catalog.*` functions. Qualified calls aborted the claim RPC at runtime. The migration now uses the keywords. Source tests forbid `pg_catalog.coalesce`, `pg_catalog.nullif`, and `pg_catalog.greatest`.

## Remaining live-provider / authenticated-preview gates

Do not treat these as passed. This worktree must not touch them.

- Signed Stripe webhook against a real endpoint.
- Live Resend delivery and Grok AgentMail inbox.
- Live SMS.
- Authenticated admin browser session against a deployed or preview app.

## Scope and stopping condition

No live Supabase, Stripe, Resend, SMS, customer data, deploy, push, merge, or PR-ready state change. The Homebrew `postgresql@17` default datadir was not started. No secrets were added.
