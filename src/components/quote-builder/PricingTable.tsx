import { Card } from '@/components/ui/card';
import { LineItemRow } from './LineItemRow';
import { FinancingCallout } from './FinancingCallout';
import { type PricingBreakdown } from '@/lib/quote-utils';

function formatTradeInLabel(tradeInInfo?: { brand: string; year: number; horsepower: number; model?: string }): string {
  if (!tradeInInfo) return "Estimated Trade Value";
  
  const { brand, year, horsepower, model } = tradeInInfo;
  const parts = [year.toString(), brand, `${horsepower} HP`];
  if (model) parts.push(model);
  
  return `Estimated Trade Value (${parts.join(' ')})`;
}

interface PricingTableProps {
  pricing: PricingBreakdown;
  motorName?: string;
  accessoryBreakdown?: Array<{
    name: string;
    price: number;
    description?: string;
  }>;
  tradeInValue?: number;
  tradeInInfo?: {
    brand: string;
    year: number;
    horsepower: number;
    model?: string;
  };
  packageName?: string;
  includesInstallation?: boolean;
  onApplyForFinancing?: () => void;
  // Selected promo option from "Choose One" bonus
  selectedPromoOption?: 'no_payments' | 'special_financing' | 'cash_rebate' | null;
  selectedPromoValue?: string;
  // Callback to open promo selector modal
  onChangeBonus?: () => void;
}

export function PricingTable({ 
  pricing, 
  motorName = "Mercury Motor",
  accessoryBreakdown = [],
  tradeInValue = 0,
  tradeInInfo,
  packageName = "Accessories & Setup",
  includesInstallation = false,
  onApplyForFinancing,
  selectedPromoOption,
  selectedPromoValue,
  onChangeBonus
}: PricingTableProps) {
  return (
    <Card className="p-6 space-y-1 bg-white">
      <div className="mb-4 space-y-1">
        <h3 className="text-lg font-semibold text-primary">
          Pricing Breakdown
        </h3>
        {motorName && (
          <p className="text-base font-semibold text-slate-900">
            {motorName}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Complete cost breakdown for your quote
        </p>
      </div>

      <div className="space-y-1">
        {/* Motor Pricing */}
        <div className="space-y-1">
          <div className="flex items-baseline justify-between">
            <div className="text-muted-foreground">
              MSRP - {motorName}
            </div>
            <div className="text-right">
              <s className="text-muted-foreground">${pricing.msrp.toLocaleString()}</s>
            </div>
          </div>
          
          {pricing.discount > 0 && (
            <LineItemRow
              label="Dealer Discount"
              amount={pricing.discount}
              isDiscount
            />
          )}
          
          <LineItemRow
            label="Motor Price"
            amount={pricing.msrp - pricing.discount}
            className="font-medium"
          />
        </div>

        {/* Accessories & Setup */}
        {accessoryBreakdown.length > 0 && (
          <div className="space-y-1 pt-2">
            <div className="text-sm font-medium text-primary py-1">
              {packageName}
            </div>
            {accessoryBreakdown.map((item, index) => (
              <LineItemRow
                key={index}
                label={item.name}
                amount={item.price}
                description={item.description}
                className="pl-4 border-l-2 border-muted"
              />
            ))}
          </div>
        )}

        {/* Estimated Trade Value */}
        {tradeInValue > 0 && (
          <LineItemRow
            label={formatTradeInLabel(tradeInInfo)}
            amount={tradeInValue}
            isDiscount
            className="pt-2"
          />
        )}

        {/* Promotional Savings */}
        {pricing.promoValue > 0 && (
          <LineItemRow
            label="Promotional Savings"
            amount={pricing.promoValue}
            isDiscount
          />
        )}

        {/* Selected Promo Bonus (Choose One) */}
        {selectedPromoOption && (
          <div className="mt-3 mb-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-green-800">
                <span className="text-green-600">✓</span>
                <span>YOUR SELECTED BONUS</span>
              </div>
              {onChangeBonus && (
                <button 
                  onClick={onChangeBonus}
                  className="text-xs text-green-700 hover:text-green-900 hover:underline font-medium transition-colors"
                >
                  Change
                </button>
              )}
            </div>
            <div className="mt-1 text-sm text-green-700 font-medium pl-5">
              {selectedPromoOption === 'no_payments' && (
                <>6 Months No Payments{selectedPromoValue ? ` (${selectedPromoValue})` : ''}</>
              )}
              {selectedPromoOption === 'special_financing' && (
                <>Special Financing Rate: {selectedPromoValue || '2.99%'} APR</>
              )}
              {selectedPromoOption === 'cash_rebate' && (
                <>Factory Cash Rebate: {selectedPromoValue}</>
              )}
            </div>
          </div>
        )}

        {/* Subtotal */}
        <LineItemRow
          label="Subtotal"
          amount={pricing.subtotal}
          isSubtotal
        />

        {/* Tax */}
        <LineItemRow
          label="HST (13%)"
          amount={pricing.tax}
          description="Ontario tax included"
        />

        {/* Total */}
        <LineItemRow
          label="Total Price"
          amount={pricing.total}
          isTotal
        />
      </div>

      {/* Financing Callout - Subtle and Minimal */}
      <div className="mt-6 mb-4 pt-6 border-t border-gray-200 space-y-2">
        <div className="text-sm text-gray-600 font-normal">
          Flexible financing available
        </div>
        
        <FinancingCallout 
          totalPrice={pricing.total}
          onApplyForFinancing={onApplyForFinancing}
        />
        
        <div className="text-xs text-gray-500 italic mt-1">
          *Based on default financing terms, subject to approval
        </div>
      </div>

      {/* Summary Note */}
      <div className="pt-4 border-t border-border/50">
        <div className="text-xs text-muted-foreground">
          All prices in Canadian dollars.{includesInstallation && ' Installation and PDI included.'}
          {tradeInValue > 0 && (
            <span className="block mt-1">
              *Estimated trade value subject to physical inspection.
            </span>
          )}
          {pricing.savings > 0 && (
            <span className="block mt-1 text-green-600 font-medium">
              Total savings of ${pricing.savings.toLocaleString()} vs MSRP
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
