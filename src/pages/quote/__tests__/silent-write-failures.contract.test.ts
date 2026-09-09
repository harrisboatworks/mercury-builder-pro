import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(path, 'utf8');

describe('silent write failure contracts', () => {
  it('does not call the never-created increment_contact_attempts RPC', () => {
    const source = read('src/components/admin/ContactLog.tsx');
    expect(source).not.toContain("rpc('increment_contact_attempts'");
    expect(source).toContain('quote_contact_log');
  });

  it('does not call the never-created get_table_schema RPC', () => {
    const source = read('src/components/admin/SecurityDashboard.tsx');
    expect(source).not.toContain("rpc('get_table_schema'");
    expect(source).not.toContain('rls-status');
  });
});
