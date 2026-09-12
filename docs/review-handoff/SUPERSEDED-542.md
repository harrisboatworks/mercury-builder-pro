# #542 SHA superseded — do not rebuild the combo

The four-PR disposable combo (`tmp/integration-four-prs-local` / `d4e0956e6150b484473480408b354544ed8f02ce`) still parents #542 at `9f7544ef063244d20b57c59c5c82986f89c128ab`. **Do not rebuild that tree for this note.**

## Superseded

`9f7544ef063244d20b57c59c5c82986f89c128ab` fail-opened leftover cleanup. `hasLiveResources() === true` treated `undefined`, `null`, an unknown string, and `Promise.resolve(true)` as no leftovers. With otherwise successful synthetic adapters and `mode: 'live'`, each returned `productionAttestable=true`. Independently reproduced by Codex against that exact GitHub source; no network/provider calls.

## Current #542 head

`a164eeae82b17da8754ca924bcff22d18a54d8db` on `cursor/pair-attestation-probes-3e2c`.

`28ced613c4be3da8ae2d80085b5226e308fa519d` is leftover-only and **not** the replay SHA. That commit failed hosted Frontend typecheck (TS2322: leftover readback widened to `unknown`). Codex independently verified `a164eeae` CI green, including Frontend typecheck.

Proven cleanup now requires an explicit synchronous `false` readback. Every other value, a missing method, or an exception leaves cleanup unproven. Last-close failure coverage is unchanged. Guards stay `UNVERIFIED`.

Replay the leftover fix without remaking the four-PR merge:

```bash
git fetch origin cursor/pair-attestation-probes-3e2c
git switch --detach a164eeae82b17da8754ca924bcff22d18a54d8db
npx vitest run src/test/publicFunctionPairAttestation.test.ts
```
