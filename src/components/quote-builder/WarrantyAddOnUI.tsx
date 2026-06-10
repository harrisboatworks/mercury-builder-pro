"use client";
import { money } from "@/lib/money";

export type WarrantyTarget = {
  targetYears: number;         // total years (e.g., 6,7,8)
  oneTimePrice: number;        // precomputed by existing engine
  monthlyDelta: number;        // precomputed by existing engine
  label?: string;
};

type Props = {
  currentCoverageYears: number;
  maxCoverageYears: number;
  targets: WarrantyTarget[];
  selectedTargetYears: number | null;
  onSelectWarranty: (targetYears: number | null) => void; // call existing action
  note?: string;
};

export default function WarrantyAddOnUI({
  currentCoverageYears,
  maxCoverageYears,
  targets,
  selectedTargetYears,
  onSelectWarranty,
  note = "Monthly shown is an estimate OAC. Final terms at checkout.",
}: Props) {
  const chips = targets.filter(t => t.targetYears > currentCoverageYears && t.targetYears <= maxCoverageYears);

  return (
    <section aria-label="Extended Warranty" className="rounded-2xl border border-repower-navy-900/10 bg-white p-5 shadow-sm  ">
      <div className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-repower-navy-900/400 ">
        Extended Warranty
      </div>

      <div className="mb-4 text-sm text-repower-navy-900 ">
        Current coverage: <span className="font-medium">{currentCoverageYears} years</span> (base + promo)
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onSelectWarranty(null)}
          className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
            selectedTargetYears === null 
              ? "border-primary bg-primary/10 text-primary  " 
              : "border-repower-navy-900/20 text-repower-navy-900 hover:border-repower-navy-900/20   0"
          }`}
        >
          No additional coverage
        </button>

        {chips.map(t => (
          <button
            key={t.targetYears}
            onClick={() => onSelectWarranty(t.targetYears)}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              selectedTargetYears === t.targetYears 
                ? "border-primary bg-primary/10 text-primary  " 
                : "border-repower-navy-900/20 text-repower-navy-900 hover:border-repower-navy-900/20   0"
            }`}
            aria-pressed={selectedTargetYears === t.targetYears}
            title={`Extend to ${t.targetYears} years total`}
          >
            {t.label ?? `${t.targetYears} yrs total`} • +{money(t.oneTimePrice)} • +{money(Math.round(t.monthlyDelta))}/mo
          </button>
        ))}
      </div>

      <p className="mt-3 text-xs text-repower-navy-900/400 ">{note}</p>
    </section>
  );
}