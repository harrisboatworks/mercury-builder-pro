# Public chat / Realtime backlog release (#533)

Source-only safety work. This document does not authorize a production deploy, migration, ElevenLabs refresh, or live smoke test.

**Pinned candidate source:** `1c9c2603f1b0f542e9048d41f0284730adc711ff` (`main` at implementation). Re-pin the exact merge SHA before any later release. Do not infer a deployed commit from a registry timestamp or version number.

**Issue #533 timestamps are stale.** A fresh registry read (Codex-owned, 2026-09-10) reports all six functions **ACTIVE** and present:

| Slug | Registry version | Registry `updated_at` | Notes |
| --- | --- | --- | --- |
| `ai-chatbot` | 740 | 2026-09-10 | Every current relative-import closure path is present in the bundle and hash-equal to this pin |
| `ai-chatbot-stream` | 455 | 2026-09-10 | Every current relative-import closure path is present and hash-equal |
| `realtime-session` | 401 | 2026-09-10 | Every current relative-import closure path is present and hash-equal |
| `sync-elevenlabs-static-kb` | 282 | 2026-09-10 | Every current relative-import closure path is present and hash-equal |
| `voice-perplexity-lookup` | 265 | 2026-09-10 | Every current relative-import closure path is present and hash-equal |
| `realtime-sdp-exchange` | 378 | 2026-08-15 | Only demonstrated source mismatch |

The existing main-push deploy path **checks** applied migrations (Management API, then CLI fallback) and never applies them. This change adds an explicit pair hold so site chat and OpenAI Realtime cannot deploy one member, or either member, while production model/API attestation remains UNVERIFIED.

PR **#528** overlaps `scripts/deploy-supabase-functions.mjs` and `.github/workflows/supabase-functions-deploy.yml`. If #528 merges first, reconcile this pair-selector work onto that tree. Do not import or edit #528's cron work.

## Codex-verified production facts (2026-09-11)

These reads were performed by **Codex**, not Cursor. Values and digests were never printed.

**Secret names PRESENT** via Supabase CLI `secret-list` metadata (names only):

`OPENAI_API_KEY`, `HBW_API_KEY`, `PERPLEXITY_API_KEY`, `ELEVENLABS_API_KEY`, `AGENT_QUOTE_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

Do not describe those names as missing or unknown. **Name presence is not key validity.** Model access on the OpenAI project behind production `OPENAI_API_KEY` remains **UNVERIFIED**. The committed runtime attestation therefore stays `UNVERIFIED`. The attestation helper checks record shape and required names only; it is not a credential or model-access verifier.

`HBW_API_KEY` is a historical `#482` Set 0 prerequisite. It is **not** referenced in the current import closures of these six functions.

**Credential-free OPTIONS** against all six slugs at `2026-09-11T02:11:36Z` returned HTTP 200 with `Access-Control-Allow-Origin: *`. That proves reachability only, not provider auth, model enablement, or runtime behavior.

## BLOCKED / UNVERIFIED prerequisites

Keep these labels. Do not collapse them into “probably fine.”

| Prerequisite | Status | Why it stays open |
| --- | --- | --- |
| Seven listed secret **names** on the production Supabase project | **PRESENT** (Codex CLI metadata) | Names only. Values, rotation state, and provider validity were not proven |
| `gpt-5.6-luna` enabled on the production `OPENAI_API_KEY` | **BLOCKED / UNVERIFIED** | Source cutover from `#461` (`CHAT_MODEL`). Runtime failure mode is not claimed here |
| `gpt-realtime-2.1-mini` enabled on the production `OPENAI_API_KEY` | **BLOCKED / UNVERIFIED** | Source cutover from `#462` (`REALTIME_MODEL`). Source comments say the retired beta sessions URL returns 404; that is a source/contract note, not a live key-class proof |
| Additional source models (`sonar`, `whisper-1`, `e5_mistral_7b_instruct`) | **UNVERIFIED** at the production providers | Listed below; not pair-hold required names |
| `PERPLEXITY_API_KEY` / `ELEVENLABS_API_KEY` / `AGENT_QUOTE_API_KEY` validity | **UNVERIFIED** | Names are present; validity is not |
| In-scope migrations | Not a current pair blocker | The deploy job **checks** applied migrations and fails closed if a newly required one is missing. It never applies SQL |
| Local `OPENAI_API_KEY` / `.env` | **Not proof** | The hold ignores process-env provider keys |

Committed attestation in `scripts/lib/public-function-release-guards.mjs` stays `UNVERIFIED` until a later reviewed change records project/source/window-bound evidence plus a live registry validation. `DEPLOY_PAIR` does not lift that hold.

## Source-derived key and model names

Read from the function `index.ts` files at the pin. Platform keys used by Edge (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) are present in production by name; they are omitted from the pair-hold required set.

| Surface | Models from source | Provider key names from source |
| --- | --- | --- |
| `ai-chatbot` | `gpt-5.6-luna` (`CHAT_MODEL`) | `OPENAI_API_KEY` |
| `ai-chatbot-stream` | `gpt-5.6-luna` (`CHAT_MODEL`); Perplexity `sonar` | `OPENAI_API_KEY`, `PERPLEXITY_API_KEY`, `AGENT_QUOTE_API_KEY` |
| `realtime-session` | `gpt-realtime-2.1-mini` (`REALTIME_MODEL`); transcription `whisper-1` | `OPENAI_API_KEY` |
| `realtime-sdp-exchange` | none in this file (ephemeral secret from session; GA URL `/v1/realtime/calls`) | none |
| `sync-elevenlabs-static-kb` | embedding `e5_mistral_7b_instruct` | `ELEVENLABS_API_KEY` |
| `voice-perplexity-lookup` | Perplexity `sonar` | `PERPLEXITY_API_KEY` |

Pair-hold required names (cutover constants only): chat = `gpt-5.6-luna` + `OPENAI_API_KEY`; Realtime = `gpt-realtime-2.1-mini` + `OPENAI_API_KEY`.

## File-hash reconciliation and bundled-source identity limits

Codex supplied a sanitized per-file SHA-256 compare of extracted deployed bundles against this pin. This lane re-hashed the same repository paths and matched every `source_sha256`.

**Equal at this pin:** for `ai-chatbot` v740, `ai-chatbot-stream` v455, `realtime-session` v401, `sync-elevenlabs-static-kb` v282, and `voice-perplexity-lookup` v265, **every current relative-import closure path** (`sourceFilesForFunction()`) is present in the extracted bundle and hash-equal to this pin. That is the full current closure, not an unspecified subset. Bundles may still include extras such as `deno.json` that the static graph does not import.

**Not equal:** `realtime-sdp-exchange` v378.

| Path | Deployed SHA-256 | Source SHA-256 at `1c9c2603` |
| --- | --- | --- |
| `supabase/functions/realtime-sdp-exchange/index.ts` | `737438db9a8311dcdde603b19e64c19537cfc906585157cd1833212ee8553d86` | `dc28683729c51ea3e597e3269ad0242424beb4b9e6779af864bcbb1f611e455e` |
| `supabase/functions/_shared/rate-limit.ts` | `5f5a62d8a7124b5c0e60657b2cdd98f09cb7dca6c8b44a9d7e15cfe995d79362` | `1117bd1856c37e6c883999f7feefd3ff0b705304daaa60c74250f4d3d915d7a0` |
| `supabase/functions/deno.json` | equal | equal |

Limits of bundled-source identity — do not over-read a hash match:

- Equal file bytes are not a deployed git commit. The CLI bundle is not a `main` tree snapshot.
- Current static import closure for `realtime-sdp-exchange` also reaches `_shared/rate-limit-probe.ts`. The v378 bundle lists `index.ts`, `rate-limit.ts`, and `deno.json` instead.
- A Sept 10 `updated_at` does not identify `1c9c2603`. Never infer the deployed commit from timestamps.
- Matching hashes do not prove key validity, model enablement, `verify_jwt`, or cron attachment.

## Import closure (static relative imports)

`sourceFilesForFunction()` in `scripts/lib/supabase-deploy-required.mjs`: function directory plus static `from` / `import()` relatives, including `_shared/`.

Shared Set 1 helpers (`voice-system-prompt.ts` and the website-voice token/MCP/inventory functions) are **out of scope** and were not edited.

| Slug | Own entry | Shared closure |
| --- | --- | --- |
| `ai-chatbot` | `index.ts` | `rate-limit.ts`, `rate-limit-probe.ts`, `format-kb-documents.ts`, `harris-knowledge.ts`, `blog-knowledge.ts`, `mercury-knowledge.ts`, `blog-index-generated.ts`, `promotion-context.ts`, `promo-dates.ts`, `verified-hbw-authority-facts.ts`, `customer-knowledge-context.ts`, `verified-mercury-technical-facts.ts` |
| `ai-chatbot-stream` | `index.ts` | chat closure plus direct `mercury-knowledge.ts` / `harris-knowledge.ts`, `mercury-product-protection-rates.ts`, `nearby-horsepowers.ts` |
| `realtime-session` | `index.ts` | `rate-limit.ts`, `rate-limit-probe.ts`, `origin-check.ts`, `browser-origin.ts`, the `format-kb-documents.ts` tree, `customer-knowledge-context.ts`, `verified-hbw-authority-facts.ts`, `verified-mercury-technical-facts.ts` |
| `realtime-sdp-exchange` | `index.ts` | `rate-limit.ts`, `rate-limit-probe.ts` (probe is current-source only; v378 bundle did not list it) |
| `sync-elevenlabs-static-kb` | `index.ts` | `cors.ts`, `format-kb-documents.ts` tree, `admin-auth.ts` |
| `voice-perplexity-lookup` | `index.ts` | `rate-limit.ts`, `rate-limit-probe.ts`, `verified-mercury-technical-facts.ts`, `verified-hbw-authority-facts.ts`, `format-kb-documents.ts` tree |

A `_shared/rate-limit.ts` change on `main` still fans out to both pairs **and** to unrelated functions. The new gate holds the pairs and leaves unprotected importers on the existing migration-check path.

## Relevant git commit dependencies

These are source dependencies at the pin, not proof of what production runs.

| Commit | Why it matters |
| --- | --- |
| `9a9793b7` `#461` | Site assistant `CHAT_MODEL` becomes `gpt-5.6-luna` |
| `1d65230c` `#462` (2026-09-04) | Realtime GA: session mints `gpt-realtime-2.1-mini`; SDP uses `/v1/realtime/calls`. Remaining SDP `index.ts` byte gap vs v378 |
| `14f199b6` `#368` (2026-08-25) | Current `_shared/rate-limit.ts`. SDP v378 (2026-08-15) still hashes the older file |
| `ff541144` `#474` | Shared knowledge / prompt closure on the five equal bundles |
| `c344b81f` `#478` | Shared `customer-knowledge-context` / voice-prompt closure (Set 1 also consumed this; not edited here) |
| `5d729c99` / `0317b578` (7 Sept) | Shared closure commits present on the five equal Sept 10 bundles |
| `9dc35b66` `#501` | Ontario promo-date / shared fact window |
| `9c7b9c0e` `#504` | Edge typecheck / shared error-narrowing on the KB closure |
| `2bf7db6b` `#535` | Later shared/source pin predecessor |
| `1c9c2603` `#536` | Current pin |

`#482` Set 1 (website voice) and Set 2 (external agents) plus `#528` promo-cron work stay on their own lanes.

## What the deploy job now does

`scripts/deploy-supabase-functions.mjs` (forced single-slug, `DEPLOY_PAIR`, git-range diff, and `_shared` fan-out) **checks** applied migrations and never applies them.

After that check, `scripts/lib/public-function-release-guards.mjs` fails closed **before `deployOne`** when a selected slug is in a pair and any of these is true:

1. Production attestation is missing, unknown, unverified, incomplete, or uses local-key provenance (shape/name check only).
2. Only one pair member is selected (`DEPLOY_FUNCTION` of one slug is one-sided).
3. Any selected pair member has a missing/unreadable required migration or other precondition.

`DEPLOY_PAIR` selects exactly the allowlisted members and still runs `requiredMigrationsForSlug` for each. It is not an approval env override.

Allowlisted IDs only: `site-chat`, `openai-realtime`. Unknown IDs or combining `DEPLOY_FUNCTION` with `DEPLOY_PAIR` fail before any deploy call.

```sh
# Future approved release command (still held today)
DEPLOY_PAIR=openai-realtime node scripts/deploy-supabase-functions.mjs
# or GitHub workflow_dispatch input pair_name=openai-realtime

DEPLOY_PAIR=site-chat node scripts/deploy-supabase-functions.mjs
# or pair_name=site-chat
```

Do not set `DEPLOY_FUNCTION` in the same run. Do not export a local `OPENAI_API_KEY` to “approve” the hold.

Sequential CLI deploys in one job are **not atomic**.

`sync-elevenlabs-static-kb` and `voice-perplexity-lookup` are documented backlog solos and are **not** pair-gated. **Source deployment of `sync-elevenlabs-static-kb` does not execute the hosted ElevenLabs KB refresh.** Those are distinct operations; neither is authorized here.

## Approval-ready release order

Do not start this list until Jay authorizes the exact pin, the production model/API proof, and the deploy window. Codex owns live/credential reads.

1. **Reconcile #528 if it merged first.** Same deploy script and workflow. Do not take #528's cron patches.
2. **Re-pin source.** Confirm the candidate SHA. Re-run the sanitized bundle-hash compare. The only demonstrated mismatch today is `realtime-sdp-exchange` (`#462` + current `rate-limit.ts` / `#368`). If a previously equal slug now mismatches, stop.
3. **Registry checks (read-only).** Confirm the six slugs are `ACTIVE` and present. Record version + `updated_at` + `verify_jwt`. Do not treat version/time as a commit.
4. **Fresh production model/API proof** on the OpenAI project behind the **production** `OPENAI_API_KEY` (names are already present). A laptop key, `.env`, or preview project is not provenance. Recording `ATTESTED` in the committed manifest is a later reviewed change that also needs live registry validation for that project/source/window. Today's validator only checks attestation shape and required names.
5. **Migrations.** Confirm no newly required in-scope migration is unapplied. The job checks this; it does not apply SQL.
6. **Realtime pair first** — the only demonstrated source mismatch. After step 4 and Jay's approval, select exactly:

   `DEPLOY_PAIR=openai-realtime node scripts/deploy-supabase-functions.mjs`  
   (workflow: `pair_name=openai-realtime`)

   That command is concrete and still **held** until the later reviewed attestation exists. Do not use `DEPLOY_FUNCTION=realtime-session` or `DEPLOY_FUNCTION=realtime-sdp-exchange` (one-sided).
7. **Avoid other unnecessary redeploys.** The source-equal `realtime-session` is intentionally included in step 6 to preserve the paired release boundary; do not redeploy it separately. `ai-chatbot`, `ai-chatbot-stream`, `realtime-session`, `sync-elevenlabs-static-kb`, and `voice-perplexity-lookup` already match this pin on every current relative-import path.
8. **Chat pair only if there is an approved source change or an explicit redeploy decision.** Then `DEPLOY_PAIR=site-chat` (`pair_name=site-chat`), same hold rules. Not a default next step.
9. **`voice-perplexity-lookup` / `sync-elevenlabs-static-kb`.** Optional later, own approvals. KB source deploy still does not refresh hosted ElevenLabs.
10. **Hosted ElevenLabs KB refresh.** Distinct authorized operation. Not implied by a function deploy.

**Fail / stop / rollback**

- Stop if the production OpenAI project lacks a required model, registry is missing a pair member, hashes/file-sets disagree with the plan, or a required migration is unapplied.
- Stop if the deploy job skips either pair member. Do not retry the other member alone.
- If one CLI deploy succeeds and the partner fails, production is split. Sequential deploys are not atomic. Roll back the succeeded member to the last known good deployed bundle (Codex-owned read) or finish the partner only while the same attested window is still valid. There is no automatic undo.
- Do not “fix” a hold by exporting a local `OPENAI_API_KEY` or by treating `DEPLOY_PAIR` as approval.
- Do not apply migrations from the function deploy workflow.

## Non-customer smoke checks

Codex completed the read-only metadata and OPTIONS checks above. Provider/session checks below remain unexecuted and require a separately scoped release verification.

### Offline (safe now, no provider calls)

- `npx vitest run src/test/publicFunctionReleaseGuards.test.ts src/test/supabaseFunctionsDeploy.test.ts`
- Confirm the committed attestation is still `UNVERIFIED`.
- Confirm `DEPLOY_PAIR=site-chat` and `DEPLOY_PAIR=openai-realtime` remain held without an injected test attestation.
- Confirm source model/key names still match the table above, including `sonar`, `whisper-1`, and `e5_mistral_7b_instruct`.
- Optional: `npm run typecheck:edge -- supabase/functions/ai-chatbot/index.ts supabase/functions/ai-chatbot-stream/index.ts supabase/functions/realtime-session/index.ts supabase/functions/realtime-sdp-exchange/index.ts supabase/functions/sync-elevenlabs-static-kb/index.ts supabase/functions/voice-perplexity-lookup/index.ts` after an authorized function edit. This PR does not change those implementations.

### Approval-dependent provider or session calls (not run here)

Codex already completed credential-free OPTIONS reachability (200, `ACAO *`) at `2026-09-11T02:11:36Z`. That is not a provider/runtime pass.

Only after Jay authorizes a specific check, using production provenance, and **without** creating customer, quote, or session business records:

- Model-existence probe on the production OpenAI project for `gpt-5.6-luna` and `gpt-realtime-2.1-mini` (read/list only; no chat completion that writes CRM state).
- Registry re-read of the six slugs.
- If a widget/session probe is later authorized: use a non-customer origin that already passes `isAllowedOrigin`, do not submit a quote, do not save a lead, do not run MCP tools that estimate trade-in, build a quote, send SMS/email, or write reminders. `/voice-test` creates a Realtime session and is **not** a no-side-effect check unless separately scoped.

Do **not** run `scripts/chat-voice-knowledge-live-check.mjs` as part of this backlog: it posts to `ai-chatbot-stream` and `elevenlabs-conversation-token` and calls voice tools (`check_current_deals`, `check_financing_options`, `get_store_hours`). That is Set 1 / live-knowledge work, not this hold.

Do **not** invoke `sync-elevenlabs-static-kb`. Source deploy does not run the hosted ElevenLabs refresh; invoking the function can write hosted KB state and is a separate authorization.

`voice-perplexity-lookup` spends Perplexity (`sonar`) and can answer from live blog/facts. A later probe must use a disposable non-customer question and must not be chained into quote or inventory tools.

## Independent verification and evidence

[Sanitized evidence JSON](evidence/public-function-backlog-533-20260910.json) contains all compared file hashes, registry readback, secret-name presence, import-closure findings, and OPTIONS results. No secret values, secret digests, or customer payloads are included.

Cursor CLI `2026.09.08-6caf4ff`, model `cursor-grok-4.6-xhigh-fast`, implemented the source-only changes from the pinned committed input. Codex independently verified **125 tests across five files**, JavaScript syntax, whitespace, and four real CLI-entry-point scenarios using a fake Supabase executable: both held pair selectors, an unknown selector, and conflicting selectors each exited 1 with **zero deployment calls**. No Edge function, migration, Set 1 implementation, secret, or hosted ElevenLabs state was changed.
