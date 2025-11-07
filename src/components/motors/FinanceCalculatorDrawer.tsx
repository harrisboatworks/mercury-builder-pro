import { useMemo, useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { formatMotorTitle } from '@/lib/card-title';
import { useActiveFinancingPromo } from '@/hooks/useActiveFinancingPromo';
import { calculatePaymentWithFrequency, type PaymentFrequency } from '@/lib/finance';
import { DollarSign, Calculator } from 'lucide-react';

interface FinanceCalculatorDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  motor: {
    id: string;
    model: string;
    year: number;
    price: number;
    hp?: number;
  };
}

export function FinanceCalculatorDrawer({ open, onOpenChange, motor }: FinanceCalculatorDrawerProps) {
  const [totalFinanced, setTotalFinanced] = useState<number>(0);
  const [down, setDown] = useState<number>(0);
  const [apr, setApr] = useState<number>(6.99);
  const [frequency, setFrequency] = useState<PaymentFrequency>('monthly');
  const { promo } = useActiveFinancingPromo();

  // Initialize values when motor changes or drawer opens
  useEffect(() => {
    if (open && motor.price) {
      const motorPrice = Math.round(motor.price);
      const totalWithFees = motorPrice * 1.13 + 299;
      setTotalFinanced(Math.round(totalWithFees));
      setDown(0);
    }
  }, [open, motor.price]);

  // Apply promotional rate if available
  useEffect(() => {
    if (promo?.rate) {
      setApr(Number(promo.rate));
    }
  }, [promo]);

  const paymentCalculation = useMemo(() => {
    const principal = Math.max(0, totalFinanced - down);
    
    if (!principal || principal <= 0) return { amount: 0, frequency, termPeriods: 0 };
    
    const result = calculatePaymentWithFrequency(principal, frequency, apr);
    return { amount: result.payment, frequency, termPeriods: result.termPeriods };
  }, [totalFinanced, down, apr, frequency]);

  const breakdown = useMemo(() => {
    const motorPrice = Math.round((totalFinanced - 299) / 1.13);
    const hst = Math.round(motorPrice * 0.13);
    return {
      motorPrice,
      hst,
      financeFee: 299,
      total: totalFinanced
    };
  }, [totalFinanced]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
      <DrawerContent className="max-h-[90vh] z-[60]">
        <DrawerHeader className="text-left">
          <DrawerTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Finance Calculator
          </DrawerTitle>
          <DrawerDescription>
            {formatMotorTitle(motor.year, motor.model)} • Estimate your payment
          </DrawerDescription>
        </DrawerHeader>

        <ScrollArea className="px-4 overflow-y-auto">
          <div className="space-y-4 pb-6">
            {/* Motor Breakdown Card */}
            <Card>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-muted-foreground">Motor Price</div>
                    <div className="font-medium">${breakdown.motorPrice.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">HST (13%)</div>
                    <div className="font-medium">${breakdown.hst.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Finance Fee</div>
                    <div className="font-medium">$299</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Total Financed</div>
                    <div className="font-semibold">${totalFinanced.toLocaleString()}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Input Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="totalFinanced">Total Financed</Label>
                <Input 
                  id="totalFinanced" 
                  type="number" 
                  inputMode="numeric" 
                  value={totalFinanced} 
                  onChange={(e) => setTotalFinanced(Number(e.target.value || 0))} 
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="down">Down Payment</Label>
                <Input 
                  id="down" 
                  type="number" 
                  inputMode="numeric" 
                  value={down} 
                  onChange={(e) => setDown(Number(e.target.value || 0))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="apr">APR (%)</Label>
                <Input 
                  id="apr" 
                  type="number" 
                  step="0.01" 
                  inputMode="decimal" 
                  value={apr} 
                  onChange={(e) => setApr(Number(e.target.value || 0))}
                  className="mt-1.5"
                />
              </div>
            </div>

            {/* Payment Frequency */}
            <div>
              <Label>Payment Frequency</Label>
              <RadioGroup
                value={frequency}
                onValueChange={(value: PaymentFrequency) => setFrequency(value)}
                className="flex flex-col sm:flex-row gap-3 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="monthly" id="monthly-drawer" />
                  <Label htmlFor="monthly-drawer" className="cursor-pointer">Monthly</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bi-weekly" id="bi-weekly-drawer" />
                  <Label htmlFor="bi-weekly-drawer" className="cursor-pointer">Bi-weekly</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="weekly" id="weekly-drawer" />
                  <Label htmlFor="weekly-drawer" className="cursor-pointer">Weekly</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Promo Alert */}
            {promo && (
              <div className="p-3 bg-primary/10 rounded-lg text-sm">
                <div className="font-medium">Promo APR applied: {promo.rate}%</div>
                {promo.promo_text && <div className="text-muted-foreground mt-0.5">{promo.promo_text}</div>}
                {promo.promo_end_date && (
                  <div className="text-muted-foreground mt-0.5">
                    Ends {new Date(promo.promo_end_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            )}

            {/* Payment Display */}
            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Estimated {frequency === 'bi-weekly' ? 'Bi-weekly' : frequency === 'weekly' ? 'Weekly' : 'Monthly'} Payment</span>
                </div>
                <div className="text-4xl font-bold">${paymentCalculation.amount.toLocaleString()}</div>
                {paymentCalculation.termPeriods > 0 && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    {paymentCalculation.termPeriods} {frequency === 'bi-weekly' ? 'bi-weekly' : frequency === 'weekly' ? 'weekly' : 'monthly'} payments
                  </div>
                )}
                <div className="mt-3 text-xs text-muted-foreground">
                  * Includes 13% HST and $299 finance fee. Estimates only, not a credit offer.
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline" className="w-full">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
