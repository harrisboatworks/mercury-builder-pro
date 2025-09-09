import { Badge } from '@/components/ui/badge';
import { money, calculateMonthly, type PricingBreakdown } from '@/lib/quote-utils';

interface HeroPriceProps {
  pricing: PricingBreakdown;
  showMonthly?: boolean;
  rate?: number;
}

export function HeroPrice({ pricing, showMonthly = true, rate = 7.99 }: HeroPriceProps) {
  const monthlyPayment = showMonthly ? calculateMonthly(pricing.total, rate) : null;

  return (
    <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-6 border border-primary/20 hero-price-enter">
      <div className="text-center space-y-4">
        {/* Main Price */}
        <div>
          <div className="text-sm font-medium text-muted-foreground mb-1">
            Your Price
          </div>
          <div className="text-4xl md:text-5xl font-bold text-primary">
            {money(pricing.total)}
          </div>
          <div className="text-sm text-muted-foreground">
            Tax included
          </div>
        </div>

        {/* Savings Breakdown */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-muted-foreground">
          <span>MSRP {money(pricing.msrp)}</span>
          {pricing.discount > 0 && (
            <>
              <span className="hidden sm:inline">−</span>
              <span className="text-green-600">Dealer Savings {money(pricing.discount)}</span>
            </>
          )}
          {pricing.promoValue > 0 && (
            <>
              <span className="hidden sm:inline">−</span>
              <span className="text-green-600">Promo Value {money(pricing.promoValue)}</span>
            </>
          )}
        </div>

        {/* Total Savings Badge */}
        {pricing.savings > 0 && (
          <div className="flex justify-center">
            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 px-3 py-1 savings-badge">
              You save {money(pricing.savings)}
            </Badge>
          </div>
        )}

        {/* Monthly Payment */}
        {monthlyPayment && (
          <div className="border-t border-border/50 pt-4">
            <div className="text-lg font-semibold text-primary">
              From {money(monthlyPayment.amount)}/mo
            </div>
            <div className="text-xs text-muted-foreground">
              Example OAC • Term {monthlyPayment.termMonths} mo @ {monthlyPayment.rate}% • Estimate
            </div>
          </div>
        )}
      </div>
    </div>
  );
}