/**
 * Offline-testable pair-attestation probe helpers for #542.
 * Does not read 1Password, does not call OpenAI, and never writes ATTESTED.
 */
import { createHash, timingSafeEqual } from 'node:crypto';
import { acceptProductionAttestation, isLocalProductionKeyProvenance } from './public-function-release-guards.mjs';

export const CHAT_MODEL = 'gpt-5.6-luna';
export const CHAT_REASONING_EFFORT = 'none';
export const CHAT_MAX_COMPLETION_TOKENS = 250;
export const CHAT_COMPLETIONS_URL = 'https://api.openai.com/v1/chat/completions';
export const CHAT_DISCOVERY_URL = `https://api.openai.com/v1/models/${CHAT_MODEL}`;
export const REALTIME_MODEL = 'gpt-realtime-2.1-mini';
export const REALTIME_DISCOVERY_URL = `https://api.openai.com/v1/models/${REALTIME_MODEL}`;
export const REALTIME_CLIENT_SECRETS_URL = 'https://api.openai.com/v1/realtime/client_secrets';
export const REALTIME_CALLS_URL = 'https://api.openai.com/v1/realtime/calls';
export const PRODUCTION_PROJECT_REF = 'eutsoqdpjurknjsshxes';
export const PRODUCTION_SECRET_NAME = 'OPENAI_API_KEY';
export const SESSION_BOUND_MS = 30_000;
export const CLEANUP_BUDGET_MS = 2_000;
export const SHA256_HEX_RE = /^[a-f0-9]{64}$/;
export const FORBIDDEN_CHAT_FIELDS = Object.freeze([
  'max_tokens',
  'temperature',
  'top_p',
  'presence_penalty',
  'frequency_penalty',
]);

const SECRETISH = /(sk-|ek_|ephemeral|BEGIN|v=0|o=|a=fingerprint)/i;

export const ADAPTER_ABORT_CONTRACT =
  'fetch(url, { signal }) and webrtc.createOffer({ signal }) / acceptAnswer(answer, { signal }) must honor AbortSignal: abort in-flight work and do not create or retain a live peer or request after abort. Promise.race only ends the caller wait. Adapters that ignore the signal fail acceptance; close() being called is not cleanup proof.';

function deadlineError(label) {
  const error = new Error(`SESSION_DEADLINE:${label}`);
  error.code = 'SESSION_DEADLINE';
  return error;
}

function abortError() {
  const error = new Error('The operation was aborted');
  error.name = 'AbortError';
  error.code = 'ABORT_ERR';
  return error;
}

export function fetchSupportsAbort(fetchImpl) {
  return typeof fetchImpl === 'function';
}

export function webrtcSupportsAbort(webrtc) {
  if (!webrtc) return true;
  return typeof webrtc.createOffer === 'function' && typeof webrtc.acceptAnswer === 'function';
}

export function adaptersHonorAbortContract(adapters) {
  return fetchSupportsAbort(adapters?.fetch) && webrtcSupportsAbort(adapters?.webrtc);
}

export async function raceWithDeadline(work, ms, label, onTimeout) {
  const budget = Number(ms);
  if (!Number.isFinite(budget) || budget <= 0) {
    onTimeout?.();
    throw deadlineError(label);
  }
  let timer;
  try {
    return await Promise.race([
      work,
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          onTimeout?.();
          reject(deadlineError(label));
        }, budget);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export function buildChatCompletionsRequest() {
  return {
    url: CHAT_COMPLETIONS_URL,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      model: CHAT_MODEL,
      messages: [{ role: 'user', content: 'Reply with the single word pong.' }],
      max_completion_tokens: CHAT_MAX_COMPLETION_TOKENS,
      reasoning_effort: CHAT_REASONING_EFFORT,
    },
  };
}

export function assertChatRequestContract(body) {
  const keys = Object.keys(body || {});
  const unexpected = keys.filter((key) => FORBIDDEN_CHAT_FIELDS.includes(key));
  if (unexpected.length) {
    return { ok: false, code: 'FORBIDDEN_FIELDS', detail: unexpected.join(',') };
  }
  const required = ['model', 'messages', 'max_completion_tokens', 'reasoning_effort'];
  const missing = required.filter((key) => !(key in (body || {})));
  if (missing.length) return { ok: false, code: 'MISSING_FIELDS', detail: missing.join(',') };
  if (body.model !== CHAT_MODEL) return { ok: false, code: 'MODEL', detail: 'request model mismatch' };
  if (body.max_completion_tokens !== CHAT_MAX_COMPLETION_TOKENS) {
    return { ok: false, code: 'TOKENS', detail: 'max_completion_tokens mismatch' };
  }
  if (body.reasoning_effort !== CHAT_REASONING_EFFORT) {
    return { ok: false, code: 'REASONING', detail: 'reasoning_effort mismatch' };
  }
  return { ok: true, code: 'OK', detail: '' };
}

export function validateChatCompletion(response) {
  if (!response || response.status !== 200) {
    return { ok: false, code: 'HTTP', modelOk: false, outputOk: false, detail: `status ${response?.status || 'missing'}` };
  }
  const model = String(response.json?.model || '');
  const output = String(response.json?.choices?.[0]?.message?.content ?? '');
  const toolCalls = response.json?.choices?.[0]?.message?.tool_calls;
  const modelOk = model === CHAT_MODEL;
  const outputOk = output.trim() === 'pong' && !toolCalls;
  return {
    ok: modelOk && outputOk,
    code: modelOk && outputOk ? 'OK' : (!modelOk ? 'MODEL' : 'OUTPUT'),
    modelOk,
    outputOk,
    detail: modelOk && outputOk ? 'exact-pong' : (!modelOk ? 'model identity failed' : 'output check failed'),
  };
}

export function buildRealtimeClientSecretsRequest() {
  return {
    url: REALTIME_CLIENT_SECRETS_URL,
    method: 'POST',
    body: { session: { type: 'realtime', model: REALTIME_MODEL } },
  };
}

export function validateClientSecretMint(response) {
  const namePresent = Boolean(response?.json?.name || response?.json?.client_secret?.name);
  const valuePresent = Boolean(response?.json?.value || response?.json?.client_secret?.value);
  if (response?.status !== 200 || !namePresent) {
    return { ok: false, code: 'MINT', namePresent: false, valuePresent: false, detail: 'client_secrets mint failed' };
  }
  return { ok: true, code: 'OK', namePresent: true, valuePresent, detail: 'name present' };
}

export function isSdpExchangeSuccessStatus(status) {
  return status === 200 || status === 201;
}

export function validateSdpAnswer(offer, answer, extra = {}) {
  const text = String(answer || '');
  const offerText = String(offer || '');
  const hasV = /^v=/m.test(text);
  const hasO = /^o=/m.test(text);
  const hasS = /^s=/m.test(text);
  const hasM = /^m=/m.test(text);
  const differs = Boolean(text) && text !== offerText;
  const peerAccepted = extra.peerAccepted === true;
  const webrtcOffer = extra.webrtcGenerated === true;
  const statusOk = isSdpExchangeSuccessStatus(extra.status);
  const ok = statusOk && hasV && hasO && hasS && hasM && differs && peerAccepted && webrtcOffer;
  return {
    ok,
    code: ok ? 'OK' : 'SDP',
    statusOk,
    hasV,
    hasO,
    hasS,
    hasM,
    differs,
    peerAccepted,
    webrtcGenerated: webrtcOffer,
    detail: ok ? 'answer accepted' : 'sdp validation failed',
  };
}

export function isValidatedSha256Digest(value) {
  return typeof value === 'string' && SHA256_HEX_RE.test(value);
}

export function compareSecretToSha256(secret, digest) {
  if (typeof secret !== 'string' || typeof digest !== 'string') return false;
  if (!secret || !digest) return false;
  if (!isValidatedSha256Digest(digest)) return false;
  const hashed = createHash('sha256').update(secret, 'utf8').digest('hex');
  try {
    return timingSafeEqual(Buffer.from(hashed, 'hex'), Buffer.from(digest, 'hex'));
  } catch {
    return false;
  }
}

export function formatProvenance({ match, comparedAt, project = PRODUCTION_PROJECT_REF, secretName = PRODUCTION_SECRET_NAME }) {
  const result = match ? 'match' : 'mismatch';
  return `sha256-match:${secretName}@${project};compared=${comparedAt};result=${result}`;
}

export function isValidComparedAt(value) {
  if (typeof value !== 'string' || !value.trim()) return false;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return false;
  return Number.isFinite(Date.parse(value));
}

export function evaluateProvenance(input) {
  if (typeof input === 'string') {
    if (isLocalProductionKeyProvenance(input)) return { ok: false, code: 'LOCAL_PROVENANCE' };
    return { ok: false, code: 'FIELDS_REQUIRED' };
  }
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, code: 'FIELDS_REQUIRED' };
  }
  if (isLocalProductionKeyProvenance(input.productionKeyProvenance || input.note || '')) {
    return { ok: false, code: 'LOCAL_PROVENANCE' };
  }
  if (input.project !== PRODUCTION_PROJECT_REF) return { ok: false, code: 'PROJECT' };
  if (input.secretName !== PRODUCTION_SECRET_NAME) return { ok: false, code: 'SECRET_NAME' };
  if (input.match !== true) return { ok: false, code: 'MISMATCH' };
  if (!isValidComparedAt(input.comparedAt)) return { ok: false, code: 'TIMESTAMP' };
  return { ok: true, code: 'MATCH' };
}

export function redactProbeSecrets(text, secrets = []) {
  let out = String(text || '');
  for (const secret of secrets.filter(Boolean)) {
    out = out.split(String(secret)).join('[redacted]');
  }
  out = out.replace(/sha256:[a-f0-9]{64}/gi, 'sha256:[redacted]');
  out = out.replace(/\b[a-f0-9]{64}\b/gi, '[redacted-digest]');
  return out;
}

export function assertReceiptRedacted(receipt) {
  const dumped = JSON.stringify(receipt);
  if (SECRETISH.test(dumped) || /sha256:[a-f0-9]{16}/i.test(dumped) || SHA256_HEX_RE.test(dumped)) {
    throw new Error('receipt leaked a secret, digest, or SDP body');
  }
}

export function buildReceipt(input) {
  const mode = input.mode === 'live' ? 'live' : 'synthetic';
  const receipt = {
    ok: Boolean(input.ok),
    mode,
    synthetic: mode !== 'live',
    layer: input.layer || 'pre-deploy-provider',
    localKeyNotUsed: Boolean(input.localKeyNotUsed),
    provenance: {
      match: input.provenance?.match === true,
      project: input.provenance?.project || PRODUCTION_PROJECT_REF,
      secretName: input.provenance?.secretName || PRODUCTION_SECRET_NAME,
      comparedAt: input.provenance?.comparedAt || null,
    },
    siteChat: {
      a1: input.siteChat?.a1 || { status: null, discoveryOnly: true },
      a2: input.siteChat?.a2 || { status: null, modelOk: false, outputOk: false },
    },
    realtime: {
      b1: input.realtime?.b1 || { status: null, discoveryOnly: true },
      b2: input.realtime?.b2 || { status: null, namePresent: false, mintOk: false },
      b3: input.realtime?.b3 || {
        status: null,
        ok: false,
        statusOk: false,
        hasV: false,
        hasO: false,
        hasS: false,
        hasM: false,
        differs: false,
        peerAccepted: false,
        webrtcGenerated: false,
      },
      b4: input.realtime?.b4 || {
        closed: false,
        elapsedMs: null,
        withinBound: false,
        cleanupAttempted: false,
        cancelled: false,
        leftover: false,
        adapterAbortOk: false,
      },
    },
    edgeRelay: {
      accepted: false,
      note: 'Provider capability is not Edge-relay acceptance.',
    },
    attestationWritten: false,
    productionAttestable: false,
    note: 'Synthetic or Codex receipts never write PUBLIC_RELEASE_PAIRS attestation.',
  };
  if (mode === 'live') {
    receipt.productionAttestable = Boolean(input.productionAttestable);
  }
  assertReceiptRedacted(receipt);
  return receipt;
}

export function siteChatAttestable(receipt) {
  return Boolean(
    receipt?.provenance?.match
    && receipt?.siteChat?.a2?.status === 200
    && receipt?.siteChat?.a2?.modelOk
    && receipt?.siteChat?.a2?.outputOk,
  );
}

export function realtimeAttestable(receipt) {
  const r = receipt?.realtime;
  return Boolean(
    receipt?.provenance?.match
    && r?.b1?.status === 200
    && r?.b2?.status === 200
    && r?.b2?.mintOk === true
    && r?.b3?.ok === true
    && r?.b4?.closed === true
    && r?.b4?.withinBound === true
    && r?.b4?.cancelled !== true
    && r?.b4?.leftover !== true
    && r?.b4?.adapterAbortOk === true,
  );
}

function resolveSecretMatch(adapters) {
  if (
    Object.prototype.hasOwnProperty.call(adapters || {}, 'plaintextSecret')
    || Object.prototype.hasOwnProperty.call(adapters || {}, 'edgeSha256Digest')
  ) {
    return compareSecretToSha256(adapters.plaintextSecret, adapters.edgeSha256Digest);
  }
  return Boolean(adapters?.provenanceMatch);
}

export async function runPairAttestationProbes(adapters) {
  const fetchImpl = adapters?.fetch;
  const webrtc = adapters?.webrtc;
  const now = adapters?.now || (() => new Date().toISOString());
  const secrets = adapters?.secretsToRedact || [];
  const mode = adapters?.mode === 'live' ? 'live' : 'synthetic';
  const deadlineMs = Number.isFinite(adapters?.deadlineMs) ? adapters.deadlineMs : SESSION_BOUND_MS;
  const cleanupBudgetMs = Number.isFinite(adapters?.cleanupBudgetMs) ? adapters.cleanupBudgetMs : CLEANUP_BUDGET_MS;
  if (typeof fetchImpl !== 'function') {
    throw new Error('offline/live adapters.fetch is required; this harness does not open a default network');
  }

  const started = Date.now();
  const remaining = () => deadlineMs - (Date.now() - started);
  const controller = new AbortController();
  const inflight = [];
  let cancelled = false;

  const abortInFlight = () => {
    if (!controller.signal.aborted) controller.abort(abortError());
  };
  const abortSession = () => {
    cancelled = true;
    abortInFlight();
  };

  const invoke = (label, start) => {
    if (controller.signal.aborted) {
      cancelled = true;
      const error = new Error(`SESSION_CANCELLED:${label}`);
      error.code = 'SESSION_CANCELLED';
      return Promise.reject(error);
    }
    const work = Promise.resolve().then(() => start(controller.signal));
    inflight.push(work);
    return raceWithDeadline(work, remaining(), label, abortSession).catch((error) => {
      abortSession();
      throw error;
    });
  };

  const closeOnce = async () => {
    if (typeof webrtc?.close !== 'function') return false;
    const closeBudget = Math.max(remaining(), cleanupBudgetMs);
    return await raceWithDeadline(
      Promise.resolve().then(() => webrtc.close({ timeoutMs: closeBudget })),
      closeBudget,
      'close',
    ) === true;
  };

  const comparedAt = now();
  const match = resolveSecretMatch(adapters);
  const provenanceFields = adapters?.forceProvenance && typeof adapters.forceProvenance === 'object'
    ? adapters.forceProvenance
    : {
        project: PRODUCTION_PROJECT_REF,
        secretName: PRODUCTION_SECRET_NAME,
        match,
        comparedAt,
      };
  const provenance = evaluateProvenance(provenanceFields);
  const provenanceString = formatProvenance({
    match: provenance.ok,
    comparedAt,
    project: provenanceFields.project,
    secretName: provenanceFields.secretName,
  });

  let a1 = { status: 0, json: {} };
  let a2 = { status: 0, json: {} };
  let b1 = { status: 0, json: {} };
  let b2 = { status: 0, json: {} };
  let b3 = { status: 0, text: '' };
  let offer = '';
  let webrtcGenerated = false;
  let peerAccepted = false;
  let closed = false;
  let leftover = false;
  let cleanupAttempted = false;

  try {
    a1 = await invoke('a1', (signal) => fetchImpl(CHAT_DISCOVERY_URL, { method: 'GET', signal }));
    const chatRequest = buildChatCompletionsRequest();
    const contract = assertChatRequestContract(chatRequest.body);
    a2 = contract.ok
      ? await invoke('a2', (signal) => fetchImpl(CHAT_COMPLETIONS_URL, { method: 'POST', body: chatRequest.body, signal }))
      : { status: 0, json: {} };

    b1 = await invoke('b1', (signal) => fetchImpl(REALTIME_DISCOVERY_URL, { method: 'GET', signal }));
    const mintReq = buildRealtimeClientSecretsRequest();
    b2 = await invoke('b2', (signal) => fetchImpl(REALTIME_CLIENT_SECRETS_URL, { method: 'POST', body: mintReq.body, signal }));
    const mintEarly = validateClientSecretMint(b2);

    if (typeof webrtc?.createOffer === 'function') {
      offer = await invoke('createOffer', (signal) => webrtc.createOffer({ signal }));
      webrtcGenerated = Boolean(webrtc.generated);
    }
    b3 = mintEarly.ok
      ? await invoke('b3', (signal) => fetchImpl(REALTIME_CALLS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/sdp' },
          body: offer,
          signal,
        }))
      : { status: 0, text: '' };
    const answer = String(b3.text || '');
    if (typeof webrtc?.acceptAnswer === 'function' && answer) {
      peerAccepted = await invoke('acceptAnswer', (signal) => webrtc.acceptAnswer(answer, { signal }));
    }
  } catch {
    abortSession();
  } finally {
    abortInFlight();
    cleanupAttempted = true;
    try {
      closed = await closeOnce();
    } catch {
      closed = false;
    }
    await Promise.allSettled(inflight.map((work) => raceWithDeadline(
      Promise.resolve(work).then(() => undefined),
      cleanupBudgetMs,
      'late-settle',
    ).catch(() => undefined)));
    try {
      const closedLate = await closeOnce();
      closed = closed === true || closedLate === true;
    } catch {
      // late close failure does not invent success
    }
    leftover = typeof webrtc?.hasLiveResources === 'function'
      ? webrtc.hasLiveResources() === true
      : leftover;
  }

  const adapterAbortOk = leftover !== true && (
    typeof webrtc?.hasLiveResources === 'function' || !cancelled
  ) && adaptersHonorAbortContract(adapters);

  const chat = validateChatCompletion(a2);
  const mint = validateClientSecretMint(b2);
  const sdp = validateSdpAnswer(offer, String(b3.text || ''), {
    peerAccepted,
    webrtcGenerated,
    status: b3?.status,
  });
  const elapsedMs = Date.now() - started;
  const withinBound = elapsedMs <= deadlineMs && closed === true && leftover !== true;
  const siteOk = provenance.ok && chat.ok && a2?.status === 200;
  const realtimeOk = provenance.ok
    && b1?.status === 200
    && mint.ok
    && sdp.ok
    && withinBound
    && cancelled !== true
    && leftover !== true
    && adapterAbortOk;
  const receipt = buildReceipt({
    ok: siteOk && realtimeOk,
    mode,
    productionAttestable: mode === 'live' && siteOk && realtimeOk,
    localKeyNotUsed: provenance.ok,
    provenance: {
      match: provenance.ok,
      project: PRODUCTION_PROJECT_REF,
      secretName: PRODUCTION_SECRET_NAME,
      comparedAt,
    },
    siteChat: {
      a1: { status: a1?.status ?? null, idOk: a1?.json?.id === CHAT_MODEL, discoveryOnly: true },
      a2: { status: a2?.status ?? null, modelOk: chat.modelOk, outputOk: chat.outputOk },
    },
    realtime: {
      b1: { status: b1?.status ?? null, idOk: b1?.json?.id === REALTIME_MODEL, discoveryOnly: true },
      b2: { status: b2?.status ?? null, namePresent: mint.namePresent, mintOk: mint.ok },
      b3: {
        status: b3?.status ?? null,
        ok: sdp.ok,
        statusOk: sdp.statusOk,
        hasV: sdp.hasV,
        hasO: sdp.hasO,
        hasS: sdp.hasS,
        hasM: sdp.hasM,
        differs: sdp.differs,
        peerAccepted: sdp.peerAccepted,
        webrtcGenerated: sdp.webrtcGenerated,
      },
      b4: {
        closed,
        elapsedMs,
        withinBound,
        cleanupAttempted,
        cancelled,
        leftover,
        adapterAbortOk,
      },
    },
  });

  return {
    receipt,
    provenanceString: redactProbeSecrets(provenanceString, secrets),
    siteChatAttestable: siteChatAttestable(receipt),
    realtimeAttestable: realtimeAttestable(receipt),
    productionAttestable: receipt.productionAttestable,
    wouldAcceptAttestation: acceptProductionAttestation,
  };
}
