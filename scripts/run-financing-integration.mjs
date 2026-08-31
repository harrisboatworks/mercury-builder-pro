import { spawnSync } from 'node:child_process';

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
