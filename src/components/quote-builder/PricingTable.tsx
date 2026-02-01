import { Card } from '@/components/ui/card';
import { LineItemRow } from './LineItemRow';
import { FinancingCallout } from './FinancingCallout';
import { type PricingBreakdown } from '@/lib/quote-utils';
import { FINANCING_MINIMUM } from '@/lib/finance';
function formatTradeInLabel(tradeInInfo?: { brand: string; year: number; horsepower: number; model?: string }): string {
  if (!tradeInInfo) return "Estimated Trade Value";
  
  const { brand, year, horsepower, model } = tradeInInfo;
  const parts = [year.toString(), brand, `${horsepower} HP`];
  if (model) parts.push(model);
  
  return `Estimated Trade Value (${parts.join(' ')})`;
}

// Parse rebate value from string like "$500" to number
function parseRebateValue(value?: string): number {
  if (!value) return 0;
  const match = value.match(/\$?([\d,]+)/);
  return match ? parseInt(match[1].replace(/,/g, ''), 10) : 0;
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
  selectedPromoValue
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
          
          {pricing.adminDiscount > 0 && (
            <LineItemRow
              label="Special Discount"
              amount={pricing.adminDiscount}
              isDiscount
              description="Applied by Harris Boat Works"
            />
          )}
          
          <LineItemRow
            label="Motor Price"
            amount={pricing.msrp - pricing.discount - (pricing.adminDiscount || 0)}
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

        {/* Promotional Savings - Show ONE consolidated line */}
        {pricing.promoValue > 0 && (
          <LineItemRow
            label={
              selectedPromoOption === 'no_payments' 
                ? '7 Years Warranty + 6 Mo No Payments'
                : selectedPromoOption === 'special_financing'
                ? `7 Years Warranty + ${selectedPromoValue || '2.99%'} APR`
                : selectedPromoOption === 'cash_rebate'
                ? `7 Years Warranty + ${selectedPromoValue} Rebate`
                : 'Promotional Savings'
            }
            amount={pricing.promoValue}
            isDiscount
            description={selectedPromoOption ? "Mercury GET 7 Promotion" : undefined}
          />
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
        />

        {/* Total */}
        <LineItemRow
          label="Total Price"
          amount={pricing.total}
          isTotal
        />
      </div>

      {/* Financing Callout - Subtle and Minimal - Only show for $5,000+ */}
      {pricing.total >= FINANCING_MINIMUM && (
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
      )}

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
