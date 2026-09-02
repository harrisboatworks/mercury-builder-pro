// @vitest-environment node
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

function runStructuredDataCheck(input: {
  id: string;
  name: string;
  type: string | readonly string[];
}) {
  const fixtureDir = mkdtempSync(join(tmpdir(), 'hbw-structured-data-'));
  try {
    writeFileSync(join(fixtureDir, 'index.html'), `<!doctype html>
<script type="application/ld+json">
${JSON.stringify({
      '@context': 'https://schema.org',
      '@type': input.type,
      '@id': input.id,
      name: input.name,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Gores Landing',
        addressCountry: 'CA',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: 4.8,
        reviewCount: 42,
      },
    }, null, 2)}
</script>`);

    return spawnSync(process.execPath, ['scripts/check-structured-data.mjs'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: { ...process.env, SCHEMA_DIST: fixtureDir },
    });
  } finally {
    rmSync(fixtureDir, { recursive: true, force: true });
  }
}

describe('self-serving business rating schema guard', () => {
  it.each([
    ['LocalBusiness', 'https://www.mercuryrepower.ca/#localbusiness', 'Harris Boat Works'],
    ['Organization', 'https://www.mercuryrepower.ca/#organization', 'Harris Boat Works'],
    [
      ['Store', 'LocalBusiness'],
      'https://www.mercuryrepower.ca/mercury-outboards-ontario#localbusiness',
      'Harris Boat Works, Mercury Premier Dealer',
    ],
    [
      'BoatDealer',
      'https://www.mercuryrepower.ca/motors/example#seller',
      'Harris Boat Works',
    ],
    [
      'FinancialService',
      'https://www.mercuryrepower.ca/financing-application#financing',
      'Harris Boat Works Marine Financing',
    ],
  ] as const)('rejects HBW %s aggregate ratings', (type, id, name) => {
    const result = runStructuredDataCheck({
      type,
      id,
      name,
    });

    expect(result.status).toBe(1);
    expect(`${result.stdout}\n${result.stderr}`).toContain(
      'declares a self-serving aggregateRating',
    );
  });

  it('allows ratings for a third-party local business', () => {
    const result = runStructuredDataCheck({
      type: 'LocalBusiness',
      id: 'https://example.com/#localbusiness',
      name: 'Example Marina',
    });

    expect(result.status).toBe(0);
    expect(`${result.stdout}\n${result.stderr}`).not.toContain(
      'declares a self-serving aggregateRating',
    );
  });

  it('allows an HBW-branded non-business entity rating', () => {
    const result = runStructuredDataCheck({
      type: 'SoftwareApplication',
      id: 'https://www.mercuryrepower.ca/agents#mcp-server',
      name: 'Harris Boat Works MCP Server',
    });

    expect(result.status).toBe(0);
    expect(`${result.stdout}\n${result.stderr}`).not.toContain(
      'declares a self-serving aggregateRating',
    );
  });
});
