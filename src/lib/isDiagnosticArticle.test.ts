import { describe, expect, it } from 'vitest';
import { isDiagnosticArticle } from './isDiagnosticArticle';

describe('isDiagnosticArticle', () => {
  it('routes troubleshooting categories to diagnostic service intake', () => {
    expect(isDiagnosticArticle('Troubleshooting', 'mercury-outboard-fault-codes-lookup')).toBe(true);
    expect(isDiagnosticArticle('Service & Troubleshooting', 'mercury-outboard-beeping-codes-guide')).toBe(true);
  });

  it('recognizes diagnostic slugs even when the category is generic', () => {
    expect(isDiagnosticArticle('Service', 'mercury-outboard-overheat-alarm-decoder')).toBe(true);
    expect(isDiagnosticArticle('Mercury Outboards', 'mercury-impeller-replacement-when-they-fail')).toBe(true);
  });

  it('keeps ordinary service and sales articles on their existing CTA paths', () => {
    expect(isDiagnosticArticle('Service', 'mercury-maintenance-intervals-20-100-300-rule')).toBe(false);
    expect(isDiagnosticArticle('Buying Guide', 'mercury-115-hp-fourstroke-review-ontario')).toBe(false);
  });
});
