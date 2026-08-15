import { describe, expect, it } from 'vitest';
import {
  isBlogPullQuoteSuppressed,
  stripSuppressedBlogPullQuotes,
} from './blogPullQuotePolicy.js';

const protectedSlug = 'outboard-trade-in-value-ontario-hbw';
const block = [
  'Before',
  '',
  '::pull-quote',
  'quote: Unverified customer story',
  'attribution: Mark T.',
  '::',
  '',
  'After',
].join('\n');

describe('blog pull-quote policy', () => {
  it('recognizes protected bare and localized-prefixed slugs', () => {
    expect(isBlogPullQuoteSuppressed(protectedSlug)).toBe(true);
    expect(isBlogPullQuoteSuppressed(`zh/${protectedSlug}`)).toBe(true);
    expect(isBlogPullQuoteSuppressed('mercury-dts-retrofit-eligibility-2026')).toBe(false);
  });

  it('keeps protected testimonial directives inert without deleting surrounding copy', () => {
    const stripped = stripSuppressedBlogPullQuotes(block, protectedSlug);
    expect(stripped).toContain('Before');
    expect(stripped).toContain('After');
    expect(stripped).not.toContain('Mark T.');
    expect(stripped).not.toContain('pull-quote');
  });

  it('preserves pull-quote examples inside fenced code', () => {
    const fenced = ['````md', block, '`````'].join('\n');
    expect(stripSuppressedBlogPullQuotes(fenced, protectedSlug)).toBe(fenced);
  });

  it('leaves unprotected article directives unchanged', () => {
    expect(stripSuppressedBlogPullQuotes(block, 'unprotected-article')).toBe(block);
  });
});
