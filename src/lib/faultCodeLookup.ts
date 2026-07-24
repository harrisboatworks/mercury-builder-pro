export type FaultCodeSource = 'modern' | 'legacy';

export interface FaultCodeRow {
  source: FaultCodeSource;
  codeLabel: string;
  codes: string[];
  meaning: string;
  guidance: string;
  groupedCodeLabel?: string;
}

const DASHES_RE = /[‐‑‒–—−]/g;
const MODERN_CODE_RE = /\b\d{3,4}-\d{1,2}\b/g;
const LEGACY_CODE_RE = /^\d+(?:-\d+)?$/;

const normalize = (value: string) =>
  value.toLowerCase().replace(DASHES_RE, '-').replace(/\s+/g, ' ').trim();

export const isIncompleteModernCode = (value: string) => /^\d{4}$/.test(normalize(value));

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
      guidance: cells[2],
    });
  }

  return rows;
}

function meaningForExactCode(row: FaultCodeRow, code: string): string {
  const codeIndex = row.codes.indexOf(code);
  if (codeIndex < 0 || row.codes.length === 1) return row.meaning;

  const alternatives: Array<{ pattern: RegExp; replacements: string[] }> = [
    { pattern: /above or below/i, replacements: ['above', 'below'] },
    { pattern: /higher or lower/i, replacements: ['higher', 'lower'] },
    {
      pattern: /open\/high resistance or short\/low resistance/i,
      replacements: ['open/high resistance', 'short/low resistance'],
    },
    {
      pattern: /high, low, or output-control fault/i,
      replacements: ['high', 'low', 'output-control fault'],
    },
    {
      pattern: /lost control, has an output fault, or is sticking/i,
      replacements: ['lost control', 'has an output fault', 'is sticking'],
    },
    {
      pattern: /commanded position differs from actual position, or control is lost/i,
      replacements: [
        'commanded position differs from actual position',
        'control is lost',
      ],
    },
    {
      pattern: /could not adapt in reverse or forward/i,
      replacements: ['could not adapt in reverse', 'could not adapt in forward'],
    },
    { pattern: /trim-up or trim-down/i, replacements: ['trim-up', 'trim-down'] },
    {
      pattern: /Demand, shift, or helm-module/i,
      replacements: ['Demand', 'Shift', 'Helm-module'],
    },
    {
      pattern: /Watchdog-module or watchdog-data/i,
      replacements: ['Watchdog-module', 'Watchdog-data'],
    },
  ];

  const alternative = alternatives.find(
    ({ pattern, replacements }) =>
      pattern.test(row.meaning) && replacements.length === row.codes.length,
  );
  if (alternative) {
    return row.meaning.replace(alternative.pattern, alternative.replacements[codeIndex]);
  }

  if (/^Ignition circuits 1-4:/i.test(row.meaning) && row.codes.length === 4) {
    return row.meaning.replace(/^Ignition circuits 1-4:/i, `Ignition circuit ${codeIndex + 1}:`);
  }
  if (/^Fuel-injector circuits 1-8:/i.test(row.meaning) && row.codes.length === 8) {
    return row.meaning.replace(
      /^Fuel-injector circuits 1-8:/i,
      `Fuel-injector circuit ${codeIndex + 1}:`,
    );
  }
  if (/sensor A or B adaptation fault/i.test(row.meaning) && row.codes.length === 2) {
    return row.meaning.replace(/sensor A or B adaptation fault/i, `sensor ${codeIndex === 0 ? 'A' : 'B'} adaptation fault`);
  }

  return row.meaning;
}

export function filterFaultCodeRows(rows: FaultCodeRow[], query: string): FaultCodeRow[] {
  const term = normalize(query);
  if (!term) return [];
  if (isIncompleteModernCode(term)) return [];

  if (/^\d{3,4}-\d{1,2}$/.test(term) || /^\d{1,3}$/.test(term)) {
    return rows
      .filter((row) => row.codes.includes(term))
      .map((row) => ({
        ...row,
        codeLabel: term,
        codes: [term],
        meaning: meaningForExactCode(row, term),
        groupedCodeLabel: row.codes.length > 1 ? row.codeLabel : undefined,
      }));
  }

  const words = term.split(' ').filter(Boolean);
  return rows.filter((row) => {
    const searchable = normalize(`${row.codeLabel} ${row.meaning} ${row.guidance}`);
    return words.every((word) => searchable.includes(word));
  });
}
