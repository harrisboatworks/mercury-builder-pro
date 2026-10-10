#!/usr/bin/env node
/**
 * Codex-only CLI for #542 pair attestation.
 * Never opens OpenAI by default. Live mode is refused in this checkout.
 * Never writes PUBLIC_RELEASE_PAIRS attestation.
 */
import { runPairAttestationProbes } from './lib/public-function-pair-attestation.mjs';

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (process.env.PAIR_ATTESTATION_LIVE === '1') {
  fail('Live provider calls are disabled in this checkout. Codex must inject adapters in the credential-owning environment.');
}

if (typeof globalThis.pairAttestationFetch !== 'function') {
  fail('No injected fetch adapter. This CLI does not open OpenAI from Cursor or CI.');
}

const result = await runPairAttestationProbes({
  fetch: globalThis.pairAttestationFetch,
  webrtc: globalThis.pairAttestationWebRtc,
  provenanceMatch: false,
  mode: 'synthetic',
});
process.stdout.write(`${JSON.stringify(result.receipt)}\n`);
process.exit(result.receipt.ok ? 0 : 1);
