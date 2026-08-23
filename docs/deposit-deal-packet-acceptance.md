# Deposit deal-packet staged acceptance

PR 371, isolated worktree `mercury-deposit-recovery-main-5406efd`, branch `cursor/deposit-deal-packet-20260823`.

Feature HEAD before this harness: `0696eb91f650382290bcc48fa63d69189fd36efd` (`feat: complete deposit deal packets`). This document is the acceptance artifact for the harness added on top of that commit.

Live I/O: none. Synthetic fixtures only (`ada@example.com`, quote `11111111-1111-4111-8111-111111111111`, deal `22222222-2222-4222-8222-222222222222`). No Stripe sessions, Resend sends, SMS, or remote Supabase mutations.

## How to reproduce

```bash
node scripts/run-deposit-deal-packet-acceptance.mjs
# same focused suite:
npm run test:deposit-acceptance
npx tsc -p tsconfig.app.json --noEmit
npm run build:dev
git diff --check
npm test
```

`npm run test:deposit-acceptance` runs these 12 files:

- `src/lib/__tests__/deposit-deal-packet-acceptance.test.ts`
- `src/lib/__tests__/deposit-deal-packet-migration.test.ts`
- `src/lib/__tests__/deposit-authority-plan.test.ts`
- `src/lib/__tests__/deposit-webhook-deal-packet.test.ts`
- `src/lib/__tests__/deposit-payment-guard.test.ts`
- `src/lib/__tests__/deposit-confirmation-mailer.test.ts`
- `src/lib/__tests__/admin-deal-packet.test.ts`
- `src/lib/__tests__/deposit-identity.test.ts`
- `src/lib/__tests__/deposit-historical-backfill.test.ts`
- `src/lib/quote-document-storage-contract.test.ts`
- `src/lib/__tests__/quote-document-policy.test.ts`
- `src/pages/quote/__tests__/quote-funnel-ux-contract.test.ts`

Local Postgres, Docker, Supabase CLI, and Deno are absent on this machine. The suite therefore executes production helpers plus in-memory fakes (`src/lib/deposit-deal-packet-acceptance.ts`) and pins Edge Function / migration source contracts. It does not start a database or Deno runtime.

## What ran (executable proof)

Recorded on this worktree after the harness landed. All commands used committed/local files only.

| Command | Result |
| --- | --- |
| `npx vitest run src/lib/__tests__/deposit-deal-packet-acceptance.test.ts` | **1/1 files, 9/9 tests passed** |
| `npm run test:deposit-acceptance` | **12/12 files, 105/105 tests passed** |
| `npm test` | **115 passed + 1 skipped files; 644 passed + 1 skipped tests** |
| `npx tsc -p tsconfig.app.json --noEmit` | **exit 0** |
| `npm run build:dev` | **exit 0** |
| `git diff --check` | **exit 0** |
| `cmp src/lib/deposit-identity.ts supabase/functions/_shared/deposit-identity.ts` | **IDENTICAL** (`a4762e98608f0e78a1b8735023b51fc98b6f8c39171c7b3f96f8a17b7ce67832`) |
| `shasum -a 256 package-lock.json` | `ca455d6283a1267fa1a41332bf45d6742da9a25025c40be3479db5640c1d050c` |

The one skipped full-suite file/test is pre-existing and unrelated to this feature.

## Direct evidence (what the suite proves)

1. **Customer / HBW / Grok are three separate sends with the same bound attachment.** Fresh-packet stage: three Resend fakes, audiences `customer`, `hbw`, `grok_bot`; three distinct idempotency keys; one `sha256` and one `saved-quotes/{quoteId}/quote.pdf` path; customer `ada@example.com`; HBW `jayharris97@gmail.com` + `info@harrisboatworks.ca`; Grok `hbwbot@agentmail.to`. Mailer source has `attachments: pdfAttachment` and no `bcc:`.
2. **Idempotency and claim races.** Concurrent claim helper: one winner. Second `service_role` claim on the same audience returns null. Anon/authenticated claim RPC denied.
3. **Role ACL negative controls.** Anon cannot SELECT deliveries. Non-admin authenticated cannot SELECT. Admin SELECT only. Authenticated cannot INSERT. `service_role` cannot DELETE. Claim RPCs granted only to `service_role`. Nested trigger helpers `deposit_authority_caller` / `deposit_quote_data_authority_changed` are executable by DML roles; `enforce_*` is not GRANTed.
4. **Non-authority poisoning prevention.** Anon INSERT that sets `payment_status` rejected. Authenticated UPDATE that sets `saved_quote_id` rejected. Authenticated DELETE of a deposit row rejected. `service_role` INSERT of a pending deposit allowed. Admin DELETE allowed.
5. **No historical auto-send.** Paid row with no `deposit_outbox_schema` marker plans `{ seed: false, invoke: false }`. Historical backfill does not seed deliveries or promote `payment_status` / `deposit_status` from JSON. Migration source has no `INSERT INTO deposit_email_deliveries` and no `SET deposit_status = 'paid'`.
6. **Explicit recovery validation.** Bound session recovery uses PI `created` (`1755964900`) and writes `payment_status: paid` only for the bound session id. A lost optimistic write against an already-paid reread classifies `already_completed`. Create-payment source uses `stripeDerivedPaidAt` and `classifyOptimisticRecoveryWrite`. Webhook source gates the final notification write with `depositNotificationOutcomeGuard(event.id)`.
7. **Admin route details.** Packet path is `/admin/quotes/{saved_quotes.id}`. Operational id is the joined `customer_quotes.id`. Paid deposits hide generic quote email (`canRetry` false when all three are `sent`). `AdminQuoteDetail` pins `data-section="email-deliveries"` and the retry copy, and does not write `saved_quotes.quote_data`.

## What could not run (remaining runtime gates)

Do not treat these as passed. They need a live isolated environment; this worktree must not touch one.

- Live Postgres trigger / RLS execution (no Docker, psql, or Supabase CLI).
- Deno Edge Function typecheck (no Deno binary). Do not claim Deno typecheck.
- Signed Stripe webhook against a real endpoint.
- Live Resend delivery and Grok AgentMail inbox.
- Live SMS.
- Authenticated admin browser session against a deployed app.

## Scope and stopping condition

Production code was not changed in this acceptance pass. The only TypeScript fixes were test-harness type errors (`deliveryTableAllows` exhaustiveness and the slim `assertCanonicalPaidQuoteDocument` row). No live environment, customer data, secrets, deploy, merge, or PR-ready state change.
