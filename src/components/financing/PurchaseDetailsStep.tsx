import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { purchaseDetailsSchema, type PurchaseDetails } from '@/lib/financingValidation';
import { useFinancing } from '@/contexts/FinancingContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { money } from '@/lib/money';
import { calculateMonthlyPayment, calculateMonthly } from '@/lib/finance';
import { FormErrorMessage, FieldValidationIndicator } from './FormErrorMessage';
import { MobileFormNavigation } from './MobileFormNavigation';

export function PurchaseDetailsStep() {
  const { state, dispatch } = useFinancing();
  const [isEditingMotor, setIsEditingMotor] = useState(false);
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid, touchedFields },
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

  // Calculate monthly payment estimates for specific terms
  // Motor price already includes HST and Dealerplan fee, so no need to add tax again
  const rate = 7.99; // Standard rate

  // Use calculateMonthly which accepts specific term months
  const payment36 = calculateMonthly(amountToFinance, rate, 36);
  const payment48 = calculateMonthly(amountToFinance, rate, 48);
  const payment60 = calculateMonthly(amountToFinance, rate, 60);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Let's Get You Financed</h2>
        <p className="text-muted-foreground font-light">First, confirm your motor selection</p>
      </div>

      {/* Motor Model - Read-only with edit option */}
      <div className="space-y-2">
        <Label htmlFor="motorModel">Motor Model</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="motorModel"
              {...register('motorModel')}
              readOnly={!isEditingMotor}
              autoComplete="off"
              className={`${!isEditingMotor ? 'bg-muted' : ''} pr-10`}
            />
            <FieldValidationIndicator 
              isValid={!errors.motorModel && !!watch('motorModel')}
              isTouched={touchedFields.motorModel}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setIsEditingMotor(!isEditingMotor)}
            className="min-h-[44px] min-w-[44px]"
          >
            <Pencil className="w-4 h-4" />
          </Button>
        </div>
        <FormErrorMessage error={errors.motorModel?.message} field="Motor model" />
      </div>

      {/* Motor Price */}
      <div className="space-y-2">
        <Label htmlFor="motorPrice">Total Purchase Price</Label>
        <div className="relative">
          <Input
            id="motorPrice"
            type="number"
            inputMode="decimal"
            step="0.01"
            {...register('motorPrice', { valueAsNumber: true })}
            autoComplete="off"
            className="pr-10"
          />
          <FieldValidationIndicator 
            isValid={!errors.motorPrice && motorPrice > 0}
            isTouched={touchedFields.motorPrice}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          />
        </div>
        <FormErrorMessage error={errors.motorPrice?.message} field="Total purchase price" />
        <p className="text-sm text-muted-foreground font-light">
          {money(motorPrice)} (includes HST and $299 processing fee)
        </p>
      </div>

      {/* Down Payment Slider */}
      <div className="space-y-4">
        <Label>Down Payment</Label>
        
        <div className="space-y-2">
          <Slider
            value={[downPayment]}
            onValueChange={handleDownPaymentChange}
            max={maxDownPayment}
            step={100}
            className="w-full min-h-[44px] cursor-pointer"
          />
          <div className="flex justify-between text-sm text-muted-foreground font-light">
            <span>$0</span>
            <span className="font-semibold text-foreground">
              {money(downPayment)} ({downPaymentPercentage}%)
            </span>
            <span>{money(maxDownPayment)}</span>
          </div>
        </div>

        <div className="relative">
          <Input
            type="number"
            inputMode="decimal"
            step="100"
            value={downPayment}
            onChange={(e) => setValue('downPayment', Number(e.target.value), { shouldValidate: true })}
            autoComplete="off"
            className="pr-10"
          />
          <FieldValidationIndicator 
            isValid={!errors.downPayment && downPayment >= 0}
            isTouched={true}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          />
        </div>
        <FormErrorMessage error={errors.downPayment?.message} field="Down payment" />
      </div>

      {/* Trade-In Value */}
      {tradeInValue > 0 && (
        <div className="space-y-2 animate-fade-in">
          <Label htmlFor="tradeInValue">Trade-In Value (Optional)</Label>
          <div className="relative">
            <Input
              id="tradeInValue"
              type="number"
              inputMode="decimal"
              step="100"
              {...register('tradeInValue', { valueAsNumber: true })}
              autoComplete="off"
              className="pr-10"
            />
            <FieldValidationIndicator 
              isValid={!errors.tradeInValue && tradeInValue > 0}
              isTouched={touchedFields.tradeInValue}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            />
          </div>
          <FormErrorMessage error={errors.tradeInValue?.message} field="Trade-in value" />
          <p className="text-sm text-muted-foreground font-light">
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
        <p className="text-xs text-muted-foreground font-light">
          Includes 13% HST and $299 Dealerplan processing fee
        </p>
      </div>

      {/* Monthly Payment Options */}
      {amountToFinance > 0 && (
        <div className="space-y-3 animate-fade-in">
          <Label className="text-sm font-medium">Estimated Monthly Payment</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-border bg-background p-4 text-center min-h-[80px] flex flex-col justify-center">
              <p className="text-xs text-muted-foreground font-light mb-1">36 months</p>
              <p className="text-lg font-bold text-foreground">
                ${Math.round(payment36)}
              </p>
              <p className="text-xs text-muted-foreground font-light">/month</p>
            </div>
            <div className="rounded-lg border-2 border-primary bg-primary/5 p-4 text-center min-h-[80px] flex flex-col justify-center">
              <p className="text-xs text-muted-foreground font-light mb-1">48 months</p>
              <p className="text-lg font-bold text-foreground">
                ${Math.round(payment48)}
              </p>
              <p className="text-xs text-muted-foreground font-light">/month</p>
            </div>
            <div className="rounded-lg border border-border bg-background p-4 text-center min-h-[80px] flex flex-col justify-center">
              <p className="text-xs text-muted-foreground font-light mb-1">60 months</p>
              <p className="text-lg font-bold text-foreground">
                ${Math.round(payment60)}
              </p>
              <p className="text-xs text-muted-foreground font-light">/month</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-light text-center">
            Rates vary by credit score and term length
          </p>
        </div>
      )}

      <MobileFormNavigation
        onNext={handleSubmit(onSubmit)}
        nextLabel="Continue"
        isNextDisabled={!isValid || amountToFinance <= 0}
        showBack={false}
      />
    </form>
  );
}
