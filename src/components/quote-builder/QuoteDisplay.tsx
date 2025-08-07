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
  const subtotalAfterTrade = motorPrice - (hasTradeIn ? tradeInValue : 0);
  const hst = subtotalAfterTrade * 0.13;
  const totalCashPrice = subtotalAfterTrade + hst;
  const maxDownPayment = totalCashPrice * 0.5;
  const downPaymentPercentage = totalCashPrice > 0 ? (downPayment / totalCashPrice) * 100 : 0;

  const calculatePayments = () => {
    const financedAmount = totalCashPrice - downPayment;
    const monthlyRate = quoteData.financing.rate / 100 / 12;
    const numPayments = term;
    
    if (financedAmount <= 0) return { weekly: 0, biweekly: 0, monthly: 0 };
    
    const monthlyPayment = (financedAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                          (Math.pow(1 + monthlyRate, numPayments) - 1);
    
    return {
      weekly: monthlyPayment / 4.33,
      biweekly: monthlyPayment / 2,
      monthly: monthlyPayment
    };
  };

  const payments = calculatePayments();
  const totalFinanced = (payments.monthly * term);
  const totalInterest = totalFinanced - (totalCashPrice - downPayment);
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
                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                  <span className="text-xs font-medium text-muted-foreground">MOTOR</span>
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
              </div>
            </div>
            
            {/* Trade-In Line */}
            {hasTradeIn && (
              <div className="flex justify-between items-center py-2">
                <div className="text-green-600 dark:text-green-400">
                  <span className="font-medium">Your {quoteData.boatInfo?.tradeIn?.year} {quoteData.boatInfo?.tradeIn?.brand} {quoteData.boatInfo?.tradeIn?.horsepower}HP</span>
                </div>
                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                  -${tradeInValue.toLocaleString()}
                </div>
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
            
            {/* Finance Option */}
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">📅</span>
                <p className="font-bold text-foreground">OR FINANCE FROM:</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">WEEKLY</p>
                  <p className="text-4xl font-bold text-foreground">${payments.weekly.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">/week</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">BI-WEEKLY</p>
                  <p className="text-4xl font-bold text-foreground">${payments.biweekly.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">/bi-weekly</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">MONTHLY</p>
                  <p className="text-6xl font-bold text-primary">${payments.monthly.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">/month</p>
                </div>
              </div>
              
              <div className="text-center space-y-1 text-sm text-muted-foreground border-t border-border pt-3">
                <p>*{quoteData.financing.rate}% APR for {term} months OAC</p>
                <p>*All payments include HST</p>
                <p>Total financed: ${totalFinanced.toLocaleString()}</p>
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