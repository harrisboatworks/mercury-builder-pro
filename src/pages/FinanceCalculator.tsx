import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { formatMotorTitle } from '@/lib/card-title';
import { useActiveFinancingPromo } from '@/hooks/useActiveFinancingPromo';
import { findMotorSpecs } from '@/lib/data/mercury-motors';
import { calculatePaymentWithFrequency, type PaymentFrequency } from '@/lib/finance';

interface DbMotor {
  id: string;
  model: string;
  year: number;
  base_price: number | null;
  sale_price: number | null;
}

const setSeo = (title: string, description: string) => {
  document.title = title;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', description);
  else {
    const m = document.createElement('meta');
    m.name = 'description';
    m.content = description;
    document.head.appendChild(m);
  }
  const canonicalHref = window.location.origin + '/finance-calculator';
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = canonicalHref;
};

export default function FinanceCalculator() {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [motor, setMotor] = useState<DbMotor | null>(null);

  const modelId = params.get('model');
  
  // Read navigation state from modal
  const navState = location.state as { 
    motorPrice?: number; 
    motorModel?: string; 
    motorId?: string; 
    motorHp?: number;
    fromModal?: boolean;
  } || {};

  const [totalFinanced, setTotalFinanced] = useState<number>(0);
  const [down, setDown] = useState<number>(0);
  const [apr, setApr] = useState<number>(6.99);
  const [term, setTerm] = useState<number>(60);
  const [frequency, setFrequency] = useState<PaymentFrequency>('monthly');
  const { promo } = useActiveFinancingPromo();

  useEffect(() => {
    setSeo('Finance Calculator | Harris Boats', 'Estimate monthly payments for Mercury outboards.');
  }, []);

  useEffect(() => {
    const run = async () => {
      // If we have navigation state from modal, use it first
      if (navState.motorPrice && navState.motorModel) {
        // Calculate total financed from motor price
        const motorPrice = Math.round(navState.motorPrice);
        const totalWithFees = motorPrice * 1.13 + 299;
        setTotalFinanced(Math.round(totalWithFees));
        // Create a pseudo-motor object from navigation state
        const pseudoMotor: DbMotor = {
          id: navState.motorId || 'nav-state',
          model: navState.motorModel,
          year: new Date().getFullYear(),
          base_price: navState.motorPrice,
          sale_price: navState.motorPrice
        };
        setMotor(pseudoMotor);
        return;
      }
      
      // Fallback to database lookup
      if (!modelId) return;
      setLoading(true);
      const { data, error } = await supabase.from('motor_models').select('id, model, year, base_price, sale_price').eq('id', modelId).maybeSingle();
      if (!error && data) {
        setMotor(data as DbMotor);
        const motorPrice = (data.sale_price && data.sale_price > 0 ? data.sale_price : data.base_price) || 0;
        const totalWithFees = motorPrice * 1.13 + 299;
        setTotalFinanced(Math.round(totalWithFees));
      }
      setLoading(false);
    };
    run();
  }, [modelId, navState]);

  useEffect(() => {
    if (promo?.rate) {
      setApr(Number(promo.rate));
    }
  }, [promo]);

  const paymentCalculation = useMemo(() => {
    const principal = Math.max(0, totalFinanced - down);
    
    if (!principal || principal <= 0) return { amount: 0, frequency };
    
    const result = calculatePaymentWithFrequency(principal, frequency, apr);
    return { amount: result.payment, frequency, termPeriods: result.termPeriods };
  }, [totalFinanced, down, apr, frequency]);

  // Calculate breakdown for display
  const breakdown = useMemo(() => {
    // Reverse calculate motor price from total financed
    const motorPrice = Math.round((totalFinanced - 299) / 1.13);
    const hst = Math.round(motorPrice * 0.13);
    return {
      motorPrice,
      hst,
      financeFee: 299,
      total: totalFinanced
    };
  }, [totalFinanced]);

  // Get motor specs if available
  const motorSpecs = useMemo(() => {
    if (navState.motorHp && navState.motorModel) {
      return findMotorSpecs(navState.motorHp, navState.motorModel);
    }
    return null;
  }, [navState.motorHp, navState.motorModel]);

  const handleGoBack = () => {
    if (navState.fromModal) {
      navigate(-1); // Go back to previous screen
    } else {
      navigate('/'); // Go to motors page
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Finance Calculator</h1>
        <p className="text-muted-foreground">Estimate your monthly payment. Values are estimates and not a credit offer.</p>
      </header>

      {motor && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">{formatMotorTitle(motor.year, motor.model)}</CardTitle>
            <CardDescription>
              {navState.fromModal ? 'Prefilled from motor selection' : 'Prefilled from selected model'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium text-muted-foreground">Motor Price</div>
                <div>${breakdown.motorPrice.toLocaleString()}</div>
              </div>
              <div>
                <div className="font-medium text-muted-foreground">HST (13%)</div>
                <div>${breakdown.hst.toLocaleString()}</div>
              </div>
              <div>
                <div className="font-medium text-muted-foreground">Finance Fee</div>
                <div>$299</div>
              </div>
              <div>
                <div className="font-medium text-muted-foreground">Total Financed</div>
                <div className="font-semibold">${totalFinanced.toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="totalFinanced">Total Financed</Label>
              <Input 
                id="totalFinanced" 
                type="number" 
                inputMode="numeric" 
                value={totalFinanced} 
                onChange={(e) => setTotalFinanced(Number(e.target.value || 0))} 
              />
            </div>
            <div>
              <Label htmlFor="down">Down Payment</Label>
              <Input id="down" type="number" inputMode="numeric" value={down} onChange={(e) => setDown(Number(e.target.value || 0))} />
            </div>
            <div>
              <Label htmlFor="apr">APR (%)</Label>
              <Input id="apr" type="number" step="0.01" inputMode="decimal" value={apr} onChange={(e) => setApr(Number(e.target.value || 0))} />
            </div>
            <div>
              <Label htmlFor="term">Term (months)</Label>
              <Input id="term" type="number" inputMode="numeric" value={term} onChange={(e) => setTerm(Number(e.target.value || 0))} />
            </div>
          </div>

          <div className="mt-4">
            <Label>Payment Frequency</Label>
            <RadioGroup
              value={frequency}
              onValueChange={(value: PaymentFrequency) => setFrequency(value)}
              className="flex flex-row gap-6 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monthly" id="monthly" />
                <Label htmlFor="monthly" className="cursor-pointer">Monthly</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bi-weekly" id="bi-weekly" />
                <Label htmlFor="bi-weekly" className="cursor-pointer">Bi-weekly</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="weekly" id="weekly" />
                <Label htmlFor="weekly" className="cursor-pointer">Weekly</Label>
              </div>
            </RadioGroup>
          </div>

          {promo && (
            <div className="mt-4 text-sm text-foreground">
              <span className="font-medium">Promo APR applied:</span> {promo.rate}%{' '}
              {promo.promo_text ? (<><span>— {promo.promo_text}</span></>) : null}{' '}
              {promo.promo_end_date ? (<><span>(ends {new Date(promo.promo_end_date).toLocaleDateString()})</span></>) : null}
            </div>
          )}
          
          <div className="mt-3 text-xs text-muted-foreground">
            * Includes 13% HST and $299 finance fee
          </div>

          <div className="mt-6 flex items-baseline gap-3">
            <div className="text-muted-foreground">
              Estimated {frequency === 'bi-weekly' ? 'Bi-weekly' : frequency === 'weekly' ? 'Weekly' : 'Monthly'}:
            </div>
            <div className="text-3xl font-bold">${paymentCalculation.amount.toLocaleString()}</div>
          </div>
          
          {paymentCalculation.termPeriods && (
            <div className="mt-2 text-sm text-muted-foreground">
              {paymentCalculation.termPeriods} {frequency === 'bi-weekly' ? 'bi-weekly' : frequency === 'weekly' ? 'weekly' : 'monthly'} payments
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <Button onClick={handleGoBack}>
              {navState.fromModal ? 'Back' : 'Back to Motors'}
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">Browse Motors</Link>
            </Button>
            {motor && navState.motorId && (
              <Button variant="outline" asChild>
                <Link to={`/?select=${encodeURIComponent(navState.motorId)}`}>Use this motor</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
