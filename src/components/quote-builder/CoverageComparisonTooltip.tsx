"use client";
import { useQuote } from "@/contexts/QuoteContext";
import { useActivePromotions } from "@/hooks/useActivePromotions";
import { money } from "@/lib/money";
import { calculateMonthlyPayment } from "@/lib/finance";

const BASE_YEARS = 3;
const MAX_YEARS = 8;

export default function CoverageComparisonTooltip() {
  const { state, dispatch } = useQuote();
  const { getTotalWarrantyBonusYears } = useActivePromotions();

  const promo = getTotalWarrantyBonusYears?.() ?? 0;
  const selectedTotal = state?.warrantyConfig?.totalYears ?? (BASE_YEARS + promo);
  const extended = Math.max(0, selectedTotal - (BASE_YEARS + promo));

  // Options are PRECOMPUTED by your engine and stored in state
  // Fallback to mock data if warrantyOptions not in state yet
  const rawOpts: Array<{ years: number; price: number; monthly?: number }> = 
    (state as any)?.warrantyOptions ?? [
      { years: 6, price: 899, monthly: 15 },
      { years: 7, price: 1199, monthly: 20 },
      { years: 8, price: 1499, monthly: 25 },
    ];

  // Find a target for 8y (or the highest available > current), to power the CTA
  const currentTotal = Math.min(selectedTotal, MAX_YEARS);
  const maxTarget =
    rawOpts.find(o => o.years === MAX_YEARS) ??
    rawOpts
      .filter(o => o.years > currentTotal && o.years <= MAX_YEARS)
      .sort((a, b) => b.years - a.years)[0];

  const onMaxOut = () => {
    if (!maxTarget) return;
    const targetYears = maxTarget.years;
    const extendedYears = Math.max(0, targetYears - (BASE_YEARS + promo));
    // Mirror WarrantySelector dispatch; NO new pricing logic
    dispatch({
      type: "SET_WARRANTY_CONFIG",
      payload: {
        extendedYears,
        warrantyPrice: maxTarget.price ?? 0,
        totalYears: targetYears,
      },
    });
  };

  // Calculate monthly delta between current and target warranty costs
  const currentOption = rawOpts.find(o => o.years === currentTotal);
  const currentMonthly = currentOption ? calculateMonthlyPayment(currentOption.price).payment : 0;
  const targetMonthly = maxTarget ? calculateMonthlyPayment(maxTarget.price).payment : 0;
  const monthlyDelta = Math.max(0, targetMonthly - currentMonthly);

  return (
    <div className="inline-flex items-center gap-2">
      <span className="text-sm text-slate-600">Coverage</span>
      <div className="relative group">
        <button
          aria-label="Compare coverage levels"
          className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-xs font-semibold text-slate-600 hover:border-slate-400"
          title="Compare coverage levels"
        >
          i
        </button>
        <div className="invisible absolute left-1/2 z-40 mt-2 w-72 -translate-x-1/2 rounded-lg border border-slate-200/70 bg-white p-3 text-sm text-slate-700 shadow-lg opacity-0 transition group-hover:visible group-hover:opacity-100">
          <div className="mb-2 font-semibold">How we get your total</div>
          <ul className="space-y-1.5">
            <li className="flex justify-between">
              <span>Base warranty:</span>
              <span className="font-medium">{BASE_YEARS} years</span>
            </li>
            <li className="flex justify-between">
              <span>Promo bonus:</span>
              <span className="font-medium">+{promo} years</span>
            </li>
            <li className="flex justify-between">
              <span>Extended add-on:</span>
              <span className="font-medium">+{extended} years</span>
            </li>
          </ul>
          <div className="mt-3 flex justify-between border-t border-slate-200/70 pt-2 font-semibold text-slate-800">
            <span>Total coverage:</span>
            <span>{selectedTotal} years</span>
          </div>

          {/* CTA: only show if a target exists and we're not already at it */}
          {maxTarget && selectedTotal < maxTarget.years && (
            <button
              onClick={onMaxOut}
              className="mt-3 w-full rounded-lg bg-primary px-3 py-2.5 text-center text-sm font-semibold text-primary-foreground transition hover:scale-[1.01] hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              Upgrade to {maxTarget.years}y max • +{money(Math.round(monthlyDelta))}/mo
            </button>
          )}

          <div className="mt-2 text-xs text-slate-500">
            Monthly shown is an estimate OAC. Final terms at checkout.
          </div>
        </div>
      </div>
    </div>
  );
}
