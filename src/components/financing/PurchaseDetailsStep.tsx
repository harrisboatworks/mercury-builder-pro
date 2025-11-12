import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { purchaseDetailsSchema, type PurchaseDetails } from '@/lib/financingValidation';
import { useFinancing } from '@/contexts/FinancingContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { useState, useEffect } from 'react';
import { money } from '@/lib/money';
import { calculateMonthlyPayment, calculateMonthly, getFinancingTermOptions } from '@/lib/finance';
import { FormErrorMessage, FieldValidationIndicator } from './FormErrorMessage';
import { MobileFormNavigation } from './MobileFormNavigation';

export function PurchaseDetailsStep() {
  const { state, dispatch } = useFinancing();
  const [isEditingMotor, setIsEditingMotor] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<string>('48');
  
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
      motorPrice: state.purchaseDetails?.motorPrice ? Number(state.purchaseDetails.motorPrice.toFixed(2)) : 0,
      downPayment: state.purchaseDetails?.downPayment || 0,
      tradeInValue: state.purchaseDetails?.tradeInValue || 0,
      amountToFinance: state.purchaseDetails?.amountToFinance || 0,
      preferredTerm: state.purchaseDetails?.preferredTerm || String(getFinancingTermOptions(state.purchaseDetails?.motorPrice || 0)[1]) as '36' | '48' | '60' | '72' | '84' | '120' | '180',
    },
  });

  const motorPrice = watch('motorPrice');
  const downPayment = watch('downPayment');
  const tradeInValue = watch('tradeInValue') || 0;
  const preferredTerm = watch('preferredTerm');
  const amountToFinance = Math.max(0, motorPrice - downPayment - tradeInValue);

  // Sync local state with form
  useEffect(() => {
    if (preferredTerm) {
      setSelectedTerm(preferredTerm);
    }
  }, [preferredTerm]);

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

  // Get dynamic term options based on motor price
  const termOptions = getFinancingTermOptions(motorPrice);
  const [shortTerm, midTerm, longTerm] = termOptions;

  // Calculate payments for each dynamic term
  const rate = 7.99; // Standard rate for estimates
  const paymentShort = calculateMonthly(amountToFinance, rate, shortTerm);
  const paymentMid = calculateMonthly(amountToFinance, rate, midTerm);
  const paymentLong = calculateMonthly(amountToFinance, rate, longTerm);

  // Helper to format term display
  const formatTermDisplay = (months: number) => {
    if (months >= 12) {
      const years = months / 12;
      return `${years} ${years === 1 ? 'year' : 'years'}`;
    }
    return `${months} months`;
  };

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
            step="1"
            {...register('motorPrice', { 
              valueAsNumber: true,
              setValueAs: (v) => Number(Number(v).toFixed(2))
            })}
            autoComplete="off"
            className="pr-10"
            onBlur={(e) => {
              const value = Number(e.target.value);
              if (!isNaN(value)) {
                setValue('motorPrice', Number(value.toFixed(2)));
              }
            }}
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

      {/* Preferred Term Selection */}
      {amountToFinance > 0 && (
        <div className="space-y-3 animate-fade-in">
          <Label className="text-sm font-medium">Choose Your Preferred Term</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Short Term */}
            <button
              type="button"
              onClick={() => {
                setSelectedTerm(String(shortTerm));
                setValue('preferredTerm', String(shortTerm) as '36' | '48' | '60' | '72' | '84' | '120' | '180', { shouldValidate: true });
              }}
              className={`rounded-lg p-4 text-center min-h-[80px] flex flex-col justify-center transition-all duration-200 cursor-pointer hover:shadow-md ${
                selectedTerm === String(shortTerm)
                  ? 'border-2 border-primary bg-primary/5'
                  : 'border border-border bg-background hover:border-gray-300'
              }`}
            >
              <p className="text-xs text-muted-foreground font-light mb-1">
                {formatTermDisplay(shortTerm)}
              </p>
              <p className="text-lg font-bold text-foreground">
                ${Math.round(paymentShort)}
              </p>
              <p className="text-xs text-muted-foreground font-light">/month</p>
            </button>

            {/* Mid Term (Recommended) */}
            <button
              type="button"
              onClick={() => {
                setSelectedTerm(String(midTerm));
                setValue('preferredTerm', String(midTerm) as '36' | '48' | '60' | '72' | '84' | '120' | '180', { shouldValidate: true });
              }}
              className={`rounded-lg p-4 text-center min-h-[80px] flex flex-col justify-center transition-all duration-200 cursor-pointer hover:shadow-md relative ${
                selectedTerm === String(midTerm)
                  ? 'border-2 border-primary bg-primary/5'
                  : 'border border-border bg-background hover:border-gray-300'
              }`}
            >
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-primary bg-background px-2 py-0.5 rounded-full border border-primary">
                RECOMMENDED
              </span>
              <p className="text-xs text-muted-foreground font-light mb-1">
                {formatTermDisplay(midTerm)}
              </p>
              <p className="text-lg font-bold text-foreground">
                ${Math.round(paymentMid)}
              </p>
              <p className="text-xs text-muted-foreground font-light">/month</p>
            </button>

            {/* Long Term */}
            <button
              type="button"
              onClick={() => {
                setSelectedTerm(String(longTerm));
                setValue('preferredTerm', String(longTerm) as '36' | '48' | '60' | '72' | '84' | '120' | '180', { shouldValidate: true });
              }}
              className={`rounded-lg p-4 text-center min-h-[80px] flex flex-col justify-center transition-all duration-200 cursor-pointer hover:shadow-md ${
                selectedTerm === String(longTerm)
                  ? 'border-2 border-primary bg-primary/5'
                  : 'border border-border bg-background hover:border-gray-300'
              }`}
            >
              <p className="text-xs text-muted-foreground font-light mb-1">
                {formatTermDisplay(longTerm)}
              </p>
              <p className="text-lg font-bold text-foreground">
                ${Math.round(paymentLong)}
              </p>
              <p className="text-xs text-muted-foreground font-light">/month</p>
              <p className="text-[10px] text-muted-foreground font-light mt-1">
                Lowest payment
              </p>
            </button>
          </div>
          <p className="text-xs text-muted-foreground font-light text-center">
            Terms are tailored to your purchase amount. Your broker will confirm the best rate and final term.
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
