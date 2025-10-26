import { Card } from '@/components/ui/card';
import { LineItemRow } from './LineItemRow';
import { type PricingBreakdown } from '@/lib/quote-utils';

function formatTradeInLabel(tradeInInfo?: { brand: string; year: number; horsepower: number; model?: string }): string {
  if (!tradeInInfo) return "Trade-in Credit";
  
  const { brand, year, horsepower, model } = tradeInInfo;
  const parts = [year.toString(), brand, `${horsepower} HP`];
  if (model) parts.push(model);
  
  return `Trade-in Credit (${parts.join(' ')})`;
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
}

export function PricingTable({ 
  pricing, 
  motorName = "Mercury Motor",
  accessoryBreakdown = [],
  tradeInValue = 0,
  tradeInInfo,
  packageName = "Accessories & Setup",
  includesInstallation = false
}: PricingTableProps) {
  return (
    <Card className="p-6 space-y-1">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-primary mb-1">
          Pricing Breakdown
        </h3>
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

        {/* Trade-in Credit */}
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

      {/* Summary Note */}
      <div className="pt-4 border-t border-border/50">
        <div className="text-xs text-muted-foreground">
          All prices in Canadian dollars.{includesInstallation && ' Installation and PDI included.'}
          {tradeInValue > 0 && (
            <span className="block mt-1">
              *Trade-in value subject to inspection.
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