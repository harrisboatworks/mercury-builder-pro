# Chat and Realtime release preparation — 2026-10-07

The main-push deploys at 16:31, 17:43 and 18:14 EDT on October 6 failed because the committed production attestations remain `UNVERIFIED`. The last run deployed four unrelated functions successfully and held `ai-chatbot`, `ai-chatbot-stream` and `realtime-session`. The October 7 08:32 EDT run was green but reported `Nothing deployed`; it covered a later range with no function changes and does not clear the earlier held targets.

Source pin: `6bcd1134060219a787dffbde27d126ebc5451595` (GitHub main). Existing draft #611 has been rebased onto that source in an isolated clone; the shared production checkout was preserved.

## Approved runtime check stopped the release

Jay approved the bounded production checks and conditional staged release. At `2026-10-07T21:55:06.570Z`, `ai-chatbot` returned HTTP 500 with the OpenAI error “You have no credits remaining.” `ai-chatbot-stream` also returned HTTP 500, with no SSE model identity or completion. [Sanitized runtime receipt](evidence/public-function-pairs-20261007.json) records the failure. The local harness relayed the disposable ping through the production functions with the allowed production Origin header; it never used a workstation OpenAI key.

The stop condition fired. No Realtime session or SDP exchange was started, and no service-link acceptance, merge or deployment occurred. Both committed pair attestations are `UNVERIFIED`; stale September 28 attestations were removed from this draft. The automatic-selection fix remains prepared for review. The production OpenAI billing/credits gate must be resolved before fresh success can be recorded and the approved release sequence can resume. This check does not identify which billing organization or key should be changed, and no credential change is authorized.

## Fresh read-only production evidence

[Sanitized registry and bundle readback](evidence/public-function-pairs-20261007-readback.json) records connector reads from Supabase project `eutsoqdpjurknjsshxes`. The refresh at `2026-10-07T21:40:43.288086+00:00` compared all 50 bundled files against the source pin. Every function was ACTIVE with `verify_jwt=false`; registry versions are unchanged from the earlier October 7 readback. Rollback copies of all four complete bundles were saved locally before any release action.

| Function | Version | Differences from the source pin |
| --- | --- | --- |
| `ai-chatbot` | 754 | `_shared/harris-knowledge.ts`, `_shared/blog-index-generated.ts` |
| `ai-chatbot-stream` | 466 | `index.ts` and the same two shared knowledge files |
| `realtime-session` | 411 | The same two shared knowledge files |
| `realtime-sdp-exchange` | 388 | None |

The held production bundles therefore have not received the latest service-link and knowledge corrections. The generated blog index also includes later source changes from #651, #654 and #655. #656 is included in the source pin; its owner-approved guard changes remain in place. Active registry entries and matching provider-call source do not prove current key validity or model access. The subsequent bounded provider ping failed as recorded above; no session or customer-tool invocation was performed. The September 28 runtime receipt remains dated historical evidence; its workstation-key provenance limitation is preserved.

## Release scope and remaining gate

The prepared #611 change retains committed UNVERIFIED pair holds, paired selection, migration checks and explicit one-sided-release rejection. Offline reproduction found that a blog-index-only diff selected `realtime-session` without `realtime-sdp-exchange`, which would leave Realtime held even after attestation. Automatic Git-diff selections now add an available partner and derive its required migrations; missing or removed partners remain incomplete and held. Explicit single-function requests are not expanded. A source-range no-op neither retries nor attests earlier failures. Recovery should select the existing explicit pair selectors; do not bypass the guard or replay an old function one-sidedly.

AGENTS.md requires explicit authorization before production triggers, merge or deployment. Jay approved bounded non-customer verification through the four production functions, followed only on successful proof and exact-head CI by merging #611 and deploying `openai-realtime` first and `site-chat` second. The failed required check currently blocks that sequence. Fresh runtime receipts must replace stale release attestations before merge. Do not invoke customer tools, submit/save quotes, send messages, refresh hosted ElevenLabs knowledge, change credentials, or apply database migrations.

Record source pin, current registry versions, production stream/model identity, a real browser-generated receive-only SDP exchange and peer cleanup. Preserve rollback bundles before any deployment. Stop if a required model/key check, pair member, migration check, source comparison or cleanup is unverified. Stop on a failed or partial pair deploy; do not continue to the next pair. Repeat source readback and bounded runtime acceptance after deployment. A bounded service question must return `hbwservice.ca`. A future shared-file push must select both members of each affected pair; verify this selection offline before declaring the automatic-release hold cleared.

The existing battery-guide correction #614 remains a separate draft. #611 alone does not add that link or complete the wider battery/four-guide handoff.

## Local validation

- 119 focused release-guard, deployment and diff-mapping tests passed under Node 22.22.2 with all deployment calls mocked. Coverage includes blog-only automatic pair completion, retained UNVERIFIED/migration holds, missing/removed partners and explicit single-function refusal.
- Frontend and Vite-config TypeScript checks passed with the tracked declaration shims present.
- `git diff --check` passed.
- No Edge implementation, production secret, migration or customer record changed. Only disposable chat pings reached production.
