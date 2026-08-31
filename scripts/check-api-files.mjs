import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const findJavaScriptFiles = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return findJavaScriptFiles(path);
    return entry.isFile() && entry.name.endsWith('.js') ? [path] : [];
  });

for (const file of findJavaScriptFiles('api')) {
  const result = spawnSync(process.execPath, ['--input-type=module', '--check'], {
    input: readFileSync(file),
    stdio: ['pipe', 'inherit', 'inherit'],
  });
  if (result.error) {
    console.error(`Unable to syntax-check ${file}: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`Syntax check failed for ${file}`);
    process.exit(result.status ?? 1);
  }
}
