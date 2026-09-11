/**
 * Offline-testable pair-attestation probe helpers for #542.
 * Does not read 1Password, does not call OpenAI, and never writes ATTESTED.
 */
import { createHash } from 'node:crypto';
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
export const FORBIDDEN_CHAT_FIELDS = Object.freeze([
  'max_tokens',
  'temperature',
  'top_p',
  'presence_penalty',
  'frequency_penalty',
]);

const SECRETISH = /(sk-|ek_|ephemeral|BEGIN|v=0|o=|a=fingerprint)/i;

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
  const output = String(response.json?.choices?.[0]?.message?.content || '');
  const toolCalls = response.json?.choices?.[0]?.message?.tool_calls;
  const modelOk = model.startsWith(CHAT_MODEL);
  const outputOk = /\bpong\b/i.test(output) && !toolCalls;
  return {
    ok: modelOk && outputOk,
    code: modelOk && outputOk ? 'OK' : (!modelOk ? 'MODEL' : 'OUTPUT'),
    modelOk,
    outputOk,
    detail: modelOk && outputOk ? 'pong' : (!modelOk ? 'model identity failed' : 'output check failed'),
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
    return { ok: false, code: 'MINT', namePresent: false, detail: 'client_secrets mint failed' };
  }
  return { ok: true, code: 'OK', namePresent: true, valuePresent, detail: 'name present' };
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
  const ok = hasV && hasO && hasS && hasM && differs && peerAccepted && webrtcOffer;
  return {
    ok,
    code: ok ? 'OK' : 'SDP',
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

export function compareSecretDigests(leftValue, rightValue) {
  const left = createHash('sha256').update(String(leftValue || ''), 'utf8').digest('hex');
  const right = createHash('sha256').update(String(rightValue || ''), 'utf8').digest('hex');
  return left === right;
}

export function formatProvenance({ match, comparedAt, project = PRODUCTION_PROJECT_REF, secretName = PRODUCTION_SECRET_NAME }) {
  const result = match ? 'match' : 'mismatch';
  return `sha256-match:${secretName}@${project};compared=${comparedAt};result=${result}`;
}

export function evaluateProvenance(provenance) {
  const text = String(provenance || '').trim();
  if (!text) return { ok: false, code: 'MISSING' };
  if (isLocalProductionKeyProvenance(text)) return { ok: false, code: 'LOCAL_PROVENANCE' };
  if (!text.includes('sha256-match:') || !text.includes(`@${PRODUCTION_PROJECT_REF}`) || !text.includes('result=match')) {
    return { ok: false, code: 'MISMATCH' };
  }
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
  if (SECRETISH.test(dumped) || /sha256:[a-f0-9]{16}/i.test(dumped)) {
    throw new Error('receipt leaked a secret, digest, or SDP body');
  }
}

export function buildReceipt(input) {
  const receipt = {
    ok: Boolean(input.ok),
    layer: input.layer || 'pre-deploy-provider',
    localKeyNotUsed: Boolean(input.localKeyNotUsed),
    provenance: {
      match: input.provenance?.match === true,
      project: PRODUCTION_PROJECT_REF,
      secretName: PRODUCTION_SECRET_NAME,
      comparedAt: input.provenance?.comparedAt || null,
    },
    siteChat: {
      a1: input.siteChat?.a1 || { status: null, discoveryOnly: true },
      a2: input.siteChat?.a2 || { status: null, modelOk: false, outputOk: false },
    },
    realtime: {
      b1: input.realtime?.b1 || { status: null, discoveryOnly: true },
      b2: input.realtime?.b2 || { status: null, namePresent: false },
      b3: input.realtime?.b3 || { status: null, hasV: false, hasO: false, hasS: false, hasM: false, differs: false, peerAccepted: false },
      b4: input.realtime?.b4 || { closed: false, elapsedMs: null },
    },
    edgeRelay: {
      accepted: false,
      note: 'Provider capability is not Edge-relay acceptance.',
    },
    attestationWritten: false,
    note: 'Synthetic or Codex receipts never write PUBLIC_RELEASE_PAIRS attestation.',
  };
  assertReceiptRedacted(receipt);
  return receipt;
}

export function siteChatAttestable(receipt) {
  return Boolean(receipt?.provenance?.match && receipt?.siteChat?.a2?.modelOk && receipt?.siteChat?.a2?.outputOk);
}

export function realtimeAttestable(receipt) {
  const b3 = receipt?.realtime?.b3;
  return Boolean(
    receipt?.provenance?.match
    && b3?.hasV && b3?.hasO && b3?.hasS && b3?.hasM && b3?.differs && b3?.peerAccepted
    && receipt?.realtime?.b4?.closed,
  );
}

export async function runPairAttestationProbes(adapters) {
  const fetchImpl = adapters?.fetch;
  const webrtc = adapters?.webrtc;
  const now = adapters?.now || (() => new Date().toISOString());
  const secrets = adapters?.secretsToRedact || [];
  if (typeof fetchImpl !== 'function') {
    throw new Error('offline/live adapters.fetch is required; this harness does not open a default network');
  }

  const comparedAt = now();
  const match = Boolean(adapters?.provenanceMatch);
  const provenanceString = formatProvenance({ match, comparedAt });
  const provenance = evaluateProvenance(adapters?.forceProvenance || provenanceString);

  const a1 = await fetchImpl(CHAT_DISCOVERY_URL, { method: 'GET' });
  const chatRequest = buildChatCompletionsRequest();
  const contract = assertChatRequestContract(chatRequest.body);
  const a2 = contract.ok ? await fetchImpl(CHAT_COMPLETIONS_URL, { method: 'POST', body: chatRequest.body }) : { status: 0, json: {} };
  const chat = validateChatCompletion(a2);

  const b1 = await fetchImpl(REALTIME_DISCOVERY_URL, { method: 'GET' });
  const mintReq = buildRealtimeClientSecretsRequest();
  const b2 = await fetchImpl(REALTIME_CLIENT_SECRETS_URL, { method: 'POST', body: mintReq.body });
  const mint = validateClientSecretMint(b2);

  let offer = '';
  let webrtcGenerated = false;
  if (typeof webrtc?.createOffer === 'function') {
    offer = await webrtc.createOffer();
    webrtcGenerated = Boolean(webrtc.generated);
  }
  const b3 = mint.ok
    ? await fetchImpl(REALTIME_CALLS_URL, { method: 'POST', headers: { 'Content-Type': 'application/sdp' }, body: offer })
    : { status: 0, text: '' };
  const answer = String(b3.text || '');
  let peerAccepted = false;
  if (typeof webrtc?.acceptAnswer === 'function' && answer) {
    peerAccepted = await webrtc.acceptAnswer(answer);
  }
  const sdp = validateSdpAnswer(offer, answer, { peerAccepted, webrtcGenerated });

  const started = Date.now();
  let closed = false;
  if (typeof webrtc?.close === 'function') {
    closed = await webrtc.close({ timeoutMs: SESSION_BOUND_MS });
  }
  const elapsedMs = Date.now() - started;
  const boundOk = elapsedMs <= SESSION_BOUND_MS && closed === true;

  const receipt = buildReceipt({
    ok: provenance.ok && chat.ok && sdp.ok && boundOk,
    localKeyNotUsed: provenance.ok,
    provenance: { match: provenance.ok, comparedAt },
    siteChat: {
      a1: { status: a1?.status ?? null, idOk: a1?.json?.id === CHAT_MODEL, discoveryOnly: true },
      a2: { status: a2?.status ?? null, modelOk: chat.modelOk, outputOk: chat.outputOk },
    },
    realtime: {
      b1: { status: b1?.status ?? null, idOk: b1?.json?.id === REALTIME_MODEL, discoveryOnly: true },
      b2: { status: b2?.status ?? null, namePresent: mint.namePresent },
      b3: {
        status: b3?.status ?? null,
        hasV: sdp.hasV,
        hasO: sdp.hasO,
        hasS: sdp.hasS,
        hasM: sdp.hasM,
        differs: sdp.differs,
        peerAccepted: sdp.peerAccepted,
      },
      b4: { closed: boundOk, elapsedMs },
    },
  });

  return {
    receipt,
    provenanceString: redactProbeSecrets(provenanceString, secrets),
    siteChatAttestable: siteChatAttestable(receipt),
    realtimeAttestable: realtimeAttestable(receipt),
    wouldAcceptAttestation: acceptProductionAttestation,
  };
}
