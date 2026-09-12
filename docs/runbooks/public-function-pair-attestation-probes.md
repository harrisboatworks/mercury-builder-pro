# Public chat / Realtime pair attestation probes

For Codex in the **credential-owning** environment only. This file does not authorize `ATTESTED`, a pair deploy, a secret change, Vault write, or a customer session. Do not request credentials in Cursor. Do not run these live probes in the Cursor cloud worker.

`#541` (parity notification / `ELEVENLABS_MCP_SECRET`) is resolved and is **not** OpenAI model proof. Unsigned MCP initialize still 401s. Do not treat a green knowledge canary, secret-name presence, a deploy timestamp, `knowledgeProbe`, Realtime token issuance, or a model `GET` as attestation.

Committed guards in `scripts/lib/public-function-release-guards.mjs` stay `UNVERIFIED`. Do not commit `ATTESTED` until the **required** probes below succeed with a key whose SHA-256 matches production Edge `OPENAI_API_KEY` on project `eutsoqdpjurknjsshxes`. A local `.env` key, or a key merely labeled production, is rejected (`LOCAL_PROVENANCE`).

Companion hold document: `docs/runbooks/public-function-backlog-release-533.md`.

Executable offline harness (no live calls, no `ATTESTED` write): `scripts/lib/public-function-pair-attestation.mjs` and `scripts/public-function-pair-attestation-probe.mjs`. Tests: `src/test/publicFunctionPairAttestation.test.ts`.

## Insufficient evidence (do not attest from these)

- Secret **name** `OPENAI_API_KEY` present
- Registry `updated_at` / version
- `#541` production-parity run
- `scripts/chat-voice-knowledge-live-check.mjs` / `knowledgeProbe: true`
- `elevenlabs-conversation-token` mint
- `GET /v1/models/gpt-5.6-luna` or `GET /v1/models/gpt-realtime-2.1-mini` alone (discovery only)
- `realtime-session` HTTP 200 that only returns a client secret without a validated SDP answer
- A hand-written or stub SDP offer
- An SDP answer accepted only because it starts with `v=`
- A provider-only OpenAI probe used as proof that production `realtime-session` / `realtime-sdp-exchange` work
- Laptop, preview, or “this is the production key” labeling without a digest match
- Posting A2 to live `ai-chatbot` / `ai-chatbot-stream` as a substitute for the source-contract probe

The offline harness (`runPairAttestationProbes`) bounds the **entire** session, not only `close()`. It passes `AbortSignal` into `fetch`, `createOffer`, and `acceptAnswer`, aborts on timeout or error, and does not start later stages after abort. `Promise.race` only ends the caller wait. Function presence is not AbortSignal proof. Adapters that ignore the signal fail acceptance (`ADAPTER_ABORT_CONTRACT`); `close()` being called is not leftover proof. The first `close()` success does not mask a later close failure: only the last close result counts. Cleanup is leftover=true unless `hasLiveResources()` returns the boolean `false` synchronously. Missing method, throw, `true`, `undefined`, `null`, strings, and Promises are unproven. Late-resolving `createOffer` is settled, then `close()` runs again. Passing `timeoutMs` to an adapter is not the deadline.

Synthetic mode is labeled on every receipt (`mode=synthetic`, `synthetic=true`) and **never** returns `productionAttestable=true`. Do not mark guards `ATTESTED` from synthetic tests.

## Provenance required (secret versus validated SHA-256, no secret values)

Do **not** treat a copied label as proof. Supabase already stores a SHA-256 digest. Hashing both sides is the wrong contract. In the credential-owning environment, Codex uses `compareSecretToSha256`:

1. Nonempty plaintext `OPENAI_API_KEY` from 1Password / secure storage.
2. Validated lowercase 64-hex SHA-256 digest of production Edge `OPENAI_API_KEY` on project `eutsoqdpjurknjsshxes`.

Empty/empty is a mismatch. Do not print the secret or the digest. `evaluateProvenance` requires exact fields (`project`, `secretName`, `match`, valid `comparedAt`). A formatted string that merely contains `result=match` is not accepted. Record:

| Field | Required record |
| --- | --- |
| Match result | `match` or `mismatch` |
| Project | `eutsoqdpjurknjsshxes` |
| Secret name | `OPENAI_API_KEY` |
| Comparison time | ISO-8601 UTC |

`productionKeyProvenance` example shape (no secret, no digest):

`sha256-match:OPENAI_API_KEY@eutsoqdpjurknjsshxes;compared=YYYY-MM-DDThh:mm:ssZ;result=match`

A mismatch, a skipped compare, or a local/process-env key keeps the pair `UNVERIFIED`. Must not match `local`, `.env`, `dotenv`, `process.env`, `env.local`.

## Two evidence layers (keep them separate)

| Layer | What it proves | What it does not prove |
| --- | --- | --- |
| **Pre-deploy / provider capability** | The production-proven key can call OpenAI with the source models and the source HTTP contracts | That our deployed Edge pair (`ai-chatbot`, `ai-chatbot-stream`, `realtime-session`, `realtime-sdp-exchange`) works |
| **Post-deploy / Edge relay acceptance** | Our production functions on an allowed origin mint and exchange correctly | That a later deploy is authorized. Requires its own approval after the pair is actually deployed |

A passing provider probe is **not** acceptance of the production relay. Do not mark `openai-realtime` or `site-chat` `ATTESTED` from provider evidence and then treat the live Edge pair as accepted. Post-deploy acceptance is a later, separately authorized check against the deployed slugs. This file specifies the **pre-deploy** Codex probes. It does not authorize the post-deploy relay run.

## Bounded probes (no CRM / quote / SMS / email writes)

Run pre-deploy probes against `https://api.openai.com` with the digest-matched production key. Record HTTP status, model identity, and pass/fail fields only. Do not print the key, ephemeral secret, SDP bodies, or customer data.

### A. Site-chat (`gpt-5.6-luna`) — A2 is required

Main `ai-chatbot` uses `POST https://api.openai.com/v1/chat/completions`. Model `GET` does not exercise that contract. **Do not permit `site-chat` `ATTESTED` on A1 alone.**

#### A1 — discovery only (not sufficient)

`GET /v1/models/gpt-5.6-luna`

- Pass as discovery: `200` and `id` equals `gpt-5.6-luna`.
- Fail: `404` / `403` / model-not-found.
- A1 success is supporting evidence only. It does not attest chat.

#### A2 — required chat/completions (source API contract)

One successful **non-customer** `POST /v1/chat/completions` that matches `supabase/functions/ai-chatbot/index.ts`:

```json
{
  "model": "gpt-5.6-luna",
  "messages": [
    { "role": "user", "content": "Reply with the single word pong." }
  ],
  "max_completion_tokens": 250,
  "reasoning_effort": "none"
}
```

Rules:

- Disposable prompt. No tools. No customer PII. No CRM/quote/SMS/email side effects.
- Send **only** `model`, `messages`, `max_completion_tokens`, `reasoning_effort`.
- Do **not** send `max_tokens`, `temperature`, `top_p`, `presence_penalty`, or `frequency_penalty` (5.6+ rejects them).
- Do **not** post A2 to live `ai-chatbot` or `ai-chatbot-stream`. That is a different surface and is not pre-deploy provider proof.

Pass (all required):

1. HTTP `200`.
2. Returned `model` identity equals `gpt-5.6-luna` exactly (prefix models fail).
3. Assistant output equals `pong` after trim. Sentences that mention pong fail. No tool calls.

Fail: any non-200, rejected request fields, missing/wrong `model`, empty output, or an output that is not the expected disposable token.

### B. Realtime (`gpt-realtime-2.1-mini`) — WebRTC offer, full answer, bounded close

Token issuance alone is insufficient. A provider-only pass is **capability proof**, not acceptance of production `realtime-session` / `realtime-sdp-exchange`.

#### B1 — discovery only (not sufficient)

`GET /v1/models/gpt-realtime-2.1-mini`

- Pass as discovery: `200` and `id` equals `gpt-realtime-2.1-mini`.
- B1 success does not attest Realtime.

#### B2 — session mint (source: `realtime-session`)

`POST /v1/realtime/client_secrets` with the GA nested `session` object (`session.model = gpt-realtime-2.1-mini`). Do not use retired `POST /v1/realtime/sessions`.

- Pass: `200` and an ephemeral client secret **name present** (do not print the secret).
- Fail: retired beta URL `404`.

#### B3 — required SDP exchange (source: `realtime-sdp-exchange`)

`POST /v1/realtime/calls` with `Content-Type: application/sdp`, authorized by that ephemeral secret.

Offer requirements:

- Generate the offer from a **real WebRTC** `RTCPeerConnection` (`createOffer` / `setLocalDescription`).
- Do **not** hand-write a stub SDP (`v=0` / `o=-` text assembled in a script).

Answer validation — **beyond** the `v=` prefix. The body must be an SDP **answer**, not a copy of the offer. Require all of:

- HTTP `200` or `201` (one `isSdpExchangeSuccessStatus` predicate; receipt `b3.ok` and `realtimeAttestable` must agree)
- `v=` present (necessary, not sufficient)
- `o=` origin line present
- `s=` session-name line present
- at least one `m=` media line
- answer semantics (WebRTC remote description accepts it as an answer; it is not the same SDP as the offer)

Fail: `404` on `/v1/realtime?model=...`, empty/non-SDP body, `v=`-only acceptance, stub offer, or an answer the peer cannot `setRemoteDescription`.

#### B4 — bound the session and close it

- Bound duration (stop within 30 seconds of the answer; do not leave a live call open).
- Explicitly close the `RTCPeerConnection` and end/delete the Realtime call/session.
- Record `closed=yes` plus elapsed seconds. An unanswered hang or an abandoned peer is a fail.

Do not use `/voice-test` unless separately scoped; it creates a Realtime session. Do not mix ElevenLabs in the same window. Do not call production `realtime-session` or `realtime-sdp-exchange` as part of this pre-deploy provider probe.

## What to return (handoff, no secrets)

| Field | Required |
| --- | --- |
| SHA-256 match result, project, secret name, comparison time | Yes |
| Explicit “local key not used” | Yes |
| Probe A1 status + model id | Yes for `site-chat` (discovery only) |
| **Probe A2 HTTP status + returned model + output check (`pong` yes/no)** | **Yes for `site-chat`. Required. Model GET is not a substitute.** |
| Probe B1 status + model id | Yes for `openai-realtime` (discovery only) |
| Probe B2 client_secrets status (secret redacted) | Yes for Realtime |
| Probe B3 HTTP status + answer fields (`v=`, `o=`, `s=`, `m=`, answer≠offer, peer accepted) | Yes for Realtime |
| Probe B4 closed + elapsed seconds | Yes for Realtime |
| Layer label | `pre-deploy-provider` (this handoff) vs `post-deploy-edge-relay` (later, separately authorized) |

`site-chat` cannot be `ATTESTED` without a passing A2 row. `openai-realtime` cannot be `ATTESTED` without passing B3 and B4. Neither pair is Edge-accepted from this provider handoff.

## After a passing Codex handoff (later reviewed change)

Only then a reviewed commit may set `PUBLIC_RELEASE_PAIRS[].attestation` to:

```js
{
  status: 'ATTESTED',
  productionKeyProvenance: '<sha256-match string above>',
  attestedModels: ['gpt-5.6-luna'], // or ['gpt-realtime-2.1-mini']
  attestedKeys: ['OPENAI_API_KEY'],
}
```

That commit records **pre-deploy provider capability** plus the digest match. It does **not** record post-deploy Edge relay acceptance. Keep pair membership intact. Release order remains `DEPLOY_PAIR=openai-realtime` first, then optionally `DEPLOY_PAIR=site-chat`. Sequential CLI deploys are not atomic. This file does not perform that commit and does not authorize the later relay acceptance run.
