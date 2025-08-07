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
  const [term, setTerm] = useState(60);
  const [showTermComparison, setShowTermComparison] = useState(false);
  
  // Get trade-in info from boat information
  const hasTradeIn = quoteData.boatInfo?.tradeIn?.hasTradeIn || false;
  const tradeInValue = quoteData.boatInfo?.tradeIn?.estimatedValue || 0;

  const motorPrice = quoteData.motor?.price || 0;
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
            
            {/* Financing Fee */}
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-amber-800 dark:text-amber-200">Financing Fee:</span>
                <span className="text-lg font-bold text-amber-800 dark:text-amber-200">${financingFee.toLocaleString()}</span>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">Applied to all financed purchases</p>
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
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">📅</span>
                <p className="font-bold text-foreground">OR FINANCE:</p>
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
                  <p className="text-7xl font-bold text-primary">${payments.monthly.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">/month*</p>
                </div>
              </div>
              
              <div className="text-center space-y-1 text-sm text-muted-foreground border-t border-border pt-3">
                <p className="font-medium">ESTIMATED PAYMENTS ({term} months):</p>
                <p>Total of payments: ${payments.totalOfPayments.toLocaleString()}</p>
                <p>Total interest: ${payments.totalInterest.toFixed(0)}</p>
                <p className="text-xs mt-2">*{quoteData.financing.rate}% APR for {term} months OAC</p>
                <p className="text-xs">*Plus applicable financing fee. All payments include HST</p>
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
                  <span>${financingFee} financing administration fee applies to all financed purchases</span>
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