import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

/**
 * Mobile visual regression guard.
 *
 * On narrow viewports, a checklist <li> that wraps an icon + multi-line text
 * will stack the icon above the text unless the <li> itself is a flex row
 * with `items-start` (or equivalent). We've hit this bug repeatedly on the
 * /repower page, so this test scans every page/component and asserts that
 * any <li> containing a leading icon (Check / X / CheckCircle2 / XCircle /
 * CircleCheck) uses an inline-row layout.
 */

const ROOTS = ['src/pages', 'src/components'];
const ICON_RE = /<\s*(Check|X|CheckCircle2|XCircle|CircleCheck|MinusCircle)\b[^>]*\/>/;
// Matches <li ... className="..."> ... </li> non-greedy. Good enough for our codebase.
const LI_RE = /<li\b([^>]*)>([\s\S]*?)<\/li>/g;
const CLASSNAME_RE = /className\s*=\s*(?:"([^"]*)"|\{`([^`]*)`\}|\{"([^"]*)"\})/;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (/\.(tsx|jsx)$/.test(name)) out.push(p);
  }
  return out;
}

const files = ROOTS.flatMap((r) => walk(r));

interface Offender {
  file: string;
  snippet: string;
  reason: string;
}

const offenders: Offender[] = [];

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  let m: RegExpExecArray | null;
  LI_RE.lastIndex = 0;
  while ((m = LI_RE.exec(src))) {
    const attrs = m[1];
    const inner = m[2];
    if (!ICON_RE.test(inner)) continue; // only checklist-style <li>

    const cmatch = CLASSNAME_RE.exec(attrs);
    const cls = (cmatch?.[1] ?? cmatch?.[2] ?? cmatch?.[3] ?? '').trim();

    const hasFlex = /(^|\s)!?flex(\s|$)/.test(cls) || /\binline-flex\b/.test(cls);
    const hasItemsStart = /\bitems-start\b/.test(cls) || /\bitems-baseline\b/.test(cls);

    if (!hasFlex || !hasItemsStart) {
      offenders.push({
        file,
        snippet: m[0].slice(0, 200).replace(/\s+/g, ' '),
        reason: !hasFlex
          ? 'missing `flex` / `inline-flex` on <li>'
          : 'missing `items-start` (icon will center-align and look stacked when text wraps)',
      });
    }
  }
}

describe('checklist <li> mobile inline-icon guard', () => {
  it('every checklist row uses flex-row with items-start so icons stay inline', () => {
    if (offenders.length) {
      const msg = offenders
        .map((o) => `\n  • ${o.file}\n      ${o.reason}\n      ${o.snippet}`)
        .join('');
      throw new Error(
        `Found ${offenders.length} checklist <li>(s) where the icon will stack above text on mobile:${msg}\n\n` +
          'Fix: add `flex flex-row items-start gap-2` (or similar) to the <li> className.',
      );
    }
    expect(offenders).toEqual([]);
  });
});
