import { Gift, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { QuotePdfSnapshot } from '@/lib/quote-pdf-data';

/** Saved quotes describe the accepted snapshot, never today's active offers. */
export function AdminQuotePromotionCard({ snapshot }: { snapshot: QuotePdfSnapshot | null }) {
  if (!snapshot) return null;

  const rebate = snapshot.pricing.promoValue;
  const coverage = snapshot.includedCoverageYears;
  const financingBenefit = snapshot.paymentMethod !== 'cash_purchase'
    && Boolean(snapshot.financing)
    && (snapshot.promotion?.selectedOption === 'special_financing'
      || snapshot.promotion?.selectedOption === 'no_payments');
  const hasPromotion = rebate > 0 || coverage > 3 || financingBenefit;
  // Parse date-only offer dates in UTC to avoid displaying the previous day.
  const endDate = snapshot.promotion?.endDate
    ? new Date(snapshot.promotion.endDate) : null;
  const expiry = endDate && Number.isFinite(endDate.getTime())
    ? endDate.toLocaleDateString('en-CA', {
      month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
    }) : null;

  return (
    <Card className="p-4 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20">
      <h2 className="font-semibold mb-3 flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
        {hasPromotion ? <Gift className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
        {hasPromotion ? 'Applied Promotion' : 'Included Coverage'}
      </h2>
      <div className="space-y-2 text-sm">
        {hasPromotion && snapshot.promotion?.name && (
          <div className="font-medium text-emerald-700 dark:text-emerald-300">{snapshot.promotion.name}</div>
        )}
        <div>{coverage > 3
          ? `${coverage} years total combined Mercury coverage included`
          : `${coverage}-year limited factory warranty included`}</div>
        {rebate > 0 && <div>Promotional savings applied: {rebate.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' })}</div>}
        {financingBenefit && <div>{snapshot.promotion?.selectedOption === 'no_payments'
          ? 'Deferred-payment promotion applied'
          : `Promotional financing: ${snapshot.financing!.rate}% APR`}</div>}
        {!hasPromotion && <div className="text-muted-foreground">No promotional benefit applied to this quote.</div>}
        {hasPromotion && expiry && <div className="text-muted-foreground pt-1 border-t mt-2">Offer expiry recorded on quote: {expiry}</div>}
      </div>
    </Card>
  );
}
