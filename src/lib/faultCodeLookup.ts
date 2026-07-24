export type FaultCodeSource = 'modern' | 'legacy';

export interface FaultCodeRow {
  source: FaultCodeSource;
  codeLabel: string;
  codes: string[];
  meaning: string;
  reference: string;
}

const DASHES_RE = /[‐‑‒–—−]/g;
const MODERN_CODE_RE = /\b\d{3,4}-\d{1,2}\b/g;
const LEGACY_CODE_RE = /^\d+(?:-\d+)?$/;

const normalize = (value: string) =>
  value.toLowerCase().replace(DASHES_RE, '-').replace(/\s+/g, ' ').trim();

function expandLegacyCodes(label: string): string[] {
  const normalized = normalize(label);
  if (!LEGACY_CODE_RE.test(normalized)) return [];

  const [first, last] = normalized.split('-').map(Number);
  if (last === undefined) return [String(first)];

  return Array.from({ length: last - first + 1 }, (_, index) => String(first + index));
}

/**
 * Reads the two scoped fault-code tables from the article Markdown. The parser
 * deliberately ignores every other table so a normal article edit cannot turn
 * unrelated numbers into diagnostic results.
 */
export function parseFaultCodeRows(content: string): FaultCodeRow[] {
  const rows: FaultCodeRow[] = [];
  let source: FaultCodeSource | null = null;

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();

    if (/^##\s+Modern UFC Table\b/i.test(line)) {
      source = 'modern';
      continue;
    }
    if (/^##\s+Legacy VesselView Fault IDs\b/i.test(line)) {
      source = 'legacy';
      continue;
    }
    if (/^##\s+/.test(line)) {
      source = null;
      continue;
    }
    if (!source || !line.startsWith('|')) continue;

    const cells = line
      .slice(1, line.endsWith('|') ? -1 : undefined)
      .split('|')
      .map((cell) => cell.trim());

    if (cells.length < 3 || cells.some((cell) => /^:?-{3,}:?$/.test(cell))) continue;

    const codeLabel = cells[0].replace(/\*\*/g, '').trim();
    const codes =
      source === 'modern'
        ? normalize(codeLabel).match(MODERN_CODE_RE) ?? []
        : expandLegacyCodes(codeLabel);

    if (!codes.length) continue;

    rows.push({
      source,
      codeLabel,
      codes,
      meaning: cells[1],
      reference: cells[2],
    });
  }

  return rows;
}

export function filterFaultCodeRows(rows: FaultCodeRow[], query: string): FaultCodeRow[] {
  const term = normalize(query);
  if (!term) return [];

  if (/^\d{3,4}-\d{1,2}$/.test(term) || /^\d{1,3}$/.test(term)) {
    return rows.filter((row) => row.codes.includes(term));
  }

  const words = term.split(' ').filter(Boolean);
  return rows.filter((row) => {
    const searchable = normalize(`${row.codeLabel} ${row.meaning} ${row.reference}`);
    return words.every((word) => searchable.includes(word));
  });
}

