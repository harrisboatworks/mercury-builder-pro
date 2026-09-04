import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { evaluateHbwStoragePolicy } from '../../scripts/lib/hbw-storage-policy.mjs';

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
    expect(result.failures).toContain('Policy source contains an affirmative HBW indoor-storage claim.');
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
    'We offer secure indoor storage and outdoor storage.',
    'We offer covered and heated indoor winter storage.',
    'Our storage options include indoor and outdoor facilities.',
    'Indoor and outdoor winter storage are available at Harris Boat Works.',
    'Harris Boat Works can accommodate boats in climate-controlled indoor storage.',
    'Boats are stored inside for winter at HBW.',
    'indoor_storage: true',
    'We can offer indoor storage.',
    'Harris Boat Works accommodates indoor storage.',
    'Indoor storage is available through Harris Boat Works.',
    'We store boats indoors for winter.',
    'Indoor storage can be arranged by HBW.',
  ])('rejects an affirmative offer paraphrase: %s', (answer) => {
    expect(evaluateHbwStoragePolicy(answer).ok).toBe(false);
  });

  it.each([
    'Do you offer indoor or outdoor storage?',
    'Does Harris Boat Works offer indoor storage?',
    'We do not offer both indoor and outdoor storage; storage is outdoor only.',
    "We don't offer indoor or heated storage.",
    'We offer outdoor storage and do not have indoor storage.',
    'We offer outdoor storage; however, indoor storage is not available.',
  ])('allows questions and denials: %s', (text) => {
    expect(evaluateHbwStoragePolicy(text).failures).toEqual([]);
  });

  it('requires the full outdoor-only clarification when the GTM storage FAQ exists', () => {
    const result = evaluateHbwStoragePolicy(`
      "name": "Do you offer boat storage?",
      "acceptedAnswer": { "text": "Yes, seasonal storage is available." }
    `);

    expect(result.ok).toBe(false);
    expect(result.failures).toHaveLength(3);
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
