// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import {
  PUBLIC_RELEASE_PAIRS,
  UNVERIFIED_PRODUCTION_ATTESTATION,
  acceptProductionAttestation,
} from '../../scripts/lib/public-function-release-guards.mjs';
import {
  CHAT_MODEL,
  REALTIME_MODEL,
  assertChatRequestContract,
  buildChatCompletionsRequest,
  buildReceipt,
  compareSecretDigests,
  evaluateProvenance,
  formatProvenance,
  redactProbeSecrets,
  runPairAttestationProbes,
  validateChatCompletion,
  validateClientSecretMint,
  validateSdpAnswer,
} from '../../scripts/lib/public-function-pair-attestation.mjs';

const FAKE_KEY = 'test-only-openai-key';
const FAKE_DIGEST = 'a'.repeat(64);
const FAKE_OFFER = 'fixture-offer-not-for-commit';
const FAKE_ANSWER = 'fixture-answer\nv=fixture\no=fixture\ns=fixture\nm=fixture';

type FakeWebrtcOverrides = {
  generated?: boolean;
  offer?: 'missing';
  peerAccepted?: boolean;
  close?: boolean;
  timeout?: boolean;
};

type ScenarioExtras = {
  fetch?: ReturnType<typeof fakeFetch>;
  webrtc?: ReturnType<typeof fakeWebrtc>;
  webrtcOverrides?: FakeWebrtcOverrides;
  provenanceMatch?: boolean;
  forceProvenance?: unknown;
};

function fakeWebrtc(overrides: FakeWebrtcOverrides = {}) {
  return {
    generated: overrides.generated !== false,
    async createOffer() {
      if (overrides.offer === 'missing') return '';
      return FAKE_OFFER;
    },
    async acceptAnswer() {
      return overrides.peerAccepted !== false;
    },
    async close() {
      if (overrides.close === false) return false;
      if (overrides.timeout) {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return false;
      }
      return true;
    },
  };
}

function fakeFetch(scenario) {
  return async (url, options = {}) => {
    if (scenario === 'network-forbidden') throw new Error('NETWORK_WAS_CALLED');
    if (String(url).includes('/v1/models/gpt-5.6-luna')) {
      return { status: 200, json: { id: CHAT_MODEL } };
    }
    if (String(url).includes('/v1/models/gpt-realtime-2.1-mini')) {
      return { status: 200, json: { id: REALTIME_MODEL } };
    }
    if (String(url).includes('/v1/chat/completions')) {
      if (scenario === 'wrong-model') {
        return { status: 200, json: { model: 'gpt-4o-mini', choices: [{ message: { content: 'pong' } }] } };
      }
      if (scenario === 'missing-output') {
        return { status: 200, json: { model: CHAT_MODEL, choices: [{ message: { content: '' } }] } };
      }
      return { status: 200, json: { model: CHAT_MODEL, choices: [{ message: { content: 'pong' } }] } };
    }
    if (String(url).includes('/v1/realtime/client_secrets')) {
      return { status: 200, json: { name: 'ek_name_only' } };
    }
    if (String(url).includes('/v1/realtime/calls')) {
      if (scenario === 'token-only') return { status: 0, text: '' };
      if (scenario === 'malformed-sdp') return { status: 200, text: 'not-an-answer' };
      return { status: 200, text: FAKE_ANSWER };
    }
    throw new Error(`unexpected url ${url} ${JSON.stringify(options)}`);
  };
}

async function runScenario(scenario: string, extras: ScenarioExtras = {}) {
  return runPairAttestationProbes({
    fetch: extras.fetch || fakeFetch(scenario),
    webrtc: extras.webrtc || (scenario === 'token-only' ? fakeWebrtc({ generated: false }) : fakeWebrtc(extras.webrtcOverrides)),
    provenanceMatch: extras.provenanceMatch !== false && scenario !== 'wrong-provenance',
    forceProvenance: extras.forceProvenance,
    secretsToRedact: [FAKE_KEY, FAKE_DIGEST, FAKE_OFFER, FAKE_ANSWER],
  });
}

describe('pair attestation source contract', () => {
  it('builds the ai-chatbot chat/completions body and rejects forbidden 5.6+ fields', () => {
    const request = buildChatCompletionsRequest();
    expect(request.url).toBe('https://api.openai.com/v1/chat/completions');
    expect(assertChatRequestContract(request.body).ok).toBe(true);
    expect(assertChatRequestContract({ ...request.body, temperature: 1 }).ok).toBe(false);
  });

  it('requires model identity and actual pong output', () => {
    expect(validateChatCompletion({
      status: 200,
      json: { model: CHAT_MODEL, choices: [{ message: { content: 'pong' } }] },
    }).ok).toBe(true);
    expect(validateChatCompletion({
      status: 200,
      json: { model: 'gpt-4o-mini', choices: [{ message: { content: 'pong' } }] },
    }).ok).toBe(false);
    expect(validateChatCompletion({
      status: 200,
      json: { model: CHAT_MODEL, choices: [{ message: { content: '' } }] },
    }).ok).toBe(false);
  });
});

describe('pair attestation provenance', () => {
  it('records a digest match without exposing values or hashes', () => {
    expect(compareSecretDigests('same', 'same')).toBe(true);
    expect(compareSecretDigests('same', 'other')).toBe(false);
    const provenance = formatProvenance({
      match: true,
      comparedAt: '2026-09-11T21:00:00Z',
    });
    expect(evaluateProvenance(provenance).ok).toBe(true);
    expect(provenance).not.toContain(FAKE_KEY);
    expect(redactProbeSecrets(`sha256:${FAKE_DIGEST}`, [FAKE_KEY])).toContain('[redacted]');
    expect(evaluateProvenance('local .env key labeled production')).toEqual({
      ok: false,
      code: 'LOCAL_PROVENANCE',
    });
  });
});

describe('pair attestation realtime validation', () => {
  it('rejects token-only success and v=-only answers', () => {
    expect(validateClientSecretMint({ status: 200, json: { name: 'ek_name' } }).ok).toBe(true);
    expect(validateSdpAnswer(FAKE_OFFER, 'v=fixture', { peerAccepted: true, webrtcGenerated: true }).ok).toBe(false);
    expect(validateSdpAnswer(FAKE_OFFER, FAKE_ANSWER, { peerAccepted: true, webrtcGenerated: true }).ok).toBe(true);
    expect(validateSdpAnswer(FAKE_OFFER, FAKE_ANSWER, { peerAccepted: true, webrtcGenerated: false }).ok).toBe(false);
  });
});

describe('pair attestation offline scenarios', () => {
  it('does not attest site-chat from A1 discovery or wrong provenance', async () => {
    const wrong = await runScenario('wrong-provenance');
    expect(wrong.siteChatAttestable).toBe(false);
    expect(wrong.receipt.siteChat.a1.discoveryOnly).toBe(true);
    expect(acceptProductionAttestation(PUBLIC_RELEASE_PAIRS[0], UNVERIFIED_PRODUCTION_ATTESTATION).ok).toBe(false);
  });

  it('rejects wrong model and missing chat output', async () => {
    const model = await runScenario('wrong-model', { provenanceMatch: true });
    expect(model.receipt.siteChat.a2.modelOk).toBe(false);
    expect(model.siteChatAttestable).toBe(false);
    const output = await runScenario('missing-output', { provenanceMatch: true });
    expect(output.receipt.siteChat.a2.outputOk).toBe(false);
    expect(output.siteChatAttestable).toBe(false);
  });

  it('rejects token-only Realtime success and malformed SDP', async () => {
    const tokenOnly = await runScenario('token-only', { provenanceMatch: true });
    expect(tokenOnly.receipt.realtime.b2.namePresent).toBe(true);
    expect(tokenOnly.realtimeAttestable).toBe(false);
    const malformed = await runScenario('malformed-sdp', { provenanceMatch: true });
    expect(malformed.receipt.realtime.b3.hasO).toBe(false);
    expect(malformed.realtimeAttestable).toBe(false);
  });

  it('rejects timeout and cleanup failures', async () => {
    const timeout = await runScenario('ok', {
      provenanceMatch: true,
      webrtcOverrides: { timeout: true },
    });
    expect(timeout.receipt.realtime.b4.closed).toBe(false);
    expect(timeout.realtimeAttestable).toBe(false);
    const leftover = await runScenario('ok', {
      provenanceMatch: true,
      webrtcOverrides: { close: false },
    });
    expect(leftover.receipt.realtime.b4.closed).toBe(false);
  });

  it('emits a redacted provider receipt that never writes ATTESTED or Edge-relay acceptance', async () => {
    const passing = await runScenario('ok', { provenanceMatch: true });
    expect(passing.receipt.layer).toBe('pre-deploy-provider');
    expect(passing.receipt.edgeRelay.accepted).toBe(false);
    expect(passing.receipt.attestationWritten).toBe(false);
    expect(passing.siteChatAttestable).toBe(true);
    expect(passing.realtimeAttestable).toBe(true);
    const dumped = JSON.stringify(passing.receipt);
    expect(dumped).not.toContain(FAKE_KEY);
    expect(dumped).not.toContain(FAKE_DIGEST);
    expect(dumped).not.toContain(FAKE_OFFER);
    expect(dumped).not.toContain('v=fixture');
    expect(acceptProductionAttestation(PUBLIC_RELEASE_PAIRS[0], {
      status: 'ATTESTED',
      productionKeyProvenance: 'local laptop key',
      attestedModels: [CHAT_MODEL],
      attestedKeys: ['OPENAI_API_KEY'],
    }).code).toBe('LOCAL_PROVENANCE');
    expect(PUBLIC_RELEASE_PAIRS.every((pair) => pair.attestation.status === 'UNVERIFIED')).toBe(true);
  });

  it('keeps committed guards UNVERIFIED even when a synthetic receipt is complete', () => {
    const receipt = buildReceipt({
      ok: true,
      localKeyNotUsed: true,
      provenance: { match: true, comparedAt: '2026-09-11T21:00:00Z' },
      siteChat: { a2: { status: 200, modelOk: true, outputOk: true } },
    });
    expect(receipt.attestationWritten).toBe(false);
    expect(UNVERIFIED_PRODUCTION_ATTESTATION.status).toBe('UNVERIFIED');
  });
});

describe('pair attestation CLI', () => {
  it('refuses live provider calls without leaking fixture secrets', () => {
    const live = spawnSync(process.execPath, ['scripts/public-function-pair-attestation-probe.mjs'], {
      cwd: process.cwd(),
      env: {
        PATH: process.env.PATH,
        PAIR_ATTESTATION_LIVE: '1',
        OPENAI_API_KEY: FAKE_KEY,
      },
      encoding: 'utf8',
      timeout: 10_000,
    });
    expect(live.status).toBe(1);
    expect(live.stdout + live.stderr).toContain('Live provider calls are disabled');
    expect(live.stdout + live.stderr).not.toContain(FAKE_KEY);

    const offline = spawnSync(process.execPath, ['scripts/public-function-pair-attestation-probe.mjs'], {
      cwd: process.cwd(),
      env: { PATH: process.env.PATH, OPENAI_API_KEY: FAKE_KEY },
      encoding: 'utf8',
      timeout: 10_000,
    });
    expect(offline.status).toBe(1);
    expect(offline.stdout + offline.stderr).toContain('No injected fetch adapter');
    expect(offline.stdout + offline.stderr).not.toContain(FAKE_KEY);
  });
});
