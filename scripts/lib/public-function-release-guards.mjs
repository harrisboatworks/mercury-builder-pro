/**
 * Explicit release holds for the unreviewed public chat and Realtime pairs.
 *
 * Production key presence and model access are not inferred from the
 * environment, a local key, or a deploy timestamp. The committed
 * attestation is UNVERIFIED until a production-proven record is written.
 * Pair membership refuses a one-sided or half-blocked release.
 *
 * No network. Never prints secret values — only key and model names.
 */

const PLATFORM_ENV_KEYS = new Set([
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
]);

const LOCAL_PROVENANCE_RE =
  /(^|[^A-Za-z0-9])(local|\.env|dotenv|process\.env|env\.local)([^A-Za-z0-9]|$)/i;

export const UNVERIFIED_PRODUCTION_ATTESTATION = Object.freeze({
  status: 'UNVERIFIED',
  productionKeyProvenance: null,
  attestedModels: Object.freeze([]),
  attestedKeys: Object.freeze([]),
  note: 'Committed hold: this record is a shape/name gate, not a credential or model-access verifier. Production secret names can be present while key validity and model access remain UNVERIFIED. A local key is not production proof.',
});

export const PUBLIC_RELEASE_PAIR_IDS = Object.freeze({
  SITE_CHAT: 'site-chat',
  OPENAI_REALTIME: 'openai-realtime',
});

/**
 * Conservative hold. requiredModels / requiredKeys are the cutover
 * prerequisites from #482 Set 3 / Set 4. Additional Deno.env names
 * found in source are documented, not extra lift switches.
 */
export const PUBLIC_RELEASE_PAIRS = Object.freeze([
  Object.freeze({
    id: PUBLIC_RELEASE_PAIR_IDS.SITE_CHAT,
    label: 'site chat',
    slugs: Object.freeze(['ai-chatbot', 'ai-chatbot-stream']),
    requiredModels: Object.freeze(['gpt-5.6-luna']),
    requiredKeys: Object.freeze(['OPENAI_API_KEY']),
    attestation: UNVERIFIED_PRODUCTION_ATTESTATION,
  }),
  Object.freeze({
    id: PUBLIC_RELEASE_PAIR_IDS.OPENAI_REALTIME,
    label: 'OpenAI Realtime',
    slugs: Object.freeze(['realtime-session', 'realtime-sdp-exchange']),
    requiredModels: Object.freeze(['gpt-realtime-2.1-mini']),
    requiredKeys: Object.freeze(['OPENAI_API_KEY']),
    attestation: UNVERIFIED_PRODUCTION_ATTESTATION,
  }),
]);

export const PUBLIC_BACKLOG_SOLOS = Object.freeze([
  Object.freeze({
    slug: 'sync-elevenlabs-static-kb',
    requiredKeys: Object.freeze(['ELEVENLABS_API_KEY']),
    note: 'Source deploy and the hosted ElevenLabs refresh are distinct steps. Neither is authorized here.',
  }),
  Object.freeze({
    slug: 'voice-perplexity-lookup',
    requiredKeys: Object.freeze(['PERPLEXITY_API_KEY']),
    note: 'Not pair-gated. Do not treat a main-push fan-out as authorization.',
  }),
]);

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export function deriveProviderFactsFromSource(source) {
  const models = [];
  const modelRe = /\bconst\s+(CHAT_MODEL|REALTIME_MODEL)\s*=\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = modelRe.exec(String(source || '')))) {
    models.push(match[2]);
  }
  const keys = [];
  const keyRe = /Deno\.env\.get\(\s*['"]([A-Z][A-Z0-9_]+)['"]\s*\)/g;
  while ((match = keyRe.exec(String(source || '')))) {
    if (!PLATFORM_ENV_KEYS.has(match[1])) keys.push(match[1]);
  }
  return { models: unique(models), keys: unique(keys) };
}

export function pairFactsFromSources(pair, sourceBySlug = {}) {
  const models = [];
  const keys = [];
  for (const slug of pair.slugs) {
    const facts = deriveProviderFactsFromSource(sourceBySlug[slug] || '');
    models.push(...facts.models);
    keys.push(...facts.keys);
  }
  return { models: unique(models), keys: unique(keys) };
}

export function pairForSlug(slug, pairs = PUBLIC_RELEASE_PAIRS) {
  return (pairs || []).find((pair) => pair.slugs.includes(slug)) || null;
}

export function pairById(id, pairs = PUBLIC_RELEASE_PAIRS) {
  const key = String(id || '').trim();
  return (pairs || []).find((pair) => pair.id === key) || null;
}

export function allowlistedPairIds(pairs = PUBLIC_RELEASE_PAIRS) {
  return (pairs || []).map((pair) => pair.id);
}

export function isLocalProductionKeyProvenance(value) {
  const text = String(value || '').trim();
  if (!text) return false;
  return LOCAL_PROVENANCE_RE.test(text);
}

/**
 * Shape/name check only. Does not read secrets, call providers, or prove
 * that a named production key is valid or that a named model is enabled.
 */
export function acceptProductionAttestation(pair, attestation) {
  if (!pair) {
    return { ok: false, code: 'UNKNOWN', detail: 'pair is unknown' };
  }
  if (attestation == null) {
    return { ok: false, code: 'MISSING', detail: 'attestation is missing' };
  }
  const status = String(attestation.status || '').trim().toUpperCase();
  if (!status) {
    return { ok: false, code: 'UNKNOWN', detail: 'attestation status is unknown' };
  }
  if (status !== 'ATTESTED') {
    return { ok: false, code: status, detail: `attestation status is ${status}` };
  }
  const provenance = String(attestation.productionKeyProvenance || '').trim();
  if (!provenance) {
    return { ok: false, code: 'UNKNOWN', detail: 'production-key provenance is missing' };
  }
  if (isLocalProductionKeyProvenance(provenance)) {
    return { ok: false, code: 'LOCAL_PROVENANCE', detail: 'local key is not production proof' };
  }
  const attestedModels = new Set((attestation.attestedModels || []).map((item) => String(item)));
  const attestedKeys = new Set((attestation.attestedKeys || []).map((item) => String(item)));
  const missingModels = pair.requiredModels.filter((model) => !attestedModels.has(model));
  const missingKeys = pair.requiredKeys.filter((key) => !attestedKeys.has(key));
  if (missingModels.length || missingKeys.length) {
    return {
      ok: false,
      code: 'INCOMPLETE',
      detail: [
        missingModels.length ? `unattested model name(s) ${missingModels.join(', ')}` : '',
        missingKeys.length ? `unattested key name(s) ${missingKeys.join(', ')}` : '',
      ]
        .filter(Boolean)
        .join('; '),
    };
  }
  return { ok: true, code: 'ATTESTED', detail: '' };
}

function pairSlugList(slugs) {
  return slugs.map((slug) => `\`${slug}\``).join(' + ');
}

export function formatAttestationHold(pair, acceptance) {
  const code = String(acceptance?.code || 'UNKNOWN').toLowerCase().replaceAll('_', ' ');
  const extra = acceptance?.detail ? ` (${acceptance.detail})` : '';
  return (
    `skipped: ${pair.label} pair ${pairSlugList(pair.slugs)} is held. ` +
    `Production key/model attestation is ${code}${extra}. ` +
    `Required model name(s) from source: ${pair.requiredModels.join(', ')}. ` +
    `Required production key name(s): ${pair.requiredKeys.join(', ')}. ` +
    `A local key is not production proof. This job did not deploy either pair member.`
  );
}

export function formatOneSidedHold(pair, selectedMembers, missing) {
  return (
    `skipped: ${pair.label} pair is incomplete. Selected ${pairSlugList(selectedMembers)}; ` +
    `missing ${pairSlugList(missing)}. Pair membership does not permit a partial release. ` +
    `This job did not deploy either pair member.`
  );
}

export function formatPairPreconditionHold(pair, hits) {
  const listed = hits
    .map((item) => `\`${item.slug}\`: ${String(item.detail || 'precondition failed').split('\n')[0]}`)
    .join('; ');
  return (
    `skipped: ${pair.label} pair ${pairSlugList(pair.slugs)} failed closed because a pair member precondition failed. ` +
    `${listed} Pair membership does not permit a partial release. This job did not deploy either pair member.`
  );
}

function preconditionMap(preconditionSkipBySlug) {
  if (preconditionSkipBySlug instanceof Map) return preconditionSkipBySlug;
  if (preconditionSkipBySlug && typeof preconditionSkipBySlug === 'object') {
    return new Map(Object.entries(preconditionSkipBySlug));
  }
  return new Map();
}

/**
 * Per-selected-slug skip reasons. Unpaired slugs keep their migration /
 * lookup precondition. Pair members fail closed together when attestation
 * is not production-proven, the selection is one-sided, or any selected
 * member has a precondition.
 *
 * `env` is accepted so callers can pass process.env; provider key values
 * in that object are ignored on purpose.
 */
export function skipReasonsForSelectedSlugs(selectedSlugs, options = {}) {
  const slugs = Array.isArray(selectedSlugs) ? selectedSlugs : [];
  const pairs = options.pairs || PUBLIC_RELEASE_PAIRS;
  const selected = new Set(slugs);
  const preconditions = preconditionMap(options.preconditionSkipBySlug);
  const reasons = new Map();

  void options.env;

  for (const slug of slugs) {
    reasons.set(slug, preconditions.get(slug) || null);
  }

  for (const pair of pairs) {
    const selectedMembers = pair.slugs.filter((slug) => selected.has(slug));
    if (!selectedMembers.length) continue;

    const attestation = options.attestations?.[pair.id] ?? pair.attestation;
    const acceptance = acceptProductionAttestation(pair, attestation);
    const missing = pair.slugs.filter((slug) => !selected.has(slug));
    const preconditionHits = selectedMembers
      .map((slug) => ({ slug, detail: preconditions.get(slug) || null }))
      .filter((item) => item.detail);

    let pairReason = null;
    if (!acceptance.ok) {
      pairReason = formatAttestationHold(pair, acceptance);
    } else if (missing.length) {
      pairReason = formatOneSidedHold(pair, selectedMembers, missing);
    } else if (preconditionHits.length) {
      pairReason = formatPairPreconditionHold(pair, preconditionHits);
    }

    if (pairReason) {
      for (const slug of selectedMembers) {
        reasons.set(slug, pairReason);
      }
    }
  }

  return reasons;
}
