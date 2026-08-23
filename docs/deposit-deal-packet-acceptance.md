# Deposit deal-packet staged acceptance

PR 371, isolated worktree `mercury-deposit-recovery-main-5406efd`, branch `cursor/deposit-deal-packet-20260823`.

Feature HEAD: `0696eb91f650382290bcc48fa63d69189fd36efd`. Prior harness commits: `b90f6e68`, `c2a3c22b`, `674915a3`. This document is the acceptance artifact after the Kimi K3 follow-up: quote `customerInfo` compatibility, orphan admin routing, already-paid outbox replay ownership, and deposit-only bound-identity scope.

Live I/O: none. Synthetic fixtures only (`ada@example.com`, quote `11111111-1111-4111-8111-111111111111`, deal `22222222-2222-4222-8222-222222222222`). No Stripe, Resend, SMS, or remote Supabase. Homebrew's default datadir is never started.

## How to reproduce

```bash
npm run test:deposit-acceptance:all
# equivalent:
node scripts/run-deposit-deal-packet-acceptance.mjs

npm run test:deposit-acceptance
npm run test:deposit-acceptance:pg
npm run test:deposit-acceptance:deno
npx tsc -p tsconfig.app.json --noEmit
npm run build:dev
git diff --check
npm test
cmp -s src/lib/deposit-identity.ts supabase/functions/_shared/deposit-identity.ts
node scripts/scan-deposit-deal-packet-secrets.mjs
brew services list | rg postgresql
```

The PostgreSQL harness creates one unique directory under ignored `.tmp/ddp-XXXXXX`. `listen_addresses` is empty. `pg_hba.conf` has only `local ... trust` (no `host` lines). Clients use `PGHOST=<unix socket dir>`. A non-default port is used only so the fail-closed TCP probe does not collide with port 5432. Darwin `sun_path` is 103 bytes, and this worktree path already consumes 88, so the Unix socket cannot live inside `.tmp`; the harness then creates a unique `mkdtemp` socket directory (not `/tmp/ddp-pg-55432`) and deletes only those two generated directories.

## What ran (executable proof)

| Command | Result |
| --- | --- |
| `npm run test:deposit-acceptance` | **12/12 files, 111/111 tests passed** |
| `npm run test:deposit-acceptance:pg` | **55/55 assertions passed**, unique dirs removed, no TCP |
| `npm run test:deposit-acceptance:deno` | **exit 0** (Deno 2.9.5) |
| `node scripts/run-deposit-deal-packet-acceptance.mjs` | **exit 0** |
| `npm test` | **115 passed + 1 skipped files; 650 passed + 1 skipped tests** |
| `npx tsc -p tsconfig.app.json --noEmit` | **exit 0** |
| `npm run build:dev` | **exit 0** |
| `git diff --check` | **exit 0** |
| identity twin | **IDENTICAL** (`a4762e98608f0e78a1b8735023b51fc98b6f8c39171c7b3f96f8a17b7ce67832`) |
| `node scripts/scan-deposit-deal-packet-secrets.mjs` | **exit 0** |
| `brew services list` `postgresql@17` | **none** |
| `package-lock.json` SHA-256 | `ca455d6283a1267fa1a41332bf45d6742da9a25025c40be3479db5640c1d050c` |

## Passed runtime gates

1. Focused Vitest suite (three-audience attachments, in-memory races, recovery, historical non-send, admin `/admin/quotes/{saved_quotes.id}`).
2. Local PostgreSQL 17.11, Unix-socket only:
   - Historical join/session/PI promoted; paid/billing/`deposit_status` not promoted; zero historical outbox rows.
   - Nested helper EXECUTE, `enforce_*` / claim RPC denials, real trigger `42501` business errors.
   - Delivery RLS/grants, claim token guard, two concurrent `service_role` sessions with exactly one winner.
   - Fail-closed: `listen_addresses` empty, no `host` pg_hba lines, log has Unix listen and no IPv listen, `psql -h 127.0.0.1/localhost/::1` fails, `lsof` shows no TCP LISTEN on the chosen port.
   - JWT spoof as `anon` with `accept.role=service_role` cannot pass `deposit_authority_caller` or write payment columns. `service_role` still passes when the JWT stub says `anon`.
   - Non-deposit bound quote (`deposit_status` null + PDF) can be updated as authenticated; pending/paid deposit bound quotes raise `42501`; `service_role` remains allowed.
3. Deno check of the three Edge Functions and changed shared modules.
4. Identity twin and secret scan.

## `deposit_authority_caller` and `auth.role()`

Supabase deprecates `auth.role()` **in RLS policies** in favor of `TO authenticated` / `TO service_role`. This helper is a BEFORE-trigger predicate, not an RLS policy, so that advisory alone is not a reason to churn.

`auth.role()` reads the request JWT GUC. PostgREST also `SET ROLE` to that claim, so the two match on the normal paths. They do not match if a session can `set_config` the JWT role while remaining `anon` or `authenticated`. That would let a non-authority caller satisfy `auth.role() = 'service_role'` and pass the deposit trigger. `CURRENT_USER` cannot be spoofed that way: becoming `service_role` requires actual `SET ROLE` membership, which PostgREST grants only to the service-role key.

That is materially safer **and** correct for the two production writers:

- Edge Functions using the service-role key: PostgREST `SET ROLE service_role`, so `CURRENT_USER` is `service_role`.
- Authenticated admin UI: `CURRENT_USER` is `authenticated`; authority remains `has_role(auth.uid(), 'admin')`.

The migration therefore uses `CURRENT_USER IS NOT DISTINCT FROM 'service_role' OR public.has_role(auth.uid(), 'admin')`. The sibling quote-document trigger still uses `auth.role()`; that is outside this packet and was not changed.

## Remaining live-provider / authenticated-preview gates

Those gates are specified in `docs/STAGING_ACCEPTANCE.md`. This worktree has no isolated Supabase project; the staging runner fail-closes before any network call.

- Isolated-project Stripe test-mode checkout + signed webhook
- Isolated-project Resend to official `delivered+…@resend.dev` test aliases only
- SMS must stay off (`DEPOSIT_STAGING_MODE=1`)
- Authenticated admin browser on the PR preview pointed at the isolated project

No live Supabase, Stripe, Resend, SMS, customer data, deploy, push, merge, or PR-ready state change.
