import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * SEO cannibalization guard.
 *
 * Only the homepage ("/") is allowed to own the generic "mercury repower"
 * query. Any internal link whose visible anchor text is the bare phrase
 * "repower" / "mercury repower" must point at "/". Qualified anchors such as
 * "how a repower works" or "repower service overview" stay free to point at
 * /repower, and "current promotions" stays free to point at /promotions.
 */

const ROOT = resolve(process.cwd());
const SCAN_DIRS = ['src'];
const FILE_RE = /\.(tsx|ts)$/;
const SKIP_DIR = /(^|\/)(node_modules|__tests__|test|tests)(\/|$)/;
const SKIP_FILE = /\.test\.(ts|tsx)$/;

// Anchor text that is generic enough to compete with the homepage.
const GENERIC_ANCHORS = new Set([
  'repower',
  'repowers',
  'repowering',
  'mercury repower',
  'mercury repowers',
  'mercury repowering',
  'mercury repower ontario',
  'boat engine repower',
  'outboard repower',
  'mercury outboard repower',
]);

const FORBIDDEN_TARGETS = ['/repower', '/promotions', '/quote/motor-selection', '/quote'];

type Violation = {
  file: string;
  line: number;
  column: number;
  anchor: string;
  target: string;
};

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const rel = relative(ROOT, full);
    if (SKIP_DIR.test(rel)) continue;
    if (statSync(full).isDirectory()) walk(full, out);
    else if (FILE_RE.test(entry) && !SKIP_FILE.test(entry)) out.push(full);
  }
  return out;
}

// <Link to="/x" ...>Text</Link> and <a href="/x" ...>Text</a>, text only
// (no nested elements): a nested element means the anchor is a card or button
// with richer content, which this guard deliberately does not judge.
const LINK_RE =
  /<(Link|a)\b([^>]*?)>\s*([^<>{}]*?)\s*<\/\1>/g;
const TARGET_RE = /\b(?:to|href)=["']([^"']+)["']/;

function normalize(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/[→←↠»›]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    // Strip leading/trailing sentence punctuation and symbols so "Mercury Repower."
    // and "Repower," are treated identically to the bare phrase.
    .replace(/^[\s.:,!?;]+|[\s.:,!?;]+$/g, '')
    .toLowerCase();
}

function collectViolations(): Violation[] {
  const violations: Violation[] = [];
  for (const dir of SCAN_DIRS) {
    for (const file of walk(join(ROOT, dir))) {
      const source = readFileSync(file, 'utf8');
      for (const match of source.matchAll(LINK_RE)) {
        const target = match[2].match(TARGET_RE)?.[1];
        if (!target || !target.startsWith('/')) continue;
        const anchor = normalize(match[3]);
        if (!GENERIC_ANCHORS.has(anchor)) continue;
        const path = target.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
        if (path === '/') continue;
        if (!FORBIDDEN_TARGETS.includes(path)) continue;
        // Resolve the match offset to a 1-indexed line/column so the failure
        // message can be pasted straight into an editor.
        const before = source.slice(0, match.index ?? 0);
        const line = before.split('\n').length;
        const column = (match.index ?? 0) - (before.lastIndexOf('\n') + 1) + 1;
        violations.push({
          file: relative(ROOT, file),
          line,
          column,
          anchor: match[3].trim(),
          target,
        });
      }
    }
  }
  return violations;
}

describe('generic "repower" anchor targets', () => {
  it('sends every generic repower anchor to the homepage', () => {
    const violations = collectViolations();
    const report = violations
      .map(
        (v) =>
          `${v.file}:${v.line}:${v.column}  "${v.anchor}" -> ${v.target}  (should be "/")`
      )
      .join('\n');
    expect(
      report,
      violations.length
        ? `${violations.length} generic repower anchor(s) must point at "/":\n${report}`
        : ''
    ).toBe('');
  });

  it('flags a generic anchor pointing at a competing page', () => {
    // Sanity check on the matcher itself, so a broken regex cannot make the
    // guard silently pass forever.
    const sample = '<Link to="/repower">Mercury Repower</Link>';
    const match = [...sample.matchAll(LINK_RE)][0];
    expect(match).toBeDefined();
    expect(GENERIC_ANCHORS.has(normalize(match![3]))).toBe(true);
    expect(FORBIDDEN_TARGETS).toContain(match![2].match(TARGET_RE)![1]);
  });

  it('flags case and punctuation variants of Mercury Repower / Repower', () => {
    // These variants must all be recognized as generic and therefore forbidden
    // when they point at /repower or /promotions.
    const variants = [
      ['Mercury Repower', '/repower'],
      ['mercury repower', '/promotions'],
      ['Repower', '/repower'],
      ['repower', '/promotions'],
      ['Mercury Repower.', '/repower'],
      ['Repower,', '/promotions'],
      ['Mercury Repower!', '/repower'],
      ['Mercury Repower;', '/promotions'],
      ['Repower?', '/repower'],
      ['Mercury Repower:', '/promotions'],
    ];

    for (const [anchor, target] of variants) {
      const sample = `<a href="${target}">${anchor}</a>`;
      const match = [...sample.matchAll(LINK_RE)][0];
      expect(match, `regex should match anchor "${anchor}"`).toBeDefined();
      const normalized = normalize(match![3]);
      expect(
        GENERIC_ANCHORS.has(normalized),
        `"${anchor}" normalized to "${normalized}" should be a generic anchor`
      ).toBe(true);
      expect(FORBIDDEN_TARGETS).toContain(target);
    }
  });

  it('does not flag qualified anchors that mention repower', () => {
    // Qualified anchors are allowed to keep pointing at /repower.
    const qualified = [
      'how a repower works',
      'Repower service overview',
      'Mercury repower process',
      'repowering your boat',
    ];

    for (const anchor of qualified) {
      const sample = `<Link to="/repower">${anchor}</Link>`;
      const match = [...sample.matchAll(LINK_RE)][0];
      expect(match).toBeDefined();
      expect(GENERIC_ANCHORS.has(normalize(match![3]))).toBe(false);
    }
  });
});
