# Four-PR integration diagnostic handoff

Diagnostic branch: `cursor/four-pr-integration-diagnostic-3e2c`  
Purpose: let Codex independently reproduce the 2026-09-12 local combination of #528, #371, #332, and #542 onto freshly fetched `main`.

This branch is **not** a product change and **not** an integration PR. Do not merge it. Do not update #528, #371, #332, #542, or #544 from it. Do not deploy.

The four-PR merge-only tree remains at `tmp/integration-four-prs-local` (`d4e0956e6150b484473480408b354544ed8f02ce`). This diagnostic branch is that commit plus this `docs/review-handoff/` tree.

## Contents

| Path | What it is |
| --- | --- |
| `PARENT-SHAS.md` | Exact parent SHAs for `main` and each merge |
| `INTEGRATION-MATRIX.md` | Compatibility matrix, commands, remaining gates |
| `SYNTHETIC-TEST-INSTRUCTIONS.md` | How to rerun the synthetic checks |
| `MANUAL-RESOLUTIONS.md` | What conflicted and how it was unioned |
| `resolutions/*.diff` | Ours/theirs → resolved diffs for each manual file |
| `pr-descriptions/` | Local replacement PR bodies. **Not posted.** |
| `issue89/` | Preserved #89 tests + mocked-layout limitation |

## Reproduce the combination

```bash
git fetch origin main \
  origin/codex/cursor-cron-auth-20260910 \
  origin/cursor/deposit-deal-packet-20260823 \
  origin/cursor/twilio-webhook-signature-1b4b \
  origin/cursor/pair-attestation-probes-3e2c
# Expected tips:
#   origin/main                                    609c63f026f355200a64a9c88093aac4bdbf3942
#   origin/codex/cursor-cron-auth-20260910         cebec56ad573fedd6f1dc00efaf35add77602f97
#   origin/cursor/deposit-deal-packet-20260823     896d74198a961d4d2c4710625929c7e50f67b8fe
#   origin/cursor/twilio-webhook-signature-1b4b    38e49fb0cb2be2427d8171b602f9541f92db7aee
#   origin/cursor/pair-attestation-probes-3e2c     9f7544ef063244d20b57c59c5c82986f89c128ab

git switch --detach origin/main
git switch -c tmp/repro-four-prs
git merge --no-ff origin/cursor/pair-attestation-probes-3e2c
git merge --no-ff origin/cursor/twilio-webhook-signature-1b4b
git merge --no-ff origin/codex/cursor-cron-auth-20260910
# Expect conflicts in package.json and src/test/supabaseFunctionsDeploy.test.ts.
# Apply the unions in MANUAL-RESOLUTIONS.md (keep all helper scripts; keep both
# Twilio preflight and cron-auth deploy test describes).
git merge --no-ff origin/cursor/deposit-deal-packet-20260823
# Expect package.json conflict. Keep pair-probe, cron-auth-pg, and deposit scripts.
```

Alternatively, inspect this published commit’s first parent chain:

```
d4e0956e6  merge #371    parents  bad483a87 + 896d74198
bad483a87  merge #528    parents  782fb2648 + cebec56ad
782fb2648  merge #332    parents  87a5f2861 + 38e49fb0c
87a5f2861  merge #542    parents  609c63f02 + 9f7544ef0
609c63f02  origin/main
```

`scripts/deploy-supabase-functions.mjs` changed on both #332 and #528 and **auto-merged**. Do not hand-edit it unless your replay fails to combine `withReleasePrerequisiteManifest` and `applyTwilioWebhookUrlPreflight`.

## Holds

No production data, credentials, live OpenAI/Twilio/Stripe/Vault calls, merge to `main`, or deploy. Pair-probe CLI without an injected adapter is expected to exit 1.

## #89

Preserved only. Viewport geometry and `scrollIntoView` were mocked. A jsdom test or generated HTML screenshot cannot establish real browser layout. See `issue89/LAYOUT-LIMITS.md`. Do not repeat that work here.
