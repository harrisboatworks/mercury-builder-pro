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
  const [hasTradein, setHasTradein] = useState(false);
  const [tradeinInfo, setTradeinInfo] = useState({
    make: '',
    model: '',
    year: ''
  });

  const motorPrice = quoteData.motor?.price || 0;
  const maxDownPayment = motorPrice * 0.5;
  const downPaymentPercentage = motorPrice > 0 ? (downPayment / motorPrice) * 100 : 0;

  const calculatePayments = () => {
    const principal = motorPrice - downPayment;
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
  const totalInterest = (payments.monthly * term) - (motorPrice - downPayment);
  const cashSavings = totalInterest;

  const handleContinue = () => {
    onStepComplete({
      financing: { downPayment, term, rate: quoteData.financing.rate },
      hasTradein,
      tradeinInfo: hasTradein ? tradeinInfo : undefined
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
                  <p className="text-2xl font-bold text-foreground">
                    ${motorPrice.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">CAD</p>
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
                    <p className="text-3xl font-bold text-primary">${payments.monthly.toFixed(0)}</p>
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

      {/* Trade-in Option */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-medium">I have a trade-in motor</Label>
              <p className="text-sm text-muted-foreground">
                Trade-in value requires in-person inspection
              </p>
            </div>
            <Switch
              checked={hasTradein}
              onCheckedChange={setHasTradein}
            />
          </div>
          
          {hasTradein && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
              <div className="space-y-2">
                <Label htmlFor="tradein-make">Make</Label>
                <Input
                  id="tradein-make"
                  value={tradeinInfo.make}
                  onChange={(e) => setTradeinInfo(prev => ({ ...prev, make: e.target.value }))}
                  placeholder="e.g., Mercury"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tradein-model">Model</Label>
                <Input
                  id="tradein-model"
                  value={tradeinInfo.model}
                  onChange={(e) => setTradeinInfo(prev => ({ ...prev, model: e.target.value }))}
                  placeholder="e.g., FourStroke 115"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tradein-year">Year</Label>
                <Input
                  id="tradein-year"
                  value={tradeinInfo.year}
                  onChange={(e) => setTradeinInfo(prev => ({ ...prev, year: e.target.value }))}
                  placeholder="e.g., 2020"
                />
              </div>
            </div>
          )}
        </div>
      </Card>

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