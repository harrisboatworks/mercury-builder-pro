# Edge-function drift vs production — 2026-09-09

**Date observed:** 2026-09-09T20:34:14Z  
**Tree:** `origin/main` at `b3c2278ae` (`#514`)  
**Production project:** `eutsoqdpjurknjsshxes` (from `supabase/config.toml`)  
**This document only reports.** It does not deploy functions, apply migrations, or change product code.

The remembered “about eight functions” from earlier today is **stale**. A fresh Management API compare against current `main` found **20** stale functions. Two of the original [#482](https://github.com/harrisboatworks/mercury-builder-pro/issues/482) eight (`agent-mcp-server`, `public-quote-api`) are no longer stale; they were redeployed today (versions 110 and 106). The other six from that issue are still stale and are classified **individually** below, not as one blob.

---

## How this was computed (re-run this)

`scripts/supabase-drift-watch.mjs` is the comparator. It was reused, not rewritten.

GitHub Actions cannot currently run it to completion: workflow run [`34378809631`](https://github.com/harrisboatworks/mercury-builder-pro/actions/runs/34378809631) (2026-09-09T16:46:19Z) skipped because repository secret `SUPABASE_PROJECT_REF` is unset. `SUPABASE_ACCESS_TOKEN` exists as a repo secret (updated 2026-09-09T17:56:15Z); both are required.

This report used a local Management API read with `SUPABASE_ACCESS_TOKEN` already present on the machine and `SUPABASE_PROJECT_REF=eutsoqdpjurknjsshxes`:

```sh
# From a clean checkout of origin/main. Do not print the token.
export SUPABASE_PROJECT_REF=eutsoqdpjurknjsshxes
# SUPABASE_ACCESS_TOKEN must be a Supabase Management API token that can read this project.
node scripts/supabase-drift-watch.mjs
```

That printed the stale list, each function’s deployed `updated_at`, version, and `git rev-list --count --since=<deployed> HEAD -- <reachable source files>`.

“Reachable source files” are exactly `sourceFilesForFunction()` in `scripts/lib/supabase-deploy-required.mjs`: the function directory plus static relative imports, including `_shared/`.

For each stale slug, the deployed-vs-`main` diff is:

```sh
# <deployed> is the ISO timestamp from the watch output
# <paths> are the reachable files for that slug
git log --since=<deployed> --format='%h %cI %s' HEAD -- <paths>
baseline=$(git log -1 --until=<deployed> --format=%H HEAD -- <paths>)
git diff --numstat "$baseline" HEAD -- <paths>
```

This is the same timestamp method the watch script uses. **Deployed source bundles were not downloaded.** If a past deploy was not the `main` tree at that timestamp, the baseline could be wrong — say so rather than guess. Nothing in this file was filled in from memory except the already-known `send-sms` decision, which was then checked against the fresh timestamps.

Once `SUPABASE_PROJECT_REF` is set as a repository secret, the same compare is:

```sh
gh workflow run supabase-drift-watch.yml --ref main
```

---

## Migration matching (the known ledger trap)

**Current `main` already matches by name.** `isMigrationApplied()` treats a file as applied when the applied ledger’s `version` or `name` equals the filename’s 14-digit prefix, full stem, or suffix after `YYYYMMDDHHMMSS_`. Historical files before `20260731000000` are not reported. This landed in `#485` (`bd8416896`, 2026-09-09).

This run: **18** in-scope migration files checked, **0** unapplied, **406** older files not reported.

Branch `cursor/migration-ledger-name-match-20260909` **does not exist** on the remote (no matching PR or branch). This report does not change that matcher.

---

## Secrets and migrations (BLOCKED gate)

Watch reported **no unapplied in-scope migrations**.

Production secret *names* were listed via `GET /v1/projects/{ref}/secrets` (values not read, not recorded). Names present that these functions use include `OPENAI_API_KEY`, `ELEVENLABS_API_KEY`, `PERPLEXITY_API_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, `RESEND_API_KEY`, `EDGE_INTERNAL_SECRET`, `HBW_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PHONE`.

**No function is BLOCKED for a missing migration or a missing named secret.**

Whether `gpt-5.6-luna` and `gpt-realtime-2.1-mini` are *enabled on the production OpenAI key* is **undetermined**. That is not a missing secret. `#482` asked to prove those model names before cutting over chat or Realtime. This report does not claim they exist.

---

## Drift table

One row per function the watch script called stale. “Commits behind” are reachable-file commits after the deployed timestamp (same rule as the script). “Consequence” for SAFE is what a non-engineer would notice (nothing). For BEHAVIOUR CHANGE it is what changes the moment that one function deploys.

| Slug | Deployed | Commits behind | Bucket | Consequence |
| --- | --- | --- | --- | --- |
| `ai-chatbot` | 2026-08-26T13:06:56.915Z (v737) | 21: `9dc35b667` `#501`, `c344b81f1` `#478`, `e2e3de217` `#473`, `7ef6b4c26` `#472`, `a4c5cb86b` `#465`, `d812b1fe9` `#448`, `3256d4ba4`, `9a9793b78` `#461`, `1c61670b3` `#460`, `b069e7d98`, `94be40747`, `38ae69309`, `732a5951b`, `a22e6ba16`, `613f3e61a`, `42e73f45f`, `dd05ab326` `#424`, `837516d65`, `eb2cb2c23` `#301`, `fc9b2a195` `#392`, `2a2e1ef24` `#387` | BEHAVIOUR CHANGE | The public chat widget switches from `gpt-4o-mini` to `gpt-5.6-luna` and starts using newer promo dates and blog facts; if luna is not on the production OpenAI key the widget errors instead of answering. |
| `ai-chatbot-stream` | 2026-08-26T13:06:56.915Z (v452) | 22: same 21 as `ai-chatbot` plus `9c7b9c0ee` `#504` | BEHAVIOUR CHANGE | Same model cutover as `ai-chatbot`, and “nearby HP” suggestions stop treating a motor with no horsepower as 0 HP. Deploy with `ai-chatbot`, not alone. |
| `auto-image-enhancer` | 2026-08-15T10:54:22.732Z (v677) | 1: `9c7b9c0ee` `#504` | SAFE | None visible. Only the 500-path error string is safer if a non-`Error` is thrown. |
| `cron-failure-notifications` | 2026-08-15T10:54:22.732Z (v481) | 1: `bc0e825d8` `#498` | SAFE | None visible. This function only imports `buildAdminEmail`; the `#498` HTML-escape helpers sit unused beside it. |
| `dropbox-chooser-upload` | 2026-08-15T10:54:22.732Z (v447) | 1: `9c7b9c0ee` `#504` | SAFE | None visible. Same `#504` error-narrowing as the other image/Dropbox jobs. |
| `elevenlabs-conversation-token` | 2026-09-09T14:31:55.637Z (v325) | 1: `9dc35b667` `#501` | BEHAVIOUR CHANGE | Redeployed today, then `#501` landed. The voice agent’s hidden prompt starts treating promo/financing windows as Ontario calendar days, so after 8pm it may still mention a deal that UTC already called expired. |
| `elevenlabs-mcp-server` | 2026-09-09T15:24:22.993Z (v273) | 1: `9dc35b667` `#501` | BEHAVIOUR CHANGE | Same `#501` date window on the tools that list current promos and financing. Evening callers can hear a different “what’s on this week” than they would this afternoon’s build. |
| `migrate-motor-images` | 2026-08-15T10:54:22.732Z (v688) | 1: `9c7b9c0ee` `#504` | SAFE | None visible. Admin image-migration errors stringify non-`Error` throws instead of crashing on `.message`. |
| `motor-health-monitor` | 2026-08-15T10:54:22.732Z (v687) | 1: `9c7b9c0ee` `#504` | SAFE | None visible. Admin health report error text only. |
| `optimize-motor-images` | 2026-08-15T10:54:22.732Z (v686) | 1: `9c7b9c0ee` `#504` | SAFE | None visible. Admin optimizer 500-path only. |
| `realtime-sdp-exchange` | 2026-08-15T10:54:22.732Z (v377) | 3: `1d65230c1` `#462`, `7ffbd26c6` `#384`, `14f199b69` `#368` | BEHAVIOUR CHANGE | The voice audio handshake moves from the retired OpenAI beta URL to `/v1/realtime/calls`. A leftover beta client stops connecting; a GA client can start. Deploy in the same window as `realtime-session`. |
| `realtime-session` | 2026-08-26T13:06:56.915Z (v398) | 21: `9dc35b667` `#501`, `68930d8d5` `#497`, `c344b81f1` `#478`, `e2e3de217` `#473`, `7ef6b4c26` `#472`, `a4c5cb86b` `#465`, `1d65230c1` `#462`, `3256d4ba4`, `1c61670b3` `#460`, `b069e7d98`, `94be40747`, `38ae69309`, `732a5951b`, `a22e6ba16`, `613f3e61a`, `42e73f45f`, `dd05ab326` `#424`, `837516d65`, `eb2cb2c23` `#301`, `fc9b2a195` `#392`, `2a2e1ef24` `#387` | BEHAVIOUR CHANGE | Website OpenAI voice stops calling `/v1/realtime/sessions` (now 404) and mints a GA secret for `gpt-realtime-2.1-mini`. If that model is not on the production key, new voice sessions fail. Deploy with `realtime-sdp-exchange`. |
| `send-promo-notifications` | 2026-09-09T15:23:25.503Z (v407) | 1: `9dc35b667` `#501` | BEHAVIOUR CHANGE | Redeployed today, then `#501` landed. Reminder SMS/email start using Ontario “today”, and a last-day offer says “Ends today!” instead of dropping the countdown. |
| `send-sms` | 2026-08-25T02:10:56.986Z (v688) | 3: `89cfcdf49` `#464`, `7ffbd26c6` `#384`, `14f199b69` `#368` | BEHAVIOUR CHANGE (already flagged) | See the known `send-sms` note below. Awaiting the owner’s decision; do not treat this row as new analysis. |
| `submit-quote-lead` | 2026-09-08T23:07:19.708Z (v52) | 2: `bc0e825d8` `#498`, `68930d8d5` `#497` | SAFE | None visible. Quote emails still escape the same fields (`value` → `valueHtml` rename only). `#497` added `isServiceRoleBearer` on a helper this function does not call; its existing origin allowlist is unchanged. |
| `sync-dropbox-folder` | 2026-08-15T10:54:22.732Z (v442) | 1: `9c7b9c0ee` `#504` | SAFE | None visible. Admin Dropbox sync error strings only. |
| `sync-elevenlabs-static-kb` | 2026-08-26T13:06:56.915Z (v279) | 19: `9c7b9c0ee` `#504`, `9dc35b667` `#501`, `e2e3de217` `#473`, `7ef6b4c26` `#472`, `a4c5cb86b` `#465`, `3256d4ba4`, `1c61670b3` `#460`, `b069e7d98`, `94be40747`, `38ae69309`, `732a5951b`, `a22e6ba16`, `613f3e61a`, `42e73f45f`, `dd05ab326` `#424`, `837516d65`, `eb2cb2c23` `#301`, `fc9b2a195` `#392`, `2a2e1ef24` `#387` | BEHAVIOUR CHANGE | Nothing speaks differently at the deploy instant. The next admin/cron knowledge-base sync uploads newer blog titles, Ontario promo dates, and “water test when seasonal conditions allow” wording into ElevenLabs. |
| `sync-inventory-api` | 2026-08-15T10:54:22.732Z (v636) | 1: `9c7b9c0ee` `#504` | SAFE | None visible. Admin inventory-sync 500-path only. |
| `voice-inventory-lookup` | 2026-08-15T10:54:22.732Z (v275) | 3: `9dc35b667` `#501`, `c344b81f1` `#478`, `1f98592be` `#379` | SAFE | None visible. The function only calls `isDefaultQuotedMotor` and `resolveCustomerSellingPrice`; those two helpers are unchanged since the Aug 15 baseline. It is stale because it imports a shared file other functions edited. |
| `voice-perplexity-lookup` | 2026-08-26T13:06:56.915Z (v262) | 18: `9dc35b667` `#501`, `e2e3de217` `#473`, `7ef6b4c26` `#472`, `a4c5cb86b` `#465`, `3256d4ba4`, `1c61670b3` `#460`, `b069e7d98`, `94be40747`, `38ae69309`, `732a5951b`, `a22e6ba16`, `613f3e61a`, `42e73f45f`, `dd05ab326` `#424`, `837516d65`, `eb2cb2c23` `#301`, `fc9b2a195` `#392`, `2a2e1ef24` `#387` | BEHAVIOUR CHANGE | Live blog/fact answers start using the newer article list, Ontario promo window, and seasonal water-test wording. |

### `#482` voice/chat lane, individually

| Slug | Still stale? | Bucket here |
| --- | --- | --- |
| `ai-chatbot` | yes | BEHAVIOUR CHANGE |
| `ai-chatbot-stream` | yes | BEHAVIOUR CHANGE |
| `realtime-session` | yes | BEHAVIOUR CHANGE |
| `voice-inventory-lookup` | yes | SAFE |
| `elevenlabs-conversation-token` | yes (only `#501` since today’s deploy) | BEHAVIOUR CHANGE |
| `elevenlabs-mcp-server` | yes (only `#501` since today’s deploy) | BEHAVIOUR CHANGE |
| `agent-mcp-server` | **no** — production v110 today | — |
| `public-quote-api` | **no** — production v106 today | — |

`realtime-sdp-exchange` **is** in the live registry (v377, 2026-08-15). `#482` asked to confirm that before pairing it with `#462`.

---

## Known `send-sms` note (already flagged — not re-derived)

Production build is `2026-08-25T02:10:56.986Z` (watch: v688), which predates `#368`’s safety commit (`14f199b69`, 2026-08-25T02:31:52Z) by about 21 minutes. Fresh watch agrees: 15 days / 3 commits behind.

Deploying it turns on rejecting public-token SMS, audit-message logging, fail-closed rate limits for token-bearing messages, the pending-outbox pre-insert, and `x-internal-secret`. That is a **BEHAVIOUR CHANGE** and is already awaiting the owner’s decision. `EDGE_INTERNAL_SECRET` exists in production (name confirmed). Do not deploy from this document.

---

## Deploy these first (SAFE)

Admin/internal typecheck-only functions first, then the two shared-import SAFEs. Order is “least customer-facing first”, not a dependency graph — none of these need a migration.

Do **not** run these as part of this PR. One function per command:

```sh
gh workflow run supabase-functions-deploy.yml --ref main -f function_name=dropbox-chooser-upload
gh workflow run supabase-functions-deploy.yml --ref main -f function_name=sync-dropbox-folder
gh workflow run supabase-functions-deploy.yml --ref main -f function_name=auto-image-enhancer
gh workflow run supabase-functions-deploy.yml --ref main -f function_name=optimize-motor-images
gh workflow run supabase-functions-deploy.yml --ref main -f function_name=migrate-motor-images
gh workflow run supabase-functions-deploy.yml --ref main -f function_name=motor-health-monitor
gh workflow run supabase-functions-deploy.yml --ref main -f function_name=sync-inventory-api
gh workflow run supabase-functions-deploy.yml --ref main -f function_name=cron-failure-notifications
gh workflow run supabase-functions-deploy.yml --ref main -f function_name=submit-quote-lead
gh workflow run supabase-functions-deploy.yml --ref main -f function_name=voice-inventory-lookup
```

`voice-inventory-lookup` is last among SAFE because it is the only customer-facing row in this list; the classification is “the helpers it actually calls did not change.” If that ever looks wrong in a follow-up read, stop and re-diff those two functions before touching it.

---

## Needs Jay (BEHAVIOUR CHANGE)

1. **`send-sms`** — already flagged. Owner decision. Do not deploy from this report.
2. **`send-promo-notifications`** — `#501` Ontario dates + “Ends today!”. Customer SMS/email copy.
3. **`elevenlabs-conversation-token`** — `#501` only, on top of today’s deploy. Voice prompt promo window.
4. **`elevenlabs-mcp-server`** — `#501` only, on top of today’s deploy. Promo/financing tools.
5. **`ai-chatbot` + `ai-chatbot-stream`** — together. Hard cutover of the public chat widget to `gpt-5.6-luna`. Prove that model on the production `OPENAI_API_KEY` first (`#482` Set 3). Undetermined here.
6. **`realtime-session` + `realtime-sdp-exchange`** — together, not in the same window as an ElevenLabs change (`#482` Set 4). Prove `gpt-realtime-2.1-mini` on the production key first. Undetermined here. The frontend on `main` is already GA.
7. **`voice-perplexity-lookup`** — blog/fact answers change without a model cutover.
8. **`sync-elevenlabs-static-kb`** — next KB sync changes what ElevenLabs can cite. Own file is `#504` types; the payload is the shared content.

Suggested pairing (from `#482`, still valid for the model cutovers): do not interleave Set 3 (site chat) with Set 4 (OpenAI Realtime), and do not interleave Set 4 with ElevenLabs.

---

## BLOCKED

**None found.**

| Slug | What would unblock |
| --- | --- |
| — | No drifted function is waiting on an unapplied in-scope migration. No drifted function is waiting on a production secret name that is absent. |

If a later check shows `gpt-5.6-luna` or `gpt-realtime-2.1-mini` missing on the production OpenAI project, treat those two cutovers as blocked *by model access*, not by this report’s BLOCKED definition.

---

## Gaps (undetermined on purpose)

- Whether `gpt-5.6-luna` and `gpt-realtime-2.1-mini` exist on the production OpenAI project. Not probed (would be a live API call against the production key).
- Exact deployed source bytes. Only Management API `updated_at` + git since that time.
- Whether `sync-elevenlabs-static-kb` is on a cron that will fire the same day it is deployed. `config.toml` notes `requireAdmin()` plus an `x-internal-secret` pg_cron path; the live cron schedule was not read back.
- GitHub Actions drift-watch will keep skipping until `SUPABASE_PROJECT_REF` is a repository secret. That is an ops gap, not function drift.
