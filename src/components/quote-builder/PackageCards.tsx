"use client";
import { money } from "@/lib/money";
import { calculateMonthly } from "@/lib/finance";
import { cn } from "@/lib/utils";

export type PackageOption = {
  id: "good" | "better" | "best" | string;
  label: string;
  priceBeforeTax: number;
  savings: number;
  monthly?: number;
  features: string[];
  recommended?: boolean;
  coverageYears?: number;
  targetWarrantyYears?: number; // used only to trigger selection handler
};

type PackageCardsProps = {
  options: PackageOption[];
  onSelect: (id: string) => void;
  selectedId?: string;
  rate?: number;
  termMonths?: number;
};

export function PackageCards({
  options,
  onSelect,
  selectedId,
  rate = 7.99,
  termMonths = 60,
}: PackageCardsProps) {
  return (
    <section aria-label="Packages" className="grid gap-3 sm:grid-cols-3">
      {options.map((p) => {
        const monthly = p.monthly ?? calculateMonthly(p.priceBeforeTax, rate, termMonths);
        const isSelected = selectedId === p.id;

        return (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={cn(
              "group relative flex flex-col rounded-2xl border p-4 text-left transition",
              "hover:shadow-md hover:scale-[1.02]",
              isSelected
                ? "border-blue-600 ring-2 ring-blue-600/20 dark:border-blue-400 dark:ring-blue-400/30"
                : "border-slate-200 dark:border-slate-700"
            )}
            aria-pressed={isSelected}
          >
            {p.recommended && (
              <span className="absolute right-3 top-3 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-800">
                Recommended
              </span>
            )}

            <div className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">{p.label}</div>

            <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
              {money(p.priceBeforeTax)}
            </div>

            <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              From <span className="font-semibold">{money(Math.round(monthly))}/mo</span>
            </div>

            {p.coverageYears != null && (
              <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Coverage: <span className="font-medium">{p.coverageYears} years total</span>
              </div>
            )}

            <div className="mt-2 inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-800">
              You save {money(p.savings)}
            </div>

            <ul className="mt-3 space-y-1 text-sm text-slate-700 dark:text-slate-300">
              {p.features.slice(0, 4).map((f, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span aria-hidden className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-400/80 dark:bg-slate-500" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </button>
        );
      })}
    </section>
  );
}

export default PackageCards;