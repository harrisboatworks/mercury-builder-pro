# Native assistant deposits — release held

This branch integrates current main with held #663/#710 and read-only #708.
It is source work, not approval to release the held refund/notification changes.
Native deposits default off. Static discovery remains quote-only; no Meta
certification, AP2 mandates or unattended buyer approval is advertised.

## Buyer and assistant flow

1. An assistant obtains a parent UCP motor quote using current catalog identifiers.
2. It prepares a normal saved quote with real buyer-owned identity, the existing
   deposit policy and the canonical PDF, using existing saved-quote interfaces.
3. `POST /checkout-sessions/{parent}/deposits` with
   `{ "operation": "motor_reservation", "saved_quote_id": "..." }` creates an
   immutable deposit-only child. Authorization is a verified saved-quote owner or
   its independent `x-resume-token` capability. The public quote UUID is insufficient.
4. The buyer follows the protected continuation, signs in, opens the exact PDF,
   and approves the named CAD deposit and terms. Guest quotes additionally require
   the saved-quote capability and a confirmed account matching the quote email.
   A server-generated, one-use challenge binds identity, child, motor, amount,
   PDF hash, policy, terms and expiry. Caller `approved` fields are rejected.
5. The assistant submits one selected UCP payment instrument to the child's
   standard `/complete` route. Its handler_id is
   `ca.mercuryrepower.deposit.shared_payment_token`, type is `card`, selected is
   true, and credential is `{ "type": "shared_payment_token", "token": "..." }`.
   The card details are collected by the buyer's wallet, not this API.
6. The server checks its seller account and token mode, exact CAD amount cap,
   active state and expiry. A durable attempt and submission marker precede the
   external PaymentIntent call. Only a token fingerprint persists. Retries reuse
   the same parameters and processor key; an ambiguous outcome cannot unlock a
   new token or hosted Checkout. Unbound requests after 23 hours require manual
   reconciliation rather than relying on an expired processor idempotency key.
7. A verified PaymentIntent claim atomically pays the saved/customer quote pair,
   binds the actual PI, and seeds the existing three-audience email outbox.
   Signed PI events reconcile asynchronous results and invoke the canonical PDF
   mailer. Outbox/provider acceptance is distinct from email delivery.
8. Required SPT bank verification continues in the issuing wallet. Stripe sends
   shared_payment.issued_token.requires_action there; that wallet retrieves its
   own issued token and uses Stripe.js handleNextAction with its hashedValue.
   The merchant owned UI explains the handoff and keeps the existing payment
   locked. It must not use the seller PI client secret or retrieve a foreign
   issued token. Public UCP never returns a client secret, capability, buyer identity or PDF URL.
   Paid deposit receipt readback requires ownership and survives checkout expiry.

Parent merchandise/HST totals and quote-only completion are preserved. This child
pays a reservation deposit; it does not guarantee stock, approve fitment or place
an installation/final motor order. Hosted Link Checkout remains available through
its existing saved-quote path and pinned non-preview Stripe client.

## Verification and paired release gate

Use `npm run verify:small`; typecheck changed Edge entrypoints explicitly, including
native-deposit-review, ucp-checkout, create-payment, stripe-webhook and mailer.
Run `node scripts/run-native-deposit-pg-acceptance.mjs` on disposable PostgreSQL17.
Review final committed public/synthetic packets with native muse-wonder-1.0 and
resolve findings under Codex authority. Render the protected UI and verify the
whole sequence against the isolated Supabase/Stripe sandbox, real signed PI event,
canonical PDF, paired paid record, three simulator provider IDs and replay.

Staging needs NATIVE_DEPOSIT_ENABLED=true, the exact seller account pin, and an
explicit NATIVE_DEPOSIT_REVIEW_ORIGIN backed only by the isolated project. Browser
UI additionally needs VITE_NATIVE_DEPOSIT_ENABLED=true. The issuing wallet,
not the merchant UI, owns its publishable key and SPT bank action. Use an owned HTTPS isolated preview for interoperable
UCP continuation proof; localhost checks alone are not conformance evidence.

Production requires an exact reviewed paired migration/Edge/frontend release
and resolution of #371/#588/#663's commercial/customer gates. Keep Stripe SPT
preview merchant admission and real consumer-wallet availability distinct.
No production migration, merge, activation or customer/provider message is implied
by this runbook or passing tests. Rollback stops new native checkouts; retain
native webhook reconciliation and cross-rail locks for existing attempts.

Primary contracts: UCP 2026-04-08 checkout/REST and payment handlers; Stripe
Shared Payment Tokens preview 2026-09-30. AP2 and actual Meta consumer-wallet
interop remain separate future acceptance work.

## Recovery acceptance required before production

Both synchronous completion and signed events invoke the same idempotent email
outbox. A mail failure retains paid authority with receipt_email_status pending;
a subsequent owned complete request or the existing admin retry can re-drive it.
Only all three provider-accepted results report provider_accepted, never delivered.

Unknown outcomes keep the quote locked. Within 23 hours the original token and
same immutable request/key may replay a lost confirmation result; do not replace
its token, reopen hosted Checkout, or delete the attempt. After that cutoff use
seller-side reconciliation, never a fresh automatic charge. The authorized
operator retrieves the candidate PI with the pinned account's preview client and
checks exact native child/intent/saved-quote/motor metadata, CAD amount, mode and
actual status. Bind only that independently verified PI to the original attempt
through the service-only bind RPC, with succeeded only after processor success.
Then an owned token-free complete call uses the ordinary locked paid claim and
outbox. An unknown or conflicting candidate stays held. Test this path with a
synthetic lost-response attempt; no customer funds or production repair implied.

A definitive card failure is retained with its real PI. To replace a card, the
operator first independently verifies zero received/captured amount and cancels
the failed sandbox PI through Stripe, then verifies canceled status. Keep the old
quote/attempt immutable for audit, and prepare a fresh saved quote/child with new
buyer review and wallet authorization. An unknown, processing, requires_action,
or succeeded PI cannot be treated as a failure or automatically unlocked. Test
this recovery path; it is deliberately dealer-assisted rather than a silent
second charge. Production refund/void decisions retain their owner authority.

A succeeded-but-unclaimed payment is an operational hold, not permission to
change identity, amount, terms, PDF or PI bindings. Verify processor and database
claims, preserve the funds/attempt record, and route a conflicting canonical
binding to the accountable owner for the appropriate reconciliation/refund.
Do not fabricate a paid receipt. This case and real signed-event request metadata
need explicit isolated provider proof before release.


SPT bank verification primary contract:
https://docs.stripe.com/agentic-commerce/concepts/shared-payment-tokens?agent-seller=agent
The native sandbox must prove requires_action -> issuer wallet's real 3DS
challenge -> same merchant PI result -> signed event -> paired claim. A
merchant test-helper token plus an isolated wallet simulator is provider
acceptance of that contract, not Meta wallet certification or live activation.
