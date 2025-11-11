import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFinancing } from '@/contexts/FinancingContext';
import { employmentSchema } from '@/lib/financingValidation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Briefcase, Building2, Phone, DollarSign, Plus, X, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Slider } from '@/components/ui/slider';
import { MaskedInput } from './MaskedInput';
import { FieldValidationIndicator } from './FormErrorMessage';
import { MobileFormNavigation } from './MobileFormNavigation';
import { useState } from 'react';
import { money } from '@/lib/money';

const incomeRanges = [
  { value: 25000, label: '<$30k' },
  { value: 40000, label: '$30k-$50k' },
  { value: 62500, label: '$50k-$75k' },
  { value: 87500, label: '$75k-$100k' },
  { value: 125000, label: '$100k-$150k' },
  { value: 175000, label: '$150k+' },
];

export function EmploymentStep() {
  const { state, dispatch } = useFinancing();
  const [showAdditionalIncome, setShowAdditionalIncome] = useState(
    state.employment?.additionalIncome && state.employment.additionalIncome.length > 0
  );

  const { register, handleSubmit, watch, setValue, control, formState: { errors, isValid, touchedFields } } = useForm({
    resolver: zodResolver(employmentSchema),
    mode: 'onChange',
    defaultValues: state.employment || {
      status: 'employed',
      additionalIncome: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'additionalIncome',
  });

  const status = watch('status');
  const timeAtJob = watch('timeAtJob');
  const annualIncome = watch('annualIncome');
  const showEmployerFields = status === 'employed' || status === 'self_employed';
  const showPreviousEmployer = timeAtJob && ['<1', '1-2'].includes(timeAtJob);

  const onSubmit = (data: any) => {
    dispatch({ type: 'SET_EMPLOYMENT', payload: data });
    dispatch({ type: 'COMPLETE_STEP', payload: 3 });
    dispatch({ type: 'SET_CURRENT_STEP', payload: 4 });
  };

  const handleBack = () => {
    dispatch({ type: 'SET_CURRENT_STEP', payload: 2 });
  };

  const isFieldValid = (fieldName: string) => {
    return touchedFields[fieldName] && !errors[fieldName];
  };

  return (
    <TooltipProvider>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-2xl mx-auto">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-lg font-semibold">Employment Status</Label>
            <RadioGroup
              value={status}
              onValueChange={(value) => setValue('status', value as any, { shouldValidate: true })}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { value: 'employed', label: 'Employed', icon: Briefcase },
                { value: 'self_employed', label: 'Self-Employed', icon: Building2 },
                { value: 'retired', label: 'Retired', icon: Briefcase },
                { value: 'other', label: 'Other', icon: Briefcase },
              ].map(({ value, label, icon: Icon }) => (
                <Card
                  key={value}
                  className={`relative cursor-pointer transition-all ${
                    status === value
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setValue('status', value as any, { shouldValidate: true })}
                >
                  <Label htmlFor={value} className="flex items-center gap-3 p-4 cursor-pointer">
                    <RadioGroupItem value={value} id={value} className="sr-only" />
                    <Icon className="h-5 w-5 text-primary" />
                    <span className="font-medium">{label}</span>
                  </Label>
                </Card>
              ))}
            </RadioGroup>
          </div>

          {showEmployerFields && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <Label htmlFor="employerName">
                  <Building2 className="inline h-4 w-4 mr-2" />
                  Employer Name
                </Label>
                <div className="relative">
                  <Input
                    id="employerName"
                    {...register('employerName')}
                    placeholder="Company name"
                    className="pr-10"
                  />
                  <FieldValidationIndicator 
                    isValid={isFieldValid('employerName')} 
                    isTouched={!!touchedFields.employerName}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  />
                </div>
                  {errors.employerName && (
                    <p className="text-sm text-destructive font-light">{errors.employerName.message}</p>
                  )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="employerPhone">
                  <Phone className="inline h-4 w-4 mr-2" />
                  Employer Phone
                </Label>
                <div className="relative">
                  <Controller
                    name="employerPhone"
                    control={control}
                    render={({ field }) => (
                      <MaskedInput
                        id="employerPhone"
                        maskType="phone"
                        inputMode="tel"
                        autoComplete="tel-national"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        className="pr-10"
                      />
                    )}
                  />
                  <FieldValidationIndicator 
                    isValid={isFieldValid('employerPhone')} 
                    isTouched={!!touchedFields.employerPhone}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  />
                </div>
                {errors.employerPhone && (
                  <p className="text-sm text-destructive font-light">{errors.employerPhone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title / Position</Label>
                <div className="relative">
                  <Input
                    id="jobTitle"
                    {...register('jobTitle')}
                    placeholder="Your position"
                    className="pr-10"
                  />
                  <FieldValidationIndicator 
                    isValid={isFieldValid('jobTitle')} 
                    isTouched={!!touchedFields.jobTitle}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  />
                </div>
                  {errors.jobTitle && (
                    <p className="text-sm text-destructive font-light">{errors.jobTitle.message}</p>
                  )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeAtJob">Time at Current Job</Label>
                <Select
                  value={timeAtJob}
                  onValueChange={(value) => setValue('timeAtJob', value as any, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="<1">Less than 1 year</SelectItem>
                    <SelectItem value="1-2">1-2 years</SelectItem>
                    <SelectItem value="2-3">2-3 years</SelectItem>
                    <SelectItem value="3-5">3-5 years</SelectItem>
                    <SelectItem value="5+">5+ years</SelectItem>
                  </SelectContent>
                </Select>
                {errors.timeAtJob && (
                  <p className="text-sm text-destructive font-light">{errors.timeAtJob.message}</p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="annualIncome">
                <DollarSign className="inline h-4 w-4 mr-2" />
                Gross Annual Income (before taxes)
              </Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-light">Required for credit assessment</p>
                  </TooltipContent>
              </Tooltip>
            </div>
            <div className="relative">
              <Input
                id="annualIncome"
                {...register('annualIncome', { valueAsNumber: true })}
                type="number"
                inputMode="numeric"
                placeholder="50000"
                className="pr-10"
              />
              <FieldValidationIndicator 
                isValid={isFieldValid('annualIncome')} 
                isTouched={!!touchedFields.annualIncome}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              />
            </div>
            <div className="space-y-2 pt-2">
              <Slider
                value={[annualIncome || 50000]}
                onValueChange={(value) => setValue('annualIncome', value[0], { shouldValidate: true })}
                min={20000}
                max={200000}
                step={5000}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground font-light">
                {incomeRanges.map((range) => (
                  <span key={range.value}>{range.label}</span>
                ))}
              </div>
              {annualIncome && (
                <p className="text-sm text-center font-semibold text-primary">
                  {money(annualIncome)}
                </p>
              )}
            </div>
                  {errors.annualIncome && (
                    <p className="text-sm text-destructive font-light">{errors.annualIncome.message}</p>
                  )}
          </div>

          {showPreviousEmployer && (
            <Card className="p-4 space-y-4 animate-fade-in border-primary/30">
              <h3 className="font-semibold text-sm">Previous Employer Information</h3>
              <div className="space-y-2">
                <Label htmlFor="previousEmployer.name">Previous Employer Name</Label>
                <Input
                  id="previousEmployer.name"
                  {...register('previousEmployer.name')}
                  placeholder="Previous company name"
                />
                {errors.previousEmployer?.name && (
                  <p className="text-sm text-destructive font-light">{errors.previousEmployer.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="previousEmployer.timeAtJob">Time at Previous Job</Label>
                <Select
                  value={watch('previousEmployer.timeAtJob')}
                  onValueChange={(value) => setValue('previousEmployer.timeAtJob', value as any, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="<1">Less than 1 year</SelectItem>
                    <SelectItem value="1-2">1-2 years</SelectItem>
                    <SelectItem value="2-3">2-3 years</SelectItem>
                    <SelectItem value="3-5">3-5 years</SelectItem>
                    <SelectItem value="5+">5+ years</SelectItem>
                  </SelectContent>
                </Select>
                {errors.previousEmployer?.timeAtJob && (
                  <p className="text-sm text-destructive font-light">{errors.previousEmployer.timeAtJob.message}</p>
                )}
              </div>
            </Card>
          )}

          <div className="space-y-4">
            {!showAdditionalIncome ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAdditionalIncome(true)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Additional Income Sources (Optional)
              </Button>
            ) : (
              <Card className="p-4 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Additional Income Sources</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAdditionalIncome(false);
                      // Clear all additional income entries
                      while (fields.length > 0) {
                        remove(0);
                      }
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <div key={field.id} className="space-y-3 p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Source {index + 1}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`additionalIncome.${index}.source`}>Type</Label>
                      <Select
                        value={watch(`additionalIncome.${index}.source`)}
                        onValueChange={(value) =>
                          setValue(`additionalIncome.${index}.source`, value, { shouldValidate: true })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="spouse">Spouse Income</SelectItem>
                          <SelectItem value="rental">Rental Income</SelectItem>
                          <SelectItem value="investment">Investment Income</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`additionalIncome.${index}.monthlyAmount`}>
                        Monthly Amount
                      </Label>
                      <Input
                        {...register(`additionalIncome.${index}.monthlyAmount`, { valueAsNumber: true })}
                        type="number"
                        inputMode="numeric"
                        placeholder="1000"
                      />
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => append({ source: '', monthlyAmount: 0 })}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Source
                </Button>
              </Card>
            )}
          </div>
        </div>

        <div className="flex gap-4 pt-4 sticky bottom-0 bg-background pb-4 border-t md:relative md:border-t-0">
          <MobileFormNavigation
            onBack={handleBack}
            nextLabel="Continue"
            isNextDisabled={!isValid}
            className="sm:relative sm:bottom-auto sm:py-0 sm:px-0 sm:border-0 sm:shadow-none w-full"
          />
        </div>
      </form>
    </TooltipProvider>
  );
}
