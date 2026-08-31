import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';

const entryPoints = process.argv.slice(2);

if (entryPoints.length === 0) {
  console.error(
    'Pass every changed Edge entry point, for example: npm run typecheck:edge -- supabase/functions/send-sms/index.ts',
  );
  process.exit(2);
}

const functionsRoot = resolve('supabase/functions');

for (const entryPoint of entryPoints) {
  const absolutePath = resolve(entryPoint);
  const relativePath = relative(functionsRoot, absolutePath);
  const isInsideFunctions =
    relativePath !== '' && relativePath !== '..' && !relativePath.startsWith(`..${sep}`);

  if (!isInsideFunctions || !absolutePath.endsWith('.ts') || !existsSync(absolutePath)) {
    console.error(`Invalid Edge TypeScript path: ${entryPoint}`);
    process.exit(2);
  }
}

const result = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  [
    '--yes',
    'deno@2.9.5',
    'check',
    '--no-lock',
    '--config',
    'supabase/functions/deno.json',
    ...entryPoints,
  ],
  { stdio: 'inherit' },
);

if (result.error) {
  console.error(`Unable to run the pinned Deno checker: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
