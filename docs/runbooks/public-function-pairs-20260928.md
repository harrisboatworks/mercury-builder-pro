# Public chat and Realtime production evidence, 2026-09-28

Codex verified the four existing production functions on project `eutsoqdpjurknjsshxes` after Jay authorized bounded chat/voice checks and preparation of a release PR. No merge, deployment, credential change, migration, customer record, quote, email, or SMS was performed.

Candidate source: `6e58b3711424a36c0832528dcc7cbf6fbae8373f`.
Machine-readable record: [sanitized evidence](evidence/public-function-pairs-20260928.json).

## Production provenance

These checks invoked the deployed Edge functions, which read `OPENAI_API_KEY` from their production environment. Supabase Management API confirmed that secret name is present. Retrieved deployed entry points are byte-identical to the candidate source. The streaming path relays the OpenAI completion stream and its model identity; the session path returns the OpenAI session model. There is no alternate credential or provider on these tested paths.

The securely stored workstation credential did **not** match Supabase's secret fingerprint and was not used for any OpenAI call. Relevant 1Password OpenAI entries contained no API-key candidate. No secret value or digest was printed or committed. This evidence does **not** claim a pass under open PR #542's different, digest-matched direct-provider protocol. It records successful calls through the actual production functions and their verified source instead.

## Observed results

| Surface | Production version | Result |
| --- | --- | --- |
| `ai-chatbot` | 752 | HTTP 200; disposable connectivity prompt returned exactly `pong` |
| `ai-chatbot-stream` | 464 | Three HTTP 200 streams identified `gpt-5.6-luna`, completed with `[DONE]`, and linked the making-oil, NMEA 2000, and aluminum-transom guides |
| `realtime-session` | 409 | HTTP 200; secret present; returned model `gpt-realtime-2.1-mini` |
| `realtime-sdp-exchange` | 386 | HTTP 200; full SDP answer differed from the browser-generated offer and was accepted by `RTCPeerConnection.setRemoteDescription` |

The Realtime test used the Codex in-app Browser, a real receive-only audio transceiver and data channel, no microphone and no customer input. The peer was explicitly closed after acceptance; the entire probe took 2,939 ms. No separate provider hangup receipt is available from the production relay. This is session/SDP capability evidence, not an audio, transcription, interruption, or customer-tool test.

All four registry entries were ACTIVE with `verify_jwt=false`. Versions identify observations, not Git commits.

## Source comparison and remaining battery defect

Every current relative-import closure path was present in the downloaded bundles: 13 paths for legacy chat, 15 for streaming chat, 15 for session mint, and 3 for SDP exchange. All four entry points and their provider contracts match the candidate byte-for-byte. The only differing bundled file is `_shared/blog-index-generated.ts` in the first three functions. The SDP bundle fully matches. This supersedes the September 10 runbook's old claim that SDP was the only mismatch.

The live battery question still returns the deterministic manual-lookup response without linking the new guide. That response is not model-access proof. Its guard source is already identical to main, so redeploying the same entry/shared guard cannot by itself fix the routing. A narrow guide-link change is still needed; do not loosen the manual-backed specification guard. This PR records provider capability only and does not claim the handoff's four-guide acceptance is complete.

## Release boundary

The per-pair ATTESTED records allow these pairs to pass the existing model/key-name gate. They do not change pair membership, migration checks, one-sided-release protection, or the UNVERIFIED fallback. Tests explicitly inject UNVERIFIED records to retain failed-closed coverage and use mocked deployment functions only.

Merge and deployment still require Jay's explicit authorization under AGENTS.md. Before release, re-pin the approved PR merge SHA, refresh registry and required migration evidence, review any intervening source/provider changes, and preserve rollback bundles. A credential or provider-contract change invalidates this dated evidence and requires fresh verification.

If approved, dispatch `openai-realtime` first, wait for completion and verify both members, then dispatch `site-chat` in a separate run. Sequential deployments are not atomic. Stop on skipped, failed, partial, or ambiguous results. Do not dispatch both runs together. No hosted ElevenLabs refresh or unrelated function deployment is included.

Repeat live acceptance after the approved deployments. The battery guide defect and four-guide acceptance remain open; the handoff is not complete merely because the model/key gate passes.

## Local validation

- Focused release-guard and deployment suite: 71 tests passed, with deployment calls mocked.
- Frontend and Vite-config TypeScript checks passed.
- JavaScript syntax, whitespace, evidence parsing, and all four entry-point hash comparisons passed.
- No Edge implementation changed. Hosted CI and merge/deploy acceptance are separate from these local checks.
