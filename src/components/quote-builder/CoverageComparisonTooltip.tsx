"use client";
import { useQuote } from "@/contexts/QuoteContext";
import { useActivePromotions } from "@/hooks/useActivePromotions";
import { money } from "@/lib/money";
import { getAppliedPromotion, getAppliedWarrantyExtraYears } from "@/lib/warranty-display";
import { buildWarrantyConfigFromCost, getPlatinumQuoteOptions, hasExplicitWarrantyBreakdown, requiresCustomProtectionReview } from "@/lib/quote-product-protection";
import { resolveQuoteIncludedCoverageYears } from "@/lib/quote-pdf-data";
import { calculateMercuryPlatinumCoverageCost } from "@/data/mercuryProductProtection";

const BASE_YEARS = 3;
const MAX_YEARS = 8;

export default function CoverageComparisonTooltip() {
  const { state, dispatch } = useQuote();
  const { promotions, loading, error } = useActivePromotions({ motor: state.motor });

  const promo = getAppliedWarrantyExtraYears(getAppliedPromotion(promotions));
  const included = resolveQuoteIncludedCoverageYears({ frozen: !!state.frozenPricing,
    snapshotYears: state.pdfSnapshot?.includedCoverageYears, warrantyConfig: state.warrantyConfig, liveYears: BASE_YEARS + promo });
  const needsReview = requiresCustomProtectionReview(state.warrantyConfig, state.adminCustomItems);
  const pricingReady = !!state.frozenPricing || (!loading && !error);
  const selectedTotal = state?.warrantyConfig?.totalYears ?? included;
  const extended = Math.max(0, selectedTotal - included);
  const hp = Number((state.motor as any)?.hp ?? (state.motor as any)?.horsepower ?? 0);

  const options = pricingReady && !needsReview ? getPlatinumQuoteOptions(hp, included) : [];
  const maxTarget = options.filter((o) => o.totalYears <= MAX_YEARS).sort((a, b) => b.totalYears - a.totalYears)[0];

  const onMaxOut = () => {
    if (!maxTarget || needsReview) return;
    const cost = calculateMercuryPlatinumCoverageCost(hp, included, maxTarget.totalYears);
    if (!cost) return;
    if (state.frozenPricing) dispatch({ type: "SET_FROZEN_PRICING", payload: undefined });
    dispatch({ type: "SET_WARRANTY_CONFIG", payload: buildWarrantyConfigFromCost(cost) });
  };


  return (
    <div className="inline-flex items-center gap-2">
      <span className="text-sm text-repower-navy-900/65">Coverage</span>
      <div className="relative group">
        <button
          aria-label="Compare coverage levels"
          className="flex h-5 w-5 items-center justify-center rounded-full border border-repower-navy-900/20 text-xs font-semibold text-repower-navy-900/65 hover:border-repower-navy-900/20"
          title="Compare coverage levels"
        >
          i
        </button>
        <div className="invisible absolute left-1/2 z-40 mt-2 w-72 -translate-x-1/2 rounded-lg border border-repower-navy-900/10 bg-white p-3 text-sm text-repower-navy-900 shadow-lg opacity-0 transition group-hover:visible group-hover:opacity-100">
          <div className="mb-2 font-semibold">How we get your total</div>
          <ul className="space-y-1.5">
            <li className="flex justify-between"><span>Factory warranty:</span><span className="font-medium">{BASE_YEARS} years</span></li>
            <li className="flex justify-between"><span>Promo Gold:</span><span className="font-medium">+{promo} years</span></li>
            <li className="flex justify-between"><span>Paid Platinum extension:</span><span className="font-medium">+{extended} years</span></li>
            {promo > 0 && hasExplicitWarrantyBreakdown(state.warrantyConfig) && (state.warrantyConfig?.goldUpgradePrice ?? 0) > 0 ? (
              <li className="flex justify-between"><span>Gold upgraded to Platinum:</span><span className="font-medium">{promo} years</span></li>
            ) : null}
          </ul>
          <div className="mt-3 flex justify-between border-t border-repower-navy-900/10 pt-2 font-semibold text-repower-navy-900">
            <span>Total coverage:</span><span>{selectedTotal} years</span>
          </div>
          <p className="mt-2 text-xs text-repower-navy-900/60">Promotional years are Gold. A Platinum quote includes upgrading those Gold years before adding any extra Platinum years.</p>
          {maxTarget && selectedTotal < maxTarget.totalYears && (
            <button onClick={onMaxOut} className="mt-3 w-full rounded-lg bg-primary px-3 py-2.5 text-center text-sm font-semibold text-primary-foreground transition hover:scale-[1.01] hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
              Change to {maxTarget.totalYears} years • Platinum price {money(maxTarget.price)} before HST
            </button>
          )}
          {maxTarget && selectedTotal >= maxTarget.totalYears && state?.warrantyConfig?.warrantyPrice === 0 && promo > 0 && (
            <button onClick={onMaxOut} className="mt-3 w-full rounded-lg bg-primary px-3 py-2.5 text-center text-sm font-semibold text-primary-foreground transition hover:scale-[1.01] hover:bg-primary/90">
              Upgrade Gold to Platinum • {money(maxTarget.price)}
            </button>
          )}
          <div className="mt-2 text-xs text-repower-navy-900/400">Final eligibility and price are confirmed by serial number.</div>
        </div>
      </div>
    </div>
  );
}
