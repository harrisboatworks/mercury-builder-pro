# Chat and Realtime release preparation — 2026-10-07

The main-push deploys at 16:31, 17:43 and 18:14 EDT on October 6 failed because the committed production attestations remain `UNVERIFIED`. The last run deployed four unrelated functions successfully and held `ai-chatbot`, `ai-chatbot-stream` and `realtime-session`. The October 7 08:32 EDT run was green but reported `Nothing deployed`; it covered a later range with no function changes and does not clear the earlier held targets.

Source pin: `fb249449df61cbcc8fca2d99e84bc5a019f0eb89` (GitHub main). Existing draft #611 has been reconciled with that source in an isolated clone; the shared production checkout was preserved.

## Fresh read-only production evidence

[Sanitized registry and bundle readback](evidence/public-function-pairs-20261007-readback.json) records connector reads from Supabase project `eutsoqdpjurknjsshxes`. Every function was ACTIVE with `verify_jwt=false`.

| Function | Version | Differences from the source pin |
| --- | --- | --- |
| `ai-chatbot` | 754 | `_shared/harris-knowledge.ts`, `_shared/blog-index-generated.ts` |
| `ai-chatbot-stream` | 466 | `index.ts` and the same two shared knowledge files |
| `realtime-session` | 411 | The same two shared knowledge files |
| `realtime-sdp-exchange` | 388 | None |

The held production bundles therefore have not received the latest service-link and knowledge corrections. Active registry entries and matching provider-call source do not prove current key validity or model access. No provider, session or customer-tool invocation was performed by this preparation. The September 28 runtime receipt remains dated historical evidence; its workstation-key provenance limitation is preserved.

## Release scope and remaining gate

The prepared #611 change records per-pair attestations and retains the UNVERIFIED fallback, paired selection, migration checks and one-sided-release rejection. A source-range no-op neither retries nor attests earlier failures. Recovery should select the existing explicit pair selectors; do not bypass the guard or replay an old function one-sidedly.

AGENTS.md requires explicit authorization before production triggers, merge or deployment. The concrete proposed scope is bounded non-customer verification through the four production functions, followed only on successful proof and exact-head CI by merging #611 and deploying `openai-realtime` first and `site-chat` second. Fresh runtime receipts must replace stale release attestations before merge. Do not invoke customer tools, submit/save quotes, send messages, refresh hosted ElevenLabs knowledge, change credentials, or apply database migrations.

Record source pin, current registry versions, production stream/model identity, a real browser-generated receive-only SDP exchange and peer cleanup. Preserve rollback bundles before any deployment. Stop if a required model/key check, pair member, migration check, source comparison or cleanup is unverified. Stop on a failed or partial pair deploy; do not continue to the next pair. Repeat source readback and bounded runtime acceptance after deployment.

The existing battery-guide correction #614 remains a separate draft. #611 alone does not add that link or complete the wider battery/four-guide handoff.

## Local validation

- 71 focused release-guard/deployment tests passed with all deployment calls mocked.
- Frontend and Vite-config TypeScript checks passed with the tracked declaration shims present.
- `git diff --check` passed.
- No Edge implementation, production secret, migration or customer record changed.
