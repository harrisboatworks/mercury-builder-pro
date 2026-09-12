# Synthetic test instructions

Replay these on the four-PR combination (`d4e0956e6150b484473480408b354544ed8f02ce` or this diagnostic branch). Official PostgreSQL 17 server binaries are required for the PG suites. Do not point at production, staging, or live providers.

```bash
export POSTGRES_17_BIN=/usr/lib/postgresql/17/bin   # or Homebrew postgresql@17 bindir
# initdb, pg_ctl, and psql in that directory must all report major 17.

npx vitest run \
  src/lib/__tests__/local-postgres17.test.ts \
  src/test/supabaseFunctionsDeploy.test.ts \
  src/test/publicFunctionPairAttestation.test.ts \
  src/lib/__tests__/notification-webhook-signature.test.ts \
  src/lib/__tests__/twilio-sms-status.test.ts \
  src/lib/__tests__/cron-auth-gate.test.ts
# Expected on 2026-09-12 combo: 6 files / 176 passed

CRON_AUTH_REQUIRE_PG=1 npx vitest run src/lib/__tests__/cron-auth-caller-migration.test.ts
# Expected: 1 file / 28 passed (disposable PG, fake cron/Vault/net; no real HTTP)

npm run test:deposit-acceptance
# Expected: 18 files / 193 passed

npm run test:deposit-acceptance:pg
# Expected: [LOCAL-PG-SYNTHETIC] assertions=114 passed=114; unix socket only;
# hosted_isolated_staging=outstanding

npm run check:pair-attestation-probe
# Expected exit 1: "No injected fetch adapter. This CLI does not open OpenAI from Cursor or CI."
# Same exit on #542 alone (9f7544ef0). Not an integration regression.
```

These are this reviewer’s local results. They are not GitHub Actions. Observed hosted `test` / typecheck success on each PR tip is listed in the per-PR description artifacts and must stay labeled as observed CI.

Do not run `test:deposit-acceptance:deno` unless a pinned Deno is already present; that script can invoke network `npx`. Do not run financing integration or production probes.

#89 tests under `issue89/` are preserved copies. They are not wired into this branch’s `src/` and should not be re-run as part of the integration replay.
