import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFinancing } from '@/contexts/FinancingContext';
import { financialSchema } from '@/lib/financingValidation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Star, CheckCircle, BarChart3, AlertTriangle, HelpCircle, Info, Building2, Lock, Unlock, CalendarIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useMemo, useState } from 'react';
import { money } from '@/lib/money';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { FormErrorMessage, FieldValidationIndicator } from './FormErrorMessage';
import { MobileFormNavigation } from './MobileFormNavigation';

const creditScoreOptions = [
  { value: 'excellent', label: 'Excellent', subtitle: '750+', icon: Star, bgColor: 'bg-green-50', borderColor: 'border-green-300', textColor: 'text-green-700' },
  { value: 'good', label: 'Good', subtitle: '700-749', icon: CheckCircle, bgColor: 'bg-emerald-50', borderColor: 'border-emerald-300', textColor: 'text-emerald-700' },
  { value: 'fair', label: 'Fair', subtitle: '650-699', icon: BarChart3, bgColor: 'bg-yellow-50', borderColor: 'border-yellow-300', textColor: 'text-yellow-700' },
  { value: 'poor', label: 'Poor', subtitle: 'Below 650', icon: AlertTriangle, bgColor: 'bg-orange-50', borderColor: 'border-orange-300', textColor: 'text-orange-700' },
  { value: 'unknown', label: "Don't Know", subtitle: 'Not sure', icon: HelpCircle, bgColor: 'bg-muted', borderColor: 'border-muted-foreground/20', textColor: 'text-muted-foreground' },
];

const canadianBanks = [
  'TD Canada Trust',
  'RBC Royal Bank',
  'Scotiabank',
  'BMO Bank of Montreal',
  'CIBC',
  'National Bank',
  'Tangerine',
  'Simplii Financial',
  'Other',
];

export function FinancialStep() {
  const { state, dispatch } = useFinancing();
  const [housingLocked, setHousingLocked] = useState(true);
  const [showBankruptcyDetails, setShowBankruptcyDetails] = useState(
    state.financial?.hasBankruptcy === true
  );
  const [bankruptcyDate, setBankruptcyDate] = useState<Date | undefined>(
    state.financial?.bankruptcyDetails?.date ? new Date(state.financial.bankruptcyDetails.date) : undefined
  );

  // Pre-fill housing payment from Step 2
  const housingPaymentFromStep2 = state.applicant?.monthlyHousingPayment;

  const { register, handleSubmit, watch, setValue, formState: { errors, isValid, touchedFields } } = useForm({
    resolver: zodResolver(financialSchema),
    mode: 'onChange',
    defaultValues: {
      ...state.financial,
      monthlyHousingPayment: state.financial?.monthlyHousingPayment || housingPaymentFromStep2 || 0,
    },
  });

  const creditScore = watch('creditScoreEstimate');
  const monthlyHousing = watch('monthlyHousingPayment') || 0;
  const monthlyCar = watch('monthlyCarPayment') || 0;
  const monthlyCreditCard = watch('monthlyCreditCardPayments') || 0;
  const monthlyOther = watch('otherMonthlyDebt') || 0;
  const hasBankruptcy = watch('hasBankruptcy');

  const totalMonthlyObligations = useMemo(() => {
    return monthlyHousing + monthlyCar + monthlyCreditCard + monthlyOther;
  }, [monthlyHousing, monthlyCar, monthlyCreditCard, monthlyOther]);

  // Calculate debt-to-income ratio if we have annual income from Step 3
  const annualIncome = state.employment?.annualIncome || 0;
  const monthlyIncome = annualIncome / 12;
  const debtToIncomeRatio = monthlyIncome > 0 ? (totalMonthlyObligations / monthlyIncome) * 100 : 0;

  const onSubmit = (data: any) => {
    const payload = {
      ...data,
      bankruptcyDetails: data.hasBankruptcy ? {
        date: bankruptcyDate,
        status: data.bankruptcyDetails?.status,
      } : undefined,
    };
    dispatch({ type: 'SET_FINANCIAL', payload });
    dispatch({ type: 'COMPLETE_STEP', payload: 4 });
    dispatch({ type: 'SET_CURRENT_STEP', payload: 5 });
  };

  const handleBack = () => {
    dispatch({ type: 'SET_CURRENT_STEP', payload: 3 });
  };

  const isFieldValid = (fieldName: string) => {
    return touchedFields[fieldName] && !errors[fieldName];
  };

  return (
    <TooltipProvider>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-2xl mx-auto">
        <div className="space-y-6">
          {/* Credit Score Estimate */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Label className="text-lg font-semibold">Credit Score Estimate</Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs font-normal">This is just an estimate - we'll verify with a credit check</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <RadioGroup
              value={creditScore}
              onValueChange={(value) => setValue('creditScoreEstimate', value as any, { shouldValidate: true })}
              className="grid grid-cols-1 md:grid-cols-3 gap-3"
            >
              {creditScoreOptions.map(({ value, label, subtitle, icon: Icon, bgColor, borderColor, textColor }) => (
                <Card
                  key={value}
                  className={cn(
                    'relative cursor-pointer transition-all min-h-[80px] bg-white',
                    creditScore === value
                      ? `${bgColor} ${borderColor} border-2 shadow-lg`
                      : 'hover:border-primary/50 border-2 border-transparent'
                  )}
                  onClick={() => setValue('creditScoreEstimate', value as any, { shouldValidate: true })}
                >
                  <Label htmlFor={`credit-${value}`} className="flex flex-col items-center justify-center gap-2 p-4 cursor-pointer h-full">
                    <RadioGroupItem value={value} id={`credit-${value}`} className="sr-only" />
                    <Icon className={cn('h-6 w-6', creditScore === value ? textColor : 'text-muted-foreground')} />
                    <div className="text-center">
                      <div className={cn('font-semibold', creditScore === value && textColor)}>{label}</div>
                      <div className="text-xs text-muted-foreground font-normal">{subtitle}</div>
                    </div>
                  </Label>
                </Card>
              ))}
            </RadioGroup>
                {errors.creditScoreEstimate && (
              <p className="text-sm text-destructive font-normal">{errors.creditScoreEstimate.message}</p>
            )}
          </div>

          {/* Monthly Financial Obligations */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Monthly Financial Obligations</Label>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="monthlyHousingPayment">Monthly Housing Payment</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setHousingLocked(!housingLocked)}
                >
                  {housingLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                </Button>
              </div>
              <div className="relative">
                <Input
                  id="monthlyHousingPayment"
                  {...register('monthlyHousingPayment', { valueAsNumber: true })}
                  type="number"
                  inputMode="numeric"
                  placeholder="1500"
                  disabled={housingLocked}
                  autoComplete="off"
                  className="pr-10"
                />
                <FieldValidationIndicator 
                  isValid={isFieldValid('monthlyHousingPayment')} 
                  isTouched={touchedFields.monthlyHousingPayment}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                />
              </div>
              <FormErrorMessage error={errors.monthlyHousingPayment?.message} field="Monthly housing payment" />
              {housingPaymentFromStep2 && housingLocked && (
                <p className="text-xs text-muted-foreground font-normal">Pre-filled from your application</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyCarPayment">Monthly Car Payment (Optional)</Label>
              <div className="relative">
                <Input
                  id="monthlyCarPayment"
                  {...register('monthlyCarPayment', { valueAsNumber: true })}
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  autoComplete="off"
                  className="pr-10"
                />
                <FieldValidationIndicator 
                  isValid={isFieldValid('monthlyCarPayment')} 
                  isTouched={touchedFields.monthlyCarPayment}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthlyCreditCardPayments">Monthly Credit Card Payments (Optional)</Label>
              <div className="relative">
                <Input
                  id="monthlyCreditCardPayments"
                  {...register('monthlyCreditCardPayments', { valueAsNumber: true })}
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  autoComplete="off"
                  className="pr-10"
                />
                <FieldValidationIndicator 
                  isValid={isFieldValid('monthlyCreditCardPayments')} 
                  isTouched={touchedFields.monthlyCreditCardPayments}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="otherMonthlyDebt">Other Monthly Debt Payments (Optional)</Label>
              <div className="relative">
                <Input
                  id="otherMonthlyDebt"
                  {...register('otherMonthlyDebt', { valueAsNumber: true })}
                  type="number"
                  inputMode="numeric"
                  placeholder="0"
                  autoComplete="off"
                  className="pr-10"
                />
                <FieldValidationIndicator 
                  isValid={isFieldValid('otherMonthlyDebt')} 
                  isTouched={touchedFields.otherMonthlyDebt}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                />
              </div>
            </div>

            {/* Total Monthly Obligations */}
            <Card className={cn(
              'p-4 border-2 bg-white',
              debtToIncomeRatio > 0 && debtToIncomeRatio < 40
                ? 'bg-green-50 border-green-300'
                : debtToIncomeRatio >= 40 && debtToIncomeRatio < 60
                ? 'bg-yellow-50 border-yellow-300'
                : 'bg-background border-border'
            )}>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total Monthly Obligations</span>
                <span className="text-2xl font-bold text-primary">{money(totalMonthlyObligations)}</span>
              </div>
              {annualIncome > 0 && (
                <div className="mt-2 text-sm text-muted-foreground font-normal">
                  <p>Debt-to-income ratio: {debtToIncomeRatio.toFixed(1)}%</p>
                  {debtToIncomeRatio < 40 && (
                    <p className="text-green-700">Excellent financial position</p>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* Banking Information */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">
              <Building2 className="inline h-5 w-5 mr-2" />
              Banking Information
            </Label>

            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Select
                value={watch('bankName')}
                onValueChange={(value) => setValue('bankName', value, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your bank" />
                </SelectTrigger>
                <SelectContent>
                  {canadianBanks.map((bank) => (
                    <SelectItem key={bank} value={bank}>
                      {bank}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormErrorMessage error={errors.bankName?.message} field="Bank name" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountType">Account Type</Label>
              <Select
                value={watch('accountType')}
                onValueChange={(value) => setValue('accountType', value as any, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chequing">Chequing</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                </SelectContent>
              </Select>
              <FormErrorMessage error={errors.accountType?.message} field="Account type" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="timeWithBank">How Long With This Bank?</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                <TooltipContent>
                  <p className="font-normal">We may need to verify your banking relationship</p>
                </TooltipContent>
                </Tooltip>
              </div>
              <Select
                value={watch('timeWithBank')}
                onValueChange={(value) => setValue('timeWithBank', value as any, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="<1">Less than 1 year</SelectItem>
                  <SelectItem value="1-3">1-3 years</SelectItem>
                  <SelectItem value="3-5">3-5 years</SelectItem>
                  <SelectItem value="5+">5+ years</SelectItem>
                </SelectContent>
              </Select>
              <FormErrorMessage error={errors.timeWithBank?.message} field="Time with bank" />
            </div>
          </div>

          {/* Bankruptcy History */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Label className="text-lg font-semibold">Bankruptcy or Consumer Proposal History</Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs font-normal">Required disclosure - won't automatically disqualify you</p>
                </TooltipContent>
              </Tooltip>
            </div>

            <RadioGroup
              value={hasBankruptcy ? 'yes' : 'no'}
              onValueChange={(value) => {
                const hasIt = value === 'yes';
                setValue('hasBankruptcy', hasIt, { shouldValidate: true });
                setShowBankruptcyDetails(hasIt);
              }}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="bankruptcy-no" />
                <Label htmlFor="bankruptcy-no">No</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="bankruptcy-yes" />
                <Label htmlFor="bankruptcy-yes">Yes</Label>
              </div>
            </RadioGroup>

            {showBankruptcyDetails && (
              <Card className="p-4 space-y-4 animate-fade-in border-primary/30 bg-white">
                <div className="space-y-2">
                  <Label>Bankruptcy/Proposal Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !bankruptcyDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {bankruptcyDate ? format(bankruptcyDate, 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={bankruptcyDate}
                        onSelect={setBankruptcyDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Current Status</Label>
                  <Select
                    value={watch('bankruptcyDetails.status')}
                    onValueChange={(value) => setValue('bankruptcyDetails.status', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="discharged">Discharged</SelectItem>
                      <SelectItem value="undischarged">Undischarged</SelectItem>
                      <SelectItem value="consumer_proposal_active">Consumer Proposal (Active)</SelectItem>
                      <SelectItem value="consumer_proposal_completed">Consumer Proposal (Completed)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Navigation */}
        <MobileFormNavigation
          onBack={handleBack}
          onNext={handleSubmit(onSubmit)}
          nextLabel="Continue to References"
          isNextDisabled={!isValid}
        />
      </form>
    </TooltipProvider>
  );
}
