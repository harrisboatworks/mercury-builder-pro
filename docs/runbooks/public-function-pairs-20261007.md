# Chat and Realtime release — October 7, 2026

Automatic blog-index changes selected `realtime-session` but omitted its required `realtime-sdp-exchange` partner. Automatic Git-diff selections now add an available partner and derive its migration requirements. Explicit one-function selectors remain refused for paired functions; missing or removed partners, UNVERIFIED attestations and migration failures retain their fail-closed behavior. A no-op range does not retry earlier held deployments.

## Fresh production proof

The [October runtime receipt](evidence/public-function-pairs-20261007.json) records bounded calls through the deployed functions and their server-side production `OPENAI_API_KEY`. The first ping failed because OpenAI had no credits. Jay restored credits, and chat passed at `2026-10-07T22:07:02.776Z`: both functions returned 200/pong; streaming returned model `gpt-5.6-luna` and `[DONE]`.

At `2026-10-07T22:08:56.246Z`, `realtime-session` returned 200 with `gpt-realtime-2.1-mini`, and the SDP relay returned a distinct valid answer accepted by a real receive-only peer in the Codex in-app Browser. The peer connected, the data channel opened, both closed, and the ephemeral secret was cleared. An earlier checker read the channel's state before its asynchronous close event; the corrected receipt awaits the event and records all cleanup fields true. No microphone, audio response, customer input or tool call was used. No secret values or digests were retained. This is bounded runtime proof, not #542's separate digest-matched direct-provider protocol or full conversational audio acceptance.

## Source and rollback

Source pin: GitHub main `6bcd1134060219a787dffbde27d126ebc5451595`, through #656. [Sanitized 50-file readback](evidence/public-function-pairs-20261007-readback.json) compares the four complete production bundles with that source. The registry bundle identities were rechecked unchanged before the fresh runtime checks. All four complete rollback bundles are preserved locally.

| Function | Pre-release version | Differences from source pin |
| --- | --- | --- |
| `ai-chatbot` | 754 | `_shared/harris-knowledge.ts`, `_shared/blog-index-generated.ts` |
| `ai-chatbot-stream` | 466 | `index.ts` and the same two shared files |
| `realtime-session` | 411 | The same two shared files |
| `realtime-sdp-exchange` | 388 | None |

The first three still require the service-link and current blog-knowledge corrections, including the later #651/#654/#655 index changes. September 28 receipts remain historical; current per-pair attestations reference October proof. The UNVERIFIED fallback remains available and tested. The guard is a shape/name gate, not a continuous key/credit/model verifier.

## Approved staged release and acceptance

Jay explicitly approved bounded non-customer production checks, final-head CI, merge and the following release sequence. Pass the final commit's hosted tests/typechecks/integrity/preview, merge #611, then dispatch `DEPLOY_PAIR=openai-realtime` on that merge SHA. Confirm both members actually deployed, compare every bundled file with the merged source and repeat the bounded session/SDP/transport/cleanup check. Only then dispatch `DEPLOY_PAIR=site-chat`, confirm both members, compare their source and repeat chat/model checks. The bounded service question must return `hbwservice.ca` from both chat functions.

Stop on failed, partial, unverified, migration-gated or source-mismatched results. Deployments are sequential, not atomic; retain the rollback bundles. The workflow checks applied migrations and never applies them. No customer tools, quote writes, messages, credential changes or hosted ElevenLabs refresh. Sonnet/Haiku evaluation is a separate provider decision; this release retains the existing models.

The existing battery-guide correction #614, #542/#544 and #649 remain separate. #611 alone does not add the battery guide or complete the wider four-guide handoff.

## Validation

119 focused release-guard, deployment and diff-mapping tests under Node 22.22.2 with every deployment call mocked, including automatic blog-only pair completion, attestation/migration holds, missing/removed partners and explicit single-function refusal. Frontend and Vite-config typechecks passed during preparation. Repeat focused checks after fresh attestations and pass final-head hosted CI before merging. No Edge implementation, production secret, migration or customer record was edited by this change.
