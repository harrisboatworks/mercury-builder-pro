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
import { ArrowLeft, Calculator, DollarSign, CheckCircle2, AlertTriangle, CreditCard, Image, Check, Download } from 'lucide-react';
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
import { useAuth } from '@/components/auth/AuthProvider';
import { AuthModal } from '@/components/auth/AuthModal';
import { createQuote } from '@/lib/quotesApi';
import { useQuote } from '@/contexts/QuoteContext';

interface QuoteDisplayProps {
  quoteData: QuoteData;
  onStepComplete: (data: { financing: any; hasTradein: boolean; tradeinInfo?: any }) => void;
  onBack: () => void;
  totalXP?: number;
  onEarnXP?: (amount: number) => void;
  purchasePath?: string;
}

export const QuoteDisplay = ({ quoteData, onStepComplete, onBack, totalXP = 0, onEarnXP, purchasePath }: QuoteDisplayProps) => {
  const FINANCING_MINIMUM = 5000;
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
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signup');
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
  
  // Auth
  const { user } = useAuth();

  // Get state data that's not in QuoteData interface
  const { state } = useQuote();

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
      description: 'Your motor has been reserved for 30 days.',
    });
    setShowReservationModal(false);
  };

  // Calculate pricing
  const motorPrice = quoteData.motor?.salePrice || quoteData.motor?.basePrice || 0;
  const hasTradeIn = state.tradeInInfo?.hasTradeIn || false;
  const tradeInValue = hasTradeIn ? (state.tradeInInfo?.estimatedValue || 0) : 0;
  const hasSale = (quoteData.motor?.basePrice || 0) > motorPrice;
  const saleSavings = hasSale ? (quoteData.motor?.basePrice || 0) - motorPrice : 0;

  // Accessories calculation
  const accessoryCosts = (() => {
    if (purchasePath === 'loose') return 0;
    
    const hp = quoteData.motor?.hp || 0;
    let total = 0;
    
    // Controls: $2500 for all motors
    total += 2500;
    
    // Battery: varies by HP
    if (hp <= 30) total += 450;
    else if (hp <= 60) total += 650;
    else if (hp <= 100) total += 750;
    else total += 850;
    
    // Propeller: varies by HP
    if (hp <= 25) total += 350;
    else if (hp <= 60) total += 450;
    else if (hp <= 115) total += 600;
    else if (hp <= 200) total += 750;
    else total += 850;
    
    return total;
  })();

  const installationCost = state.installConfig?.selectedOption?.price || 0;
  const subtotalBeforeTax = motorPrice + accessoryCosts + installationCost - tradeInValue;
  const hstAmount = subtotalBeforeTax * 0.13;
  const totalCashPrice = subtotalBeforeTax + hstAmount;

  // Financing calculations
  const financeAmount = totalCashPrice - downPayment;
  const monthlyRate = effectiveRate / 100 / 12;
  const monthlyPayment = monthlyRate > 0 ? (financeAmount * monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1) : financeAmount / term;
  const totalFinancePayments = monthlyPayment * term + downPayment;
  const totalInterest = totalFinancePayments - totalCashPrice;
  const cashSavings = totalInterest;

  const payments = {
    monthly: monthlyPayment,
    total: totalFinancePayments,
    interest: totalInterest
  };

  // Achievement handling
  const handlePaymentSelection = (type: 'cash' | 'finance') => {
    setPaymentPreference(type);

    if (type === 'cash' && totalCashPrice > 20000) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      setAchievement({
        icon: '💰',
        title: 'High Roller!',
        subtitle: 'Cash payment selected',
        message: `Paying $${totalCashPrice.toLocaleString()} in cash - that's serious commitment!`,
        points: '+500 XP',
        color: 'gold',
        rewardUnlocked: 'VIP Status',
        rewardValue: 500
      });

      if (onEarnXP) onEarnXP(500);
    } else if (type === 'finance') {
      // Add visual feedback for finance selection
      toast({
        title: 'Financing selected',
        description: `Monthly payment: ${formatCurrency(payments.monthly)} at ${effectiveRate}% APR`,
      });
    }
  };

  const handleContinue = () => {
    const financingData = paymentPreference === 'finance' ? {
      preference: 'finance',
      downPayment,
      term,
      monthlyPayment,
      rate: effectiveRate
    } : {
      preference: 'cash',
      totalCashPrice
    };

      onStepComplete({
        financing: financingData,
        hasTradein: hasTradeIn,
        tradeinInfo: hasTradeIn ? state.tradeInInfo : undefined
      });
  };

  const handleSaveQuote = async () => {
    if (!user) {
      setAuthModalMode('signup');
      setShowAuthModal(true);
      return;
    }

    try {
      await createQuote({
        customer_name: user.email,
        motor_model: quoteData.motor?.model,
        motor_hp: quoteData.motor?.hp,
        base_price: motorPrice,
        options: [
          { name: 'Accessories', price: accessoryCosts },
          { name: 'Installation', price: installationCost }
        ],
        notes: hasTradeIn ? `Trade-in: ${state.tradeInInfo?.year} ${state.tradeInInfo?.brand} ${state.tradeInInfo?.model}` : undefined
      });
      
      toast({ title: 'Quote saved!', description: 'Your quote has been saved to your account.' });
    } catch (error) {
      console.error('Save quote error:', error);
      toast({ title: 'Error', description: 'Failed to save quote. Please try again.', variant: 'destructive' });
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const pdfData = {
        customerName: user?.email || 'Customer',
        customerEmail: user?.email || 'customer@example.com',
        customerPhone: user?.phone || '',
        quoteNumber: `Q${Date.now()}`,
        motor: quoteData.motor,
        boatInfo: quoteData.boatInfo,
        financing: quoteData.financing,
        warrantyConfig: quoteData.warrantyConfig,
        hasTradein: hasTradeIn,
        tradeInValue: tradeInValue
      };

      const pdf = await generateQuotePDF(pdfData);
      pdf.save(`mercury-quote-${Date.now()}.pdf`);
      
      toast({ title: 'Download complete!', description: 'Your quote PDF has been downloaded.' });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({ title: 'Error', description: 'Failed to generate PDF. Please try again.', variant: 'destructive' });
    }
  };

  const handleStripePayment = async () => {
    if (!user) {
      toast({ 
        title: 'Please sign in', 
        description: 'You need to be signed in to secure your deal.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // For deposit, we only charge $100 to secure the deal
      const depositAmount = 100;
      const stripeQuoteData = {
        motorModel: quoteData.motor?.model || 'Mercury Motor',
        horsepower: quoteData.motor?.hp || 0,
        motorPrice: depositAmount, // Only charge deposit amount
        accessoryCosts: 0, // No accessories in deposit
        installationCost: 0, // No installation in deposit
        tradeInCredit: 0, // No trade-in credit in deposit
        totalPrice: depositAmount, // Total is just the deposit
        customerName: user.email,
        customerPhone: user.phone || '',
        isDeposit: true, // Flag to indicate this is a deposit
        fullQuoteTotal: totalCashPrice // Store full quote amount for reference
      };

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { quoteData: stripeQuoteData }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        toast({ 
          title: 'Securing your deal', 
          description: 'Opening secure deposit payment...' 
        });
      }
    } catch (error) {
      console.error('Deposit payment error:', error);
      toast({
        title: 'Payment Error', 
        description: error.message || 'Failed to initiate payment. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(value);

  return (
    <div className="max-w-screen-xl mx-auto p-4 space-y-6">
      {/* Header Section */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Your Mercury Motor Quote</h1>
      </div>

      {/* Promotional banners */}
      {hasSale && saleSavings > 0 && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gradient-to-r from-red-500 to-pink-600 text-white p-4 rounded-lg text-center font-bold"
        >
          💥 FLASH SALE: Save ${saleSavings.toLocaleString()} on this motor!
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
                  alt={quoteData.motor?.model || 'Mercury Motor'}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Quote Summary */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quote Summary</h3>
            
            <div className="space-y-2 text-sm">
              {/* Motor Pricing */}
              <div className="space-y-1">
                {hasSale && quoteData.motor?.basePrice ? (
                  <>
                    <div className="flex justify-between text-muted-foreground">
                      <span>MSRP:</span>
                      <span className="line-through">{formatCurrency(quoteData.motor.basePrice)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span className="font-medium">-{formatCurrency(saleSavings)}</span>
                    </div>
                  </>
                ) : null}
                <div className="flex justify-between">
                  <span>Motor Price:</span>
                  <span className="font-semibold">{formatCurrency(motorPrice)}</span>
                </div>
              </div>

              {/* Accessories */}
              {accessoryCosts > 0 && (
                <div className="flex justify-between">
                  <span>Accessories:</span>
                  <span>{formatCurrency(accessoryCosts)}</span>
                </div>
              )}

              {/* Installation */}
              {installationCost > 0 && (
                <div className="flex justify-between">
                  <span>Installation:</span>
                  <span>{formatCurrency(installationCost)}</span>
                </div>
              )}

              {/* Trade-in Credit */}
              {hasTradeIn && (
                <div className="flex justify-between text-green-600">
                  <span>Trade-in Credit:</span>
                  <span>-{formatCurrency(tradeInValue)}</span>
                </div>
              )}

              <div className="border-t border-border pt-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotalBeforeTax)}</span>
                </div>
                <div className="flex justify-between">
                  <span>HST (13%):</span>
                  <span>{formatCurrency(hstAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
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
          
          {/* Main Payment Options - Centered */}
          <div className="flex justify-center gap-4 flex-wrap">
            {/* Cash Payment */}
            <Card 
              className={`p-4 cursor-pointer transition-all border-2 w-full max-w-xs ${
                paymentPreference === 'cash' ? 'border-green-500 bg-green-50' : 'border-border hover:border-green-300'
              }`}
              onClick={() => handlePaymentSelection('cash')}
            >
              <div className="text-center space-y-2">
                <DollarSign className="w-8 h-8 mx-auto text-green-600" />
                <h4 className="font-semibold">Pay Cash</h4>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalCashPrice)}</p>
                <p className="text-sm text-muted-foreground">
                  {motorPrice >= FINANCING_MINIMUM ? `Save ${formatCurrency(cashSavings)} in interest!` : 'Best price for this motor'}
                </p>
              </div>
            </Card>

            {/* Finance Payment - Only show if motor price is above financing minimum */}
            {motorPrice >= FINANCING_MINIMUM && (
              <Card 
                className={`p-4 cursor-pointer transition-all border-2 w-full max-w-xs ${
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
            )}
          </div>

          {/* Deposit Payment - Only show when Cash is selected */}
          {paymentPreference === 'cash' && (
            <div className="flex justify-center mt-4">
              <Card 
                className="p-4 cursor-pointer transition-all border-2 border-green-200 hover:border-green-300 bg-green-50 w-full max-w-xs"
                onClick={handleStripePayment}
              >
                <div className="text-center space-y-2">
                  <CreditCard className="w-8 h-8 mx-auto text-green-600" />
                  <h4 className="font-semibold text-green-800">Secure Deal with Deposit</h4>
                  <p className="text-2xl font-bold text-green-600">$100</p>
                  <p className="text-sm text-muted-foreground">
                    Lock in your quote • Balance due on delivery
                  </p>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={handleContinue} size="lg" className="flex-1 max-w-xs">
            Continue to Consultation
          </Button>
          <Button onClick={handleSaveQuote} variant="outline" size="lg" className="flex-1 max-w-xs">
            {user ? 'Save Quote' : 'Save Quote (Sign Up)'}
          </Button>
        </div>
      </Card>

      {/* Save & Download Options */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Save & Share Your Quote</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button 
            onClick={handleDownloadPDF}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
        </div>
      </Card>

      {/* Achievement Modal */}
      {achievement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`bg-white rounded-lg p-6 max-w-md w-full text-center ${
              achievement.color === 'gold' ? 'border-4 border-yellow-400' : 'border-4 border-blue-400'
            }`}
          >
            <div className="text-6xl mb-4">{achievement.icon}</div>
            <h3 className="text-xl font-bold mb-2">{achievement.title}</h3>
            <p className="text-muted-foreground mb-4">{achievement.message}</p>
            <div className="text-lg font-semibold text-green-600 mb-4">{achievement.points}</div>
            {isMobile && countdownSeconds > 0 && (
              <p className="text-sm text-muted-foreground mb-4">
                Auto-continuing in {countdownSeconds}s...
              </p>
            )}
            <Button onClick={() => { setAchievement(null); handleContinue(); }}>
              Continue
            </Button>
          </motion.div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal 
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        mode={authModalMode}
      />
    </div>
  );
};