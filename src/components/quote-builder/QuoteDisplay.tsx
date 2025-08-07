import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calculator, DollarSign, CheckCircle2, AlertTriangle } from 'lucide-react';
import { QuoteData } from '../QuoteBuilder';

interface QuoteDisplayProps {
  quoteData: QuoteData;
  onStepComplete: (data: { financing: any; hasTradein: boolean; tradeinInfo?: any }) => void;
  onBack: () => void;
}

export const QuoteDisplay = ({ quoteData, onStepComplete, onBack }: QuoteDisplayProps) => {
  const [downPayment, setDownPayment] = useState(0);
  const [term, setTerm] = useState(48);
  
  // Get trade-in info from boat information
  const hasTradeIn = quoteData.boatInfo?.tradeIn?.hasTradeIn || false;
  const tradeInValue = quoteData.boatInfo?.tradeIn?.estimatedValue || 0;

  const motorPrice = quoteData.motor?.price || 0;
  const totalWithTrade = motorPrice - (hasTradeIn ? tradeInValue : 0);
  const maxDownPayment = totalWithTrade * 0.5;
  const downPaymentPercentage = totalWithTrade > 0 ? (downPayment / totalWithTrade) * 100 : 0;

  const calculatePayments = () => {
    const principal = totalWithTrade - downPayment;
    const monthlyRate = quoteData.financing.rate / 100 / 12;
    const numPayments = term;
    
    if (principal <= 0) return { weekly: 0, biweekly: 0, monthly: 0 };
    
    const monthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                          (Math.pow(1 + monthlyRate, numPayments) - 1);
    
    return {
      weekly: monthlyPayment / 4.33,
      biweekly: monthlyPayment / 2,
      monthly: monthlyPayment
    };
  };

  const payments = calculatePayments();
  const totalInterest = (payments.monthly * term) - (totalWithTrade - downPayment);
  const cashSavings = totalInterest;

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Selected Motor */}
        <Card className="p-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              Selected Motor
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <h4 className="text-lg font-semibold text-foreground">
                    {quoteData.motor.model}
                  </h4>
                  <p className="text-muted-foreground">{quoteData.motor.specs}</p>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary text-primary-foreground">
                      {quoteData.motor.hp}HP
                    </Badge>
                    <Badge className={`bg-in-stock text-in-stock-foreground`}>
                      {quoteData.motor.stockStatus}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="space-y-1">
                    {hasTradeIn && (
                      <p className="text-sm text-muted-foreground line-through">
                        ${motorPrice.toLocaleString()}
                      </p>
                    )}
                    <p className="text-2xl font-bold text-foreground">
                      ${totalWithTrade.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">CAD{hasTradeIn ? ' (After Trade)' : ''}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Financing Calculator */}
        <Card className="p-6">
          <div className="space-y-6">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Financing Calculator
            </h3>

            {/* Down Payment */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-base font-medium">Down Payment</Label>
                <span className="text-sm text-muted-foreground">
                  {downPaymentPercentage.toFixed(0)}% of price
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

            {/* Term Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Financing Term</Label>
              <div className="grid grid-cols-3 gap-2">
                {[36, 48, 60].map((months) => (
                  <Button
                    key={months}
                    variant={term === months ? 'default' : 'outline'}
                    onClick={() => setTerm(months)}
                    className="h-12"
                  >
                    {months} months
                  </Button>
                ))}
              </div>
            </div>

            {/* Payment Display */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Estimated Payments at {quoteData.financing.rate}% APR</p>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Weekly</p>
                    <p className="text-3xl font-bold text-foreground">${payments.weekly.toFixed(0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Bi-Weekly</p>
                    <p className="text-3xl font-bold text-foreground">${payments.biweekly.toFixed(0)}</p>
                  </div>
                   <div>
                     <p className="text-xs text-muted-foreground uppercase tracking-wide">Monthly</p>
                     <p className="text-6xl font-bold text-primary">${payments.monthly.toFixed(0)}</p>
                   </div>
                </div>
              </div>
              
              {cashSavings > 0 && (
                <div className="text-center pt-2 border-t border-border">
                  <Badge className="bg-in-stock text-in-stock-foreground">
                    <DollarSign className="w-3 h-3 mr-1" />
                    Cash Savings: ${cashSavings.toFixed(0)} interest
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

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

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Boat Details
        </Button>
        
        <Button onClick={handleContinue} className="bg-primary hover:bg-primary/90">
          Schedule Consultation
        </Button>
      </div>
    </div>
  );
};