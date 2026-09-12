# Exact parent SHAs

Recorded 2026-09-12 from GitHub `pull_request_read` plus local `git rev-parse` / `git log -1 --format=%H%n%P` on `/tmp/hbw-worktrees/integration`.

## Tips

| Ref | Full SHA |
| --- | --- |
| `origin/main` | `609c63f026f355200a64a9c88093aac4bdbf3942` |
| Four-PR merge-base vs `origin/main` | `431c63471b84230208c03837226f40ec82f0058a` |
| #528 `codex/cursor-cron-auth-20260910` | `cebec56ad573fedd6f1dc00efaf35add77602f97` |
| #371 `cursor/deposit-deal-packet-20260823` | `896d74198a961d4d2c4710625929c7e50f67b8fe` |
| #332 `cursor/twilio-webhook-signature-1b4b` | `38e49fb0cb2be2427d8171b602f9541f92db7aee` |
| #542 `cursor/pair-attestation-probes-3e2c` | `a164eeae82b17da8754ca924bcff22d18a54d8db` (supersedes leftover-only `28ced613c` and `9f7544ef063244d20b57c59c5c82986f89c128ab`; see `SUPERSEDED-542.md`) |
| #544 excluded `codex/serialize-edge-drift-deployment-handoff` | `6235d9935e147791c5477eae8fe074a7e44fe31c` |
| Combo-only `tmp/integration-four-prs-local` | `d4e0956e6150b484473480408b354544ed8f02ce` |

GitHub PR bodies still cite older heads (`bc9652d65`, `7a86e715`, `c5b1e39e`). Those strings are stale. Use the SHAs above.

No GitHub assignees on any of the four. Owners are from comments/runbooks, not the assignee field.

## Local merge commits (first parent = combo, second = PR tip)

| Merge | Commit | Parent 1 (ours) | Parent 2 (theirs) | Manual resolutions |
| --- | --- | --- | --- | --- |
| #542 onto `main` | `87a5f2861ec271655580e4f81988f26b8be8c672` | `609c63f026f355200a64a9c88093aac4bdbf3942` | `9f7544ef063244d20b57c59c5c82986f89c128ab` | none |
| #332 onto combo | `782fb2648310bba7105ac9f623f19a2c4b3e92e1` | `87a5f2861ec271655580e4f81988f26b8be8c672` | `38e49fb0cb2be2427d8171b602f9541f92db7aee` | none |
| #528 onto combo | `bad483a87124d077bdab0a6b01e58ba035dd2406` | `782fb2648310bba7105ac9f623f19a2c4b3e92e1` | `cebec56ad573fedd6f1dc00efaf35add77602f97` | `package.json`, `src/test/supabaseFunctionsDeploy.test.ts` |
| #371 onto combo | `d4e0956e6150b484473480408b354544ed8f02ce` | `bad483a87124d077bdab0a6b01e58ba035dd2406` | `896d74198a961d4d2c4710625929c7e50f67b8fe` | `package.json` |

`scripts/deploy-supabase-functions.mjs` was “changed in both” at the #528 merge and auto-merged. No conflict markers remain.

## GitHub `base.sha` vs current `main`

| PR | GitHub `base.sha` at read time | Meaning |
| --- | --- | --- |
| #528, #371, #332 | `431c63471b84230208c03837226f40ec82f0058a` | PR merge-base / last compare, not current tip |
| #542 | `397654fe566cb207d75be5b619371bc0c8e9531e` | Older `main` snapshot on that PR object |

Current `origin/main` tip is `609c63f02` (#546). The four PRs are three blog commits behind (`#543`, `#545`, `#546`).
