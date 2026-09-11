// @vitest-environment node
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import {
  PUBLIC_RELEASE_PAIRS,
  UNVERIFIED_PRODUCTION_ATTESTATION,
  acceptProductionAttestation,
} from '../../scripts/lib/public-function-release-guards.mjs';
import {
  CHAT_MODEL,
  PRODUCTION_PROJECT_REF,
  PRODUCTION_SECRET_NAME,
  REALTIME_MODEL,
  assertChatRequestContract,
  buildChatCompletionsRequest,
  buildReceipt,
  compareSecretToSha256,
  evaluateProvenance,
  formatProvenance,
  redactProbeSecrets,
  runPairAttestationProbes,
  validateChatCompletion,
  validateClientSecretMint,
  validateSdpAnswer,
} from '../../scripts/lib/public-function-pair-attestation.mjs';

const FAKE_KEY = 'test-only-openai-key';
const FAKE_DIGEST = createHash('sha256').update(FAKE_KEY, 'utf8').digest('hex');
const FAKE_OFFER = 'fixture-offer-not-for-commit';
const FAKE_ANSWER = 'fixture-answer\nv=fixture\no=fixture\ns=fixture\nm=fixture';

type FakeWebrtcOverrides = {
  generated?: boolean;
  offer?: 'missing';
  peerAccepted?: boolean;
  close?: boolean;
  timeout?: boolean;
  hangClose?: boolean;
  throwOnClose?: boolean;
};

type ScenarioExtras = {
  fetch?: ReturnType<typeof fakeFetch>;
  webrtc?: ReturnType<typeof fakeWebrtc>;
  webrtcOverrides?: FakeWebrtcOverrides;
  provenanceMatch?: boolean;
  forceProvenance?: unknown;
  deadlineMs?: number;
  cleanupBudgetMs?: number;
  plaintextSecret?: string;
  edgeSha256Digest?: string;
  mode?: 'synthetic' | 'live';
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
      if (overrides.throwOnClose) throw new Error('close failed');
      if (overrides.hangClose) return new Promise(() => {});
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
    if (scenario === 'throw-a2' && String(url).includes('/v1/chat/completions')) {
      throw new Error('chat exploded');
    }
    if (scenario === 'hang-a2' && String(url).includes('/v1/chat/completions')) {
      return new Promise(() => {});
    }
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
      if (scenario === 'prefix-model') {
        return { status: 200, json: { model: `${CHAT_MODEL}-preview`, choices: [{ message: { content: 'pong' } }] } };
      }
      if (scenario === 'missing-output') {
        return { status: 200, json: { model: CHAT_MODEL, choices: [{ message: { content: '' } }] } };
      }
      if (scenario === 'sentence-pong') {
        return { status: 200, json: { model: CHAT_MODEL, choices: [{ message: { content: 'the word is pong today' } }] } };
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
    deadlineMs: extras.deadlineMs,
    cleanupBudgetMs: extras.cleanupBudgetMs,
    plaintextSecret: extras.plaintextSecret,
    edgeSha256Digest: extras.edgeSha256Digest,
    mode: extras.mode,
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

  it('requires exact model identity and exact pong output', () => {
    expect(validateChatCompletion({
      status: 200,
      json: { model: CHAT_MODEL, choices: [{ message: { content: 'pong' } }] },
    }).ok).toBe(true);
    expect(validateChatCompletion({
      status: 200,
      json: { model: `${CHAT_MODEL}-preview`, choices: [{ message: { content: 'pong' } }] },
    }).ok).toBe(false);
    expect(validateChatCompletion({
      status: 200,
      json: { model: CHAT_MODEL, choices: [{ message: { content: 'the word is pong today' } }] },
    }).ok).toBe(false);
    expect(validateChatCompletion({
      status: 200,
      json: { model: CHAT_MODEL, choices: [{ message: { content: '' } }] },
    }).ok).toBe(false);
  });
});

describe('pair attestation provenance', () => {
  it('compares a nonempty secret to a validated SHA-256 digest without exposing either', () => {
    expect(compareSecretToSha256(FAKE_KEY, FAKE_DIGEST)).toBe(true);
    expect(compareSecretToSha256('', '')).toBe(false);
    expect(compareSecretToSha256(FAKE_KEY, '')).toBe(false);
    expect(compareSecretToSha256('', FAKE_DIGEST)).toBe(false);
    expect(compareSecretToSha256(FAKE_KEY, 'not-a-digest')).toBe(false);
    expect(compareSecretToSha256(FAKE_KEY, FAKE_DIGEST.toUpperCase())).toBe(false);
    const provenance = evaluateProvenance({
      project: PRODUCTION_PROJECT_REF,
      secretName: PRODUCTION_SECRET_NAME,
      match: true,
      comparedAt: '2026-09-11T21:00:00Z',
    });
    expect(provenance).toEqual({ ok: true, code: 'MATCH' });
    expect(evaluateProvenance(formatProvenance({
      match: true,
      comparedAt: '2026-09-11T21:00:00Z',
    }))).toEqual({ ok: false, code: 'FIELDS_REQUIRED' });
    expect(evaluateProvenance({
      project: 'other-project',
      secretName: PRODUCTION_SECRET_NAME,
      match: true,
      comparedAt: '2026-09-11T21:00:00Z',
    }).code).toBe('PROJECT');
    expect(evaluateProvenance('local .env key labeled production')).toEqual({
      ok: false,
      code: 'LOCAL_PROVENANCE',
    });
    expect(redactProbeSecrets(`sha256:${FAKE_DIGEST}`, [FAKE_KEY])).toContain('[redacted]');
  });
});

describe('pair attestation realtime validation', () => {
  it('rejects token-only success and v=-only answers', () => {
    expect(validateClientSecretMint({ status: 200, json: { name: 'ek_name' } }).ok).toBe(true);
    expect(validateSdpAnswer(FAKE_OFFER, 'v=fixture', { peerAccepted: true, webrtcGenerated: true }).ok).toBe(false);
    expect(validateSdpAnswer(FAKE_OFFER, FAKE_ANSWER, { peerAccepted: true, webrtcGenerated: true, status: 200 }).ok).toBe(true);
    expect(validateSdpAnswer(FAKE_OFFER, FAKE_ANSWER, { peerAccepted: true, webrtcGenerated: false }).ok).toBe(false);
  });
});

describe('pair attestation offline scenarios', () => {
  it('does not attest site-chat from A1 discovery or wrong provenance', async () => {
    const wrong = await runScenario('wrong-provenance');
    expect(wrong.siteChatAttestable).toBe(false);
    expect(wrong.productionAttestable).toBe(false);
    expect(wrong.receipt.siteChat.a1.discoveryOnly).toBe(true);
    expect(acceptProductionAttestation(PUBLIC_RELEASE_PAIRS[0], UNVERIFIED_PRODUCTION_ATTESTATION).ok).toBe(false);
  });

  it('rejects wrong, prefixed, and sentence-mentioned chat output', async () => {
    const model = await runScenario('wrong-model', { provenanceMatch: true });
    expect(model.receipt.siteChat.a2.modelOk).toBe(false);
    expect(model.siteChatAttestable).toBe(false);
    const prefix = await runScenario('prefix-model', { provenanceMatch: true });
    expect(prefix.receipt.siteChat.a2.modelOk).toBe(false);
    const output = await runScenario('missing-output', { provenanceMatch: true });
    expect(output.receipt.siteChat.a2.outputOk).toBe(false);
    const sentence = await runScenario('sentence-pong', { provenanceMatch: true });
    expect(sentence.receipt.siteChat.a2.outputOk).toBe(false);
    expect(sentence.siteChatAttestable).toBe(false);
  });

  it('rejects token-only Realtime success and malformed SDP', async () => {
    const tokenOnly = await runScenario('token-only', { provenanceMatch: true });
    expect(tokenOnly.receipt.realtime.b2.namePresent).toBe(true);
    expect(tokenOnly.receipt.realtime.b2.mintOk).toBe(true);
    expect(tokenOnly.realtimeAttestable).toBe(false);
    const malformed = await runScenario('malformed-sdp', { provenanceMatch: true });
    expect(malformed.receipt.realtime.b3.hasO).toBe(false);
    expect(malformed.receipt.realtime.b3.webrtcGenerated).toBe(true);
    expect(malformed.realtimeAttestable).toBe(false);
  });

  it('rejects timeout and cleanup failures using the session clock', async () => {
    const timeout = await runScenario('ok', {
      provenanceMatch: true,
      webrtcOverrides: { timeout: true },
    });
    expect(timeout.receipt.realtime.b4.closed).toBe(false);
    expect(timeout.receipt.realtime.b4.withinBound).toBe(false);
    expect(timeout.realtimeAttestable).toBe(false);
    const leftover = await runScenario('ok', {
      provenanceMatch: true,
      webrtcOverrides: { close: false },
    });
    expect(leftover.receipt.realtime.b4.closed).toBe(false);
    expect(leftover.receipt.realtime.b4.cleanupAttempted).toBe(true);
  });

  it('still closes after thrown probe errors and hung operations', async () => {
    let closedAfterThrow = false;
    const thrown = await runPairAttestationProbes({
      deadlineMs: 80,
      cleanupBudgetMs: 40,
      fetch: fakeFetch('throw-a2'),
      webrtc: {
        generated: true,
        createOffer: async () => FAKE_OFFER,
        acceptAnswer: async () => true,
        close: async () => {
          closedAfterThrow = true;
          return true;
        },
      },
      provenanceMatch: true,
      secretsToRedact: [FAKE_KEY, FAKE_DIGEST, FAKE_OFFER, FAKE_ANSWER],
    });
    expect(closedAfterThrow).toBe(true);
    expect(thrown.receipt.realtime.b4.cleanupAttempted).toBe(true);
    expect(thrown.productionAttestable).toBe(false);

    let closedAfterHang = false;
    const hung = await runPairAttestationProbes({
      deadlineMs: 40,
      cleanupBudgetMs: 40,
      fetch: fakeFetch('hang-a2'),
      webrtc: {
        generated: true,
        createOffer: async () => FAKE_OFFER,
        acceptAnswer: async () => true,
        close: async () => {
          closedAfterHang = true;
          return true;
        },
      },
      provenanceMatch: true,
      secretsToRedact: [FAKE_KEY, FAKE_DIGEST, FAKE_OFFER, FAKE_ANSWER],
    });
    expect(closedAfterHang).toBe(true);
    expect(hung.receipt.realtime.b4.cleanupAttempted).toBe(true);
    expect(hung.siteChatAttestable).toBe(false);

    const hungClose = await runScenario('ok', {
      provenanceMatch: true,
      deadlineMs: 40,
      cleanupBudgetMs: 40,
      webrtcOverrides: { hangClose: true },
    });
    expect(hungClose.receipt.realtime.b4.closed).toBe(false);
    expect(hungClose.receipt.realtime.b4.cleanupAttempted).toBe(true);
    expect(hungClose.realtimeAttestable).toBe(false);
  });

  it('labels synthetic receipts and never returns production-attestable=true', async () => {
    const passing = await runScenario('ok', { provenanceMatch: true });
    expect(passing.receipt.mode).toBe('synthetic');
    expect(passing.receipt.synthetic).toBe(true);
    expect(passing.receipt.layer).toBe('pre-deploy-provider');
    expect(passing.receipt.edgeRelay.accepted).toBe(false);
    expect(passing.receipt.attestationWritten).toBe(false);
    expect(passing.receipt.productionAttestable).toBe(false);
    expect(passing.productionAttestable).toBe(false);
    expect(passing.siteChatAttestable).toBe(true);
    expect(passing.realtimeAttestable).toBe(true);
    expect(passing.receipt.realtime.b2.mintOk).toBe(true);
    expect(passing.receipt.realtime.b3.webrtcGenerated).toBe(true);
    expect(passing.receipt.realtime.b4.withinBound).toBe(true);
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
    expect(receipt.mode).toBe('synthetic');
    expect(receipt.productionAttestable).toBe(false);
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
