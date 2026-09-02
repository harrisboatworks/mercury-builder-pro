import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';

if (existsSync('.env.local')) loadEnvFile('.env.local');

const requiredCredentials = ['FINANCING_TEST_EMAIL', 'FINANCING_TEST_PASSWORD'];
const missingCredentials = requiredCredentials.filter((name) => !process.env[name]?.trim());

if (missingCredentials.length > 0) {
  console.error(
    `Missing required financing integration credentials: ${missingCredentials.join(', ')}`,
  );
  process.exit(2);
}

const result = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['vitest', 'run', 'src/lib/__tests__/financing-submission-permissions.test.ts'],
  {
    env: {
      ...process.env,
      HBW_FINANCING_TEST_RUNNER: 'dedicated-financing-integration-runner',
    },
    stdio: 'inherit',
  },
);

if (result.error) {
  console.error(`Unable to run the financing integration test: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
