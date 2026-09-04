import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  evaluateHbwStorageFaqEntries,
  evaluateHbwStoragePolicy,
} from '../../scripts/lib/hbw-storage-policy.mjs';

const safeStorageFaq = `
  "name": "Do you offer boat storage?",
  "acceptedAnswer": {
    "text": "Yes. We offer outdoor winter storage with professional shrink wrap, outdoor uncovered storage, and shrink-wrap-only service. We do not offer indoor or heated boat storage. Done inside and done outside refer only to where we apply shrink wrap."
  }
`;

describe('HBW cross-site storage policy', () => {
  it('accepts the authoritative outdoor-only FAQ boundary', () => {
    expect(evaluateHbwStoragePolicy(safeStorageFaq)).toEqual({
      ok: true,
      storageFaqDetected: true,
      failures: [],
    });
  });

  it('rejects the former indoor-and-outdoor GTM claim', () => {
    const result = evaluateHbwStoragePolicy(`
      "name": "Do you offer boat storage?",
      "acceptedAnswer": {
        "text": "We provide both indoor and outdoor storage options."
      }
    `);

    expect(result.ok).toBe(false);
    expect(result.failures).toContain('Policy source contains an indoor-and-outdoor storage offer.');
  });

  it('allows comparison content that does not claim HBW offers indoor storage', () => {
    const result = evaluateHbwStoragePolicy(
      'Indoor storage may suit some owners, but Harris Boat Works does not offer it.',
    );

    expect(result).toEqual({
      ok: true,
      storageFaqDetected: false,
      failures: [],
    });
  });

  it.each([
    'We offer indoor/outdoor storage options.',
    'HBW provides heated winter storage.',
    'Harris Boat Works has boat storage indoors.',
  ])('rejects an affirmative offer paraphrase: %s', (answer) => {
    expect(evaluateHbwStoragePolicy(answer).ok).toBe(false);
  });

  it('requires the full outdoor-only clarification when the GTM storage FAQ exists', () => {
    const result = evaluateHbwStoragePolicy(`
      "name": "Do you offer boat storage?",
      "acceptedAnswer": { "text": "Yes, seasonal storage is available." }
    `);

    expect(result.ok).toBe(false);
    expect(result.failures).toHaveLength(3);
  });

  it('fails closed when rendered schema omits the expected GTM FAQ', () => {
    expect(evaluateHbwStorageFaqEntries([])).toEqual({
      ok: false,
      storageFaqDetected: false,
      expectedFaqCount: 0,
      failures: ['Rendered schema is missing the expected "Do you offer boat storage?" FAQ.'],
    });
  });

  it('keeps repository-owned HBW policy surfaces contradiction-free', () => {
    const paths = [
      'public/maintenance.md',
      'public/.well-known/brand.json',
      'src/data/faqData.ts',
      'src/data/harrisBoatWorksBrandPage.js',
    ];
    for (const path of paths) {
      expect(evaluateHbwStoragePolicy(readFileSync(path, 'utf8')).failures, path).toEqual([]);
    }
  });
});
