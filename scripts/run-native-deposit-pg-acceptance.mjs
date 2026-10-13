// Disposable local PostgreSQL 17 only. Never accepts a remote DSN.
import { execFileSync, spawn } from 'node:child_process';
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
  // Reproduce an absent-customer-row complete/webhook race using real locks.
  const raceId = '74747474-7474-4474-8474-747474747474';
  sql(['-f', resolve('scripts/native-deposit-pg/race-seed.sql')]);
  const claim = `SELECT public.claim_native_motor_deposit_paid('${raceId}', (SELECT id FROM public.native_deposit_attempts WHERE intent_id='${raceId}'), '${raceId}', 'pi_race', 50000, repeat('a',64), '36363636-3636-4636-8636-363636363636', 'hbw-reservation-terms/2026-04-08', 'deposit-policy/v1', 'in_stock_refundable', 'evt_race', now());`;
  const owner = spawn(join(bin,'psql'), ['-X','-v','ON_ERROR_STOP=1','-q','-t','-A'], {env:{...env,PGAPPNAME:'native_race_owner'},stdio:['pipe','pipe','pipe']});
  let ownerText=''; let ownerError=''; owner.stdout.on('data',b=>ownerText+=b.toString()); owner.stderr.on('data',b=>ownerError+=b.toString());
  owner.stdin.write(`BEGIN; SET ROLE service_role; SELECT id FROM public.saved_quotes WHERE id='${raceId}' FOR UPDATE; SELECT 'owner_ready';\n`);
  const deadline = Date.now()+10000;
  while (!ownerText.includes('owner_ready') && Date.now()<deadline) await new Promise(r=>setTimeout(r,20));
  if (!ownerText.includes('owner_ready')) { owner.kill(); throw new Error('Race owner failed: '+ownerError); }
  const loser = spawn(join(bin,'psql'), ['-X','-v','ON_ERROR_STOP=1','-q','-t','-A','-c', 'SET ROLE service_role; '+claim], {env:{...env,PGAPPNAME:'native_race_loser'},stdio:['ignore','pipe','pipe']});
  let loserText=''; let loserError=''; loser.stdout.on('data',b=>loserText+=b.toString()); loser.stderr.on('data',b=>loserError+=b.toString());
  const finished = new Promise((resolveDone,reject)=>loser.on('exit',code=>code===0?resolveDone():reject(new Error(loserError))));
  let waiting=false;
  while (!waiting && Date.now()<deadline) {
    waiting = sql(['-t','-A','-c', "SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE application_name='native_race_loser' AND wait_event_type='Lock');"]).trim()==='t';
    if(!waiting) await new Promise(r=>setTimeout(r,20));
  }
  if (!waiting) { loser.kill(); owner.kill(); throw new Error('Race loser never reached saved-row lock'); }
  owner.stdin.end(claim+' COMMIT;\n');
  await finished;
  if (loserText.trim()!=='t') throw new Error('Concurrent paid claim incorrectly returned false: '+loserText);
  console.log('Concurrent complete/webhook absent-row claim returns paid for both participants.');
  console.log('Native deposit PostgreSQL acceptance passed. Synthetic local data only.');
} catch (error) {
  console.error(error.stderr?.toString() || error.message); process.exitCode = 1;
} finally {
  if (started) command('pg_ctl', ['-D', data, '-m', 'fast', '-w', 'stop']);
  rmSync(root, { recursive: true, force: true });
}
