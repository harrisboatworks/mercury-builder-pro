// Disposable local PostgreSQL 17 only. Never accepts a remote DSN.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { requirePostgres17Bin } from './lib/local-postgres17.mjs';
const bin = requirePostgres17Bin();
const root = mkdtempSync(join(tmpdir(), 'ndpg-'));
const data = join(root, 'data'); const socket = join(root, 'socket'); mkdirSync(socket);
const port = 45000 + Math.floor(Math.random() * 15000);
let started = false;
const command = (name, args, options = {}) => execFileSync(join(bin, name), args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...options });
try {
  command('initdb', ['-D', data, '--auth=trust', '--no-locale']);
  command('pg_ctl', ['-D', data, '-l', join(root, 'postgres.log'), '-o', `-k ${socket} -p ${port} -c listen_addresses=''`, '-w', 'start']); started = true;
  const env = { ...process.env, PGHOST: socket, PGPORT: String(port), PGDATABASE: 'postgres', PGSSLMODE: 'disable' };
  delete env.PGHOSTADDR; delete env.PGPASSWORD; delete env.PGSERVICE;
  const sql = args => command('psql', ['-X', '-v', 'ON_ERROR_STOP=1', '-q', ...args], { env });
  sql(['-f', resolve('scripts/deposit-deal-packet-pg/bootstrap.sql')]);
  sql(['-f', resolve('supabase/migrations/20260823120000_deposit_deal_packet.sql')]);
  sql(['-f', resolve('supabase/migrations/20260830193000_enforce_unique_deposit_checkout_bindings.sql')]);
  sql(['-f', resolve('scripts/native-deposit-pg/shape.sql')]);
  sql(['-f', resolve('supabase/migrations/20261012233000_native_agent_deposit.sql')]);
  console.log(sql(['-f', resolve('scripts/native-deposit-pg/checks.sql')]));
  console.log('Native deposit PostgreSQL acceptance passed. Synthetic local data only.');
} catch (error) {
  console.error(error.stderr?.toString() || error.message); process.exitCode = 1;
} finally {
  if (started) command('pg_ctl', ['-D', data, '-m', 'fast', '-w', 'stop']);
  rmSync(root, { recursive: true, force: true });
}
