import { Card, CardContent } from '@/components/ui/card';
import { useQuote } from '@/contexts/QuoteContext';
import { useActivePromotions } from '@/hooks/useActivePromotions';
import { getAppliedPromotion, getAppliedWarrantyExtraYears } from '@/lib/warranty-display';
import { requiresCustomProtectionReview } from '@/lib/quote-product-protection';
import { resolveQuoteIncludedCoverageYears } from '@/lib/quote-pdf-data';
import { PlatinumProtectionSelector } from './PlatinumProtectionSelector';

/** Both the admin builder and customer summary use the same priced choices. */
export function WarrantySelector() {
  const { state, dispatch } = useQuote();
  const { promotions, loading, error } = useActivePromotions({ motor: state.motor });
  if (!state.motor) return null;
  if (!state.frozenPricing && (loading || error)) {
    return <Card><CardContent className="p-6">{error
      ? 'Current promotional coverage could not be verified. Retry before choosing Product Protection.'
      : 'Loading Product Protection options...'}</CardContent></Card>;
  }
  const liveYears = 3 + getAppliedWarrantyExtraYears(getAppliedPromotion(promotions));
  const includedYears = resolveQuoteIncludedCoverageYears({
    frozen: !!state.frozenPricing,
    snapshotYears: state.pdfSnapshot?.includedCoverageYears,
    warrantyConfig: state.warrantyConfig,
    liveYears,
  });
  return <PlatinumProtectionSelector
    horsepower={Number(state.motor.hp || 0)}
    currentCoverageYears={includedYears}
    value={state.warrantyConfig}
    customPricingReview={requiresCustomProtectionReview(state.warrantyConfig, state.adminCustomItems)
      ? (state.isAdminQuote ? 'staff' : 'customer') : undefined}
    onChange={config => {
      if (state.frozenPricing) dispatch({ type: 'SET_FROZEN_PRICING', payload: undefined });
      dispatch({ type: 'SET_WARRANTY_CONFIG', payload: config });
    }}
  />;
}
