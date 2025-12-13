import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { useQuote } from '@/contexts/QuoteContext';
import { useActivePromotions } from '@/hooks/useActivePromotions';
import { useActiveFinancingPromo } from '@/hooks/useActiveFinancingPromo';
import { calculateMonthlyPayment, DEALERPLAN_FEE } from '@/lib/finance';
import { money } from '@/lib/money';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Gift, Shield, CreditCard, ChevronRight } from 'lucide-react';

interface MobileQuoteDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const PACKAGE_LABELS: Record<string, { name: string; years: number }> = {
  essential: { name: 'Essential', years: 5 },
  complete: { name: 'Complete', years: 7 },
  premium: { name: 'Premium', years: 10 }
};

export const MobileQuoteDrawer: React.FC<MobileQuoteDrawerProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { state } = useQuote();
  const { promotions } = useActivePromotions();
  const { promo: financingPromo } = useActiveFinancingPromo();

  // Calculate all pricing details
  const pricing = useMemo(() => {
    if (!state.motor?.price) return null;

    const motorPrice = state.motor.price;
    
    let subtotal = motorPrice;
    const lineItems: { label: string; value: number; isCredit?: boolean }[] = [];

    // Motor
    lineItems.push({ label: 'Motor Price', value: motorPrice });

    // Warranty
    if (state.warrantyConfig?.warrantyPrice) {
      subtotal += state.warrantyConfig.warrantyPrice;
      lineItems.push({ 
        label: `Extended Warranty (+${state.warrantyConfig.totalYears - 5} yrs)`, 
        value: state.warrantyConfig.warrantyPrice 
      });
    }

    // Controls
    if (state.boatInfo?.controlsOption) {
      if (state.boatInfo.controlsOption === 'none') {
        subtotal += 1200;
        lineItems.push({ label: 'New Controls & Rigging', value: 1200 });
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
    if (state.fuelTankConfig?.tankCost && state.fuelTankConfig?.tankSize) {
      subtotal += state.fuelTankConfig.tankCost;
      lineItems.push({ label: `${state.fuelTankConfig.tankSize} Fuel Tank`, value: state.fuelTankConfig.tankCost });
    }

    // Trade-in
    if (state.tradeInInfo?.estimatedValue) {
      subtotal -= state.tradeInInfo.estimatedValue;
      lineItems.push({ 
        label: 'Trade-In Credit', 
        value: state.tradeInInfo.estimatedValue, 
        isCredit: true 
      });
    }

    const hst = subtotal * 0.13;
    const total = subtotal + hst;
    const totalWithFee = total + DEALERPLAN_FEE;
    
    const promoRate = financingPromo?.rate || null;
    const { payment: monthly, termMonths, rate } = calculateMonthlyPayment(totalWithFee, promoRate);

    return {
      motorPrice,
      lineItems,
      subtotal,
      hst,
      total,
      monthly,
      termMonths,
      rate
    };
  }, [state, financingPromo]);

  // Get package info
  const packageInfo = useMemo(() => {
    if (!state.warrantyConfig?.totalYears) return PACKAGE_LABELS.essential;
    if (state.warrantyConfig.totalYears >= 10) return PACKAGE_LABELS.premium;
    if (state.warrantyConfig.totalYears >= 7) return PACKAGE_LABELS.complete;
    return PACKAGE_LABELS.essential;
  }, [state.warrantyConfig]);

  // Active promotions
  const activePromos = promotions || [];

  const handleViewSummary = () => {
    onClose();
    navigate('/quote/summary');
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[85vh] bg-white">
        {(!pricing || !state.motor) ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Select a motor to view your configuration</p>
          </div>
        ) : (
          <div className="overflow-y-auto">
            <DrawerHeader className="border-b border-border/50 pb-3">
              <DrawerTitle className="text-base font-semibold">Your Configuration</DrawerTitle>
            </DrawerHeader>

            <div className="px-4 pb-6 space-y-4">
              {/* Motor Summary */}
              <div className="pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{state.motor.model}</span>
                  <Badge variant="secondary" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    {packageInfo.name}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {state.warrantyConfig?.totalYears || 5}-year warranty coverage
                </p>
              </div>

              <Separator />

              {/* Pricing Breakdown */}
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Pricing Breakdown
                </h4>
                
                {pricing.lineItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className={item.isCredit ? 'text-green-600' : 'text-muted-foreground'}>
                      {item.label}
                    </span>
                    <span className={item.isCredit ? 'text-green-600 font-medium' : ''}>
                      {item.isCredit ? '-' : ''}{money(item.value)}
                    </span>
                  </div>
                ))}

                <Separator className="my-2" />

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{money(pricing.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">HST (13%)</span>
                  <span>{money(pricing.hst)}</span>
                </div>

                <Separator className="my-2" />

                <div className="flex justify-between font-semibold">
                  <span>Estimated Total</span>
                  <span className="text-lg">{money(pricing.total)}</span>
                </div>
              </div>

              {/* Active Promotions */}
              {activePromos.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Gift className="h-4 w-4 text-green-600" />
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Active Promotions
                      </h4>
                    </div>
                    {activePromos.slice(0, 2).map((promo) => (
                      <div 
                        key={promo.id} 
                        className="bg-green-50 border border-green-100 rounded-lg p-2.5"
                      >
                        <p className="text-sm font-medium text-green-800">
                          {promo.bonus_title || promo.name}
                        </p>
                        {promo.end_date && (
                          <p className="text-xs text-green-600 mt-0.5">
                            Ends {new Date(promo.end_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Financing Estimate */}
              <div className="bg-muted/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Monthly Financing</span>
                </div>
                <p className="text-2xl font-semibold">
                  ≈ {money(pricing.monthly)}<span className="text-sm font-normal text-muted-foreground">/mo</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {pricing.termMonths} months @ {pricing.rate}% APR OAC
                </p>
              </div>

              {/* View Summary Button */}
              <Button 
                onClick={handleViewSummary}
                variant="outline"
                className="w-full"
              >
                View Full Summary
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
};