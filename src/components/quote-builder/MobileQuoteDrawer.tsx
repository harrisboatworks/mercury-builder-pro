import React, { useMemo } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { useQuote } from '@/contexts/QuoteContext';
import { useActivePromotions } from '@/hooks/useActivePromotions';
import { useActiveFinancingPromo } from '@/hooks/useActiveFinancingPromo';
import { calculateMonthlyPayment, DEALERPLAN_FEE, getDefaultFinancingRate } from '@/lib/finance';
import { money } from '@/lib/money';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Gift, Shield, CreditCard } from 'lucide-react';

interface MobileQuoteDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const PACKAGE_LABELS: Record<string, { name: string; years: number; description: string }> = {
  essential: { name: 'Essential', years: 5, description: 'Base warranty' },
  complete: { name: 'Complete', years: 7, description: '+2 years extended' },
  premium: { name: 'Premium', years: 10, description: '+5 years extended' }
};

export const MobileQuoteDrawer: React.FC<MobileQuoteDrawerProps> = ({ isOpen, onClose }) => {
  const { state } = useQuote();
  const { promotions } = useActivePromotions();
  const { promo: financingPromo } = useActiveFinancingPromo();

  // Calculate all pricing details
  const pricing = useMemo(() => {
    if (!state.motor?.price) return null;

    const motorPrice = state.motor.price;
    const motorMsrp = state.motor.msrp || state.motor.basePrice || motorPrice;
    
    let subtotal = motorPrice;
    const lineItems: { label: string; value: number; type?: 'add' | 'subtract' }[] = [];

    // Motor
    lineItems.push({ label: 'Motor Price', value: motorPrice });

    // Warranty
    if (state.warrantyConfig?.warrantyPrice) {
      subtotal += state.warrantyConfig.warrantyPrice;
      lineItems.push({ 
        label: `Warranty Extension (${state.warrantyConfig.totalYears - 5} yrs)`, 
        value: state.warrantyConfig.warrantyPrice 
      });
    }

    // Controls
    if (state.boatInfo?.controlsOption) {
      if (state.boatInfo.controlsOption === 'none') {
        subtotal += 1200;
        lineItems.push({ label: 'New Controls', value: 1200 });
      } else if (state.boatInfo.controlsOption === 'adapter') {
        subtotal += 125;
        lineItems.push({ label: 'Controls Adapter', value: 125 });
      }
    }

    // Installation labor for remote motors
    const isTiller = state.motor.model?.includes('TLR') || state.motor.model?.includes('MH');
    if (state.purchasePath === 'installed' && !isTiller) {
      subtotal += 450;
      lineItems.push({ label: 'Installation Labor', value: 450 });
    }

    // Installation config (mounting for tillers)
    if (state.installConfig?.installationCost) {
      subtotal += state.installConfig.installationCost;
      lineItems.push({ label: 'Mounting Hardware', value: state.installConfig.installationCost });
    }

    // Fuel tank
    if (state.fuelTankConfig?.tankCost) {
      subtotal += state.fuelTankConfig.tankCost;
      lineItems.push({ label: `${state.fuelTankConfig.tankSize} Fuel Tank`, value: state.fuelTankConfig.tankCost });
    }

    // Trade-in
    if (state.tradeInInfo?.estimatedValue) {
      subtotal -= state.tradeInInfo.estimatedValue;
      lineItems.push({ 
        label: 'Trade-In Credit', 
        value: -state.tradeInInfo.estimatedValue, 
        type: 'subtract' 
      });
    }

    const hst = subtotal * 0.13;
    const total = subtotal + hst;
    const totalWithFee = total + DEALERPLAN_FEE;
    
    const promoRate = financingPromo?.rate || null;
    const { payment: monthly, termMonths, rate } = calculateMonthlyPayment(totalWithFee, promoRate);

    return {
      motorPrice,
      motorMsrp,
      lineItems,
      subtotal,
      hst,
      total,
      monthly,
      termMonths,
      rate,
      savings: motorMsrp - motorPrice
    };
  }, [state, financingPromo]);

  // Get package info
  const packageInfo = useMemo(() => {
    if (!state.warrantyConfig?.totalYears) return PACKAGE_LABELS.essential;
    if (state.warrantyConfig.totalYears >= 10) return PACKAGE_LABELS.premium;
    if (state.warrantyConfig.totalYears >= 7) return PACKAGE_LABELS.complete;
    return PACKAGE_LABELS.essential;
  }, [state.warrantyConfig]);

  // Active promotions (already filtered by hook)
  const activePromos = useMemo(() => {
    return promotions || [];
  }, [promotions]);

  if (!pricing) return null;

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[85vh]">
        <div className="overflow-y-auto px-4 pb-8">
          <DrawerHeader className="px-0">
            <DrawerTitle className="text-lg font-semibold text-foreground">
              Your Configuration
            </DrawerTitle>
          </DrawerHeader>

          {/* Motor Summary */}
          <div className="space-y-1 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-foreground font-medium">{state.motor?.model}</span>
              <Badge variant="secondary" className="text-xs">
                {packageInfo.name}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>{state.warrantyConfig?.totalYears || 5}-year coverage</span>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Pricing Breakdown */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground mb-3">Pricing Breakdown</h3>
            
            {pricing.lineItems.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <span className={item.type === 'subtract' ? 'text-emerald-600 font-medium' : 'text-foreground'}>
                  {item.type === 'subtract' ? '-' : ''}{money(Math.abs(item.value))}
                </span>
              </div>
            ))}

            <Separator className="my-3" />

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">{money(pricing.subtotal)}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">HST (13%)</span>
              <span className="text-foreground">{money(pricing.hst)}</span>
            </div>

            <Separator className="my-3" />

            <div className="flex justify-between">
              <span className="font-semibold text-foreground">Total</span>
              <span className="font-semibold text-foreground text-lg">{money(pricing.total)}</span>
            </div>

            {pricing.savings > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-emerald-600">Total Savings</span>
                <span className="text-emerald-600 font-medium">{money(pricing.savings)}</span>
              </div>
            )}
          </div>

          {/* Active Promotions */}
          {activePromos.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
                  <Gift className="h-4 w-4 text-emerald-600" />
                  <span>Active Promotions</span>
                </div>
                {activePromos.slice(0, 3).map((promo) => (
                  <div 
                    key={promo.id} 
                    className="bg-emerald-50 border border-emerald-100 rounded-lg p-3"
                  >
                    <div className="text-sm font-medium text-emerald-800">
                      {promo.bonus_title || promo.name}
                    </div>
                    {promo.end_date && (
                      <div className="text-xs text-emerald-600 mt-1">
                        Ends {new Date(promo.end_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Financing Estimate */}
          <Separator className="my-4" />
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <CreditCard className="h-4 w-4" />
              <span>Monthly Financing</span>
            </div>
            <div className="text-2xl font-semibold text-foreground">
              ≈ {money(pricing.monthly)}/mo
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {pricing.termMonths} months @ {pricing.rate}% APR OAC
            </div>
            {financingPromo && (
              <Badge variant="secondary" className="mt-2 bg-emerald-100 text-emerald-800 text-xs">
                {financingPromo.promo_text || `Special ${financingPromo.rate}% Rate`}
              </Badge>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
