# Native Stripe live preflight boundary

The temporary server-only verifier is in `scripts/operations/native-stripe-live-preflight` so normal Edge deployment cannot republish it. Codex deploys it temporarily with gateway JWT verification enabled, verifies its readback, then deletes the deployed utility before native activation.

It requires the SHA256-pinned current Management API service-role bearer token, canonical production project, explicitly paused native feature flag, live Stripe key and signing configuration. Requests are bounded POST JSON without browser Origin. All Stripe calls are fixed-origin GET with the pinned 2026-09-30.preview version, timeout and redirects disabled. Every operation verifies the expected account and charges_enabled first. Responses expose only public identifiers, configuration digests and fixed statuses; no credentials, payment/customer data, raw provider messages or other endpoints.

The four strict operations are:

- `account`: verify the live merchant and return current key/signing digests.
- `webhooks`: verify exactly one enabled live endpoint at the existing production stripe-webhook URL and return only its public configuration. Preserve its API version, URL, status and Checkout subscription. Add the five native PaymentIntent events in the existing Stripe dashboard, then read back.
- `event_candidate`: return only the ID/type/timestamp of a recent live event from a fixed no-op type allowlist (non-native PaymentIntent, customer, charge, account, product or price changes) for an actual signed no-op delivery. Existing source ignores such events; no customer deposit/receipt state changes.
- `spt_access`: require a separate server-side live terms approval flag, then GET a fresh generated nonexistent SPT identifier. Recognized resource_missing establishes token lookup access, not a charge, real wallet interoperability or provider certification.

The utility cannot mutate Stripe, create or charge a payment, write a database, send notifications, approve buyer terms or activate native checkout. Meaningful tests cover authorization, configuration/input bounds, account mismatch, owned-endpoint selection, no-op event selection, legal gating and error/data redaction. Native activation additionally requires a controller attestation bound to the actual current account, public profile, live key/signing digests, live terms timestamp, token API proof and signed callback proof. New native creation, approval and payment initiation fail closed on missing/drifted live proof; submitted and paid attempts remain recoverable.

Live account and the attested owned webhook are re-read immediately before every Stripe POST. New charging requires current charges_enabled and all six events on the reviewed legacy 2022-11-15 endpoint. Native event processing re-fetches authoritative PI state through the pinned preview client, so the legacy Checkout webhook version is preserved. Missing/drifted controller proof gates any live key, including accidental nonproduction placement. Durable proof does not expire on a timer: current provider readiness is checked at each live write; read/reconciliation never depends on webhook availability. No new monitoring schedule is introduced.

Supabase Management can return a freshly generated service-role JWT different from the injected legacy Edge token. The verifier pins only the digest of the current authorized token, confirmed to carry service_role and the canonical project ref, while gateway JWT validation stays enabled. Remove this operator digest with the temporary verifier at retirement.

The signed no-op proof excludes both Checkout completion branches and all native-channel/motor-deposit metadata. Stripe had no recent eligible PaymentIntent event; an existing allowed object-change event is equivalent for verifying the endpoint signing secret and acceptance without any payment or notification mutation.
