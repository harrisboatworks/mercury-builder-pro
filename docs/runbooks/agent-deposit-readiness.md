# Agent deposit readiness

The buyer's existing reservation flow is the payment authority: prepare a saved quote and its canonical PDF, review the deposit and terms, approve Stripe Checkout, then wait for verified payment and a reservation receipt. A deposit reserves the selected motor subject to the existing terms; it is not the final motor sale, completed installation, fitment approval or pickup.

## Explicit reservation preparation (source implementation)

The custom UCP MCP tool `prepare_motor_reservation` takes:

```json
{"id":"chk_synthetic_example","operation":"motor_reservation"}
```

Its REST equivalent is `POST /checkout-sessions/{id}/reservation-preparation` with `{"operation":"motor_reservation"}`. Optional MCP `meta.ucp-agent.profile` is transport metadata only. Caller-authored payment, contact, amount, motor and other unknown fields are rejected.

The operation reads an existing unexpired quote and the current public catalog motor. It requires one resolved motor, quantity one, CAD, no rejected quote items, unchanged catalog price and a positive deposit below the merchandise price. The existing deposit policy supplies the amount; only the exact catalog identity and model can qualify for the express tier. Catalog stock is not promised by an estimate.

The custom result contains `operation`, `session_id`, `motor_id`, `amount_cents`, `currency`, `payment_status: "not_started"`, `status: "requires_escalation"`, `terms_url`, `continue_url` and a scope statement. It omits buyer data, payment instruments and full-price checkout totals. It does not save a session, capture a lead, create Checkout, charge, reserve stock or complete an order. The shared platform rate limiter still applies to requests.

The continuation URL includes the existing `ucp` reference and `motor` selection plus `reservation=1`. The page displays an informational reservation notice. Existing motor-selection behavior remains; the flag never submits a quote, accepts terms or approves payment. The browser must finish boat/options and review the quote. Link is offered by Stripe Checkout when eligible. UCP's standard `complete_checkout` stays quote-only and its discovery profile keeps `payment_handlers: {}`.

## What must be proven before payment activation

Local unit tests and a provider setting do not prove successful deposits. A separate, approved, data-less Supabase staging project and a dedicated Stripe sandbox are required. None of the production or unrelated projects qualifies implicitly. Project organization/cost and credential provisioning require the owner's choice; credentials must remain outside source, worker packets and logs.

Preserve the held deposit-deal-packet work (#371, #588, #663) and its isolated staging owner requirements. Do not copy production data, apply a full historical migration chain to a blank target, reuse live Stripe keys, send real customer/staff messages or migrate/deploy held code to production. Assemble the minimal hosted staging schema including UCP sessions, saved quotes and the canonical document contract, then deploy only approved functions to the isolated project. Use fresh synthetic quote/customer identities and the specified Resend simulator recipients; suppress SMS through the staging guard.

Acceptance receipts must independently show:

- A CAD deposit for the intended motor, distinct from the merchandise/HST estimate, after review of the current canonical document and terms.
- Buyer-approved sandbox Link Checkout and a real test-mode Stripe payment event, authoritative webhook verification, processing-to-paid status and the bound reservation receipt.
- Replayed requests/webhooks do not double charge or duplicate fulfillment. Changed price, motor, amount, currency, document, expiration or quote binding fails safely.
- Expired, canceled, failed, asynchronous and authentication-required payments never appear paid prematurely; cancellation/refund follows the existing terms and verified provider outcome.
- Held deal-packet staging additionally proves its three simulator delivery receipts and admin packet read before its release gate can move.

## Native UCP payments: a separate next increment

Stripe documents Link agent wallets and Shared Payment Tokens (SPTs) for supported Canadian customers/accounts. Broader Agentic Commerce Suite seller availability has different enrollment/geography rules. Canadian SPT availability alone does not establish this account's admission or native UCP interoperability.

A native integration needs a verified payment-handler contract, approved seller profile/terms/preview access, and explicit deposit intent. Bind a saved quote, canonical document hash/terms, motor, merchant, exact CAD amount, token usage/expiry and an idempotent attempt before accepting a buyer-approved SPT. Return only safe status; never handle card numbers or log token values. Only an authoritative Stripe PaymentIntent/webhook and the existing shared receipt authority may mark a deposit paid. Step-up/authentication must return a safe buyer continuation; never authorize the full estimated motor sale by implication.

Do not advertise native UCP payment completion, configure a handler or release it until the account gate and isolated end-to-end receipts pass. Production release is a separate decision with exact source review and CI; migration, Edge deployment, frontend deployment and live readback are distinct gates.

Primary references:

- [Stripe Link with Checkout](https://docs.stripe.com/payments/link/checkout-link)
- [Link agent wallet](https://docs.stripe.com/agentic-commerce/agents/link-agent-wallet)
- [Shared Payment Tokens](https://docs.stripe.com/agentic-commerce/concepts/shared-payment-tokens.md?agent-seller=seller)
- [UCP checkout specification](https://ucp.dev/2026-04-08/specification/checkout/)
