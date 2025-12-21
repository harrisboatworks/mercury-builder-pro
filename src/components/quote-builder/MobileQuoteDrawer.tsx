import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { useQuote } from '@/contexts/QuoteContext';
import { useActivePromotions } from '@/hooks/useActivePromotions';
import { useActiveFinancingPromo } from '@/hooks/useActiveFinancingPromo';
import { calculateMonthlyPayment, DEALERPLAN_FEE } from '@/lib/finance';
import { money } from '@/lib/money';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Gift, Shield, CreditCard, ChevronRight, X, Phone, MessageSquare, Mail, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
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
  const location = useLocation();
  const { state } = useQuote();
  const { promotions } = useActivePromotions();
  const { promo: financingPromo } = useActiveFinancingPromo();
  const { triggerHaptic } = useHapticFeedback();

  const isSummaryPage = location.pathname === '/quote/summary';

  // Use preview motor if available, otherwise selected motor (matches UnifiedMobileBar behavior)
  const displayMotor = state.previewMotor || state.motor;
  const isPreview = !!state.previewMotor;

  // Calculate all pricing details
  const pricing = useMemo(() => {
    // Only bail if no motor exists at all
    if (!displayMotor) return null;
    
    const motorPrice = displayMotor.price || displayMotor.basePrice || displayMotor.msrp || 0;
    
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
    const isTiller = displayMotor.model?.includes('TLR') || displayMotor.model?.includes('MH');
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
  }, [displayMotor, state, financingPromo]);

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
      <DrawerContent className="max-h-[85vh] bg-white pb-safe">
        {(!pricing || !displayMotor) ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Select a motor to view your configuration</p>
          </div>
        ) : (
          <div className="overflow-y-auto">
            <DrawerHeader className="border-b border-border/50 pb-3 relative">
              <DrawerTitle className="text-base font-semibold">Your Configuration</DrawerTitle>
              <button
                onClick={onClose}
                className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
                aria-label="Close drawer"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </DrawerHeader>

            <div className="px-4 pb-24 space-y-4">
              {/* Motor Summary */}
              <div className="pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{displayMotor.model}</span>
                  <div className="flex items-center gap-2">
                    {isPreview && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                        Previewing
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      {packageInfo.name}
                    </Badge>
                  </div>
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

              {/* Summary Page Actions */}
              {isSummaryPage ? (
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Quick Actions
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        triggerHaptic('light');
                        // Trigger PDF download via custom event
                        window.dispatchEvent(new CustomEvent('download-quote-pdf'));
                        onClose();
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                    <Button 
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        triggerHaptic('light');
                        // Trigger email quote via custom event
                        window.dispatchEvent(new CustomEvent('email-quote'));
                        onClose();
                      }}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Email Quote
                    </Button>
                  </div>
                  <Button 
                    variant="default"
                    className="w-full"
                    onClick={() => {
                      triggerHaptic('medium');
                      navigate('/financing/apply');
                      onClose();
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Apply for Financing
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={handleViewSummary}
                  variant="outline"
                  className="w-full"
                >
                  View Full Summary
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}

              <Separator />

              {/* Need Help Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide text-center">
                  Need Help?
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <a
                    href="tel:(905) 342-2153"
                    onClick={() => triggerHaptic('light')}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border hover:bg-muted/50 active:scale-[0.98] transition-all animate-fade-in"
                    style={{ animationDelay: '0ms' }}
                  >
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Call</span>
                  </a>
                  <a
                    href="sms:647-952-2153"
                    onClick={(e) => {
                      triggerHaptic('light');
                      const canSendSMS = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
                      if (!canSendSMS) {
                        e.preventDefault();
                        navigator.clipboard.writeText('647-952-2153');
                        toast.success('Text number copied to clipboard');
                      }
                    }}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border hover:bg-muted/50 active:scale-[0.98] transition-all animate-fade-in"
                    style={{ animationDelay: '75ms' }}
                  >
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Text</span>
                  </a>
                  <a
                    href="mailto:info@harrisboatworks.ca"
                    onClick={() => triggerHaptic('light')}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border hover:bg-muted/50 active:scale-[0.98] transition-all animate-fade-in"
                    style={{ animationDelay: '150ms' }}
                  >
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Email</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
};