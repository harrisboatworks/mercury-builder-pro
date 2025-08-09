import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calculator, DollarSign, CheckCircle2, AlertTriangle } from 'lucide-react';
import { QuoteData } from '../QuoteBuilder';
import { estimateTradeValue, medianRoundedTo25, getBrandPenaltyFactor, normalizeBrand } from '@/lib/trade-valuation';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';

interface QuoteDisplayProps {
  quoteData: QuoteData;
  onStepComplete: (data: { financing: any; hasTradein: boolean; tradeinInfo?: any }) => void;
  onBack: () => void;
}

export const QuoteDisplay = ({ quoteData, onStepComplete, onBack }: QuoteDisplayProps) => {
  const [downPayment, setDownPayment] = useState(0);
  const [term, setTerm] = useState(60);
  const [showTermComparison, setShowTermComparison] = useState(false);
  const [paymentPreference, setPaymentPreference] = useState<'cash' | 'finance' | null>(null);
  const [achievement, setAchievement] = useState<{
    icon: string;
    title: string;
    subtitle: string;
    message: string;
    points: string;
    color: 'gold' | 'blue';
  } | null>(null);
  const [showFinancingInfoModal, setShowFinancingInfoModal] = useState(false);
  
  // Achievement toast on load
  useEffect(() => {
    toast({
      title: "🏆 Quote Generated!",
      description: "You've configured the perfect motor.",
      duration: 2200,
    });
  }, []);

  // Gamified helpers
  const hasSale = Boolean(quoteData.motor?.basePrice && quoteData.motor?.salePrice && (quoteData.motor!.salePrice as number) < (quoteData.motor!.basePrice as number));
  const saleSavings = hasSale ? ((quoteData.motor!.basePrice as number) - (quoteData.motor!.salePrice as number)) : 0;
  const hasWarrantyBonus = (quoteData.motor?.bonusOffers || []).some(b => !!b.warrantyExtraYears && b.warrantyExtraYears > 0);
  const promoEndsAt = quoteData.motor?.promoEndsAt || null;

  // Countdown (static on render)
  const now = new Date();
  const promoMsLeft = promoEndsAt ? (new Date(promoEndsAt).getTime() - now.getTime()) : 0;
  const daysLeft = promoMsLeft > 0 ? Math.floor(promoMsLeft / (1000 * 60 * 60 * 24)) : 0;
  const hoursLeft = promoMsLeft > 0 ? Math.floor((promoMsLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)) : 0;

  // Progress to water (Step 3 of 4)
  const progressToWater = 75;

  // Simple social proof counter
  const [viewers, setViewers] = useState(0);
  useEffect(() => {
    const target = 12;
    let current = 0;
    const id = setInterval(() => {
      current += 1;
      setViewers(current);
      if (current >= target) clearInterval(id);
    }, 60);
    return () => clearInterval(id);
  }, []);
  // Get trade-in info from boat information
  const hasTradeIn = quoteData.boatInfo?.tradeIn?.hasTradeIn || false;
  const tradeInValue = quoteData.boatInfo?.tradeIn?.estimatedValue || 0;
  const tradeInDetails = quoteData.boatInfo?.tradeIn;
  const tradeEstimate = hasTradeIn && tradeInDetails ? estimateTradeValue(tradeInDetails) : null;

  const motorPrice = (quoteData.motor?.salePrice ?? quoteData.motor?.basePrice ?? quoteData.motor?.price) || 0;
  const subtotalAfterTrade = motorPrice - (hasTradeIn ? tradeInValue : 0);
  const hst = subtotalAfterTrade * 0.13;
  const financingFee = 299; // Added to all finance deals
  const totalCashPrice = subtotalAfterTrade + hst;
  const totalFinancePrice = subtotalAfterTrade + hst + financingFee;
  const maxDownPayment = totalFinancePrice * 0.5;
  const downPaymentPercentage = totalFinancePrice > 0 ? (downPayment / totalFinancePrice) * 100 : 0;

  const calculatePayments = () => {
    const financedAmount = totalFinancePrice - downPayment;
    const monthlyRate = quoteData.financing.rate / 100 / 12;
    const numPayments = term;
    
    if (financedAmount <= 0) return { weekly: 0, biweekly: 0, monthly: 0, totalOfPayments: 0, totalInterest: 0 };
    
    const monthlyPayment = (financedAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                          (Math.pow(1 + monthlyRate, numPayments) - 1);
    
    const totalOfPayments = monthlyPayment * numPayments;
    const totalInterest = totalOfPayments - financedAmount;
    
    return {
      weekly: monthlyPayment / 4.33,
      biweekly: monthlyPayment / 2,
      monthly: monthlyPayment,
      totalOfPayments,
      totalInterest
    };
  };

  const calculateAllTerms = () => {
    const terms = [48, 60, 120, 180];
    return terms.map(termMonths => {
      const financedAmount = totalFinancePrice - downPayment;
      const monthlyRate = quoteData.financing.rate / 100 / 12;
      const monthlyPayment = financedAmount > 0 ? 
        (financedAmount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
        (Math.pow(1 + monthlyRate, termMonths) - 1) : 0;
      const totalPaid = monthlyPayment * termMonths;
      const totalInterest = totalPaid - financedAmount;
      
      return {
        term: termMonths,
        years: Math.floor(termMonths / 12),
        monthly: monthlyPayment,
        totalPaid,
        totalInterest
      };
    });
  };

  const payments = calculatePayments();
  const allTerms = calculateAllTerms();
  const cashSavings = payments.totalInterest + financingFee;

  type Achievement = {
    icon: string;
    title: string;
    subtitle: string;
    message: string;
    points: string;
    color: 'gold' | 'blue';
  };

  const showAchievement = (payload: Achievement) => setAchievement(payload);

  const launchConfetti = (options: { colors?: string[] }) => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const colors = options.colors || ['#28a745', '#ffc107'];

    const interval: any = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }
      const particleCount = Math.round(50 * (timeLeft / duration));
      confetti({
        particleCount,
        startVelocity: 30,
        spread: 360,
        colors,
        origin: { x: 0.5, y: 0.5 },
      });
    }, 250);
  };

  const playSound = (_key: string) => {
    // Optional: Integrate subtle success sounds here
  };

  const triggerCashCelebration = () => {
    showAchievement({
      icon: '💰',
      title: 'CASH BUYER LOCKED IN!',
      subtitle: 'Maximum Savings Achieved',
      message: `You just saved $${cashSavings.toFixed(0)} in interest!`,
      points: '+500 Captain Points',
      color: 'gold',
    });
    launchConfetti({ colors: ['#F2C94C', '#F2994A', '#F2C14E'] });
    playSound('success-cash');
  };

  const triggerFinanceCelebration = () => {
    showAchievement({
      icon: '📅',
      title: 'SMART FINANCING ACTIVATED!',
      subtitle: 'Monthly Payment Plan Secured',
      message: `Just $${payments.monthly.toFixed(0)}/month gets you on the water!`,
      points: '+500 Flexibility Points',
      color: 'blue',
    });
    launchConfetti({ colors: ['#60A5FA', '#06B6D4', '#A78BFA'] });
    playSound('success-finance');
  };

  const handlePaymentSelection = (type: 'cash' | 'finance') => {
    setPaymentPreference(type);
    if (type === 'cash') triggerCashCelebration();
    else triggerFinanceCelebration();
  };
  const handleContinue = () => {
    onStepComplete({
      financing: { downPayment, term, rate: quoteData.financing.rate },
      hasTradein: hasTradeIn
    });
  };

  if (!quoteData.motor) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-foreground">Your Quote Summary</h2>
        <p className="text-lg text-muted-foreground">
          Review your selection and financing options
        </p>
      </div>

      {/* Savings Celebration */}
      {(hasSale || hasWarrantyBonus) && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-center animate-fade-in">
          <div className="font-semibold">🎉 Great choice! You're getting:</div>
          <div className="benefits-ticker mt-2">
            <div>
              {hasWarrantyBonus && (
                <span className="benefit-item">✓ 5 Year Warranty (Value: $899)</span>
              )}
              <span className="benefit-item">✓ Exclusive Mercury Dealer Pricing</span>
              <span className="benefit-item">✓ Professional Installation Available</span>
            </div>
          </div>
          {hasSale && (
            <div className="mt-2 text-sm text-primary font-medium">Instant Savings: ${saleSavings.toLocaleString()}</div>
          )}
        </div>
      )}

      {/* Progress Momentum Indicator */}
      <div className="rounded-lg border border-border bg-muted/30 p-4 animate-fade-in">
        <h3 className="font-semibold mb-2">You're Almost on the Water! 🚤</h3>
        <div className="flex items-center gap-3">
          <Progress value={progressToWater} className="h-3" />
          <span className="text-sm text-muted-foreground">{progressToWater}% Complete</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-3 text-xs">
          <span className="text-green-700 dark:text-green-300">✓ Motor Selected</span>
          <span className="text-green-700 dark:text-green-300">✓ Boat Configured</span>
          <span className="font-medium">→ Review Quote</span>
          <span className="text-muted-foreground">○ Schedule Consultation</span>
        </div>
      </div>

      {/* Limited Time Urgency */}
      {promoEndsAt && (daysLeft > 0 || hoursLeft > 0) && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-center pulse">
          <div className="font-semibold">⏰ Promotion Ends In: <span className="ml-1">{daysLeft}d {hoursLeft}h</span></div>
          <small className="text-muted-foreground block">Lock in your 5 Year Warranty today!</small>
        </div>
      )}

      {/* Complete Financial Breakdown */}
      <Card className="p-8">
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-center text-foreground border-b border-border pb-4">
            QUOTE SUMMARY
          </h3>
          
          {/* Selected Motor Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                  {quoteData.motor.image ? (
                    <img 
                      src={quoteData.motor.image} 
                      alt={quoteData.motor.model}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-medium text-muted-foreground">MOTOR</span>
                  )}
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-foreground">{quoteData.motor.model}</h4>
                  <p className="text-sm text-muted-foreground">{quoteData.motor.specs}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="bg-primary text-primary-foreground text-xs">
                      {quoteData.motor.hp}HP
                    </Badge>
                    <Badge className="bg-in-stock text-in-stock-foreground text-xs">
                      {quoteData.motor.stockStatus}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-foreground">${motorPrice.toLocaleString()}</p>
                {quoteData.motor.basePrice && quoteData.motor.salePrice && quoteData.motor.salePrice < quoteData.motor.basePrice && (
                  <div className="mt-1 text-xs">
                    <div className="text-muted-foreground line-through">Motor List Price: ${quoteData.motor.basePrice.toLocaleString()}</div>
                    <div className="text-green-600 dark:text-green-400">Current Sale Price: -${(quoteData.motor.basePrice - (quoteData.motor.salePrice || 0)).toLocaleString()}</div>
                    <div className="text-foreground">Your Price: ${motorPrice.toLocaleString()}</div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Promotions Breakdown */}
            {(quoteData.motor?.appliedPromotions?.length || (quoteData.motor?.bonusOffers?.length)) ? (
              <div className="mt-3 rounded-lg border border-border p-3 bg-muted/20">
                <h5 className="font-semibold text-foreground mb-2">Active Promotions</h5>
                {quoteData.motor?.appliedPromotions?.length ? (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex flex-wrap gap-2">
                      {quoteData.motor.appliedPromotions.map((name, i) => (
                        <Badge key={i} variant="outline">{name}</Badge>
                      ))}
                    </div>
                    {quoteData.motor.originalPrice && quoteData.motor.price < (quoteData.motor.originalPrice || 0) && (
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground line-through">${quoteData.motor.originalPrice?.toLocaleString()}</p>
                        <p className="text-sm font-bold text-primary">You save ${Math.round(((quoteData.motor.originalPrice || 0) - quoteData.motor.price)).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                ) : null}
                {quoteData.motor?.bonusOffers?.length ? (
                  <div className="mt-2">
                    <div className="text-sm text-muted-foreground mb-1">Included Bonus Offers:</div>
                    <div className="flex flex-wrap gap-2">
                      {quoteData.motor.bonusOffers.map((b) => (
                        <Badge key={b.id} className="bg-secondary text-secondary-foreground">{b.shortBadge || b.title}</Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
            
            {/* Trade-In Line */}
            {hasTradeIn && (
              <div className="py-2">
                <div className="flex justify-between items-center">
                  <div className="text-green-600 dark:text-green-400">
                    <span className="font-medium">Your {quoteData.boatInfo?.tradeIn?.year} {quoteData.boatInfo?.tradeIn?.brand} {quoteData.boatInfo?.tradeIn?.horsepower}HP</span>
                  </div>
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">
                    -${tradeInValue.toLocaleString()}
                  </div>
                </div>
                {tradeEstimate && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    Using ${tradeInValue.toLocaleString()} (median of ${Math.round(tradeEstimate.low).toLocaleString()}–${Math.round(tradeEstimate.high).toLocaleString()}). Final value subject to inspection.
                  </div>
                )}
              </div>
            )}
            
            {/* Subtotal */}
            <div className="border-t border-border pt-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-foreground">Subtotal:</span>
                <span className="text-xl font-bold text-foreground">${subtotalAfterTrade.toLocaleString()}</span>
              </div>
            </div>
            
            {/* HST */}
            <div className="flex justify-between items-center">
              <span className="font-medium text-foreground">HST (13%):</span>
              <span className="text-xl font-bold text-foreground">${hst.toLocaleString()}</span>
            </div>
            
            {/* Total Cash Price */}
            <div className="border-t border-border pt-4">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-foreground">TOTAL CASH PRICE:</span>
                <span className="text-3xl font-bold text-primary">${totalCashPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          {/* Financing Options */}
          <div className="border-t border-border pt-6 space-y-6">
            <h4 className="text-xl font-bold text-foreground">FINANCING OPTIONS {hasTradeIn ? '(after trade-in)' : ''}:</h4>
            
            {/* Cash Option */}
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💰</span>
                  <div>
                    <p className="font-bold text-green-800 dark:text-green-200">PAY CASH & SAVE:</p>
                    <p className="text-sm text-green-700 dark:text-green-300">Save ${cashSavings.toFixed(0)} in interest</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-green-800 dark:text-green-200">
                  ${totalCashPrice.toLocaleString()}
                </div>
              </div>
            </div>
            
            {/* Down Payment Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-base font-medium">Down Payment</Label>
                <span className="text-sm text-muted-foreground">
                  {downPaymentPercentage.toFixed(0)}% of total price
                </span>
              </div>
              <Slider
                value={[downPayment]}
                onValueChange={(value) => setDownPayment(value[0])}
                max={maxDownPayment}
                min={0}
                step={500}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>$0</span>
                <span className="font-medium text-foreground">
                  ${downPayment.toLocaleString()}
                </span>
                <span>${maxDownPayment.toLocaleString()}</span>
              </div>
            </div>
            

            {/* Amount to Finance */}
            <div className="flex justify-between items-center py-2 bg-muted/30 px-4 rounded">
              <span className="font-medium text-foreground">Amount to Finance:</span>
              <span className="text-lg font-bold text-foreground">${(totalFinancePrice - downPayment).toLocaleString()}</span>
            </div>

            {/* Term Selection */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-base font-medium">SELECT YOUR TERM</Label>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowTermComparison(!showTermComparison)}
                  className="text-xs"
                >
                  {showTermComparison ? 'Hide' : 'Show'} Payment Comparison
                </Button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[48, 60, 120, 180].map((months) => {
                  const years = Math.floor(months / 12);
                  const isShortTerm = months <= 60;
                  const isLongTerm = months >= 120;
                  return (
                    <Button
                      key={months}
                      variant={term === months ? 'default' : 'outline'}
                      onClick={() => setTerm(months)}
                      className={`h-16 flex flex-col ${
                        isShortTerm ? 'border-green-300 hover:border-green-400' :
                        isLongTerm ? 'border-orange-300 hover:border-orange-400' :
                        'border-yellow-300 hover:border-yellow-400'
                      }`}
                    >
                      <span className="text-lg font-bold">{months} mo</span>
                      <span className="text-xs">{years} year{years > 1 ? 's' : ''}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Term Comparison Table */}
            {showTermComparison && (
              <div className="border border-border rounded-lg p-4 bg-muted/20">
                <h5 className="font-semibold text-foreground mb-3">PAYMENT COMPARISON (Amount: ${(totalFinancePrice - downPayment).toLocaleString()})</h5>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2">Term</th>
                        <th className="text-right py-2">Monthly</th>
                        <th className="text-right py-2">Total Paid</th>
                        <th className="text-right py-2">Interest</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allTerms.map((termData) => (
                        <tr key={termData.term} className={`border-b border-border/50 ${term === termData.term ? 'bg-primary/10' : ''}`}>
                          <td className="py-2 font-medium">{termData.term} mo</td>
                          <td className="text-right py-2 font-bold">${termData.monthly.toFixed(0)}</td>
                          <td className="text-right py-2">${termData.totalPaid.toFixed(0)}</td>
                          <td className="text-right py-2">${termData.totalInterest.toFixed(0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Finance Option */}
            <div className="border border-border rounded-lg p-6 bg-muted/10">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">📅</span>
                <p className="font-bold text-foreground">YOUR PAYMENT OPTIONS:</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">WEEKLY</p>
                  <p className="text-5xl font-bold text-foreground">${payments.weekly.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">/week*</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">BI-WEEKLY</p>
                  <p className="text-5xl font-bold text-foreground">${payments.biweekly.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">/bi-weekly*</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">MONTHLY</p>
                  <p className="text-5xl font-bold text-foreground">${payments.monthly.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">/month*</p>
                </div>
              </div>
              
              <div className="text-center space-y-1 text-sm text-muted-foreground border-t border-border pt-3">
                <p className="font-medium">ESTIMATED PAYMENTS ({term} months):</p>
                <p>Total of payments: ${payments.totalOfPayments.toLocaleString()}</p>
                <p>Total interest: ${payments.totalInterest.toFixed(0)}</p>
                <p className="text-xs mt-2">*{quoteData.financing.rate}% APR for {term} months OAC</p>
                <p className="text-xs text-muted-foreground">Includes ${financingFee.toLocaleString()} financing administration fee. All payments include HST.</p>
              </div>
            </div>

            {/* Financing Disclaimers */}
            <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
              <h5 className="font-bold text-foreground mb-3">IMPORTANT FINANCING INFORMATION:</h5>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>All financing subject to approved credit (OAC)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>Payments shown are estimates for quoting purposes only</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>Final pricing, payments and terms must be finalized with Harris Boat Works Ltd, Dealerplan Peterborough (Broker), and lending institution</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>Actual payments may vary based on credit approval</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>Interest rate subject to credit qualification</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  <span>HST included in all payment calculations</span>
                </div>
              </div>
            </div>
            
            {/* Cash Savings Highlight */}
            {cashSavings > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <p className="font-bold text-amber-800 dark:text-amber-200">
                      SAVE ${cashSavings.toFixed(0)} by paying cash!
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      No interest charges = more money for fuel and fun!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Gamified Financing Comparison */}
          <div className="border-t border-border pt-6">
            <h4 className="text-xl font-bold mb-3">Choose Your Adventure to the Water 🌊</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              {/* Cash Captain Card */}
              <Card className="h-full flex flex-col gap-4 p-5 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">💰 Cash Captain</div>
                    <Badge variant="secondary" className="text-[10px]">BEST VALUE</Badge>
                  </div>
                  <div className="text-3xl font-bold leading-tight mt-2">${totalCashPrice.toLocaleString()}</div>
                  <div className="text-sm text-green-700 dark:text-green-300">Save {cashSavings.toFixed(0)} in interest!</div>
                </div>
                <Button className="mt-auto w-full" onClick={() => handlePaymentSelection('cash')}>Pay Cash & Save</Button>
              </Card>

              {/* Easy Monthly Card */}
              <Card className="h-full flex flex-col gap-4 p-5 border-border bg-card">
                <div>
                  <div className="font-semibold">📅 Easy Monthly</div>
                  <div className="text-3xl font-bold leading-tight mt-2">${payments.monthly.toFixed(0)}/month</div>
                  <small className="block text-muted-foreground">{term} months @ {quoteData.financing.rate}%</small>
                  <div className="mt-2 text-sm leading-relaxed">
                    <div>✓ Keep cash on hand</div>
                    <div>✓ Build credit</div>
                  </div>
                </div>
                <Button className="mt-auto w-full" onClick={() => handlePaymentSelection('finance')}>Finance This Motor</Button>
              </Card>
            </div>

            {paymentPreference && (
              <div className="mt-4 rounded-lg border border-in-stock/30 bg-in-stock/10 p-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xl">🔒</span>
                  <h5 className="font-semibold">Payment Method Locked In!</h5>
                </div>
                <p className="text-sm mt-1">
                  {paymentPreference === 'cash' ? `💰 Cash Payment - Save $${cashSavings.toFixed(0)}` : `📅 Financing - $${payments.monthly.toFixed(0)}/month`}
                </p>
                <div className="mt-3 flex justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPaymentPreference(null)}>Change Selection</Button>
                  <Button size="sm" onClick={handleContinue}>Continue to Final Step →</Button>
                </div>
              </div>
            )}
          </div>

          {/* Financing Teaser Section */}
          <div className="mt-6 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/10 p-6">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">💳 Financing Available!</h3>
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-in-stock font-bold">✓</span>
                  <span>Quick approval process</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-in-stock font-bold">✓</span>
                  <span>Competitive rates from 7.99%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-in-stock font-bold">✓</span>
                  <span>Apply after consultation when we know your exact needs</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground italic mt-2 p-3 bg-background rounded-md border border-border">
                We'll help you get the best financing terms after we've confirmed your perfect motor setup and trade-in value.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <Button onClick={handleContinue}>📅 Schedule Your Consultation</Button>
                <Button variant="outline" onClick={() => setShowFinancingInfoModal(true)}>Learn About Financing</Button>
              </div>
            </div>
          </div>

          <Dialog open={showFinancingInfoModal} onOpenChange={setShowFinancingInfoModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Financing Your Mercury Outboard</DialogTitle>
                <DialogDescription>Easy financing through our partners</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">Easy Financing Through Our Partners</h4>
                  <div className="mt-1 text-sm">
                    <p><strong>Dealerplan Peterborough (Broker)</strong></p>
                    <p className="text-muted-foreground">Working with major Canadian banks and lenders</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold">What You Need to Know:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Rates starting from 7.99% OAC</li>
                    <li>Terms from 48 to 180 months available</li>
                    <li>Quick approval process (usually same day)</li>
                    <li>No penalties for early payment</li>
                    <li>Finance insurance available</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold">What to Bring:</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Valid driver's license</li>
                    <li>Proof of income</li>
                    <li>Void cheque or bank info</li>
                    <li>Trade ownership (if applicable)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold">Why Wait Until Consultation?</h4>
                  <p className="text-muted-foreground text-sm">
                    We want to ensure you're financing the right amount! After we:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-sm mt-1">
                    <li>Confirm the perfect motor for your boat</li>
                    <li>Verify control compatibility costs</li>
                    <li>Assess your trade-in value</li>
                    <li>Calculate exact installation needs</li>
                  </ul>
                  <p className="text-muted-foreground text-sm mt-2">
                    ...we'll know your exact financing needs and can get you the best possible terms.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowFinancingInfoModal(false)}>Got It!</Button>
                <Button onClick={handleContinue}>Schedule Consultation</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Important Notes */}
          <div className="border-t border-border pt-4 space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-in-stock" />
              <span>Quote valid for 30 days</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-in-stock" />
              <span>Installation requirements to be determined</span>
            </div>
            {hasTradeIn && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-in-stock" />
                <span>Trade value subject to inspection</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-in-stock" />
              <span>Prices subject to change</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Installation Requirements */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-on-order">
            <AlertTriangle className="w-5 h-5" />
            Installation Requirements To Be Determined
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-in-stock" />
                <span className="text-sm">Exact shaft length for your boat</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-in-stock" />
                <span className="text-sm">Control system compatibility check</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-in-stock" />
                <span className="text-sm">Rigging and cable requirements</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-in-stock" />
                <span className="text-sm">Professional installation estimate</span>
              </div>
            </div>
          </div>
          
          <Alert className="border-primary bg-primary/10">
            <AlertDescription>
              Our technicians will provide final pricing after inspection
            </AlertDescription>
          </Alert>
        </div>
      </Card>

      {/* Trade-In Impact Display */}
      {hasTradeIn && quoteData.boatInfo?.tradeIn && (
        <Card className="p-6 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Trade-In Impact
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                  ${tradeInValue.toLocaleString()}
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">Trade Value Applied</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                  ${tradeInValue.toLocaleString()}
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">Total Price Reduction</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                  ${(Math.round((motorPrice - downPayment) * (0.0799 / 12) * 100) / 100 - payments.monthly).toFixed(0)}
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">Monthly Payment Savings</div>
              </div>
            </div>

            <div className="pt-4 border-t border-green-200 dark:border-green-800">
              <div className="text-center">
                <p className="text-sm text-green-700 dark:text-green-300">
                  Trade-in: {quoteData.boatInfo.tradeIn.year} {quoteData.boatInfo.tradeIn.brand} {quoteData.boatInfo.tradeIn.horsepower}HP
                  {quoteData.boatInfo.tradeIn.model && ` ${quoteData.boatInfo.tradeIn.model}`}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  *Final value subject to in-person inspection
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Social Proof / Popularity Indicator */}
      <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
        <div className="font-medium">🔥 This motor is popular!</div>
        <div className="text-sm text-muted-foreground"><span className="font-semibold">{viewers}</span> other customers viewed this model today</div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Boat Details
        </Button>
        
        <Button onClick={handleContinue} className="bg-primary hover:bg-primary/90 relative overflow-hidden">
          <span className="flex flex-col items-start">
            <span>Schedule Consultation</span>
            <span className="text-xs opacity-90">Unlock installation quote</span>
          </span>
        </Button>
      </div>

      {/* Achievement Overlay */}
      {achievement && (
        <div className="achievement-overlay" role="dialog" aria-modal="true">
          <div className="achievement-card animate-in">
            <div className="achievement-icon-container">
              <div
                className="icon-pulse-ring"
                style={{ ['--ring-color' as any]: achievement.color === 'gold' ? 'hsl(var(--promo-gold-1))' : 'hsl(var(--primary))' }}
              ></div>
              <div className="achievement-icon">{achievement.icon}</div>
            </div>

            <h1 className="achievement-title">{achievement.title}</h1>
            <h2 className="achievement-subtitle">{achievement.subtitle}</h2>

            <div className="achievement-stats">
              <div className="stat-item">
                <span className="stat-value">{achievement.message}</span>
              </div>
              <div className="points-earned">{achievement.points}</div>
            </div>

            <div className="progress-complete">
              <div className="progress-bar-fill"></div>
              <span>Payment Method Selected ✓</span>
            </div>

            <button className="btn-continue-epic" onClick={() => { setAchievement(null); handleContinue(); }}>
              Continue to Final Step →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};