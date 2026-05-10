import { Link } from 'react-router-dom';

export interface MotorPricingRow {
  model: string;
  dealerPrice?: string;
  msrp?: string;
  useCase?: string;
}

interface Props {
  rows: MotorPricingRow[];
}

const QUOTE_URL = '/quote/motor-selection';

/**
 * Grid of motor pricing cards rendered in place of a markdown pricing
 * table inside a blog post. Detection lives in the markdown
 * preprocessor in MarkdownSectionCards.tsx; this component is purely
 * presentational.
 */
export function MotorPricingCards({ rows }: Props) {
  if (!rows.length) return null;
  return (
    <div className="not-prose my-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {rows.map((row, i) => (
        <div
          key={`${row.model}-${i}`}
          className="flex flex-col rounded-lg border border-repower-navy-900/15 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="text-base font-semibold text-repower-navy-900 leading-snug">
            {row.model}
          </div>
          {row.dealerPrice && (
            <div className="mt-3">
              <div className="text-2xl font-bold text-repower-navy-900">
                {row.dealerPrice}
                <span className="ml-1 text-xs font-medium text-repower-navy-900/60">
                  CAD
                </span>
              </div>
              {row.msrp && (
                <div className="mt-0.5 text-xs text-repower-navy-900/55">
                  MSRP {row.msrp}
                </div>
              )}
            </div>
          )}
          {row.useCase && (
            <div className="mt-3 text-sm italic text-repower-navy-900/65 leading-snug">
              {row.useCase}
            </div>
          )}
          <div className="mt-auto pt-4">
            <Link
              to={QUOTE_URL}
              className="inline-flex items-center justify-center gap-1 rounded-md bg-[hsl(var(--repower-mercury-red,0_70%_45%))] px-4 py-2 text-sm font-semibold !text-white no-underline shadow-sm transition-colors hover:brightness-110"
            >
              Build Quote <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
