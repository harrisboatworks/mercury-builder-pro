import { describe, expect, it } from 'vitest';
import { getArticleBySlug } from '@/data/blogArticles';
import { filterFaultCodeRows, parseFaultCodeRows } from '@/lib/faultCodeLookup';

const article = getArticleBySlug('mercury-outboard-fault-codes-lookup');
const rows = parseFaultCodeRows(article?.content ?? '');

describe('FaultCodeFinder', () => {
  it('reads every modern code pair, including the current dealer update', () => {
    const modernCodes = new Set(
      rows.filter((row) => row.source === 'modern').flatMap((row) => row.codes),
    );

    expect(modernCodes.size).toBe(131);
    expect(modernCodes).toContain('621-5');
    expect(modernCodes).toContain('3043-6');
  });

  it('matches complete modern pairs exactly', () => {
    const matches = filterFaultCodeRows(rows, '621-5');

    expect(matches).toHaveLength(1);
    expect(matches[0].meaning).toMatch(/system voltage lower/i);
  });

  it('expands legacy ranges so a single displayed ID is searchable', () => {
    const matches = filterFaultCodeRows(rows, '23');

    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({
      source: 'legacy',
      codeLabel: '23',
    });
    expect(matches[0].meaning).toMatch(/water in fuel/i);
  });

  it('searches meanings across both scoped tables', () => {
    const matches = filterFaultCodeRows(rows, 'water in fuel');

    expect(matches.some((row) => row.codes.includes('1108-25'))).toBe(true);
    expect(matches.some((row) => row.codes.includes('23'))).toBe(true);
  });
});
