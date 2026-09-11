# Public chat / Realtime pair attestation probes

For Codex in the **credential-owning** environment only. This file does not authorize `ATTESTED`, a pair deploy, a secret change, or a customer session.

`#541` (parity notification / `ELEVENLABS_MCP_SECRET`) is resolved and is **not** OpenAI model proof. Unsigned MCP initialize still 401s. Do not treat a green knowledge canary, secret-name presence, a deploy timestamp, `knowledgeProbe`, or Realtime token issuance alone as attestation.

Committed guards in `scripts/lib/public-function-release-guards.mjs` stay `UNVERIFIED`. Do not commit `ATTESTED` until the probes below succeed with a key **demonstrably matching** production Edge `OPENAI_API_KEY` on project `eutsoqdpjurknjsshxes`. A local `.env` key is rejected (`LOCAL_PROVENANCE`).

Companion hold document: `docs/runbooks/public-function-backlog-release-533.md`.

## Insufficient evidence (do not attest from these)

- Secret **name** `OPENAI_API_KEY` present
- Registry `updated_at` / version
- `#541` production-parity run
- `scripts/chat-voice-knowledge-live-check.mjs` / `knowledgeProbe: true`
- `elevenlabs-conversation-token` mint
- `realtime-session` HTTP 200 that only returns a client secret without an SDP answer
- Laptop or preview `OPENAI_API_KEY`

## Provenance required

Copy the production Edge `OPENAI_API_KEY` through 1Password / secure storage into the Codex environment. Record **names and window only**:

- `productionKeyProvenance` example shape (no secret): `supabase-edge-secret:OPENAI_API_KEY@eutsoqdpjurknjsshxes;openai-project-behind-that-key;window=YYYY-MM-DD`
- Must not match `local`, `.env`, `dotenv`, `process.env`, `env.local`

## Bounded probes (no CRM / quote / SMS / email writes)

Run against `https://api.openai.com` with that production key. Record HTTP status and model/id fields only. Do not print the key.

### A. Site-chat model (`gpt-5.6-luna`)

1. `GET /v1/models/gpt-5.6-luna`  
   Pass: `200` and `id` equals `gpt-5.6-luna`.  
   Fail: `404` / `403` / model-not-found.
2. Optional single non-customer `POST /v1/chat/completions` with `model=gpt-5.6-luna` and a disposable prompt (`Reply with the single word pong.`). No tools. No customer PII.  
   Pass: `200` and `model` starts with `gpt-5.6-luna`.  
   Do not post to `ai-chatbot` / `ai-chatbot-stream`.

### B. Realtime model + actual SDP/session path (`gpt-realtime-2.1-mini`)

Token issuance alone is insufficient.

1. `GET /v1/models/gpt-realtime-2.1-mini`  
   Pass: `200` and `id` equals `gpt-realtime-2.1-mini`.
2. Session mint matching `realtime-session`: `POST /v1/realtime/client_secrets` with body using `session.model = gpt-realtime-2.1-mini` (GA nested `session` object, not retired `POST /v1/realtime/sessions`).  
   Pass: `200` and an ephemeral client secret **name present** (do not print the secret).  
   Fail: retired beta URL `404`.
3. SDP exchange matching `realtime-sdp-exchange`: `POST /v1/realtime/calls` with `Content-Type: application/sdp` and a **minimal valid SDP offer**, authorized by that ephemeral secret.  
   Pass: `200`/`201` and body is an SDP **answer** (starts with `v=`).  
   Fail: `404` on `/v1/realtime?model=...` or empty/non-SDP body.

Do not use `/voice-test` unless separately scoped; it creates a Realtime session. Do not mix ElevenLabs in the same window.

## What to return (handoff, no secrets)

| Field | Required |
| --- | --- |
| Production provenance string | Yes |
| Probe A1 status + model id | Yes for `site-chat` |
| Probe B1 status + model id | Yes for `openai-realtime` |
| Probe B2 client_secrets status (secret redacted) | Yes for Realtime |
| Probe B3 SDP answer `v=` yes/no + HTTP status | Yes for Realtime |
| Explicit “local key not used” | Yes |

## After a passing Codex handoff (later reviewed change)

Only then a reviewed commit may set `PUBLIC_RELEASE_PAIRS[].attestation` to:

```js
{
  status: 'ATTESTED',
  productionKeyProvenance: '<the provenance string above>',
  attestedModels: ['gpt-5.6-luna'], // or ['gpt-realtime-2.1-mini']
  attestedKeys: ['OPENAI_API_KEY'],
}
```

Keep pair membership intact. Release order remains `DEPLOY_PAIR=openai-realtime` first, then optionally `DEPLOY_PAIR=site-chat`. Sequential CLI deploys are not atomic. This file does not perform that commit.
