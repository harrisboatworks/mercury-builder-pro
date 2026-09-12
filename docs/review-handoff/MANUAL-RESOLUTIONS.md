# Manual conflict resolutions

Only two files needed a human union. Both resolutions keep every incoming helper; they do not invent product behavior. Owner branches were not rewritten.

## 1. `package.json` at merge #528 (`bad483a87`)

- Ours: `782fb2648310bba7105ac9f623f19a2c4b3e92e1` (combo after #542+#332) had `check:pair-attestation-probe`.
- Theirs: `cebec56ad573fedd6f1dc00efaf35add77602f97` had `test:cron-auth-pg`.
- Resolved: both scripts.

Diffs:

- `resolutions/package.json.528.ours-to-resolved.diff`
- `resolutions/package.json.528.theirs-to-resolved.diff`

## 2. `src/test/supabaseFunctionsDeploy.test.ts` at merge #528 (`bad483a87`)

Git interleaved two independent suites.

- Ours (#332 on combo): `TWILIO_WEBHOOK_URL deploy preflight`, `beforeEach` stub of `SUPABASE_EDGE_SECRET_NAMES`, `listEdgeSecretNamesForProject` import, `listSecretNamesFromApi` adapters on `runDeploy` cases.
- Theirs (#528): `cron-auth deploy path mapping` and `resolved cron prerequisite identity`.
- Resolved: #332 imports + `beforeEach` + Twilio adapters on shared `runDeploy` cases + full Twilio preflight describe + full cron-auth describes.

Combo `it()` count is 77 (shared 63 + Twilio-only 9 + cron-only 5). #528 alone had 68; #332 alone had 72.

Diffs:

- `resolutions/supabaseFunctionsDeploy.test.ts.528.ours-to-resolved.diff`
- `resolutions/supabaseFunctionsDeploy.test.ts.528.theirs-to-resolved.diff`

## 3. `package.json` at merge #371 (`d4e0956e6`)

- Ours: `bad483a87` already had pair-probe + cron-auth-pg.
- Theirs: `896d74198` had `test:deposit-acceptance*`.
- Resolved: all three families.

Diffs:

- `resolutions/package.json.371.ours-to-resolved.diff`
- `resolutions/package.json.371.theirs-to-resolved.diff`

## Auto-merged (not hand-edited)

`scripts/deploy-supabase-functions.mjs` at #528: both `withReleasePrerequisiteManifest` and `applyTwilioWebhookUrlPreflight` are present. `scripts/lib/local-postgres17.mjs` is byte-identical on #528 and #371 (`sha256 3954df7781e9a944aa0b4cdeb1d9073b91bf4a26282af521b2df457582d2b17c`).
