# Staging acceptance — motor deposit deal packet

Branch `cursor/deposit-deal-packet-20260823`. Isolated worktree only. This packet is the executable surface for a later isolated-project run. It does not create a Supabase branch, Vercel project, or Stripe account.

Live I/O from this repository: **none** until an operator supplies a non-production project and test-mode keys that pass the fail-closed guards. Do not load the worktree `.env`. That file targets production.

## Cloud limitation (stop here if no isolated project)

There is no isolated data-less Supabase branch. Evidence:

- `supabase/config.toml` `project_id` is `eutsoqdpjurknjsshxes` (production).
- This packet must not `supabase link`, `db push`, or deploy functions to that ref.
- `npm run test:deposit-staging:dry-run` and `--live` without a safe `STAGING_*` bag open **zero** sockets.

`--live` re-runs the operator-env guards and exits. It does not construct a Supabase, Stripe, or Resend client. After an isolated project exists, follow the numbered sequence below by hand (or a later runner) using only `STAGING_*` names.

## Fail-closed binding

`supabase/functions/_shared/deposit-staging-guard.ts` rejects configuration **before any network call** when any of these is true:

| Check | Rule |
| --- | --- |
| `STAGING_SUPABASE_URL` | Required HTTPS. Host must not be `eutsoqdpjurknjsshxes.supabase.co`. |
| `STAGING_STRIPE_SECRET_KEY` | Must be test-mode (`sk` + `test`). Live (`sk`/`rk` + `live`) is rejected. |
| Recipients | All three overrides required and must be `@example.invalid`. Production HBW/Grok/admin inboxes are rejected. |
| `DEPOSIT_STAGING_MODE` | Must be `1` on the isolated project and in the runner env. |
| `VERCEL_PREVIEW_URL` | Optional. Production web/Vercel aliases (`mercuryrepower.ca`, `mercury-builder-pro.vercel.app`, `…-git-main-hbw.vercel.app`, …) are rejected. |
| `STAGING_DATABASE_URL` | Optional. Rejected if the value mentions the production project host/ref. |
| Inherited names | Process env must not define `SUPABASE_URL` or `STRIPE_SECRET_KEY`. Use `STAGING_*` only. Refuse rather than guess. |

`DEPOSIT_STAGING_MODE=1` on the isolated Edge secrets also:

- Rewrites customer / HBW / Grok recipients to the three `@example.invalid` overrides.
- Disables every `send-sms` path in `stripe-webhook` (deposit and quote-payment).
- Leaves production recipients unchanged when the flag is unset.

Never set `DEPOSIT_STAGING_MODE` on project `eutsoqdpjurknjsshxes`.

## Required environment variable names

Copy `scripts/deposit-deal-packet-staging/env.example`. Names only; never commit values.

Runner / operator shell (do not export production names):

- `STAGING_SUPABASE_URL`
- `STAGING_SUPABASE_ANON_KEY`
- `STAGING_SUPABASE_SERVICE_ROLE_KEY`
- `STAGING_STRIPE_SECRET_KEY`
- `STAGING_STRIPE_WEBHOOK_SECRET`
- `STAGING_RESEND_API_KEY`
- `STAGING_ADMIN_ACCESS_TOKEN`
- `VERCEL_PREVIEW_URL`
- `DEPOSIT_STAGING_MODE=1`
- `DEPOSIT_STAGING_CUSTOMER_EMAIL=ada@example.invalid`
- `DEPOSIT_STAGING_HBW_EMAIL=hbw@example.invalid`
- `DEPOSIT_STAGING_GROK_EMAIL=grok@example.invalid`

Isolated Supabase function secrets (same recipient names plus the project's own `SUPABASE_URL` / test Stripe / Resend). Isolated `SUPABASE_URL` is injected by that project and must not be the production host.

Vercel **Preview** env, scoped to git branch `cursor/deposit-deal-packet-20260823` only:

- `VITE_SUPABASE_URL` = isolated project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` = isolated anon/publishable key

Do not change Production or Development Vercel env. Do not point Preview at `eutsoqdpjurknjsshxes`.

## How the existing Vercel PR preview is pointed at the isolated project

1. Create or obtain a **data-less isolated Supabase project** (operator action; this packet does not create it).
2. In Vercel → mercury-builder-pro → Settings → Environment Variables, add Preview-only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for this git branch.
3. Redeploy the existing PR preview so the browser bundle embeds the isolated URL.
4. Confirm the preview document is not a production host. Allowed example: `https://mercury-builder-pro-git-cursor-deposit-deal-packet-20260823-hbw.vercel.app`.
5. Isolated function secret `APP_URL` may be that preview URL. It must not be `https://www.mercuryrepower.ca`.

Repository contract: `resolveAllowedBrowserOrigin` allows only stable aliases and localhost. Generated PR hosts (`*-git-*-hbw.vercel.app`) are **not** allowed. Browser `create-payment` from the generated preview is expected to return `403 Forbidden origin`. Admin **reads** still work if Preview `VITE_*` points at the isolated project (PostgREST). Edge invokes for checkout, webhook-driven mailer, and delivery retry must use `Origin: http://localhost:5173` or no Origin plus the isolated service-role key.

## Fixtures

`scripts/deposit-deal-packet-staging/fixtures.json`:

| Role | ID | Email |
| --- | --- | --- |
| Staging saved quote | `31313131-3131-4131-8131-313131313131` | `ada@example.invalid` |
| Staging customer quote | created at checkout (or `32323232-3232-4232-8222-323232323232` if you pin it) | `ada@example.invalid` |
| Historical saved quote | `34343434-3434-4343-8343-343434343434` | `historical@example.invalid` |
| Historical customer quote | `35353535-3535-4353-8353-353535353535` | `historical@example.invalid` |

Canonical PDF bytes and SHA-256 are in the fixture file. Recipients are only `@example.invalid`.

## Local proof (this commit)

```bash
npm run test:deposit-staging:dry-run
# writes .tmp/deposit-deal-packet-staging-evidence.json
# schema: deposit-deal-packet-staging-evidence/v1

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

Unsafe `--live` (must FAIL before any client is constructed; `networkCalls` stays `0`):

```bash
# no STAGING_* set
node scripts/run-deposit-deal-packet-staging.mjs --live

STAGING_SUPABASE_URL=https://eutsoqdpjurknjsshxes.supabase.co \
STAGING_STRIPE_SECRET_KEY=sk_test_synthetic \
DEPOSIT_STAGING_MODE=1 \
DEPOSIT_STAGING_CUSTOMER_EMAIL=ada@example.invalid \
DEPOSIT_STAGING_HBW_EMAIL=hbw@example.invalid \
DEPOSIT_STAGING_GROK_EMAIL=grok@example.invalid \
node scripts/run-deposit-deal-packet-staging.mjs --live
```

The second command is a production-URL tripwire. It must exit 1 with `live_env_safe_before_network` FAIL and `networkCalls: 0`.

## Operator sequence (only after an isolated project exists)

Stop if any guard fails. Do not fall back to production.

### 0. Tripwires

```bash
npm run test:deposit-staging:dry-run
# then, with a filled untracked env file that uses STAGING_* names only:
set -a && source /path/to/untracked-staging.env && set +a
node scripts/run-deposit-deal-packet-staging.mjs --live
# PASS here means env is safe. It still makes no network call.
```

### 1. Isolated project secrets

On the isolated project only: deploy this branch's Edge functions (`create-payment`, `stripe-webhook`, `send-deposit-confirmation-email`, `quote-document-api`). Set `DEPOSIT_STAGING_MODE=1` and the three recipient overrides. Set Stripe **test** secret and webhook secret. Set Resend. Confirm `STRIPE_SECRET_KEY` kind is test. Confirm the project's URL host is not `eutsoqdpjurknjsshxes.supabase.co`.

Apply `supabase/migrations/20260823120000_deposit_deal_packet.sql` (and prior migrations) to the isolated database. Target the isolated project ref explicitly. Refuse `eutsoqdpjurknjsshxes`.

### 2. Storage

Create private bucket `quotes` if the isolated project has none. Upload fixture bytes:

```bash
node --input-type=module -e '
import { writeFileSync } from "node:fs";
writeFileSync(".tmp/staging-canonical.pdf", "%PDF-1.7\nstaging-canonical\n");
writeFileSync(".tmp/historical-control.pdf", "%PDF-1.7\nhistorical-control\n");
'
# PUT object saved-quotes/31313131-3131-4131-8131-313131313131/quote.pdf
# PUT object saved-quotes/34343434-3434-4343-8343-343434343434/quote.pdf
# hashes must match fixtures.json
```

### 3. Seed / cleanup

```bash
# After guards: apply seed to the isolated DB only
psql "$STAGING_DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f scripts/deposit-deal-packet-staging/sql/seed.sql
```

`$STAGING_DATABASE_URL` is an operator name, not a committed value. It must not be a `db.eutsoqdpjurknjsshxes` host. Cleanup after the run:

```bash
psql "$STAGING_DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f scripts/deposit-deal-packet-staging/sql/cleanup.sql
# also delete the two storage objects above
```

### 4. Identity / address gating (negative, before Stripe)

Use `Origin: http://localhost:5173`. Expect `400` and no Checkout session.

```bash
# missing address fields
curl -sS -D - -o /tmp/deposit-neg-identity.json \
  -X POST "$STAGING_SUPABASE_URL/functions/v1/create-payment" \
  -H "apikey: $STAGING_SUPABASE_ANON_KEY" \
  -H "Origin: http://localhost:5173" \
  -H "Content-Type: application/json" \
  -d '{"paymentType":"deposit","depositAmount":"500","savedQuoteId":"31313131-3131-4131-8131-313131313131","customerInfo":{"name":"Staging Lovelace","email":"ada@example.invalid","phone":"5555550100"}}'

# missing savedQuoteId
curl -sS -D - -o /tmp/deposit-neg-quote.json \
  -X POST "$STAGING_SUPABASE_URL/functions/v1/create-payment" \
  -H "apikey: $STAGING_SUPABASE_ANON_KEY" \
  -H "Origin: http://localhost:5173" \
  -H "Content-Type: application/json" \
  -d '{"paymentType":"deposit","depositAmount":"500","customerInfo":{"name":"Staging Lovelace","email":"ada@example.invalid","phone":"5555550100","addressLine1":"1 Example Invalid Road","city":"Exampleville","region":"ON","postalCode":"K0K 0A0","country":"Canada"}}'
```

Assert body contains `Customer identity and address are required for a deposit` or `Invalid saved quote for deposit`. Assert no new `customer_quotes` row for the staging saved-quote id. Assert Stripe test mode has no new Checkout session for that request.

Preview-origin negative control:

```bash
curl -sS -D - -o /tmp/deposit-neg-cors.json \
  -X POST "$STAGING_SUPABASE_URL/functions/v1/create-payment" \
  -H "apikey: $STAGING_SUPABASE_ANON_KEY" \
  -H "Origin: $VERCEL_PREVIEW_URL" \
  -H "Content-Type: application/json" \
  -d '{"paymentType":"deposit","depositAmount":"500","savedQuoteId":"31313131-3131-4131-8131-313131313131"}'
```

Expect `403` `Forbidden origin`.

### 5. Stripe test-mode deposit

`create-payment` for `$500` uses committed Price `price_1SocofHhVKClVQCpsdCfdG7e`. Before checkout, retrieve that Price with the **test** secret. If it is missing on the test account, stop. Do not create paid live products. Do not use a live secret. The `$100` path is out of scope (requires the express motor catalog).

```bash
curl -sS -D - -o /tmp/deposit-checkout.json \
  -X POST "$STAGING_SUPABASE_URL/functions/v1/create-payment" \
  -H "apikey: $STAGING_SUPABASE_ANON_KEY" \
  -H "Origin: http://localhost:5173" \
  -H "Content-Type: application/json" \
  -d '{"paymentType":"deposit","depositAmount":"500","savedQuoteId":"31313131-3131-4131-8131-313131313131","customerInfo":{"name":"Staging Lovelace","email":"ada@example.invalid","phone":"5555550100","addressLine1":"1 Example Invalid Road","city":"Exampleville","region":"ON","postalCode":"K0K 0A0","country":"Canada"}}'
```

Pay the hosted Checkout URL with test card `4242424242424242`. Stripe Checkout cannot be completed from the API. Record `cs_test_…` as `STAGING_PAID_SESSION_ID`.

### 6. Webhook, three audiences, canonical PDF

Forward the test webhook to the isolated `stripe-webhook` (Stripe CLI or a test endpoint). Expected after `checkout.session.completed`:

- `saved_quotes.deposit_status = paid`
- `saved_quotes.quote_pdf_path = saved-quotes/31313131-3131-4131-8131-313131313131/quote.pdf`
- `saved_quotes.quote_pdf_sha256 = e7914d99efa8418be53d3f8acd8809c6cc87f221bd097358ada61c79e747cadc`
- `customer_quotes.payment_status = paid` and a `pi_…` / `cs_test_…`
- exactly three `deposit_email_deliveries` rows (`customer`, `hbw`, `grok_bot`)
- each row `status = sent` **or** `failed` if Resend refuses `example.invalid` (do not change recipients)
- each `sent` row has a non-null `provider_id`
- `quote_data.sms_notification_status` is not `sent` (skipped / staging)
- no `send-sms` invoke in webhook logs

Run `scripts/deposit-deal-packet-staging/sql/readback.sql`.

### 7. Replay / idempotency

Resend the same `checkout.session.completed` event. Expected: no fourth delivery row; `sent` `provider_id` values unchanged; no second Stripe charge.

### 8. Failure / retry

Force one audience to `failed` (null `provider_id`). Invoke isolated `send-deposit-confirmation-email` with service-role and `{ "stripeSessionId": "$STAGING_PAID_SESSION_ID" }` (no Origin). Expected: only the failed audience is reclaimed; other `provider_id`s unchanged. Admin retry from the generated preview Origin is expected to `403`; use service-role or localhost.

### 9. Authenticated admin packet

Sign in as an isolated-project admin (`STAGING_ADMIN_ACCESS_TOKEN`). Open:

`{VERCEL_PREVIEW_URL}/admin/quotes/31313131-3131-4131-8131-313131313131`

Visible sections: `customer-identity` (name, `ada@example.invalid`, phone, full address), `motor-configuration`, `payment-status`, `boat-trade-financing`, `canonical-document` (bound SHA-256), `email-deliveries` (three audiences). `provider_id` is authoritative on `deposit_email_deliveries` (SQL/API). Canonical download must return the fixture PDF bytes and the same hash.

### 10. Historical rows unchanged

Replay or process `cs_test_historical_control_35353535` if a matching event exists; otherwise only read the control row. Expected:

- fingerprint `quote_data.staging_historical_control = deposit-deal-packet-staging/v1`
- `quote_data ? 'deposit_outbox_schema'` is false
- `notification_status = not_sent`
- zero `deposit_email_deliveries` for `35353535-3535-4353-8353-353535353535`
- paid columns and PDF hash `1a43268bacbf0a74d6f3c8816c3e0d826f1582944278bc3a2cdbf776ee989adb` unchanged

### 11. Evidence

Write a machine-readable file (default `.tmp/deposit-deal-packet-staging-evidence.json`):

```json
{
  "schema": "deposit-deal-packet-staging-evidence/v1",
  "head": "<git rev-parse HEAD>",
  "mode": "dry-run | live",
  "networkCalls": 0,
  "verdict": "PASS | FAIL",
  "envNamesPresent": { "STAGING_SUPABASE_URL": true },
  "checks": [{ "id": "tripwire_production_supabase", "result": "PASS", "beforeNetwork": true }]
}
```

Values of secrets are never written. `envNamesPresent` is boolean presence only. An operator live run may append readback IDs, delivery `provider_id`s, and SHA-256 hex to a separate untracked file. Do not commit it.

## Test-mode assertions

- Stripe secret kind is test. Checkout session IDs start with `cs_test_`.
- No live Stripe, live Resend production audience, SMS, or production Supabase host appears in evidence.
- Recipients on the three delivery sends are exactly the fixture `@example.invalid` addresses.
- Historical control email stays `historical@example.invalid` and is never mailed.

## Negative controls (summary)

| Control | Expected |
| --- | --- |
| Production Supabase URL | rejected before network |
| Live Stripe prefix | rejected before network |
| Production inbox | rejected before network |
| Production Vercel/web host as preview | rejected before network |
| Inherited `SUPABASE_URL` / `STRIPE_SECRET_KEY` | rejected |
| Incomplete identity / missing `savedQuoteId` | `400`, no Stripe session |
| Generated preview Origin on `create-payment` | `403` |
| Historical paid row without outbox schema | no seed, no mailer |
| `DEPOSIT_STAGING_MODE` unset | production recipients (do not test this on the isolated project) |
