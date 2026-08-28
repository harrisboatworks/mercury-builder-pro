import { describe, expect, it } from 'vitest';
import { hasIdentifiedPdfCustomer } from './pdf-lead-tracking';

describe('hasIdentifiedPdfCustomer', () => {
  it('requires both a non-blank name and email', () => {
    expect(hasIdentifiedPdfCustomer({ name: 'Taylor', email: 'taylor@example.com' })).toBe(true);
    expect(hasIdentifiedPdfCustomer({ name: ' ', email: 'taylor@example.com' })).toBe(false);
    expect(hasIdentifiedPdfCustomer({ name: 'Taylor', email: ' ' })).toBe(false);
    expect(hasIdentifiedPdfCustomer({})).toBe(false);
  });
});
