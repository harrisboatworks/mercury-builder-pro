# #371 isolated staging — owner requirements

Draft PR `cursor/deposit-deal-packet-20260823`. This is not authorization to create a paid project, reuse a production project, apply production SQL, or send real mail/SMS.

**No approved isolated staging credentials exist for this task.** Visible Supabase projects (`eutsoqdpjurknjsshxes` Mercury production, `guyvvtwjyotndealjvrd` HBW Website, `smqiwympmrrmyabyyuuf` Perplexity, inactive Boat Rentals) are **not** staging targets. Do not repurpose them. Do not create a paid project from this note.

Source blockers 1–4 are implemented on this branch. Hosted synthetic acceptance stays open until the owner supplies a **new, data-less, non-production** isolated project plus test-mode keys through secure storage.

## Isolation controls (fail-closed)

`deposit-staging-guard.ts` rejects configuration before any client is constructed when any of these is true:

- `STAGING_SUPABASE_URL` missing, not HTTPS, or host/ref is `eutsoqdpjurknjsshxes`
- `STAGING_DATABASE_URL` present but parsed ref ≠ URL ref, or ref is production
- `STAGING_STRIPE_SECRET_KEY` is live (`sk`/`rk` + `live`)
- Recipients are not the three distinct packet allowlist addresses
- `DEPOSIT_STAGING_MODE` is not `1`
- Process env defines `SUPABASE_URL` or `STRIPE_SECRET_KEY` (use `STAGING_*` only)
- `VERCEL_PREVIEW_URL` is a production/main alias
- `DEPOSIT_STAGING_SAVED_QUOTE_ID` missing, retired, reserved, or reused

Never set `DEPOSIT_STAGING_MODE` on production. If that flag is set there, Edge send/suppress paths fail visibly.

## Fake-data / outbound-message safeguards

| Channel | Staging rule |
| --- | --- |
| Email | Only `delivered+deposit-customer@resend.dev`, `delivered+deposit-hbw@resend.dev`, `delivered+deposit-grok@resend.dev`. These are Resend simulated-delivery addresses. `example.invalid` and production HBW/Grok inboxes are rejected. |
| SMS | `stripe-webhook` deposit and quote-payment SMS paths are disabled only after `assertRuntimeStagingIsolation` succeeds. |
| Stripe | Test-mode secret/restricted key only. Fresh `DEPOSIT_STAGING_SAVED_QUOTE_ID` per run (Stripe idempotency cache). |
| Identities | Seed/cleanup use `@example.invalid` rows. Cleanup requires the same SET pair as seed and deletes only the current-run UUID plus documented fixtures. |
| Browser origin | Generated `*-git-*-hbw.vercel.app` hosts are not in `resolveAllowedBrowserOrigin`. Checkout probes use `Origin: http://localhost:5173`. |

Copy `scripts/deposit-deal-packet-staging/env.example` to an untracked file. Names only.

## Staging bootstrap requirements

Owner creates a **fresh data-less isolated** Supabase project (20-character lowercase ref ≠ `eutsoqdpjurknjsshxes`). Do not replay the historical migration chain (`customer_quotes` is missing on an empty public schema).

Same `psql` session, GUCs from the parsed DSN host (`https://<ref>.supabase.co` or `db.<ref>.supabase.co`):

```bash
psql "$STAGING_DATABASE_URL" -v ON_ERROR_STOP=1 \
  -c "SET deposit_staging.project_ref TO '<isolated-20-char-ref>'" \
  -c "SET deposit_staging.connection_ref TO '<same-ref>'" \
  -c "SET deposit_staging.allow_nonce TO 'deposit-deal-packet-staging/<isolated-20-char-ref>'" \
  -f scripts/deposit-deal-packet-staging/sql/hosted-bootstrap.sql

psql "$STAGING_DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f supabase/migrations/20260823120000_deposit_deal_packet.sql

psql "$STAGING_DATABASE_URL" -v ON_ERROR_STOP=1 \
  -c "SET deposit_staging.project_ref TO '<isolated-20-char-ref>'" \
  -c "SET deposit_staging.connection_ref TO '<same-ref>'" \
  -f scripts/deposit-deal-packet-staging/sql/hosted-bootstrap-verify.sql
```

`SET deposit_staging.project_ref TO 'eutsoqdpjurknjsshxes'` must fail before DDL. `connection_ref` must equal `project_ref`. Then seed with a **fresh** UUID (never `31313131-3131-4131-8131-313131313131`).

## Ordered acceptance commands (owner, after isolated project exists)

Full sequence and negative curls: `docs/STAGING_ACCEPTANCE.md`. Condensed order:

1. `npm run test:deposit-staging:dry-run` (no `STAGING_*` → `guard_only_no_clients`)
2. Production-URL tripwire must FAIL (`STAGING_SUPABASE_URL=https://eutsoqdpjurknjsshxes.supabase.co` + `--live`)
3. Source/synthetic (already on this branch, no hosted project):
   - `npm run test:deposit-acceptance`
   - `npm run test:deposit-acceptance:pg`
   - `npm run test:deposit-acceptance:deno`
   - `npx tsc -p tsconfig.app.json --noEmit`
4. Load untracked `STAGING_*` env. `node scripts/materialize-deposit-deal-packet-staging-run.mjs`
5. Bootstrap → feature migration → verify → seed (above)
6. Deploy **this branch’s** Edge slugs only on the isolated project: `create-payment`, `stripe-webhook`, `send-deposit-confirmation-email`, `quote-document-api`. Set isolated `DEPOSIT_STAGING_MODE=1` and the three recipient overrides. Test Stripe/Resend only.
7. Preview `VITE_*` → isolated project; `BUILD_CONTENT_*` → production **public catalog** pair. Do not change Production Vercel env.
8. Identity-negative `create-payment` (missing address / missing savedQuoteId) expect `400` and no Checkout.
9. Happy-path test-mode deposit, webhook replay, three-audience `delivered+` mailer, admin deal-packet read.
10. `cleanup.sql` with the same SET pair.

Production release order (separate authorization): migration `20260823120000_deposit_deal_packet.sql` → those four Edge slugs → frontend. See `docs/runbooks/deposit-deal-packet-release-plan.md`.
