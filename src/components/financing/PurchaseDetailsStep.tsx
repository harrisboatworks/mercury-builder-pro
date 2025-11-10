import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { purchaseDetailsSchema, type PurchaseDetails } from '@/lib/financingValidation';
import { useFinancing } from '@/contexts/FinancingContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { CheckCircle2, Pencil } from 'lucide-react';
import { useState } from 'react';
import { money } from '@/lib/money';
import { calculateMonthlyPayment } from '@/lib/finance';

export function PurchaseDetailsStep() {
  const { state, dispatch } = useFinancing();
  const [isEditingMotor, setIsEditingMotor] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<PurchaseDetails>({
    resolver: zodResolver(purchaseDetailsSchema),
    mode: 'onChange',
    defaultValues: {
      motorModel: state.purchaseDetails?.motorModel || '',
      motorPrice: state.purchaseDetails?.motorPrice || 0,
      downPayment: state.purchaseDetails?.downPayment || 0,
      tradeInValue: state.purchaseDetails?.tradeInValue || 0,
      amountToFinance: state.purchaseDetails?.amountToFinance || 0,
    },
  });

  const motorPrice = watch('motorPrice');
  const downPayment = watch('downPayment');
  const tradeInValue = watch('tradeInValue') || 0;
  const amountToFinance = Math.max(0, motorPrice - downPayment - tradeInValue);

  // Update amount to finance when values change
  const handleDownPaymentChange = (value: number[]) => {
    setValue('downPayment', value[0], { shouldValidate: true });
  };

  const onSubmit = (data: PurchaseDetails) => {
    dispatch({
      type: 'SET_PURCHASE_DETAILS',
      payload: { ...data, amountToFinance },
    });
    dispatch({ type: 'COMPLETE_STEP', payload: 1 });
    dispatch({ type: 'SET_CURRENT_STEP', payload: 2 });
  };

  const maxDownPayment = Math.floor(motorPrice * 0.5);
  const downPaymentPercentage = motorPrice > 0 ? Math.round((downPayment / motorPrice) * 100) : 0;

  // Calculate monthly payment estimates
  const payment36 = calculateMonthlyPayment(amountToFinance * 1.13, null);
  const payment48 = calculateMonthlyPayment(amountToFinance * 1.13, null);
  const payment60 = calculateMonthlyPayment(amountToFinance * 1.13, null);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Let's Get You Financed</h2>
        <p className="text-muted-foreground">First, confirm your motor selection</p>
      </div>

      {/* Motor Model - Read-only with edit option */}
      <div className="space-y-2">
        <Label htmlFor="motorModel" className="flex items-center gap-2">
          Motor Model
          {!errors.motorModel && watch('motorModel') && (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          )}
        </Label>
        <div className="flex gap-2">
          <Input
            id="motorModel"
            {...register('motorModel')}
            readOnly={!isEditingMotor}
            className={`${!isEditingMotor ? 'bg-muted' : ''} ${!errors.motorModel && watch('motorModel') ? 'border-green-500' : ''}`}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setIsEditingMotor(!isEditingMotor)}
          >
            <Pencil className="w-4 h-4" />
          </Button>
        </div>
        {errors.motorModel && (
          <p className="text-sm text-destructive">{errors.motorModel.message}</p>
        )}
      </div>

      {/* Motor Price */}
      <div className="space-y-2">
        <Label htmlFor="motorPrice" className="flex items-center gap-2">
          Motor Price
          {!errors.motorPrice && motorPrice > 0 && (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          )}
        </Label>
        <Input
          id="motorPrice"
          type="number"
          inputMode="decimal"
          step="0.01"
          {...register('motorPrice', { valueAsNumber: true })}
          className={!errors.motorPrice && motorPrice > 0 ? 'border-green-500' : ''}
        />
        {errors.motorPrice && (
          <p className="text-sm text-destructive">{errors.motorPrice.message}</p>
        )}
        <p className="text-sm text-muted-foreground">
          {money(motorPrice)}
        </p>
      </div>

      {/* Down Payment Slider */}
      <div className="space-y-4">
        <Label className="flex items-center gap-2">
          Down Payment
          {!errors.downPayment && downPayment >= 0 && (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          )}
        </Label>
        
        <div className="space-y-2">
          <Slider
            value={[downPayment]}
            onValueChange={handleDownPaymentChange}
            max={maxDownPayment}
            step={100}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>$0</span>
            <span className="font-semibold text-foreground">
              {money(downPayment)} ({downPaymentPercentage}%)
            </span>
            <span>{money(maxDownPayment)}</span>
          </div>
        </div>

        <Input
          type="number"
          inputMode="decimal"
          step="100"
          value={downPayment}
          onChange={(e) => setValue('downPayment', Number(e.target.value), { shouldValidate: true })}
          className={!errors.downPayment ? 'border-green-500' : ''}
        />
        {errors.downPayment && (
          <p className="text-sm text-destructive">{errors.downPayment.message}</p>
        )}
      </div>

      {/* Trade-In Value */}
      {tradeInValue > 0 && (
        <div className="space-y-2 animate-fade-in">
          <Label htmlFor="tradeInValue" className="flex items-center gap-2">
            Trade-In Value (Optional)
            {!errors.tradeInValue && tradeInValue > 0 && (
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            )}
          </Label>
          <Input
            id="tradeInValue"
            type="number"
            inputMode="decimal"
            step="100"
            {...register('tradeInValue', { valueAsNumber: true })}
            className={!errors.tradeInValue && tradeInValue > 0 ? 'border-green-500' : ''}
          />
          {errors.tradeInValue && (
            <p className="text-sm text-destructive">{errors.tradeInValue.message}</p>
          )}
          <p className="text-sm text-muted-foreground">
            {money(tradeInValue)} credit applied
          </p>
        </div>
      )}

      <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-muted-foreground">Amount to Finance</span>
          <span className="text-2xl font-bold text-foreground">
            {money(amountToFinance)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Including 13% HST: {money(amountToFinance * 1.13)}
        </p>
      </div>

      {/* Monthly Payment Options */}
      {amountToFinance > 0 && (
        <div className="space-y-3 animate-fade-in">
          <Label className="text-sm font-medium">Estimated Monthly Payment</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-border bg-background p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">36 months</p>
              <p className="text-lg font-bold text-foreground">
                ${Math.round(payment36.payment)}
              </p>
              <p className="text-xs text-muted-foreground">/month</p>
            </div>
            <div className="rounded-lg border-2 border-primary bg-primary/5 p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">48 months</p>
              <p className="text-lg font-bold text-foreground">
                ${Math.round(payment48.payment)}
              </p>
              <p className="text-xs text-muted-foreground">/month</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">60 months</p>
              <p className="text-lg font-bold text-foreground">
                ${Math.round(payment60.payment)}
              </p>
              <p className="text-xs text-muted-foreground">/month</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Rates vary by credit score and term length
          </p>
        </div>
      )}

      {/* Continue Button */}
      <Button
        type="submit"
        disabled={!isValid || amountToFinance <= 0}
        className="w-full py-6 text-lg"
      >
        Continue to Application
      </Button>
    </form>
  );
}
