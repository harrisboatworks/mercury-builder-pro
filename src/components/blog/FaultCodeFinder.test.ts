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

  it('disambiguates opposite conditions in an exact grouped-code match', () => {
    const above = filterFaultCodeRows(rows, '1012-24');
    const below = filterFaultCodeRows(rows, '1012-25');

    expect(above).toHaveLength(1);
    expect(above[0]).toMatchObject({
      codeLabel: '1012-24',
      groupedCodeLabel: '1012-24 / 1012-25',
    });
    expect(above[0].meaning).toMatch(/above valid limit/i);
    expect(above[0].meaning).not.toMatch(/below valid limit/i);
    expect(below[0].meaning).toMatch(/below valid limit/i);
    expect(below[0].meaning).not.toMatch(/above valid limit/i);
  });

  it('does not treat a bare four-digit UFC stem as a valid result', () => {
    expect(filterFaultCodeRows(rows, '1012')).toEqual([]);
    expect(filterFaultCodeRows(rows, '3043')).toEqual([]);
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
