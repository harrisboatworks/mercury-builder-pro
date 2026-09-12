# Integration compatibility matrix — #528 × #371 × #332 × #542 vs `main`

Reviewed 2026-09-12 against freshly fetched `origin/main`. Local combination only. No remote merge of the four PRs, no deploy, no production data, no live provider calls.

Diagnostic publication (this branch) contains the local combination plus this handoff tree. It is not an integration PR.

## #89 preserve (do not repeat)

See `issue89/`. Viewport geometry and `scrollIntoView` were mocked in the jsdom destination tests (`innerWidth`/`innerHeight` + `getBoundingClientRect`; `scrollIntoView` only set `data-scrolled-into-view`). A jsdom test or generated HTML screenshot cannot establish real browser layout. Verdict: no demonstrated CTA/destination defect; no #89 PR.

## Locked SHAs

| Ref | SHA | GitHub assignees | Current owner / hold |
| --- | --- | --- | --- |
| `origin/main` | `609c63f026f355200a64a9c88093aac4bdbf3942` | — | Authoritative. Tip is #546 blog dateModified. |
| Merge-base of all four vs `origin/main` | `431c63471b84230208c03837226f40ec82f0058a` | — | Four PRs are 3 commits behind (`#543`, `#545`, `#546`; blog only). |
| #528 | `cebec56ad573fedd6f1dc00efaf35add77602f97` | none | Cursor-authored; Codex/owner: Vault name `EDGE_INTERNAL_SECRET`, provision, parity, authorize `20260910140000`. Manifest `unresolved`. Ready for review, not merge. |
| #371 | `896d74198a961d4d2c4710625929c7e50f67b8fe` | none | Cursor-authored; owner must create a new data-less isolated staging project (do not reuse `eutsoqdpjurknjsshxes`). Draft. |
| #332 | `38e49fb0cb2be2427d8171b602f9541f92db7aee` | none | Cursor-authored; owner sets `TWILIO_WEBHOOK_URL` and paired-deploys `send-sms` + `notification-webhook`. Tracking SQL already on main/prod as ledger `20260910005522` / `add_twilio_sms_status_tracking` — never reapply. Draft. |
| #542 | `9f7544ef063244d20b57c59c5c82986f89c128ab` | none | Cursor lane; Codex live probes in a credential-owning env. Guards stay `UNVERIFIED`. Draft. |
| #544 excluded | `6235d9935e147791c5477eae8fe074a7e44fe31c` | none | Codex docs-only serialize-edge-drift. Not combined. |

## Shared PostgreSQL 17

`scripts/lib/local-postgres17.mjs` is byte-identical on #528, #371, and the combo (`sha256 3954df7781e9a944aa0b4cdeb1d9073b91bf4a26282af521b2df457582d2b17c`). Accepts a bindir only when `initdb`, `pg_ctl`, and `psql` all report major 17. Review environment: official PGDG 17.11 at `/usr/lib/postgresql/17/bin`.

## Migration ordering

| File | Source | On `main`? | Action |
| --- | --- | --- | --- |
| `20260823120000_deposit_deal_packet.sql` | #371 | no | New. Apply only after owner staging + release order. |
| `20260830230000_add_twilio_sms_status_tracking.sql` | #332 | yes (ledger `20260910005522`) | Do not reapply. |
| `20260910140000_rewrite_promo_lightspeed_cron_internal_secret.sql` | #528 | no | Authored only. Manifest unresolved. Do not apply. |

No 14-digit version collisions among 427 combo migrations.

## Deploy guards (no slug overlap)

| Gate | Slugs | Combo behavior |
| --- | --- | --- |
| Cron-auth prerequisite | `check-expiring-promotions`, `sync-lightspeed-inventory` | Unresolved → `explicitDeployBlock`. Job never applies SQL. |
| Twilio secret-name preflight | `send-sms`, `notification-webhook` | Fail-closed if name list unreadable or `TWILIO_WEBHOOK_URL` absent. Names only. |
| Pair attestation | site-chat pair; openai-realtime pair | Committed `UNVERIFIED` hold. A local key is not production proof. |

## Webhook authentication and probe cleanup

Combo still fail-closes `notification-webhook` without `TWILIO_AUTH_TOKEN` or `TWILIO_WEBHOOK_URL`, verifies HMAC before creating a client or writing `sms_logs`, and signs the configured public URL. Pair leftover uses only the last `close()`; missing `hasLiveResources()` is leftover; function presence is not AbortSignal proof.

## Synthetic local checks vs observed hosted CI

**This reviewer’s local claims** (combo `d4e0956e6`, official PG 17.11, no live providers): see `SYNTHETIC-TEST-INSTRUCTIONS.md`. 176 + 28 + 193 + 114 passed. Pair-probe CLI exit 1 without an injected adapter is pre-existing on #542 alone.

**Observed GitHub checks on the four PR tips** (workflow conclusions; not this reviewer’s machine): current heads were green for `test` and typechecks when read on 2026-09-12. `production-quote`, `production-parity`, and financing were skipped. That is hosted workflow policy, not local proof of those probes.

## Pre-existing vs integration

| Observation | Class |
| --- | --- |
| Pair-probe CLI exits 1 without an injected adapter | Pre-existing #542 |
| Cron manifest `unresolved`; Vault unprovisioned | Pre-existing #528 |
| Production `TWILIO_WEBHOOK_URL` absent; token present | Pre-existing #332 (owner metadata, not a local secret read) |
| Isolated staging project not approved | Pre-existing #371 |
| Pair guards `UNVERIFIED` | Pre-existing #542 / main |
| Stale SHAs in some PR bodies | Documentation drift |
| Failed Actions on superseded heads | Historical; not current tips |
| Shared-file semantic conflict, dropped tests, migration collision, guard override | **None found** |

## Remaining release gates (not integration defects)

1. **#528** — accept Vault name, prove execution-role read, snapshot callers, separately authorize `20260910140000`, then resolve the manifest.
2. **#371** — new isolated staging project; migration → Edge → frontend order; no real Stripe/email/SMS.
3. **#332** — set canonical `TWILIO_WEBHOOK_URL`; paired deploy; do not reapply tracking SQL.
4. **#542** — Codex live probes in a credential-owning env; do not mark `ATTESTED` from synthetics.
5. **Pairs on main** — site-chat and openai-realtime stay UNVERIFIED-held.

## Verdict

**No proven unowned integration defect.** No product patch. Owner branches were not modified. No integration PR.
