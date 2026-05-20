/**
 * Single source of truth for motor price tables shown on the site.
 *
 * Parses src/data/mercury-dealer-prices.csv at module load (Vite `?raw`
 * import) and exposes a normalized row list plus filter helpers used by:
 *   - <MercuryPriceTable /> blog directive
 *   - scripts/static-prerender.mjs (mirrors this parser in plain Node)
 *
 * This keeps the blog price guide aligned with the CSV file so prices
 * never go stale across the site.
 */

import dealerCsv from './mercury-dealer-prices.csv?raw';

export type MotorFamily = 'FourStroke' | 'Pro XS' | 'SeaPro' | 'Verado' | 'Other';

export type MotorGroupKey = 'portable' | 'mid-range' | 'high-output' | 'v6-v8';

export interface MotorGroup {
  key: MotorGroupKey;
  label: string;
  description: string;
  minHp: number;
  maxHp: number;
}

export const MOTOR_GROUPS: MotorGroup[] = [
  { key: 'portable',     label: 'Portable (2.5 to 20 HP)',          description: 'Tenders, canoes, small tin boats, kickers.',                     minHp: 0,   maxHp: 20 },
  { key: 'mid-range',    label: 'Mid-Range (25 to 60 HP)',          description: 'Fishing boats, small bowriders, smaller pontoons.',              minHp: 25,  maxHp: 60 },
  { key: 'high-output',  label: 'High-Output (75 to 150 HP)',       description: 'Bowriders, larger pontoons, dedicated fishing rigs.',            minHp: 75,  maxHp: 150 },
  { key: 'v6-v8',        label: 'V6 and V8 (175 to 300 HP)',        description: 'Performance bowriders, deck boats, tournament platforms.',       minHp: 175, maxHp: 9999 },
];

export interface MotorPriceRow {
  modelNumber: string;
  description: string;   // e.g. "115ELPT Pro XS"
  hp: number;
  family: MotorFamily;
  dealerPrice: number;   // CAD selling price (Base Price +10%)
  msrp: number;          // CAD MSRP
  group: MotorGroupKey;
}

function detectFamily(desc: string): MotorFamily {
  if (/pro\s*xs/i.test(desc)) return 'Pro XS';
  if (/verado/i.test(desc)) return 'Verado';
  if (/seapro/i.test(desc)) return 'SeaPro';
  if (/fourstroke/i.test(desc)) return 'FourStroke';
  return 'Other';
}

function groupForHp(hp: number): MotorGroupKey {
  if (hp <= 20) return 'portable';
  if (hp <= 60) return 'mid-range';
  if (hp <= 150) return 'high-output';
  return 'v6-v8';
}

function parseHp(desc: string): number {
  const m = /^\s*(\d+(?:\.\d+)?)/.exec(desc);
  return m ? parseFloat(m[1]) : NaN;
}

function parseCsv(raw: string): MotorPriceRow[] {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return [];
  // Skip header row.
  const rows: MotorPriceRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',').map((c) => c.trim());
    if (cells.length < 4) continue;
    const [modelNumber, description, msrpStr, dealerStr] = cells;
    const hp = parseHp(description);
    const dealerPrice = Number(dealerStr.replace(/[^\d.]/g, ''));
    const msrp = Number(msrpStr.replace(/[^\d.]/g, ''));
    if (!modelNumber || !description || !Number.isFinite(hp) || !Number.isFinite(dealerPrice) || dealerPrice <= 0) continue;
    // Skip Verado: special order, not actively promoted (project policy).
    const family = detectFamily(description);
    if (family === 'Verado') continue;
    rows.push({
      modelNumber,
      description,
      hp,
      family,
      dealerPrice,
      msrp,
      group: groupForHp(hp),
    });
  }
  // Sort: HP ascending, then description.
  rows.sort((a, b) => a.hp - b.hp || a.description.localeCompare(b.description));
  return rows;
}

export const MOTOR_PRICE_ROWS: MotorPriceRow[] = parseCsv(dealerCsv);

export interface MotorPriceFilter {
  group?: MotorGroupKey;
  minHp?: number;
  maxHp?: number;
}

export function filterMotorPriceRows(filter: MotorPriceFilter = {}): MotorPriceRow[] {
  const { group, minHp, maxHp } = filter;
  return MOTOR_PRICE_ROWS.filter((r) => {
    if (group && r.group !== group) return false;
    if (typeof minHp === 'number' && r.hp < minHp) return false;
    if (typeof maxHp === 'number' && r.hp > maxHp) return false;
    return true;
  });
}

export function groupRows(rows: MotorPriceRow[]): Array<{ group: MotorGroup; rows: MotorPriceRow[] }> {
  return MOTOR_GROUPS
    .map((g) => ({ group: g, rows: rows.filter((r) => r.group === g.key) }))
    .filter((g) => g.rows.length > 0);
}

export function formatCad(n: number): string {
  return '$' + n.toLocaleString('en-CA', { maximumFractionDigits: 0 });
}
