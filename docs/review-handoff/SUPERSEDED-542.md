# #542 SHA superseded — do not rebuild the combo

The four-PR disposable combo (`tmp/integration-four-prs-local` / `d4e0956e6150b484473480408b354544ed8f02ce`) still parents #542 at `9f7544ef063244d20b57c59c5c82986f89c128ab`. **Do not rebuild that tree for this note.**

## Superseded

`9f7544ef063244d20b57c59c5c82986f89c128ab` fail-opened leftover cleanup. `hasLiveResources() === true` treated `undefined`, `null`, an unknown string, and `Promise.resolve(true)` as no leftovers. With otherwise successful synthetic adapters and `mode: 'live'`, each returned `productionAttestable=true`. Independently reproduced by Codex against that exact GitHub source; no network/provider calls.

## Current #542 head

`28ced613c4be3da8ae2d80085b5226e308fa519d` on `cursor/pair-attestation-probes-3e2c`.

Proven cleanup now requires an explicit synchronous `false` readback. Every other value, a missing method, or an exception leaves cleanup unproven. Last-close failure coverage is unchanged.

Focused local check on the isolated #542 checkout: `npx vitest run src/test/publicFunctionPairAttestation.test.ts` → 25/25. CLI still exits 1 without an injected fetch.

Replay the leftover fix without remaking the four-PR merge:

```bash
git fetch origin cursor/pair-attestation-probes-3e2c
git switch --detach 28ced613c4be3da8ae2d80085b5226e308fa519d
npx vitest run src/test/publicFunctionPairAttestation.test.ts
```
