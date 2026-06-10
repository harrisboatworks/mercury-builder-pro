#!/usr/bin/env node
/**
 * Design token guard.
 *
 * Flags hardcoded surface gradients and palette hex values inside src/ that
 * should instead use the centralized tokens defined in src/index.css:
 *   --gradient-image-bg     (motor image / card image background gradient)
 *   --surface-page          (matches the motor selection page background)
 *   --surface-card          (cream card body)
 *   --surface-image         (background behind motor images)
 *
 * See docs/design-tokens.md for guidance on which token to use where.
 *
 * Usage:
 *   node scripts/check-design-tokens.mjs           # report violations
 *   node scripts/check-design-tokens.mjs --quiet   # exit 1 only, no output
 *
 * CI: this script exits non-zero on any violation.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SRC = join(ROOT, 'src');

// Files that are allowed to contain raw hex / gradient literals (the source of
// truth for the tokens themselves).
const ALLOWLIST = new Set([
  'src/index.css',
  'tailwind.config.ts',
  'scripts/check-design-tokens.mjs',
]);

// Patterns that indicate a hardcoded surface gradient or palette value.
// Scope: only flag *background* and *gradient* uses of the cream palette.
// Foreground uses (text-/border-/ring-/caret-/divide-) of #F5F1EA on dark
// surfaces are legitimate and not surface tokens.
const RULES = [
  {
    id: 'hardcoded-image-gradient',
    // Any linear-gradient that mentions our cream/paper hexes — must use --gradient-image-bg.
    pattern: /linear-gradient\([^)]*#(?:F5F1EA|FAF8F4|ECE4D2)[^)]*\)/i,
    message:
      'Use `var(--gradient-image-bg)` instead of a hardcoded cream/paper linear-gradient.',
  },
  {
    id: 'hardcoded-bg-class',
    // Tailwind arbitrary bg- using cream/paper hex.
    pattern: /\bbg-\[#(?:F5F1EA|FAF8F4|ECE4D2)(?:\/\d+)?\]/i,
    message:
      'Use `bg-surface-page` / `bg-surface-card` (or `bg-repower-paper` / `bg-repower-cream`) instead of `bg-[#FAF8F4]` / `bg-[#F5F1EA]`.',
  },
  {
    id: 'hardcoded-bg-style',
    // Inline style background / backgroundColor using cream/paper hex.
    pattern: /background(?:Color)?\s*:\s*['"`]#(?:F5F1EA|FAF8F4|ECE4D2)\b/i,
    message:
      'Use a surface token (CSS var or Tailwind class) instead of a raw hex `background:` value.',
  },
];

const exts = new Set(['.ts', '.tsx', '.js', '.jsx', '.css']);
const violations = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const rel = relative(ROOT, full);
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full);
      continue;
    }
    if (!exts.has(extname(entry))) continue;
    if (ALLOWLIST.has(rel)) continue;
    const text = readFileSync(full, 'utf8');
    const lines = text.split('\n');
    for (const rule of RULES) {
      lines.forEach((line, i) => {
        if (rule.pattern.test(line)) {
          violations.push({ file: rel, line: i + 1, rule: rule.id, message: rule.message, snippet: line.trim() });
        }
      });
    }
  }
}

walk(SRC);

const quiet = process.argv.includes('--quiet');
if (violations.length === 0) {
  if (!quiet) console.log('✓ design-tokens: no hardcoded surface gradients or palette hexes found.');
  process.exit(0);
}

if (!quiet) {
  console.error(`✗ design-tokens: found ${violations.length} violation(s):\n`);
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  [${v.rule}]`);
    console.error(`    ${v.snippet}`);
    console.error(`    → ${v.message}\n`);
  }
  console.error('See docs/design-tokens.md for guidance.');
}
process.exit(1);
