import { Check, ShieldCheck } from 'lucide-react';
import { MERCURY_PLATINUM_MAX_TOTAL_YEARS } from '@/data/mercuryProductProtection';
import {
  createBaselineWarrantyConfig,
  getPlatinumQuoteOptions,
  normalizeIncludedCoverageYears,
  type QuoteWarrantyConfig,
} from '@/lib/quote-product-protection';
import { cn } from '@/lib/utils';

interface PlatinumProtectionSelectorProps {
  horsepower: number;
  currentCoverageYears: number;
  value: QuoteWarrantyConfig | null;
  onChange: (config: QuoteWarrantyConfig) => void;
}

function formatCad(amount: number): string {
  return `$${amount.toLocaleString('en-CA')} CAD`;
}

export function PlatinumProtectionSelector({
  horsepower,
  currentCoverageYears,
  value,
  onChange,
}: PlatinumProtectionSelectorProps) {
  const includedYears = normalizeIncludedCoverageYears(currentCoverageYears);
  const options = getPlatinumQuoteOptions(horsepower, includedYears);
  const selectedTotalYears = value && value.extendedYears > 0 ? value.totalYears : null;

  // Never guess a price for an unsupported or not-yet-priced motor.
  if (options.length === 0 && includedYears < MERCURY_PLATINUM_MAX_TOTAL_YEARS) {
    return null;
  }

  return (
    <section
      aria-labelledby="platinum-protection-title"
      className="rounded border border-repower-navy-900/15 bg-white p-5 shadow-sm md:p-6"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-repower-navy-900 text-white">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h2 id="platinum-protection-title" className="font-sans text-lg font-bold text-repower-navy-900">
              Add Mercury Platinum Product Protection
            </h2>
            <span className="font-sans text-xs font-semibold uppercase tracking-[0.12em] text-repower-navy-900/55">
              Optional
            </span>
          </div>
          <p className="mt-1 text-sm leading-6 text-repower-navy-900/70">
            Your quote currently includes {includedYears} years of combined coverage. Choose a total below to add factory-backed Platinum protection.
          </p>
        </div>
      </div>

      {includedYears >= MERCURY_PLATINUM_MAX_TOTAL_YEARS ? (
        <div className="mt-5 flex items-center gap-2 border-t border-repower-navy-900/10 pt-4 text-sm font-semibold text-repower-navy-900">
          <Check className="h-4 w-4 text-emerald-700" aria-hidden="true" />
          Maximum combined coverage is already included.
        </div>
      ) : (
        <div className="mt-5 border-t border-repower-navy-900/10 pt-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" aria-label="Platinum Product Protection choices">
            <button
              type="button"
              aria-pressed={selectedTotalYears === null}
              onClick={() => onChange(createBaselineWarrantyConfig(includedYears))}
              className={cn(
                'min-h-[64px] rounded border px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repower-mercury-red focus-visible:ring-offset-2',
                selectedTotalYears === null
                  ? 'border-repower-navy-900 bg-repower-navy-900 text-white'
                  : 'border-repower-navy-900/15 bg-white text-repower-navy-900 hover:border-repower-navy-900/45',
              )}
            >
              <span className="block text-sm font-bold">No additional plan</span>
              <span className={cn('mt-1 block text-xs', selectedTotalYears === null ? 'text-white/70' : 'text-repower-navy-900/60')}>
                {includedYears} years included
              </span>
            </button>

            {options.map((option) => {
              const selected = selectedTotalYears === option.totalYears;
              return (
                <button
                  key={option.totalYears}
                  type="button"
                  aria-pressed={selected}
                  aria-label={`${option.totalYears} years total coverage, add ${formatCad(option.price)}`}
                  onClick={() => onChange({
                    extendedYears: option.planYears,
                    warrantyPrice: option.price,
                    totalYears: option.totalYears,
                  })}
                  className={cn(
                    'min-h-[64px] rounded border px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repower-mercury-red focus-visible:ring-offset-2',
                    selected
                      ? 'border-repower-mercury-red bg-repower-mercury-red text-white'
                      : 'border-repower-navy-900/15 bg-white text-repower-navy-900 hover:border-repower-navy-900/45',
                  )}
                >
                  <span className="block text-sm font-bold">{option.totalYears} years total</span>
                  <span className={cn('mt-1 block text-xs', selected ? 'text-white/75' : 'text-repower-navy-900/60')}>
                    Add {formatCad(option.price)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p className="mt-4 text-xs leading-5 text-repower-navy-900/60">
        Exact HBW rate-card pricing before HST. Factory warranty, promotional coverage and paid Platinum coverage remain separate programs. Final eligibility is confirmed using the engine serial number.{' '}
        <a
          href="/mercury-product-protection"
          className="font-semibold text-repower-navy-900 underline decoration-repower-mercury-red/60 underline-offset-4 hover:text-repower-mercury-red"
        >
          Coverage and pricing details
        </a>
      </p>
    </section>
  );
}
