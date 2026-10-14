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
  sql(['-f', resolve('supabase/migrations/20261013203000_native_deposit_submission_consent.sql')]);
  sql(['-f', resolve('supabase/migrations/20261013213000_native_deposit_unsubmitted_recovery.sql')]);
  sql(['-f', resolve('supabase/migrations/20261014150000_native_deposit_recovery_lifecycle.sql')]);
  console.log(sql(['-f', resolve('scripts/native-deposit-pg/checks.sql')]));
  // Begin before consent expiry, block on the saved-quote lock, then release
  // after expiry. The first-submission gate must use the post-lock clock.
  const expiryId = '73737373-7373-4373-8373-737373737373';
  sql(['-c', `SET ROLE service_role;
    SELECT public.record_native_deposit_buyer_approval('${expiryId}','ndc_73737373737343738373737373737373','${expiryId}','36363636-3636-4636-8636-363636363636',50000,repeat('a',64),'deposit-policy/v1','in_stock_refundable','hbw-reservation-terms/2026-04-08',now()+interval '4 seconds');
    SELECT public.claim_native_deposit_attempt('${expiryId}',repeat('3',64),repeat('4',64),50000,'acct_synthetic',false);
    SELECT public.bind_native_deposit_payment_intent(id,NULL,'unknown') FROM public.native_deposit_attempts WHERE intent_id='${expiryId}';`]);
  const expiryOwner = spawn(join(bin,'psql'), ['-X','-v','ON_ERROR_STOP=1','-q','-t','-A'], {env:{...env,PGAPPNAME:'native_expiry_owner'},stdio:['pipe','pipe','pipe']});
  let expiryOwnerText=''; expiryOwner.stdout.on('data',b=>expiryOwnerText+=b.toString());
  expiryOwner.stdin.write(`BEGIN; SELECT id FROM public.saved_quotes WHERE id='${expiryId}' FOR UPDATE; SELECT 'expiry_owner_ready';\n`);
  const expiryDeadline=Date.now()+10000;
  while(!expiryOwnerText.includes('expiry_owner_ready') && Date.now()<expiryDeadline) await new Promise(r=>setTimeout(r,20));
  if(!expiryOwnerText.includes('expiry_owner_ready')) throw new Error('Expiry lock owner failed');
  const expiryWaiter = spawn(join(bin,'psql'), ['-X','-v','ON_ERROR_STOP=1','-q','-t','-A','-c', `SET ROLE service_role; SELECT public.begin_native_deposit_submission(id,repeat('3',64),repeat('4',64),50000,'acct_synthetic',false,now()+interval '7 days') FROM public.native_deposit_attempts WHERE intent_id='${expiryId}';`], {env:{...env,PGAPPNAME:'native_expiry_waiter'},stdio:['ignore','pipe','pipe']});
  let expiryText=''; let expiryError=''; expiryWaiter.stdout.on('data',b=>expiryText+=b.toString()); expiryWaiter.stderr.on('data',b=>expiryError+=b.toString());
  const expiryDone=new Promise((done,reject)=>expiryWaiter.on('exit',code=>code===0?done():reject(new Error(expiryError))));
  let expiryWaiting=false;
  while(!expiryWaiting && Date.now()<expiryDeadline) {
    expiryWaiting=sql(['-t','-A','-c', "SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE application_name='native_expiry_waiter' AND wait_event_type='Lock');"]).trim()==='t';
    if(!expiryWaiting) await new Promise(r=>setTimeout(r,20));
  }
  if(!expiryWaiting) throw new Error('Consent gate never waited for row lock');
  while(sql(['-t','-A','-c', `SELECT clock_timestamp() >= expires_at FROM public.native_deposit_approvals WHERE intent_id='${expiryId}';`]).trim()!=='t') await new Promise(r=>setTimeout(r,50));
  expiryOwner.stdin.end('COMMIT;\n'); await expiryDone;
  if(expiryText.trim()!=='f') throw new Error('Consent expired during lock wait but submission was authorized');
  if(sql(['-t','-A','-c', `SELECT submitted_at IS NULL FROM public.native_deposit_attempts WHERE intent_id='${expiryId}';`]).trim()!=='t') throw new Error('Expired consent left submission marker');
  console.log('Consent expired during a real row-lock wait: first submission refused, marker absent.');
  if(sql(['-t','-A','-c',`SET ROLE service_role; SELECT public.claim_hosted_deposit_rail('${expiryId}');`]).trim()!=='t') throw new Error('Expired unsubmitted native attempt trapped hosted fallback');
  if(sql(['-t','-A','-c',`SELECT retired_at IS NOT NULL FROM public.native_deposit_intents WHERE id='${expiryId}';`]).trim()!=='t') throw new Error('Hosted fallback did not retain a retired audit');
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
  console.log(sql(['-f', resolve('scripts/native-deposit-pg/recovery-checks.sql')]));
  sql(['-f', resolve('scripts/native-deposit-pg/recovery-race-seed.sql')]);
  async function lockedRace(label, savedId, winnerSql, loserSql, preSql = '', options = {}) {
    const owner = spawn(join(bin,'psql'), ['-X','-v','ON_ERROR_STOP=1','-q','-t','-A'], { env: {...env,PGAPPNAME:label+'_owner'}, stdio:['pipe','pipe','pipe'] });
    let ownerText='', ownerError=''; owner.stdout.on('data',b=>ownerText+=b); owner.stderr.on('data',b=>ownerError+=b);
    const ownerDone = new Promise((done,reject)=>owner.on('exit',c=>c===0?done():reject(new Error(ownerError))));
    owner.stdin.write(`BEGIN; SET ROLE service_role; SELECT id FROM public.saved_quotes WHERE id='${savedId}' FOR UPDATE; ${preSql} SELECT 'ready';\n`);
    const deadline=Date.now()+10000;
    while(!ownerText.includes('ready') && Date.now()<deadline) await new Promise(r=>setTimeout(r,20));
    if(!ownerText.includes('ready')) { owner.kill(); throw new Error(label+' owner failed'); }
    const loser=spawn(join(bin,'psql'), ['-X','-v','ON_ERROR_STOP=1','-q','-t','-A','-c','SET ROLE service_role; '+loserSql], {env:{...env,PGAPPNAME:label+'_loser'},stdio:['ignore','pipe','pipe']});
    let loserText='', loserError=''; loser.stdout.on('data',b=>loserText+=b); loser.stderr.on('data',b=>loserError+=b);
    const loserDone=new Promise((done,reject)=>loser.on('exit',c=>c===0?done():reject(new Error(loserError))));
    let waiting=false;
    while(!waiting && Date.now()<deadline) {
      waiting=sql(['-t','-A','-c',`SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE application_name='${label}_loser' AND wait_event_type='Lock');`]).trim()==='t';
      if(!waiting) await new Promise(r=>setTimeout(r,20));
    }
    if(!waiting) { owner.kill(); loser.kill(); throw new Error(label+' did not contend on a real row lock'); }
    if(options.expiryIntentId) while(sql(['-t','-A','-c',`SELECT clock_timestamp() >= expires_at FROM public.native_deposit_approvals WHERE intent_id='${options.expiryIntentId}';`]).trim()!=='t') await new Promise(r=>setTimeout(r,50));
    owner.stdin.end(winnerSql+' COMMIT;\n'); await Promise.all([ownerDone,loserDone]);
    if(loserText.trim()!==(options.expectedOutput || 'f')) throw new Error(label+' loser was admitted: '+loserText);
  }
  const cancelId='77777777-7777-4777-8777-777777777777', submitId='78787878-7878-4878-8878-787878787878';
  const begin = (id, fp) => `SELECT public.begin_native_deposit_submission(id,repeat('${fp}',64),repeat('0',64),50000,'acct_synthetic',false,now()+interval '7 days') FROM public.native_deposit_attempts WHERE intent_id='${id}';`;
  await lockedRace('native_cancel_first',cancelId,`SELECT public.retire_unsubmitted_native_deposit('${cancelId}',false);`,begin(cancelId,'9'));
  if(sql(['-t','-A','-c',`SET ROLE service_role; SELECT public.claim_hosted_deposit_rail('${cancelId}');`]).trim()!=='t') throw new Error('Canceled rail not released');
  await lockedRace('native_submit_first',submitId,begin(submitId,'b'),`SELECT public.retire_unsubmitted_native_deposit('${submitId}',false);`);
  if(sql(['-t','-A','-c',`SET ROLE service_role; SELECT public.claim_hosted_deposit_rail('${submitId}');`]).trim()!=='f') throw new Error('Submitted payment crossed hosted rail');
  const attempt = `(SELECT id FROM public.native_deposit_attempts WHERE intent_id='${submitId}')`;
  await lockedRace('native_bound_state',submitId,'',
    `SELECT CASE WHEN public.bind_native_deposit_payment_intent(${attempt},NULL,'unknown') THEN false ELSE true END;`,
    `SELECT public.bind_native_deposit_payment_intent(${attempt},'pi_staterace','requires_action');`);
  if(sql(['-t','-A','-c',`SELECT status FROM public.native_deposit_attempts WHERE intent_id='${submitId}';`]).trim()!=='requires_action') throw new Error('Concurrent uncertainty destroyed bank action');
  await lockedRace('native_hosted_vs_submit',submitId,`SELECT public.bind_native_deposit_payment_intent(${attempt},'pi_staterace','processing');`, `SELECT public.claim_hosted_deposit_rail('${submitId}');`);
  const fpOwner='81818181-8181-4181-8181-818181818181', fpLoser='82828282-8282-4282-8282-828282828282';
  const fpClaim = id => `public.claim_native_deposit_attempt('${id}',repeat('c',64),repeat('0',64),50000,'acct_synthetic',false)`;
  await lockedRace('native_fingerprint',fpOwner,'',`SELECT ${fpClaim(fpLoser)}->>'reason';`,`SELECT ${fpClaim(fpOwner)};`,{expectedOutput:'token_already_bound'});
  if(sql(['-t','-A','-c',`SELECT EXISTS(SELECT 1 FROM public.deposit_payment_rails WHERE saved_quote_id='${fpLoser}') OR EXISTS(SELECT 1 FROM public.native_deposit_attempts WHERE intent_id='${fpLoser}');`]).trim()!=='f') throw new Error('Fingerprint race left a rail or attempt');
  const freshId='85858585-8585-4585-8585-858585858585', lateId='86868686-8686-4686-8686-868686868686';
  await lockedRace('native_unsubmitted_hosted',freshId,begin(freshId,'d'),`SELECT public.claim_hosted_deposit_rail('${freshId}');`,
    `SELECT public.claim_native_deposit_attempt('${freshId}',repeat('d',64),repeat('0',64),50000,'acct_synthetic',false);`);
  sql(['-c',`SET ROLE service_role; SELECT public.record_native_deposit_buyer_approval(id,child_id,saved_quote_id,motor_id,amount_cents,document_sha256,policy_version,policy_code,terms_version,now()+interval '4 seconds') FROM public.native_deposit_intents WHERE id='${lateId}';`]);
  await lockedRace('native_expired_hosted',lateId,`SELECT public.claim_hosted_deposit_rail('${lateId}');`,begin(lateId,'f'),
    `SELECT public.claim_native_deposit_attempt('${lateId}',repeat('f',64),repeat('0',64),50000,'acct_synthetic',false);`,{expiryIntentId:lateId});
  sql(['-c', `SET ROLE service_role;
    DO $$ BEGIN
      IF NOT public.claim_hosted_deposit_rail('83838383-8383-4383-8383-838383838383') THEN RAISE EXCEPTION 'no-approval hosted claim refused'; END IF;
      IF NOT EXISTS(SELECT 1 FROM public.native_deposit_intents WHERE id='83838383-8383-4383-8383-838383838383' AND retired_at IS NOT NULL) THEN RAISE EXCEPTION 'no-approval intent not retired'; END IF;
      IF NOT public.claim_hosted_deposit_rail('84848484-8484-4484-8484-848484848484') THEN RAISE EXCEPTION 'fresh approval without attempt blocked hosted'; END IF;
      IF EXISTS(SELECT 1 FROM public.native_deposit_intents WHERE id='84848484-8484-4484-8484-848484848484' AND retired_at IS NOT NULL) THEN RAISE EXCEPTION 'hosted invalidated fresh consent'; END IF;
      IF public.claim_native_deposit_attempt('84848484-8484-4484-8484-848484848484',repeat('2',64),repeat('0',64),50000,'acct_synthetic',false)->>'reason' IS DISTINCT FROM 'hosted_rail' THEN RAISE EXCEPTION 'native crossed fresh hosted rail'; END IF;
    END $$;`]);
  console.log('Cross-quote token-fingerprint race rolls back the losing rail; fresh/expired hosted-vs-first-submit races and no-approval/fresh-approval hosted cases passed.');
  console.log('Real lock races: cancel versus submit in both orders, cross-rail recovery, and null uncertainty versus bound bank action passed.');
  console.log('Native deposit PostgreSQL acceptance passed. Synthetic local data only.');
} catch (error) {
  console.error(error.stderr?.toString() || error.message); process.exitCode = 1;
} finally {
  if (started) command('pg_ctl', ['-D', data, '-m', 'fast', '-w', 'stop']);
  rmSync(root, { recursive: true, force: true });
}
