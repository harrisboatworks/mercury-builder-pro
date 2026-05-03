import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { LineItemRow } from './LineItemRow';
import { FinancingCallout } from './FinancingCallout';
import { type PricingBreakdown } from '@/lib/quote-utils';
import { FINANCING_MINIMUM } from '@/lib/finance';
function formatTradeInDescription(tradeInInfo?: { brand: string; year: number; horsepower: number; model?: string }): string | undefined {
  if (!tradeInInfo) return undefined;
  
  const { brand, year, horsepower, model } = tradeInInfo;
  const parts = [year.toString(), brand, `${horsepower} HP`];
  if (model) parts.push(model);
  
  return parts.join(' ');
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
  selectedPromoOption?: 'no_payments' | 'special_financing' | 'cash_rebate' | null;
  selectedPromoValue?: string;
  warrantyPromoYears?: number;
  totalCoverageYears?: number;
}

export function PricingTable({ 
  pricing, 
  motorName = "Mercury Motor",
  accessoryBreakdown = [],
  tradeInValue = 0,
  tradeInInfo,
  packageName = "Required Rigging & Installation",
  includesInstallation = false,
  onApplyForFinancing,
  selectedPromoOption,
  selectedPromoValue,
  warrantyPromoYears,
  totalCoverageYears
}: PricingTableProps) {
  return (
    <div className="rounded-[12px] border border-repower-navy-900/10 bg-white p-8">
      <div className="mb-6 space-y-2">
        <div className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-repower-mercury-red">
          Pricing Breakdown
        </div>
        {motorName && (
          <h3 className="font-display font-bold text-repower-navy-900 text-[24px] tracking-[-0.02em] leading-tight">
            {motorName}
          </h3>
        )}
        <p className="font-sans text-[14px] text-repower-navy-900/55">
          Complete cost breakdown for your quote
        </p>
        <div className="mt-4 h-px w-full bg-repower-navy-900/10" aria-hidden />
      </div>

      <div className="space-y-1">
        {/* Motor Pricing */}
        <div className="space-y-1">
          <div className="flex items-baseline justify-between py-3 border-b border-repower-navy-900/10">
            <div className="font-sans font-medium text-repower-navy-900" style={{ fontSize: 16 }}>MSRP</div>
            <div className="text-right">
              <s className="font-display font-semibold tabular-nums text-repower-navy-900/50" style={{ fontSize: 18, letterSpacing: '-0.01em' }}>
                ${pricing.msrp.toLocaleString()}
              </s>
            </div>
          </div>
          
          {pricing.discount > 0 && (
            <LineItemRow
              label="Your Discount"
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

        {/* Warranty Promotion Banner */}
        {warrantyPromoYears != null && warrantyPromoYears > 0 && (
          <div className="mt-2 rounded-[12px] border bg-[#F5F1EA] p-4" style={{ borderColor: 'rgba(201, 162, 74, 0.4)' }}>
            <div className="flex items-center gap-2">
              <span className="text-repower-gold" aria-hidden>🛡️</span>
              <span className="font-display font-semibold text-repower-navy-900 text-[16px]">
                {(totalCoverageYears ?? 3 + warrantyPromoYears)}-Year Factory-Backed Warranty Included
              </span>
            </div>
            <div className="mt-1 font-sans text-[13px] text-repower-navy-900/65">
              3 yr standard + {warrantyPromoYears} yr bonus coverage
            </div>
            <div className="mt-0.5 font-sans text-[13px] text-repower-navy-900/65">
              Dealer Promotion
            </div>
          </div>
        )}

        {/* Accessories & Setup */}
        {accessoryBreakdown.length > 0 && (
          <div className="space-y-1 pt-4">
            <div className="font-sans font-semibold uppercase text-repower-navy-900/65 py-2" style={{ fontSize: 12, letterSpacing: '0.18em' }}>
              {packageName}
            </div>
            {accessoryBreakdown.map((item, index) => {
              const isExistingProp = item.name.includes('Use Existing');
              return (
                <LineItemRow
                  key={index}
                  label={item.name}
                  amount={item.price}
                  description={item.description}
                  className={cn("pl-4 border-l-2", isExistingProp ? "border-repower-gold/40 bg-[#F5F1EA]/60 rounded" : "border-muted")}
                />
              );
            })}
          </div>
        )}

        {/* Your Savings Section - only show if there are savings */}
        {(tradeInValue > 0 || pricing.promoValue > 0) && (
          <div className="space-y-1 pt-3">
            <div className="flex items-center gap-2 py-1 border-t border-dashed border-repower-navy-900/15">
              <span className="text-xs font-medium text-repower-mercury-red uppercase tracking-wide">
                Your Savings
              </span>
            </div>
            
             {/* Trade Value */}
            {tradeInValue > 0 && (
              <>
                <LineItemRow
                  label="Estimated Trade Value"
                  amount={tradeInValue}
                  isDiscount
                  description={formatTradeInDescription(tradeInInfo)}
                  className="pl-2 border-l-2 border-repower-mercury-red/30"
                />
                <div className="pl-2 border-l-2 border-repower-mercury-red/30 py-1">
                  <div className="text-xs text-repower-mercury-red font-medium">
                    💡 Tax Savings from Trade-In: ${Math.round(tradeInValue * 0.13).toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    HST not charged on trade-in portion
                  </div>
                </div>
              </>
            )}
            
            {/* Promotional Savings */}
            {pricing.promoValue > 0 && (
              <LineItemRow
                label={
                  selectedPromoOption === 'no_payments' 
                    ? 'Warranty + No Payments'
                    : selectedPromoOption === 'special_financing'
                    ? `Warranty + ${selectedPromoValue || '2.99%'} APR`
                    : selectedPromoOption === 'cash_rebate'
                    ? `Warranty + ${selectedPromoValue} Rebate`
                    : 'Promotional Savings'
                }
                amount={pricing.promoValue}
                isDiscount
                description="Dealer Promotion"
                className="pl-2 border-l-2 border-repower-mercury-red/30"
              />
            )}
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
        <div className="mt-6 mb-4 pt-6 border-t border-gray-300 space-y-2">
          <div className="text-sm text-gray-700 font-normal">
            Flexible financing available
          </div>
          
          <FinancingCallout 
            totalPrice={pricing.total}
            onApplyForFinancing={onApplyForFinancing}
          />
          
          <div className="text-xs text-gray-600 italic mt-1">
            *Based on default financing terms, subject to approval
          </div>
        </div>
      )}

      {/* Summary Note */}
      <div className="pt-4 border-t border-border/50">
        <div className="text-xs text-muted-foreground">
          All prices in Canadian dollars. Installation, rigging, and trade-in values subject to inspection and verification.
          {pricing.savings > 0 && (
            <span className="inline-block mt-2 px-2 py-1 bg-repower-mercury-red/10 text-repower-mercury-red rounded-md text-xs font-semibold">
              {tradeInValue > 0 ? `Dealer + Promo Savings` : 'Total savings'} of ${pricing.savings.toLocaleString()} vs MSRP
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
