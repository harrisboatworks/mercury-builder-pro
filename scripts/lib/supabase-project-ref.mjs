import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Shared project-ref resolution for deploy and drift-watch.
 * Precedence: non-empty SUPABASE_PROJECT_REF, then supabase/config.toml project_id.
 * The ref is not a credential; config.toml is the committed fallback.
 */

export function projectRefFromConfig(toml) {
  const match = String(toml).match(/^\s*project_id\s*=\s*"([^"]+)"/m);
  return match ? match[1].trim() : '';
}

export function resolveProjectRef(env = process.env, options = {}) {
  const fromEnv = typeof env.SUPABASE_PROJECT_REF === 'string' ? env.SUPABASE_PROJECT_REF.trim() : '';
  if (fromEnv) return fromEnv;
  const root = options.root ?? process.cwd();
  const configPath = join(root, 'supabase/config.toml');
  if (!existsSync(configPath)) return '';
  try {
    return projectRefFromConfig(readFileSync(configPath, 'utf8'));
  } catch {
    return '';
  }
}
