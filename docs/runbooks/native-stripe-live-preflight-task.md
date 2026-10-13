# Bounded native Stripe production preflight utility

Controller: Codex. This is source preparation only. The worker has no deploy,
credentials, browser, live API, native activation or customer authority.

Implement a temporary server-only Edge function `native-stripe-live-preflight`,
with a testable `_shared/native-stripe-live-preflight.ts` handler and meaningful
Vitest tests. Do not change existing deposit code, schema or public discovery.
Codex will review/test/deploy it temporarily, use only its safe output, and
delete the deployed utility before native activation. Existing live Stripe
credentials must stay in Supabase. Operator authentication uses the existing
Supabase service-role key; it never becomes a Stripe key export path.

## Authorization and boundary

- POST JSON only; no CORS/browser access. Require exact service-role bearer
  authentication with a nonempty configured key before parsing input or fetching
  Stripe. Use a timing-safe comparison. Supabase gateway verify_jwt stays true.
- Pin SUPABASE_URL to the canonical production project already defined in
  deposit-staging-guard.ts. Reject staging/test Stripe keys, missing signing
  configuration, or NATIVE_DEPOSIT_ENABLED other than explicitly `false`.
- Strict body: operation (`account`, `webhooks`, `ensure_pi_events`,
  `event_candidate`, `spt_access`) and `expected_account` only. Validate an
  acct_ identifier. Account attestation precedes every subsequent operation:
  GET /v1/account using the existing STRIPE_SECRET_KEY and pinned
  2026-09-30.preview. Fail closed for account mismatch or charges disabled.
- Bounded request body, upstream timeout/redirect handling and errors. Replies
  no-store. No raw provider messages, account details, customer/payment data,
  credentials, signing secrets, or caller-controlled URLs/tokens in output/logs.
  Return only fixed statuses, merchant match/mode booleans, safe provider
  status/code/type/param, and the exact owned webhook's public metadata.
- This utility never writes the database, creates/charges/refunds payments,
  sends email/SMS, accepts buyer approval or enables native checkout.

## Operations

- `account`: return matched account id, live-key boolean, charges_enabled,
  country/default currency if safe, and SHA256 of configured Stripe key for
  comparison with existing Management API secret digest. Never the key value.
- `webhooks`: GET /v1/webhook_endpoints?limit=100. Exactly one ACTIVE live
  endpoint at SUPABASE_URL/functions/v1/stripe-webhook must match. Return its
  id/status/livemode/url/api_version/enabled_events only; not other endpoints.
- `ensure_pi_events`: same strict owned endpoint/account checks. Preserve
  existing enabled events, URL, API version and status, adding only
  payment_intent.succeeded, payment_intent.processing,
  payment_intent.payment_failed, payment_intent.canceled,
  payment_intent.requires_action. If `*` already covers them, leave unchanged.
  POST /v1/webhook_endpoints/{verified id} with only enabled_events[]; read back
  and verify exact union, unchanged endpoint/account/mode/version/status. Never
  create or delete an endpoint, reveal/rotate its secret or touch another URL.
- `event_candidate`: read at most 10 payment_intent.succeeded events. Return
  only a live event id/type/created whose object is a PaymentIntent and metadata
  payment_channel is NOT native_spt and payment_type is NOT motor_deposit.
  This will be used for one real signed NO-OP replay to the owned webhook.
  Existing stripe-webhook/native handler ignores such non-native PI events;
  no real customer payment/receipt record is modified for verification.
- `spt_access`: only after explicit live Seller Services agreement approval,
  which Codex enforces before invoking this operation. Generate a fresh random
  synthetic `spt_` alphanumeric identifier; never accept a token from input.
  GET /v1/shared_payment/granted_tokens/{synthetic id} using the pinned preview.
  Return structured allowlisted result/status. A 404 resource_missing from the
  recognized token endpoint proves lookup access, not a paid transaction or
  real wallet interoperability. Unexpected success fails closed and discards
  the entire returned object; unknown routes/auth/version/features fail closed.

## Acceptance tests

Prove unauthorized/missing-key/incorrect project/test key/native enabled/body
injection/oversize/account mismatch never reaches protected operations. Prove
no configuration mutation except exact event union on one owned active live
endpoint, preservation and re-read, wildcard no-op, no alternate callback,
multiple matching endpoints refused, mismatch/readback error refused, timeout
and raw-secret/provider-message redaction. Prove event selection has no native
metadata and exposes no object details; SPT probe identifier is generated and
never caller selected, proper recognized missing-token result versus wrong URL,
and no payment creation or other API paths. Typecheck the new Edge entry point.

Keep the implementation small, explicit and reversible. Controller retains
all production and native feature-flag decisions.
