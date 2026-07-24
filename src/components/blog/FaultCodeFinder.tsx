import { useId, useMemo, useState } from 'react';
import { AlertTriangle, Search } from 'lucide-react';
import {
  filterFaultCodeRows,
  isIncompleteModernCode,
  parseFaultCodeRows,
} from '@/lib/faultCodeLookup';

interface FaultCodeFinderProps {
  content: string;
}

export function FaultCodeFinder({ content }: FaultCodeFinderProps) {
  const inputId = useId();
  const [query, setQuery] = useState('');
  const rows = useMemo(() => parseFaultCodeRows(content), [content]);
  const matches = useMemo(() => filterFaultCodeRows(rows, query), [query, rows]);
  const visibleMatches = matches.slice(0, 12);
  const hasQuery = query.trim().length > 0;
  const hasIncompleteModernCode = isIncompleteModernCode(query, rows);
  const normalizedStem = query.trim().replace(/[‐‑‒–—−]/g, '-');
  const completeCodeExample =
    rows
      .find(
        (row) =>
          row.source === 'modern' &&
          row.codes.some((code) => code.startsWith(`${normalizedStem}-`)),
      )
      ?.codes.find((code) => code.startsWith(`${normalizedStem}-`)) ?? '1012-24';

  return (
    <section
      aria-labelledby={`${inputId}-heading`}
      className="my-8 rounded-2xl border border-repower-navy-900/15 bg-white p-5 shadow-sm md:p-7"
      data-fault-code-finder
    >
      <div className="keep-flex mb-5 flex flex-row items-start gap-3">
        <span className="mt-0.5 rounded-full bg-repower-mercury-red/10 p-2 text-repower-mercury-red">
          <Search className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h2
            id={`${inputId}-heading`}
            className="font-display text-2xl font-bold text-repower-navy-900"
          >
            Search the Codes on This Page
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-repower-navy-900/70">
            Enter the complete code when you have it. You can also search a symptom or
            component, such as “water in fuel” or “low voltage.”
          </p>
        </div>
      </div>

      <div
        className="keep-flex mb-5 flex flex-row items-start gap-3 rounded-xl border border-repower-mercury-red/20 bg-repower-mercury-red/5 p-4 text-sm leading-relaxed text-repower-navy-900"
        role="note"
      >
        <AlertTriangle
          className="mt-0.5 h-5 w-5 shrink-0 text-repower-mercury-red"
          aria-hidden="true"
        />
        <p>
          <strong>Protect the engine and boat first.</strong> For low oil pressure,
          oil-pump failure, active overheat, fuel leakage or overflow, loss of steering,
          or a gear that does not match the control command, skip this lookup and follow
          the display's stop instructions.
        </p>
      </div>

      <label htmlFor={inputId} className="sr-only">
        Search Mercury fault codes and meanings
      </label>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-repower-navy-900/45"
          aria-hidden="true"
        />
        <input
          id={inputId}
          type="search"
          inputMode="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Try 621-5, 23, low voltage, or water in fuel"
          className="w-full rounded-xl border border-repower-navy-900/20 bg-repower-paper py-3.5 pl-11 pr-4 text-base text-repower-navy-900 outline-none transition placeholder:text-repower-navy-900/45 focus:border-repower-mercury-red focus:ring-2 focus:ring-repower-mercury-red/15"
        />
      </div>

      {!hasQuery && (
        <div
          className="keep-flex mt-4 flex flex-row flex-wrap gap-2"
          aria-label="Example fault-code searches"
        >
          {['621-5', '23', 'water in fuel'].map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setQuery(example)}
              className="rounded-full border border-repower-navy-900/15 bg-repower-paper px-3 py-1.5 text-sm font-semibold text-repower-navy-900 transition hover:border-repower-mercury-red hover:text-repower-mercury-red"
            >
              {example}
            </button>
          ))}
        </div>
      )}

      <div className="mt-5">
        {hasQuery && hasIncompleteModernCode && (
          <div className="rounded-xl bg-repower-paper p-4 text-sm leading-relaxed text-repower-navy-900/75">
            That may be only the first half of a modern UFC. Enter the complete pair shown
            on the display, including the suffix after the dash, such as{' '}
            <strong>{completeCodeExample}</strong>. A single number may also be a legacy
            VesselView ID, so any legacy match remains visible below.
          </div>
        )}

        {hasQuery && !hasIncompleteModernCode && matches.length === 0 && (
          <div className="rounded-xl bg-repower-paper p-4 text-sm leading-relaxed text-repower-navy-900/75">
            No match appears in these two scoped tables. Keep the photo and complete code,
            then take the record to an authorized Mercury dealer. Do not borrow a meaning
            from a neighbouring number.
          </div>
        )}

        {visibleMatches.length > 0 && (
          <>
            <p
              className="mb-3 text-sm font-semibold text-repower-navy-900/70"
              aria-live="polite"
              aria-atomic="true"
            >
              {matches.length} {matches.length === 1 ? 'match' : 'matches'}
              {matches.length > visibleMatches.length ? ` · showing first ${visibleMatches.length}` : ''}
            </p>
            <div className="space-y-3">
              {visibleMatches.map((row) => (
                <article
                  key={`${row.source}-${row.codeLabel}`}
                  className="rounded-xl border border-repower-navy-900/10 bg-repower-paper p-4"
                >
                  <div className="keep-flex flex flex-row flex-wrap items-center gap-2">
                    <strong className="font-mono text-lg text-repower-navy-900">
                      {row.codeLabel}
                    </strong>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        row.source === 'modern'
                          ? 'bg-repower-mercury-red/10 text-repower-mercury-red'
                          : 'bg-repower-navy-900/10 text-repower-navy-900'
                      }`}
                    >
                      {row.source === 'modern' ? 'Modern V6/V8 UFC' : 'Legacy VesselView'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-repower-navy-900">
                    {row.meaning}
                  </p>
                  {row.groupedCodeLabel && (
                    <p className="mt-1 text-xs leading-relaxed text-repower-navy-900/60">
                      Exact match from grouped table row: {row.groupedCodeLabel}
                    </p>
                  )}
                  {row.dealerUpdateGuidance && (
                    <p className="mt-1 text-xs leading-relaxed text-repower-navy-900/60">
                      † This code has May 2026 dealer-software and calibration guidance.
                      See “What Changed in May 2026” below.
                    </p>
                  )}
                  <p className="mt-2 text-sm leading-relaxed text-repower-navy-900/75">
                    <strong>
                      {row.source === 'modern' ? 'What to do now: ' : 'Scope: '}
                    </strong>
                    {row.guidance}
                  </p>
                </article>
              ))}
            </div>
          </>
        )}
      </div>

      <p className="mt-5 border-t border-repower-navy-900/10 pt-4 text-xs leading-relaxed text-repower-navy-900/60">
        Search results provide the scoped meaning and published operator action; they do
        not prove which part failed. The modern and legacy tables use different numbering
        systems.
      </p>
    </section>
  );
}
