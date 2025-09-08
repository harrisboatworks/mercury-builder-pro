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
import { ArrowLeft, Calculator, DollarSign, CheckCircle2, AlertTriangle, CreditCard, Image } from 'lucide-react';
import { QuoteData } from '../QuoteBuilder';
import { estimateTradeValue, medianRoundedTo25, getBrandPenaltyFactor, normalizeBrand } from '@/lib/trade-valuation';

import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';
import { supabase } from '@/integrations/supabase/client';
import { generateQuotePDF } from '@/lib/pdf-generator';
import { motion } from 'framer-motion';
import { xpActions } from '@/config/xpActions';
import { xpRewards, getCurrentReward, getNextReward } from '@/config/xpRewards';
import { format } from 'date-fns';
import { useActiveFinancingPromo } from '@/hooks/useActiveFinancingPromo';
import { useIsMobile } from '@/hooks/use-mobile';

interface QuoteDisplayProps {
  quoteData: QuoteData;
  onStepComplete: (data: { financing: any; hasTradein: boolean; tradeinInfo?: any }) => void;
  onBack: () => void;
  totalXP?: number;
  onEarnXP?: (amount: number) => void;
  purchasePath?: string;
}

export const QuoteDisplay = ({ quoteData, onStepComplete, onBack, totalXP = 0, onEarnXP, purchasePath }: QuoteDisplayProps) => {
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
    rewardUnlocked?: string;
    rewardValue?: number;
  } | null>(null);
  const [showFinancingInfoModal, setShowFinancingInfoModal] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  // Dynamic financing options
  const [financingOptions, setFinancingOptions] = useState<any[]>([]);
  const [selectedFinancing, setSelectedFinancing] = useState<string | null>(null);
  const { promo: activePromo } = useActiveFinancingPromo();
  const effectiveRate = (activePromo?.rate ?? quoteData.financing.rate);

  // SMS via Zapier
  const [phoneNumber, setPhoneNumber] = useState('');

  // Mobile auto-dismiss functionality
  const isMobile = useIsMobile();
  const [countdownSeconds, setCountdownSeconds] = useState(0);

  // Auto-dismiss achievement on mobile
  useEffect(() => {
    if (achievement && isMobile) {
      setCountdownSeconds(5); // 5 second countdown
      
      const timer = setInterval(() => {
        setCountdownSeconds((prev) => {
          if (prev <= 1) {
            setAchievement(null);
            handleContinue();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [achievement, isMobile]);

  const openReservationModal = () => setShowReservationModal(true);
  const handleReserveConfirm = () => {
    toast({
      title: 'Reservation placed',
      description: "We'll hold your price for 30 days.",
      duration: 2500,
    });
    setShowReservationModal(false);
  };
  
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
  
  const calculateAccessoryCosts = (motor: any, boatDetails: any) => {
    const costs = {
      controls: 0,
      controlAdapter: 0,
      battery: 0,
      propeller: 0,
      installation: purchasePath === 'loose' ? 0 : 500,
      waterTest: 0,
    };
    const hp = typeof motor?.hp === 'string' ? parseInt(motor.hp) : (motor?.hp || 0);
    const model = String(motor?.model || '').toUpperCase();

    // Controls logic with adapter option
    if (hp >= 40) {
      switch (boatDetails?.controlsOption) {
        case 'none':
          costs.controls = 1200; break;
        case 'adapter':
          costs.controlAdapter = 125; break;
        case 'compatible':
          costs.controls = 0; break;
      }
    }

    // Battery - Required for electric start
    const isElectricStart = /\bE\b|EL|ELPT|EH|EFI/.test(model) && !/\bM\b/.test(model);
    if (isElectricStart) {
      costs.battery = boatDetails?.hasBattery ? 0 : 179.99;
    }

    // Propeller - Required for 25HP+
    if (hp >= 25) {
      if (boatDetails?.hasCompatibleProp) {
        costs.propeller = 0;
      } else if (hp >= 150) {
        costs.propeller = 950; // Stainless steel
      } else {
        costs.propeller = 350; // Aluminum
      }
    }

    return costs;
  };

  const accessoryCosts = calculateAccessoryCosts(quoteData.motor, quoteData.boatInfo);
  const accessoriesSubtotal = Math.round((Object.values(accessoryCosts).reduce((sum, v) => sum + (v || 0), 0)) * 100) / 100;

  const subtotalBeforeTrade = Math.round((motorPrice + accessoriesSubtotal) * 100) / 100;
  const subtotalAfterTrade = Math.round((subtotalBeforeTrade - (hasTradeIn ? tradeInValue : 0)) * 100) / 100;
  const hst = Math.round((subtotalAfterTrade * 0.13) * 100) / 100;
  const financingFee = 299; // Added to all finance deals
  const totalCashPrice = Math.round((subtotalAfterTrade + hst) * 100) / 100;
  const totalFinancePrice = Math.round((subtotalAfterTrade + hst + financingFee) * 100) / 100;
  const maxDownPayment = totalFinancePrice * 0.5;
  const downPaymentPercentage = totalFinancePrice > 0 ? (downPayment / totalFinancePrice) * 100 : 0;

  // Financing options loader (filter by min_amount <= total)
  const calculateTotal = () => totalFinancePrice;
  const loadFinancingOptions = async () => {
    try {
      const totalAmount = calculateTotal();
      const { data, error } = await supabase
        .from('financing_options')
        .select('*')
        .eq('is_active', true)
        .lte('min_amount', totalAmount)
        .order('display_order', { ascending: true });
      
      if (error) {
        console.warn('Failed to load financing options:', error);
        setFinancingOptions([]);
        return;
      }
      
      setFinancingOptions(data || []);
    } catch (error) {
      console.warn('Error loading financing options:', error);
      setFinancingOptions([]);
    }
  };
  useEffect(() => {
    if (totalFinancePrice > 0) {
      loadFinancingOptions();
    }
  }, [totalFinancePrice]);

  const calculatePayments = () => {
    const financedAmount = totalFinancePrice - downPayment;
    const monthlyRate = effectiveRate / 100 / 12;
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
      const monthlyRate = effectiveRate / 100 / 12;
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
    rewardUnlocked?: string;
    rewardValue?: number;
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
    const projectedXP = (totalXP || 0) + xpActions.selectCash;
    const reward = getCurrentReward(projectedXP);
    showAchievement({
      icon: '💰',
      title: 'CASH BUYER LOCKED IN!',
      subtitle: 'Maximum Savings Achieved',
      message: `You just saved $${cashSavings.toFixed(0)} in interest!`,
      points: `+${xpActions.selectCash} XP Points`,
      color: 'gold',
      rewardUnlocked: reward?.reward,
      rewardValue: reward?.value,
    });
    onEarnXP?.(xpActions.selectCash);
    launchConfetti({ colors: ['#F2C94C', '#F2994A', '#F2C14E'] });
    playSound('success-cash');
  };

  const triggerFinanceCelebration = () => {
    const projectedXP = (totalXP || 0) + xpActions.selectFinancing;
    const reward = getCurrentReward(projectedXP);
    showAchievement({
      icon: '📅',
      title: 'SMART FINANCING ACTIVATED!',
      subtitle: 'Monthly Payment Plan Secured',
      message: `Just $${payments.monthly.toFixed(0)}/month gets you on the water!`,
      points: `+${xpActions.selectFinancing} XP Points`,
      color: 'blue',
      rewardUnlocked: reward?.reward,
      rewardValue: reward?.value,
    });
    onEarnXP?.(xpActions.selectFinancing);
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
      financing: { downPayment, term, rate: effectiveRate },
      hasTradein: hasTradeIn
    });
  };
  
  // Send quote via SMS with PDF link and full details
  const handleSendQuoteSms = async () => {
    if (!phoneNumber) {
      toast({ title: 'Enter phone number', description: 'Please enter your mobile number.', variant: 'destructive' });
      return;
    }

    const customerName = ((quoteData as any)?.customerName || (quoteData as any)?.boatInfo?.ownerName || 'Customer') as string;
    const quoteNumber = `Q-${Date.now()}`;

    try {
      // 1) Generate PDF
      const pdfData: any = {
        ...quoteData,
        customerName,
        customerEmail: '',
        customerPhone: phoneNumber,
        quoteNumber,
        tradeInValue: hasTradeIn ? tradeInValue : undefined,
        xp: totalXP,
        rewardName: getCurrentReward(totalXP)?.reward,
        rewardValue: getCurrentReward(totalXP)?.value,
      };
      const pdf = await generateQuotePDF(pdfData);
      const pdfBlob = pdf.output('blob');

      // 2) Upload to Supabase Storage (public bucket 'quotes')
      const safeName = customerName
        .replace(/[^a-z0-9\-]+/gi, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase() || 'customer';
      const fileName = `quote-${Date.now()}-${safeName}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('quotes')
        .upload(fileName, pdfBlob, { contentType: 'application/pdf', upsert: true });
      if (uploadError) throw uploadError;
      const { data: pub } = supabase.storage.from('quotes').getPublicUrl(fileName);
      const pdfUrl = pub.publicUrl;

      // 3) Save quote record
      const { data: quoteRecord, error: insertError } = await supabase
        .from('quotes')
        .insert({
          customer_name: customerName,
          customer_phone: phoneNumber,
          motor_model: quoteData.motor?.model || null,
          motor_price: motorPrice,
          total_price: Math.round(totalCashPrice),
          pdf_url: pdfUrl,
          quote_data: quoteData as any,
        })
        .select()
        .single();
      if (insertError) throw insertError;

      // 4) Send to Zapier webhook with ALL details
      const webhookUrl = 'https://hooks.zapier.com/hooks/catch/7238949/u6hvee9/';
      const payload = {
        phone: phoneNumber,
        customerName,
        motorModel: quoteData.motor?.model || 'Mercury Motor',
        motorPrice: motorPrice,
        totalPrice: Math.round(totalCashPrice),
        pdfUrl,
        quoteId: quoteRecord?.id || quoteNumber,
        quoteUrl: `${window.location.origin}/quote/${quoteRecord?.id || ''}`,
        // Extra details
        boatType: quoteData.boatInfo?.type,
        boatLength: quoteData.boatInfo?.length,
        hasTradeIn,
        tradeInValue,
        accessoryCosts,
        financing: {
          rate: effectiveRate,
          termMonths: term,
          downPayment,
          monthly: Math.round(payments.monthly || 0),
        },
        installationIncluded: purchasePath === 'loose' ? 'No - Loose motor only' : 'Yes - Professional installation',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        timestamp: new Date().toISOString(),
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        // Do not set Content-Type to avoid CORS preflight; Zapier will handle raw body
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        toast({ title: 'Sent', description: 'Quote was sent to your phone.' });
      } else {
        toast({ title: 'Zapier error', description: 'The webhook did not accept the request.', variant: 'destructive' });
      }
    } catch (error) {
      console.error('SMS error:', error);
      toast({ title: 'Network error', description: 'SMS service temporarily unavailable. Your quote is saved above.', variant: 'destructive' });
    }
  };
  const calculateMonthlyPayment = (principal: number, rate: number, months: number) => {
    const monthlyRate = rate / 100 / 12;
    return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(value);

  const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

  return (
    <div className="max-w-screen-xl mx-auto p-4 space-y-6">
      {/* Header Section */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Your Mercury Motor Quote</h1>
        {viewers > 0 && (
          <p className="text-sm text-muted-foreground">
            🔥 {viewers} people are viewing quotes right now
          </p>
        )}
      </div>

      {/* Promotional banners */}
      {hasSale && saleSavings > 0 && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gradient-to-r from-red-500 to-pink-600 text-white p-4 rounded-lg text-center font-bold"
        >
          💥 FLASH SALE: Save ${saleSavings.toLocaleString()} on this motor!
          {daysLeft > 0 && ` Only ${daysLeft} days left!`}
        </motion.div>
      )}

      {activePromo && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg text-center font-bold"
        >
          🎉 SPECIAL FINANCING: {activePromo.rate}% APR for qualified buyers!
        </motion.div>
      )}

      <Card className="p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Motor Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img 
                src="/assets/mercury-logo.png" 
                alt="Mercury Marine" 
                className="h-8 w-auto"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <h2 className="text-xl font-bold text-foreground">{quoteData.motor?.model}</h2>
            </div>

            {/* Motor specifications */}
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Horsepower:</span>
                <span className="font-medium">{quoteData.motor?.hp} HP</span>
              </div>
            </div>

            {/* Motor image if available */}
            {quoteData.motor?.image && (
              <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                <img 
                  src={quoteData.motor.image} 
                  alt={quoteData.motor.model}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Quote Summary */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quote Summary</h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Motor Price:</span>
                <span className="font-medium">{formatCurrency(motorPrice)}</span>
              </div>
              
              {accessoriesSubtotal > 0 && (
                <div className="flex justify-between">
                  <span>Accessories:</span>
                  <span className="font-medium">{formatCurrency(accessoriesSubtotal)}</span>
                </div>
              )}
              
              {hasTradeIn && (
                <div className="flex justify-between text-green-600">
                  <span>Trade-in Credit:</span>
                  <span className="font-medium">-{formatCurrency(tradeInValue)}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium">{formatCurrency(subtotalAfterTrade)}</span>
              </div>
              
              <div className="flex justify-between">
                <span>HST (13%):</span>
                <span className="font-medium">{formatCurrency(hst)}</span>
              </div>
              
              <div className="border-t pt-2">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(totalCashPrice)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Selection */}
        <div className="mt-8 space-y-6">
          <h3 className="text-lg font-semibold text-center">Choose Your Payment Method</h3>
          
          <div className="grid gap-4 md:grid-cols-2">
            {/* Cash Payment */}
            <Card 
              className={`p-4 cursor-pointer transition-all border-2 ${
                paymentPreference === 'cash' ? 'border-green-500 bg-green-50' : 'border-border hover:border-green-300'
              }`}
              onClick={() => handlePaymentSelection('cash')}
            >
              <div className="text-center space-y-2">
                <DollarSign className="w-8 h-8 mx-auto text-green-600" />
                <h4 className="font-semibold">Pay Cash</h4>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalCashPrice)}</p>
                <p className="text-sm text-muted-foreground">
                  Save {formatCurrency(cashSavings)} in interest!
                </p>
              </div>
            </Card>

            {/* Finance Payment */}
            <Card 
              className={`p-4 cursor-pointer transition-all border-2 ${
                paymentPreference === 'finance' ? 'border-blue-500 bg-blue-50' : 'border-border hover:border-blue-300'
              }`}
              onClick={() => handlePaymentSelection('finance')}
            >
              <div className="text-center space-y-2">
                <Calculator className="w-8 h-8 mx-auto text-blue-600" />
                <h4 className="font-semibold">Finance</h4>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(payments.monthly)}/mo
                </p>
                <p className="text-sm text-muted-foreground">
                  {effectiveRate}% APR for {term} months
                </p>
                {activePromo && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Promotional Rate!
                  </Badge>
                )}
              </div>
            </Card>
          </div>

          {/* Financing Details */}
          {paymentPreference === 'finance' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-4"
            >
              <Card className="p-4">
                <h4 className="font-semibold mb-4">Customize Your Financing</h4>
                
                {/* Down Payment Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Down Payment: {formatCurrency(downPayment)}</Label>
                    <span className="text-sm text-muted-foreground">
                      ({downPaymentPercentage.toFixed(0)}%)
                    </span>
                  </div>
                  <Slider
                    value={[downPayment]}
                    onValueChange={(value) => setDownPayment(value[0])}
                    max={maxDownPayment}
                    step={100}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>$0</span>
                    <span>{formatCurrency(maxDownPayment)}</span>
                  </div>
                </div>

                {/* Term Selection */}
                <div className="space-y-2 mt-4">
                  <Label>Loan Term</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[48, 60, 120, 180].map((termOption) => (
                      <Button
                        key={termOption}
                        variant={term === termOption ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTerm(termOption)}
                      >
                        {termOption} months
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Payment Breakdown */}
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Monthly Payment:</span>
                      <span className="font-medium">{formatCurrency(payments.monthly)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total of Payments:</span>
                      <span className="font-medium">{formatCurrency(payments.totalOfPayments + downPayment)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Interest:</span>
                      <span className="font-medium">{formatCurrency(payments.totalInterest)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Warranty and Bonus Offers */}
        {hasWarrantyBonus && (
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">🛡️ Extended Warranty Included</h4>
            <p className="text-sm text-blue-800">
              Your motor includes an extended warranty at no extra cost!
            </p>
          </div>
        )}

        {/* Financing Information Modal */}
        <Dialog open={showFinancingInfoModal} onOpenChange={setShowFinancingInfoModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Financing Information</DialogTitle>
              <DialogDescription>
                Here's what you need to know about financing your Mercury motor.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Quick Approval Process</h4>
                <p className="text-sm text-muted-foreground">
                  Get pre-approved in minutes with our online application. We work with multiple lenders to find you the best rates.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Flexible Terms</h4>
                <p className="text-sm text-muted-foreground">
                  Choose from 2-15 year terms with competitive rates. No prepayment penalties.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">What You'll Need</h4>
                <p className="text-sm text-muted-foreground">
                  Valid ID, proof of income, and basic contact information. The entire process can be completed online.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowFinancingInfoModal(false)}>Got It!</Button>
              <Button onClick={handleContinue}>Schedule Consultation</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reservation CTA */}
        <div className="reservation-section rounded-lg mt-6 p-6 text-white bg-[linear-gradient(135deg,hsl(var(--premium-blue-1)),hsl(var(--premium-blue-2)))] shadow">
          <h3 className="text-xl font-bold mb-2">Ready to Lock In This Price?</h3>
          <p className="mb-4">Put down $100 to reserve this motor and price for 30 days</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button onClick={openReservationModal} className="bg-background text-foreground hover:bg-background/90 font-bold">
              <CreditCard className="w-4 h-4 mr-2" /> Reserve Now - $100
            </Button>
            <Button onClick={handleContinue} className="bg-background text-foreground hover:bg-background/90 font-bold">
              Schedule Consultation
            </Button>
          </div>
          <div className="mt-4 text-sm opacity-90">
            <p>✓ Fully refundable deposit</p>
            <p>✓ Locks today's price for 30 days</p>
            <p>✓ Expert consultation included</p>
          </div>
        </div>

        <Dialog open={showReservationModal} onOpenChange={setShowReservationModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reserve Your Motor</DialogTitle>
              <DialogDescription>Secure today's price with a refundable $100 deposit</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="text-sm">Motor: <span className="font-medium">{quoteData.motor.model}</span></div>
              <div className="text-sm">Price held: <span className="font-medium">${motorPrice.toLocaleString()}</span></div>
              <div className="text-sm">Valid for: <span className="font-medium">30 days</span></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReservationModal(false)}>Cancel</Button>
              <Button onClick={handleReserveConfirm}><CreditCard className="w-4 h-4 mr-2" /> Pay $100</Button>
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
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-3">Text me this quote</h3>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <div className="grid gap-2">
            <Label htmlFor="phoneNumber">Mobile number</Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="+1 555-123-4567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleSendQuoteSms} disabled={!phoneNumber}>
              Send Quote
            </Button>
          </div>
        </div>
      </Card>

      {/* Why buy from us */}
      <div className="why-harris rounded-lg bg-primary/5 border border-border p-4">
        <h4 className="font-bold mb-3 text-foreground">Why Buy From Harris Boat Works?</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <img src="/lovable-uploads/5d3b9997-5798-47af-8034-82bf5dcdd04c.png" alt="Mercury CSI Award Winner badge" loading="lazy" className="h-10 w-auto" />
            <span className="text-sm text-foreground/90">Award-winning service you can trust</span>
          </div>
          <div className="flex items-center gap-3">
            <img src="/lovable-uploads/87369838-a18b-413c-bacb-f7bcfbbcbc17.png" alt="Mercury Certified Repower Center badge" loading="lazy" className="h-10 w-auto" />
            <span className="text-sm text-foreground/90">Expert repower consultation</span>
          </div>
        </div>
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
            <span className="text-xs opacity-90">Get expert advice</span>
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

            {achievement.rewardUnlocked && (
              <div className="mt-3 rounded-lg border-2 border-green-500 bg-green-50 p-3 text-green-700">
                <div className="font-bold text-lg">You've unlocked: {achievement.rewardUnlocked}{achievement.rewardValue ? ` (Free - $${achievement.rewardValue} value)` : ''}</div>
              </div>
            )}

            <div className="progress-complete">
              <div className="progress-bar-fill"></div>
              <span>Payment Method Selected ✓</span>
            </div>

            {/* Mobile countdown indicator */}
            {isMobile && countdownSeconds > 0 && (
              <div className="text-center mb-3 text-sm text-muted-foreground">
                Auto-continuing in {countdownSeconds} seconds...
                <div className="w-full bg-muted rounded-full h-1 mt-1">
                  <div 
                    className="bg-primary h-1 rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${((5 - countdownSeconds) / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            <button className="btn-continue-epic" onClick={() => { setAchievement(null); handleContinue(); }}>
              {isMobile && countdownSeconds > 0 ? `Continue (${countdownSeconds}s)` : 'Continue to Final Step →'}
            </button>
          </div>
        </div>
      )}
      
      {/* Mobile Sticky CTA - Hidden on desktop */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-white/95 backdrop-blur-sm border-t border-gray-200 block md:hidden">
        <div className="max-w-screen-sm mx-auto">
          <Button 
            onClick={handleContinue}
            className="w-full bg-red-600 hover:bg-red-700 py-4 rounded-xl text-white font-semibold text-lg"
            disabled={!paymentPreference}
          >
            {paymentPreference === 'cash' ? 'Confirm Cash Purchase' : paymentPreference === 'finance' ? 'Continue to Financing' : 'Choose Payment Method Above'}
          </Button>
        </div>
      </div>
    </div>
  );
};
