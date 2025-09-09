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
    <section aria-label="Extended Warranty" className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
        Extended Warranty
      </div>

      <div className="mb-4 text-sm text-slate-700 dark:text-slate-300">
        Current coverage: <span className="font-medium">{currentCoverageYears} years</span> (base + promo)
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onSelectWarranty(null)}
          className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
            selectedTargetYears === null 
              ? "border-primary bg-primary/10 text-primary dark:border-primary dark:text-primary" 
              : "border-slate-300 text-slate-700 hover:border-slate-400 dark:border-slate-600 dark:text-slate-300 dark:hover:border-slate-500"
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
                ? "border-primary bg-primary/10 text-primary dark:border-primary dark:text-primary" 
                : "border-slate-300 text-slate-700 hover:border-slate-400 dark:border-slate-600 dark:text-slate-300 dark:hover:border-slate-500"
            }`}
            aria-pressed={selectedTargetYears === t.targetYears}
            title={`Extend to ${t.targetYears} years total`}
          >
            {t.label ?? `${t.targetYears} yrs total`} • +{money(t.oneTimePrice)} • +{money(Math.round(t.monthlyDelta))}/mo
          </button>
        ))}
      </div>

      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{note}</p>
    </section>
  );
}