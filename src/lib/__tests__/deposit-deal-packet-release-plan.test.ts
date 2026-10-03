import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const RUNBOOK = 'docs/runbooks/deposit-deal-packet-release-plan.md';
const MIGRATION = '20260823120000_deposit_deal_packet.sql';
const EDGE_SLUGS = [
  'create-payment',
  'stripe-webhook',
  'send-deposit-confirmation-email',
  'quote-document-api',
] as const;

describe('deposit deal-packet release plan contract', () => {
  it('exists and lists migration then Edge slugs then frontend', () => {
    expect(existsSync(RUNBOOK)).toBe(true);
    const runbook = readFileSync(RUNBOOK, 'utf8');
    expect(runbook).toContain(MIGRATION);
    for (const slug of EDGE_SLUGS) {
      expect(runbook).toContain(slug);
    }
    expect(runbook.toLowerCase()).toContain('frontend');
    expect(runbook).toContain('Migration before Edge before frontend');

    const migrationIdx = runbook.indexOf(MIGRATION);
    const firstEdgeIdx = Math.min(...EDGE_SLUGS.map((slug) => runbook.indexOf(slug)));
    const lastEdgeIdx = Math.max(...EDGE_SLUGS.map((slug) => runbook.indexOf(slug)));
    const frontendIdx = runbook.toLowerCase().indexOf('frontend last');
    expect(migrationIdx).toBeGreaterThan(-1);
    expect(firstEdgeIdx).toBeGreaterThan(migrationIdx);
    expect(frontendIdx).toBeGreaterThan(lastEdgeIdx);
  });
});
