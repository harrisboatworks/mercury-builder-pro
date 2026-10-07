import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  PUBLIC_BACKLOG_SOLOS,
  PUBLIC_RELEASE_PAIR_IDS,
  PUBLIC_RELEASE_PAIRS,
  UNVERIFIED_PRODUCTION_ATTESTATION,
  acceptProductionAttestation,
  deriveProviderFactsFromSource,
  allowlistedPairIds,
  pairById,
  pairFactsFromSources,
  pairForSlug,
  skipReasonsForSelectedSlugs,
} from '../../scripts/lib/public-function-release-guards.mjs';

const sourceBySlug = Object.fromEntries(
  [
    'ai-chatbot',
    'ai-chatbot-stream',
    'realtime-session',
    'realtime-sdp-exchange',
    'sync-elevenlabs-static-kb',
    'voice-perplexity-lookup',
  ].map((slug) => [slug, readFileSync(`supabase/functions/${slug}/index.ts`, 'utf8')]),
);

const ATTESTED_CHAT = {
  status: 'ATTESTED',
  productionKeyProvenance:
    'supabase-production-secrets-read-plus-openai-project-behind-production-OPENAI_API_KEY',
  attestedModels: ['gpt-5.6-luna'],
  attestedKeys: ['OPENAI_API_KEY'],
};

describe('source-derived pair facts', () => {
  it('derives chat and Realtime model and key names from committed source', () => {
    const chat = pairFactsFromSources(
      PUBLIC_RELEASE_PAIRS.find((pair) => pair.id === PUBLIC_RELEASE_PAIR_IDS.SITE_CHAT)!,
      sourceBySlug,
    );
    const realtime = pairFactsFromSources(
      PUBLIC_RELEASE_PAIRS.find((pair) => pair.id === PUBLIC_RELEASE_PAIR_IDS.OPENAI_REALTIME)!,
      sourceBySlug,
    );
    expect(chat.models).toEqual(['gpt-5.6-luna']);
    expect(chat.keys).toEqual(expect.arrayContaining(['OPENAI_API_KEY', 'PERPLEXITY_API_KEY']));
    expect(realtime.models).toEqual(['gpt-realtime-2.1-mini']);
    expect(realtime.keys).toEqual(['OPENAI_API_KEY']);
    expect(deriveProviderFactsFromSource(sourceBySlug['realtime-sdp-exchange'])).toEqual({
      models: [],
      keys: [],
    });
    expect(deriveProviderFactsFromSource(sourceBySlug['sync-elevenlabs-static-kb']).keys).toEqual([
      'ELEVENLABS_API_KEY',
    ]);
    expect(deriveProviderFactsFromSource(sourceBySlug['voice-perplexity-lookup']).keys).toEqual([
      'PERPLEXITY_API_KEY',
    ]);
    expect(PUBLIC_RELEASE_PAIRS[0].requiredModels).toEqual(chat.models);
    expect(PUBLIC_RELEASE_PAIRS[1].requiredModels).toEqual(realtime.models);
  });

  it('keeps the committed production attestation UNVERIFIED', () => {
    expect(PUBLIC_RELEASE_PAIRS.every((pair) => pair.attestation === UNVERIFIED_PRODUCTION_ATTESTATION)).toBe(
      true,
    );
    expect(UNVERIFIED_PRODUCTION_ATTESTATION.status).toBe('UNVERIFIED');
    expect(PUBLIC_BACKLOG_SOLOS.map((item) => item.slug)).toEqual([
      'sync-elevenlabs-static-kb',
      'voice-perplexity-lookup',
    ]);
    expect(allowlistedPairIds()).toEqual(['site-chat', 'openai-realtime']);
    expect(pairById('site-chat')?.slugs).toEqual(['ai-chatbot', 'ai-chatbot-stream']);
    expect(pairById('unknown')).toBeNull();
  });
});

describe('production attestation', () => {
  const chat = pairForSlug('ai-chatbot')!;

  it('rejects missing, unknown, unverified, and local provenance', () => {
    expect(acceptProductionAttestation(chat, null).code).toBe('MISSING');
    expect(acceptProductionAttestation(chat, { status: '' }).code).toBe('UNKNOWN');
    expect(acceptProductionAttestation(chat, { status: 'UNKNOWN' }).code).toBe('UNKNOWN');
    expect(acceptProductionAttestation(chat, UNVERIFIED_PRODUCTION_ATTESTATION).code).toBe('UNVERIFIED');
    expect(
      acceptProductionAttestation(chat, {
        ...ATTESTED_CHAT,
        productionKeyProvenance: 'local .env OPENAI_API_KEY',
      }).code,
    ).toBe('LOCAL_PROVENANCE');
    expect(
      acceptProductionAttestation(chat, {
        ...ATTESTED_CHAT,
        attestedModels: [],
      }).code,
    ).toBe('INCOMPLETE');
    expect(
      acceptProductionAttestation(chat, {
        ...ATTESTED_CHAT,
        attestedKeys: [],
      }).code,
    ).toBe('INCOMPLETE');
  });

  it('accepts only a production-proven attestation that names the source model and key', () => {
    expect(acceptProductionAttestation(chat, ATTESTED_CHAT)).toEqual({
      ok: true,
      code: 'ATTESTED',
      detail: '',
    });
  });
});

describe('pair skip reasons', () => {
  it('holds a complete pair when attestation is unverified and ignores a local env key', () => {
    const reasons = skipReasonsForSelectedSlugs(['ai-chatbot', 'ai-chatbot-stream', 'send-sms'], {
      env: { OPENAI_API_KEY: 'sk-local-not-production-proof' },
    });
    expect(reasons.get('ai-chatbot')).toMatch(/attestation is unverified/);
    expect(reasons.get('ai-chatbot-stream')).toMatch(/A local key is not production proof/);
    expect(reasons.get('send-sms')).toBeNull();
    expect(String(reasons.get('ai-chatbot'))).not.toContain('sk-local-not-production-proof');
  });

  it('holds one-sided selection even after production attestation', () => {
    const reasons = skipReasonsForSelectedSlugs(['realtime-sdp-exchange'], {
      attestations: {
        [PUBLIC_RELEASE_PAIR_IDS.OPENAI_REALTIME]: {
          status: 'ATTESTED',
          productionKeyProvenance:
            'supabase-production-secrets-read-plus-openai-project-behind-production-OPENAI_API_KEY',
          attestedModels: ['gpt-realtime-2.1-mini'],
          attestedKeys: ['OPENAI_API_KEY'],
        },
      },
    });
    expect(reasons.get('realtime-sdp-exchange')).toMatch(/pair is incomplete/);
    expect(reasons.get('realtime-sdp-exchange')).toMatch(/missing `realtime-session`/);
  });

  it('fails the whole pair when one member has a migration precondition', () => {
    const reasons = skipReasonsForSelectedSlugs(['ai-chatbot', 'ai-chatbot-stream'], {
      attestations: { [PUBLIC_RELEASE_PAIR_IDS.SITE_CHAT]: ATTESTED_CHAT },
      preconditionSkipBySlug: {
        'ai-chatbot-stream':
          'skipped: newly required migration `20260909193000_serialize_quote_email_delivery_failed_retry_claim.sql` is not applied in production.',
      },
    });
    expect(reasons.get('ai-chatbot')).toMatch(/pair member precondition failed/);
    expect(reasons.get('ai-chatbot-stream')).toMatch(
      /20260909193000_serialize_quote_email_delivery_failed_retry_claim\.sql/,
    );
    expect(reasons.get('ai-chatbot')).toBe(reasons.get('ai-chatbot-stream'));
  });
});
