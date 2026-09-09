import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  PARTS_PAGE_URL,
  buildPublicPartInfo,
  buildPublicPartResponse,
} from '../../supabase/functions/mercury-parts-lookup/public-part';

/**
 * Keys an anonymous parts-lookup probe is allowed to see on `data`.
 *
 * Intentional strictness: widening this allowlist should require editing
 * this test so a human decides whether the new key is public.
 */
const PUBLIC_PART_INFO_KEYS = [
  'partNumber',
  'name',
  'description',
  'cadPrice',
  'imageUrl',
  'sourceUrl',
  'fromCache',
] as const;

const SENTINEL = {
  email: 'LEAK-caller-email@example.com',
  phone: 'LEAK-caller-phone-5550199',
  notes: 'LEAK-internal-notes',
  dealer: 'LEAK-dealer-cost',
  lookup: 'LEAK-lookup-count',
};

const SENTINEL_VALUES = Object.values(SENTINEL);

function collectKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, keys);
    return keys;
  }
  if (value === null || typeof value !== 'object') return keys;
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    keys.add(key);
    collectKeys(nested, keys);
  }
  return keys;
}

function leakyPartsCacheRow() {
  return {
    id: '22222222-2222-4222-8222-222222222222',
    part_number: '8M0151274',
    name: 'Tiller Extension Handle',
    description: 'Adjustable tiller extension for comfortable steering',
    cad_price: 129.99,
    image_url: 'https://www.mercuryrepower.ca/parts/8M0151274.jpg',
    source_url: 'https://LEAK-internal-source.example.test/parts',
    lookup_count: SENTINEL.lookup,
    created_at: '2026-01-01T00:00:00.000Z',
    last_updated: '2026-09-01T12:00:00.000Z',
    caller_phone: SENTINEL.phone,
    caller_email: SENTINEL.email,
    internal_notes: SENTINEL.notes,
    dealer_cost: SENTINEL.dealer,
    unknownFutureField: { secret: SENTINEL.notes },
  };
}

function assertNoSentinels(value: unknown) {
  const serialized = JSON.stringify(value);
  for (const sentinel of SENTINEL_VALUES) {
    expect(serialized).not.toContain(sentinel);
  }
}

describe('public mercury parts lookup sentinel contract', () => {
  it('strips identifying sentinels and pins the PartInfo allowlist', () => {
    const result = buildPublicPartInfo(leakyPartsCacheRow(), { fromCache: true });

    expect(Object.keys(result).sort()).toEqual([...PUBLIC_PART_INFO_KEYS].sort());
    expect(result).toEqual({
      partNumber: '8M0151274',
      name: 'Tiller Extension Handle',
      description: 'Adjustable tiller extension for comfortable steering',
      cadPrice: 129.99,
      imageUrl: 'https://www.mercuryrepower.ca/parts/8M0151274.jpg',
      sourceUrl: PARTS_PAGE_URL,
      fromCache: true,
    });

    const publicKeys = collectKeys(result);
    for (const forbidden of [
      'id',
      'part_number',
      'cad_price',
      'image_url',
      'source_url',
      'lookup_count',
      'created_at',
      'last_updated',
      'caller_phone',
      'caller_email',
      'internal_notes',
      'dealer_cost',
      'unknownFutureField',
    ]) {
      expect(publicKeys).not.toContain(forbidden);
    }

    assertNoSentinels(result);
    expect(JSON.stringify(result)).not.toContain('LEAK-internal-source');
  });

  it('keeps the HTTP wrapper on an exact key set and never serializes sentinels', () => {
    const response = buildPublicPartResponse(leakyPartsCacheRow(), { fromCache: true });

    expect(Object.keys(response).sort()).toEqual(['data', 'success']);
    expect(response.success).toBe(true);
    expect(Object.keys(response.data).sort()).toEqual([...PUBLIC_PART_INFO_KEYS].sort());
    expect(response.data.fromCache).toBe(true);
    assertNoSentinels(response);
  });

  it('pins the cache-miss wrapper keys and still drops row sentinels', () => {
    const response = buildPublicPartResponse(leakyPartsCacheRow(), {
      fromCache: false,
      message: 'Use parts lookup for current CAD pricing',
    });

    expect(Object.keys(response).sort()).toEqual(['data', 'message', 'success']);
    expect(response.data.fromCache).toBe(false);
    expect(response.data).not.toHaveProperty('lookup_count');
    assertNoSentinels(response);
  });

  it('wires the edge function to the allowlist and an explicit select', () => {
    const edgeSource = readFileSync(
      resolve(process.cwd(), 'supabase/functions/mercury-parts-lookup/index.ts'),
      'utf8',
    );

    expect(edgeSource).toContain('buildPublicPartResponse');
    expect(edgeSource).toContain(
      ".select('part_number, name, description, cad_price, image_url, lookup_count')",
    );
    expect(edgeSource).not.toContain(".select('*')");
    expect(edgeSource).toContain('lookup_count: (cached.lookup_count || 0) + 1');
  });
});
