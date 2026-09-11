#!/usr/bin/env python3
"""Run the real claim RPC race in a disposable local PostgreSQL cluster.

Requires initdb, pg_ctl and psql on PATH. No database URL, credentials, existing
server or email provider is used. --baseline proves the pre-fix double claim.
"""
import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import time

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'supabase/migrations/20260815160000_quote_email_delivery_audit.sql'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--baseline', action='store_true')
    args = parser.parse_args()
    for tool in ('initdb', 'pg_ctl', 'psql'):
        if not shutil.which(tool):
            parser.error(f'{tool} must be on PATH')
    # Remove inherited libpq connection settings, including service/password files.
    env = {k: v for k, v in os.environ.items() if not k.startswith('PG')}
    children = []
    with tempfile.TemporaryDirectory(prefix='quote-retry-') as temporary:
        tmp = Path(temporary)
        data = tmp / 'data'
        subprocess.run(['initdb', '-D', str(data), '-U', 'postgres', '-A', 'trust', '--no-locale'],
                       env=env, check=True, capture_output=True)
        subprocess.run(['pg_ctl', '-D', str(data), '-l', str(tmp / 'server.log'),
                        '-o', f"-k {tmp} -c listen_addresses='' -c fsync=off", '-w', 'start'],
                       env=env, check=True, capture_output=True)
        command = ['psql', '-X', '-qAt', '-v', 'ON_ERROR_STOP=1', '-h', str(tmp),
                   '-U', 'postgres', '-d', 'postgres']

        def sql(statement):
            return subprocess.run(command, input=statement, env=env, text=True,
                                  check=True, capture_output=True, timeout=15).stdout.strip()

        def start(statement, name):
            process = subprocess.Popen(command, env={**env, 'PGAPPNAME': name},
                                       stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                                       stderr=subprocess.PIPE, text=True)
            children.append(process)
            process.stdin.write(statement + '\n')
            process.stdin.flush()
            return process

        def wait_for(query, expected):
            deadline = time.monotonic() + 10
            while time.monotonic() < deadline:
                if sql(query) == expected:
                    return
                time.sleep(0.05)
            raise AssertionError(f'Database barrier timed out: {query}')

        quote = '11111111-1111-4111-8111-111111111111'
        claim = ("SELECT public.claim_quote_email_delivery_v1("
                 f"'race', 'quote_delivery', 'Q1', '{quote}', 'hash', 'admin');")
        try:
            sql("""
                CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
                CREATE SCHEMA auth;
                CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS 'SELECT NULL::uuid';
                CREATE TYPE public.app_role AS ENUM ('admin');
                CREATE FUNCTION public.has_role(uuid, public.app_role) RETURNS boolean
                  LANGUAGE sql AS 'SELECT false';
            """)
            sql(BASE.read_text())
            if not args.baseline:
                corrections = [p for p in sorted((ROOT / 'supabase/migrations').glob('*.sql'))
                               if p.name > BASE.name
                               and 'CREATE OR REPLACE FUNCTION public.claim_quote_email_delivery_v1('
                               in p.read_text()]
                assert corrections, 'Forward claim migration missing'
                for migration in corrections:
                    sql(migration.read_text())
            initial = json.loads(sql(claim))
            assert initial['status'] == 'claimed'
            delivery = initial['delivery_id']
            sql(f"SELECT public.complete_quote_email_delivery_v1('{delivery}', 'failed', NULL, 'rejected', 'none');")
            # Hold the row while BOTH retry sessions reach the locking point.
            # Before the fix both read 'failed' and block at the unconditional
            # UPDATE; after the fix the decision itself is serialized.
            locker = start("BEGIN; SELECT id FROM public.quote_email_deliveries WHERE idempotency_key='race' FOR UPDATE;", 'quote-locker')
            wait_for("SELECT count(*) FROM pg_stat_activity WHERE application_name='quote-locker' AND state='idle in transaction';", '1')
            retries = [start(claim, f'quote-retry-{i}') for i in range(2)]
            wait_for("SELECT count(*) FROM pg_stat_activity WHERE application_name LIKE 'quote-retry-%' AND wait_event_type='Lock';", '2')
            out, error = locker.communicate('COMMIT;\n', timeout=15)
            assert locker.returncode == 0, error
            verdicts = []
            for process in retries:
                out, error = process.communicate(timeout=15)
                assert process.returncode == 0, error
                verdicts.append(json.loads(out))
            statuses = sorted(v['status'] for v in verdicts)
            expected = ['claimed', 'claimed'] if args.baseline else ['claimed', 'in_flight']
            assert statuses == expected, (statuses, expected)
            assert all(v['delivery_id'] == delivery for v in verdicts)
            print(f"{'BASELINE reproduced' if args.baseline else 'PASS'}: concurrent retries -> {statuses}")
            assert json.loads(sql(claim))['status'] == 'in_flight'
            assert json.loads(sql(claim.replace("'hash'", "'other-hash'")))['status'] == 'mismatch'
            sql(f"SELECT public.complete_quote_email_delivery_v1('{delivery}', 'sent', 'provider-test-id', NULL, 'none');")
            duplicate = json.loads(sql(claim))
            assert duplicate['status'] == 'duplicate'
            assert duplicate['message_id'] == 'provider-test-id'
            assert sql('SELECT count(*) FROM public.quote_email_deliveries;') == '1'
            for role, allowed in [('anon', 'f'), ('authenticated', 'f'), ('service_role', 't')]:
                assert sql(f"SELECT has_function_privilege('{role}', 'public.claim_quote_email_delivery_v1(text,text,text,uuid,text,text)', 'EXECUTE');") == allowed
            print('PASS: sending suppression, identity mismatch, sent duplicate/message ID, one row, RPC grants')
        finally:
            for process in children:
                if process.poll() is None:
                    process.kill()
                    process.wait()
            subprocess.run(['pg_ctl', '-D', str(data), '-m', 'immediate', '-w', 'stop'],
                           env=env, check=True, capture_output=True)


if __name__ == '__main__':
    main()
