# Native deposit implementation brief — source work only

Implement a default-off, explicitly deposit-scoped UCP child checkout using
Stripe Shared Payment Tokens. Preserve the existing parent quote and hosted
Checkout paths. This brief does not authorize production release, migrations,
deployment, real charges, customer messages or publication of payment support.

## Authorization boundary

The UCP 2026-04-08 overview requires manual finalization through a trusted buyer
UI unless AP2 Mandates is supported. A valid Stripe token, arbitrary caller
profile or `approved: true` is not sufficient proof of checkout/terms consent.
This increment uses trusted buyer UI confirmation; do not advertise or invent
AP2 support, a simple JWT substitute for SD-JWT+kb, Meta certification or an
official `com.stripe` handler. Fully unattended AP2 completion remains separate.

The backend must require a durable server-side approval bound to the child id,
saved quote, motor, exact CAD deposit, canonical document hash, policy/terms
version and expiry. Approval fields are never accepted in public create/update/
complete bodies. Keep the child `requires_escalation` until that review exists.
The controller will supply the trusted review UI and its authenticated approval
path after independently inspecting these backend primitives. Do not add a
public approval setter or fabricate approval to make a happy-path test pass.

Creating, reading and completing the child must require verified saved-quote
ownership or its existing unpredictable resume capability. A public quote UUID,
UCP parent id, browser Origin or public anon key alone is not authorization.
No buyer identity, ownership capability, raw token or private PDF URL belongs
in the public UCP session payload or error logs.

## Bounded backend increment

1. Add a typed native deposit intent/attempt surface with service-only writes,
   owner-authorized reads, narrow ACLs/RLS and immutable quote/motor/document/
   amount/terms bindings. Use existing identity, canonical document, policy and
   tier helpers. Parent must be active/unexpired, one resolved motor, quantity
   one, CAD, unchanged catalog price and a positive deposit below merchandise.
   Reuse exact express id/model proof. Caller amount/model/HP/express flags and
   arbitrary unknown fields must fail before payment calls.
2. Produce a child checkout with its own id and explicit kind. Its single
   reservation-service line and total are the server-derived deposit cents,
   without merchandise/HST totals. Keep the parent quote unchanged. Reserve no
   stock and place no final motor/installation order. Receipt scope is the
   deposit subject to existing HBW confirmation and refund terms.
3. Keep new routes/tools default-off. Wire child create/get/complete through
   the existing UCP backend with explicit kind dispatch; parent complete stays
   quote-only. Do not publish static global `payment_handlers` or marketing
   claims yet. Use an owned documented handler id for staged child responses.
4. Use a separate Stripe preview client (`2026-09-30.preview`) for the native
   path; preserve hosted Checkout's `2025-08-27.basil` client and contract.
   Retrieve the SPT with the server's pinned seller account credentials; verify
   account identity, test/live mode, active token, CAD, exact deposit amount cap
   and future expiry no later than the approved intent. No card/CVC collection.
   The test helper is never called by deployed application code.
5. Claim a durable idempotent attempt before making an external payment call.
   An uncertain network outcome must not permit a second token/attempt to charge
   the same intent. Keep stable processor parameters/idempotency keys, a token
   fingerprint only and a uniquely bound PaymentIntent. Retry reconciles the
   existing attempt/PI; it never confirms an already-paid intent again.
6. Never fabricate a `cs_` identity for a direct `pi_` payment. Add a narrowly
   typed native paid-claim RPC rather than weakening the Checkout claim. Lock
   the existing deposit/saved-quote pair in consistent order, recheck the exact
   intent, identity, motor, amount/CAD, approved terms, PDF hash, channel and
   promoted PI id, then atomically mark paid. Keep canonical authority frozen
   while a native payment attempt is active. Hosted and native rails cannot
   both claim/charge the same saved quote.
7. Extend the signed webhook for channel-bound native PI events. Verify the
   authoritative PI with the native client before paid claims. Reuse the
   existing three-audience outbox/mailer and canonical PDF authority. Change
   the mailer only where necessary to accept a verified native saved-quote/PI
   binding; keep the existing Checkout signature and lookup safeguards.
8. `requires_action` uses a safe owned buyer continuation; do not dump a raw
   PaymentIntent/client secret in UCP output. `processing`, failure, revocation,
   expiry and unknown outcomes never appear paid or delivered. A processor
   success is not a completed reservation until the durable paid claim succeeds.
   Completed paid readback remains available after the original intent expires.

## Meaningful verification

Use public/synthetic fixtures and injected processor dependencies. Prove native
child amount versus parent HST quote, unauthorized UUID/parent-only rejection,
no approval before Stripe, stale/changed doc/motor/price/terms rejection, token
mode/seller/amount/currency/expiry/revocation rejection, concurrent/uncertain
retries, one paid authority/outbox, no token/capability persistence or logging,
safe step-up/async/failure states and intact hosted Checkout behavior. SQL tests
must exercise real migrations/RPCs with synthetic fixtures, including conflicting
bindings and paid/unknown states. Run affected Edge typechecks and necessary
tests; do not manufacture release proof from mocked success.

Deployment/configuration is owned by Codex after review. Use only the approved
isolated staging project, synthetic identities, test Stripe keys, three Resend
simulator recipients and checked SMS suppression. Real signed native PI event,
canonical paid receipt/PDF, idempotent replay and buyer UI approval must all be
verified before any proposed production release. Static discovery, current-main
integration, migration, Edge, frontend and live provider proof remain distinct.

Primary protocol references:

- https://ucp.dev/2026-04-08/specification/checkout/
- https://ucp.dev/2026-04-08/specification/checkout-rest/
- https://ucp.dev/2026-04-08/specification/payment-handler-guide/
- https://ucp.dev/2026-04-08/specification/ap2-mandates/
- https://docs.stripe.com/agentic-commerce/concepts/shared-payment-tokens.md?agent-seller=seller
