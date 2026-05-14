import React, { Children, cloneElement, isValidElement, ReactElement, ReactNode } from 'react';
import { motion } from 'framer-motion';

// Heuristic: leading $, optional minus, then digits (with optional commas/decimals).
// Matches values like $1,200, -$500, 1200, 1,200.50.
const NUMERIC_RE = /^\s*-?\$?[\d,]+(?:\.\d+)?\s*$/;
const TOTAL_RE = /\b(total|net|all-?in|subtotal)\b/i;

function getText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(getText).join('');
  if (isValidElement(node)) {
    const props = node.props as any;
    return getText(props?.children);
  }
  return '';
}

function mergeClass(existing: unknown, extra: string): string {
  return [typeof existing === 'string' ? existing : '', extra].filter(Boolean).join(' ');
}

interface CellOpts {
  numeric: boolean;
  isHeader: boolean;
  totalRow?: boolean;
  totalCell?: 'label' | 'value' | null;
}

function styleCell(cell: ReactElement, opts: CellOpts): ReactElement {
  const base = opts.isHeader
    ? 'px-4 py-3 text-[11px] uppercase tracking-[0.14em] text-repower-navy-900 font-semibold'
    : 'px-4 py-3 text-sm text-repower-navy-900/85';
  const align = opts.numeric ? 'text-right tabular-nums font-display' : 'text-left';
  let extra = '';
  if (opts.totalRow && opts.totalCell === 'label') {
    extra = 'font-semibold text-repower-navy-900';
  } else if (opts.totalRow && opts.totalCell === 'value') {
    extra = 'text-lg font-display font-bold text-mercury-red tabular-nums text-right';
  }
  const className = mergeClass((cell.props as any).className, `${base} ${align} ${extra}`);
  return cloneElement(cell, { className });
}

export function BlogTable({ children }: { children?: ReactNode }) {
  // children: <thead>, <tbody> (and possibly <tfoot>)
  const sections = Children.toArray(children).filter(isValidElement) as ReactElement[];
  const thead = sections.find((s) => s.type === 'thead');
  const tbody = sections.find((s) => s.type === 'tbody');

  // Determine numeric columns by scanning body cells.
  const numericCols = new Set<number>();
  const bodyRows: ReactElement[] = tbody
    ? (Children.toArray((tbody.props as any).children).filter(isValidElement) as ReactElement[])
    : [];
  if (bodyRows.length) {
    const firstCells = Children.toArray((bodyRows[0].props as any).children).filter(isValidElement) as ReactElement[];
    firstCells.forEach((cell, idx) => {
      const txt = getText((cell.props as any).children);
      if (NUMERIC_RE.test(txt)) numericCols.add(idx);
    });
    // Confirm with second row if present, to avoid false positives on header-like first row.
    if (bodyRows[1]) {
      const secondCells = Children.toArray((bodyRows[1].props as any).children).filter(isValidElement) as ReactElement[];
      const confirmed = new Set<number>();
      secondCells.forEach((cell, idx) => {
        const txt = getText((cell.props as any).children);
        if (NUMERIC_RE.test(txt) && numericCols.has(idx)) confirmed.add(idx);
      });
      if (confirmed.size) {
        numericCols.clear();
        confirmed.forEach((i) => numericCols.add(i));
      }
    }
  }

  // Detect total row (last body row, first cell label match).
  let totalRowIdx = -1;
  if (bodyRows.length) {
    const last = bodyRows[bodyRows.length - 1];
    const cells = Children.toArray((last.props as any).children).filter(isValidElement) as ReactElement[];
    const firstText = getText((cells[0]?.props as any)?.children);
    if (TOTAL_RE.test(firstText)) totalRowIdx = bodyRows.length - 1;
  }

  // Rebuild thead with styled cells.
  let newThead: ReactElement | undefined;
  if (thead) {
    const headRows = Children.toArray((thead.props as any).children).filter(isValidElement) as ReactElement[];
    const styledHeadRows = headRows.map((row, ri) => {
      const cells = Children.toArray((row.props as any).children).filter(isValidElement) as ReactElement[];
      const styledCells = cells.map((c, ci) =>
        styleCell(c, { numeric: numericCols.has(ci), isHeader: true }),
      );
      return cloneElement(row, { key: `hr-${ri}`, className: mergeClass((row.props as any).className, 'border-b-2 border-mercury-red') }, styledCells);
    });
    newThead = cloneElement(
      thead,
      { className: mergeClass((thead.props as any).className, 'bg-repower-navy-900/5') },
      styledHeadRows,
    );
  }

  // Rebuild tbody with styled rows + cells.
  let newTbody: ReactElement | undefined;
  if (tbody) {
    const styledBodyRows = bodyRows.map((row, ri) => {
      const cells = Children.toArray((row.props as any).children).filter(isValidElement) as ReactElement[];
      const isTotal = ri === totalRowIdx;
      const lastIdx = cells.length - 1;
      const styledCells = cells.map((c, ci) =>
        styleCell(c, {
          numeric: numericCols.has(ci),
          isHeader: false,
          totalRow: isTotal,
          totalCell: isTotal ? (ci === 0 ? 'label' : ci === lastIdx ? 'value' : null) : null,
        }),
      );
      const rowExtras = isTotal
        ? 'bg-repower-navy-900/5 border-t-2 border-repower-navy-900/30'
        : `${ri > 0 ? 'border-t border-border/30' : ''} even:bg-repower-paper/30 hover:bg-mercury-red/5 transition-colors`;
      return cloneElement(
        row,
        { key: `br-${ri}`, className: mergeClass((row.props as any).className, rowExtras) },
        styledCells,
      );
    });
    newTbody = cloneElement(tbody, {}, styledBodyRows);
  }

  return (
    <motion.div
      initial={{ y: 8 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="not-prose my-8 w-full rounded-2xl border border-border/30 bg-repower-paper p-3 md:p-4 shadow-sm"
    >
      <div className="overflow-x-auto rounded-xl bg-card">
        <table className="w-full border-collapse" style={{ minWidth: 600 }}>
          {newThead}
          {newTbody}
        </table>
      </div>
    </motion.div>
  );
}

export default BlogTable;
