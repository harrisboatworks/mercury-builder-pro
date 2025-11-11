import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFinancing } from '@/contexts/FinancingContext';
import { coApplicantSchema, type CoApplicant } from '@/lib/financingValidation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import { InfoIcon, UserPlus, UserX, Building2, Briefcase, DollarSign, CreditCard, Landmark } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MaskedInput } from './MaskedInput';
import { FormErrorMessage, FieldValidationIndicator } from './FormErrorMessage';
import { MobileFormNavigation } from './MobileFormNavigation';

export function CoApplicantStep() {
  const { state, dispatch } = useFinancing();
  const [hasCoApplicant, setHasCoApplicant] = useState(state.hasCoApplicant || false);
  const [sameAddress, setSameAddress] = useState(false);
  const [showPreviousEmployer, setShowPreviousEmployer] = useState(false);
  const [showBankruptcyDetails, setShowBankruptcyDetails] = useState(false);
  const [incomeValue, setIncomeValue] = useState([50000]);

  const { register, handleSubmit, watch, setValue, formState: { errors, isValid, touchedFields } } = useForm<CoApplicant>({
    resolver: zodResolver(coApplicantSchema),
    mode: 'onChange',
    defaultValues: state.coApplicant || {},
  });

  const watchTimeAtJob = watch('timeAtJob');
  const watchEmploymentStatus = watch('status');
  const watchBankruptcy = watch('hasBankruptcy');

  useEffect(() => {
    if (watchTimeAtJob && ['<1', '1-2'].includes(watchTimeAtJob)) {
      setShowPreviousEmployer(true);
    } else {
      setShowPreviousEmployer(false);
    }
  }, [watchTimeAtJob]);

  useEffect(() => {
    if (watchBankruptcy === true) {
      setShowBankruptcyDetails(true);
    } else {
      setShowBankruptcyDetails(false);
    }
  }, [watchBankruptcy]);

  useEffect(() => {
    if (sameAddress && state.applicant?.currentAddress) {
      setValue('currentAddress.street', state.applicant.currentAddress.street);
      setValue('currentAddress.city', state.applicant.currentAddress.city);
      setValue('currentAddress.province', state.applicant.currentAddress.province);
      setValue('currentAddress.postalCode', state.applicant.currentAddress.postalCode);
      setValue('currentAddress.timeAtAddress', state.applicant.currentAddress.timeAtAddress);
    }
  }, [sameAddress, state.applicant, setValue]);

  const onSubmit = (data: CoApplicant) => {
    dispatch({ type: 'SET_CO_APPLICANT', payload: data });
    dispatch({ type: 'COMPLETE_STEP', payload: 5 });
    dispatch({ type: 'SET_CURRENT_STEP', payload: 6 });
  };

  const handleSkip = () => {
    dispatch({ type: 'SET_HAS_CO_APPLICANT', payload: false });
    dispatch({ type: 'COMPLETE_STEP', payload: 5 });
    dispatch({ type: 'SET_CURRENT_STEP', payload: 6 });
  };

  const handleBack = () => {
    dispatch({ type: 'SET_CURRENT_STEP', payload: 4 });
  };

  return (
    <div className="space-y-6">
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          A co-applicant can help improve your approval chances and may result in better rates.
        </AlertDescription>
      </Alert>

      {/* Initial Choice */}
      <Card>
        <CardContent className="pt-6">
          <Label className="text-base font-semibold mb-4 block">Do you have a co-applicant?</Label>
          <RadioGroup value={hasCoApplicant ? 'yes' : 'no'} onValueChange={(value) => {
            const hasCoApp = value === 'yes';
            setHasCoApplicant(hasCoApp);
            dispatch({ type: 'SET_HAS_CO_APPLICANT', payload: hasCoApp });
          }}>
            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardContent className="flex items-center space-x-4 p-4">
                <RadioGroupItem value="yes" id="yes" />
                <Label htmlFor="yes" className="flex items-center gap-2 cursor-pointer flex-1">
                  <UserPlus className="h-5 w-5 text-primary" />
                  <span>Yes, add co-applicant</span>
                </Label>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-primary transition-colors">
              <CardContent className="flex items-center space-x-4 p-4">
                <RadioGroupItem value="no" id="no" />
                <Label htmlFor="no" className="flex items-center gap-2 cursor-pointer flex-1">
                  <UserX className="h-5 w-5 text-muted-foreground" />
                  <span>No, continue without co-applicant</span>
                </Label>
              </CardContent>
            </Card>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Co-Applicant Form */}
      {hasCoApplicant && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-in fade-in-50 duration-500">
          {/* Personal Information */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Personal Information
              </h3>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    {...register('firstName')}
                    className={errors.firstName ? 'border-destructive' : ''}
                  />
                  {errors.firstName && <p className="text-sm text-destructive">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="middleName">Middle Name</Label>
                  <Input id="middleName" {...register('middleName')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    {...register('lastName')}
                    className={errors.lastName ? 'border-destructive' : ''}
                  />
                  {errors.lastName && <p className="text-sm text-destructive">{errors.lastName.message}</p>}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...register('dateOfBirth', { valueAsDate: true })}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                    className={errors.dateOfBirth ? 'border-destructive' : ''}
                  />
                  {errors.dateOfBirth && <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sin">Social Insurance Number *</Label>
                  <div className="relative">
                    <MaskedInput
                      id="sin"
                      maskType="sin"
                      {...register('sin')}
                      value={watch('sin')}
                      onChange={(e) => setValue('sin', e.target.value, { shouldValidate: true })}
                      autoComplete="off"
                      className="pr-10"
                    />
                    <FieldValidationIndicator 
                      isValid={!errors.sin && !!watch('sin')}
                      isTouched={touchedFields.sin}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    />
                  </div>
                  <FormErrorMessage error={errors.sin?.message} field="SIN" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    className={errors.email ? 'border-destructive' : ''}
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryPhone">Phone *</Label>
                  <div className="relative">
                    <MaskedInput
                      id="primaryPhone"
                      maskType="phone"
                      {...register('primaryPhone')}
                      value={watch('primaryPhone')}
                      onChange={(e) => setValue('primaryPhone', e.target.value, { shouldValidate: true })}
                      autoComplete="tel"
                      className="pr-10"
                    />
                    <FieldValidationIndicator 
                      isValid={!errors.primaryPhone && !!watch('primaryPhone')}
                      isTouched={touchedFields.primaryPhone}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    />
                  </div>
                  <FormErrorMessage error={errors.primaryPhone?.message} field="Phone number" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Address Information</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sameAddress"
                    checked={sameAddress}
                    onCheckedChange={(checked) => setSameAddress(checked as boolean)}
                  />
                  <Label htmlFor="sameAddress" className="cursor-pointer">Same as primary applicant</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentAddress.street">Street Address *</Label>
                <Input
                  id="currentAddress.street"
                  {...register('currentAddress.street')}
                  disabled={sameAddress}
                  className={errors.currentAddress?.street ? 'border-destructive' : ''}
                />
                {errors.currentAddress?.street && <p className="text-sm text-destructive">{errors.currentAddress.street.message}</p>}
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentAddress.city">City *</Label>
                  <Input
                    id="currentAddress.city"
                    {...register('currentAddress.city')}
                    disabled={sameAddress}
                    className={errors.currentAddress?.city ? 'border-destructive' : ''}
                  />
                  {errors.currentAddress?.city && <p className="text-sm text-destructive">{errors.currentAddress.city.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentAddress.province">Province *</Label>
                  <Select
                    {...register('currentAddress.province')}
                    onValueChange={(value) => setValue('currentAddress.province', value)}
                    disabled={sameAddress}
                  >
                    <SelectTrigger className={errors.currentAddress?.province ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ON">Ontario</SelectItem>
                      <SelectItem value="QC">Quebec</SelectItem>
                      <SelectItem value="BC">British Columbia</SelectItem>
                      <SelectItem value="AB">Alberta</SelectItem>
                      <SelectItem value="MB">Manitoba</SelectItem>
                      <SelectItem value="SK">Saskatchewan</SelectItem>
                      <SelectItem value="NS">Nova Scotia</SelectItem>
                      <SelectItem value="NB">New Brunswick</SelectItem>
                      <SelectItem value="NL">Newfoundland</SelectItem>
                      <SelectItem value="PE">Prince Edward Island</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.currentAddress?.province && <p className="text-sm text-destructive">{errors.currentAddress.province.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentAddress.postalCode">Postal Code *</Label>
                  <div className="relative">
                    <MaskedInput
                      id="currentAddress.postalCode"
                      maskType="postal"
                      {...register('currentAddress.postalCode')}
                      value={watch('currentAddress.postalCode')}
                      onChange={(e) => setValue('currentAddress.postalCode', e.target.value, { shouldValidate: true })}
                      disabled={sameAddress}
                      autoComplete="postal-code"
                      className="pr-10"
                    />
                    <FieldValidationIndicator 
                      isValid={!errors.currentAddress?.postalCode && !!watch('currentAddress.postalCode')}
                      isTouched={touchedFields.currentAddress?.postalCode}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    />
                  </div>
                  <FormErrorMessage error={errors.currentAddress?.postalCode?.message} field="Postal code" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentAddress.timeAtAddress">Time at Address *</Label>
                <Select {...register('currentAddress.timeAtAddress')} onValueChange={(value) => setValue('currentAddress.timeAtAddress', value as any)} disabled={sameAddress}>
                  <SelectTrigger className={errors.currentAddress?.timeAtAddress ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="<1">Less than 1 year</SelectItem>
                    <SelectItem value="1-2">1-2 years</SelectItem>
                    <SelectItem value="2-3">2-3 years</SelectItem>
                    <SelectItem value="3-5">3-5 years</SelectItem>
                    <SelectItem value="5+">5+ years</SelectItem>
                  </SelectContent>
                </Select>
                {errors.currentAddress?.timeAtAddress && <p className="text-sm text-destructive">{errors.currentAddress.timeAtAddress.message}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Employment Information */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Employment Information
              </h3>

              <div className="space-y-2">
                <Label>Employment Status *</Label>
                <RadioGroup {...register('status')} onValueChange={(value) => setValue('status', value as any)}>
                  <div className="grid md:grid-cols-2 gap-3">
                    {[
                      { value: 'employed', label: 'Employed' },
                      { value: 'self_employed', label: 'Self-Employed' },
                      { value: 'retired', label: 'Retired' },
                      { value: 'other', label: 'Other' }
                    ].map((status) => (
                      <Card key={status.value} className="cursor-pointer hover:border-primary transition-colors">
                        <CardContent className="flex items-center space-x-3 p-3">
                          <RadioGroupItem value={status.value} id={`emp-${status.value}`} />
                          <Label htmlFor={`emp-${status.value}`} className="cursor-pointer flex-1">{status.label}</Label>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </RadioGroup>
                {errors.status && <p className="text-sm text-destructive">{errors.status.message}</p>}
              </div>

              {(watchEmploymentStatus === 'employed' || watchEmploymentStatus === 'self_employed') && (
                <div className="space-y-4 animate-in fade-in-50 duration-300">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="employerName">Employer Name *</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="employerName"
                          {...register('employerName')}
                          className={`pl-10 ${errors.employerName ? 'border-destructive' : ''}`}
                        />
                      </div>
                      {errors.employerName && <p className="text-sm text-destructive">{errors.employerName.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employerPhone">Employer Phone *</Label>
                      <Input
                        id="employerPhone"
                        type="tel"
                        inputMode="tel"
                        {...register('employerPhone')}
                        className={errors.employerPhone ? 'border-destructive' : ''}
                      />
                      {errors.employerPhone && <p className="text-sm text-destructive">{errors.employerPhone.message}</p>}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="jobTitle">Job Title *</Label>
                      <Input
                        id="jobTitle"
                        {...register('jobTitle')}
                        className={errors.jobTitle ? 'border-destructive' : ''}
                      />
                      {errors.jobTitle && <p className="text-sm text-destructive">{errors.jobTitle.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timeAtJob">Time at Job *</Label>
                      <Select {...register('timeAtJob')} onValueChange={(value) => setValue('timeAtJob', value as any)}>
                        <SelectTrigger className={errors.timeAtJob ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="<1">Less than 1 year</SelectItem>
                          <SelectItem value="1-2">1-2 years</SelectItem>
                          <SelectItem value="2-3">2-3 years</SelectItem>
                          <SelectItem value="3-5">3-5 years</SelectItem>
                          <SelectItem value="5+">5+ years</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.timeAtJob && <p className="text-sm text-destructive">{errors.timeAtJob.message}</p>}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="annualIncome">Gross Annual Income *</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoIcon className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>Required for credit assessment</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="space-y-4">
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="annualIncome"
                      type="number"
                      inputMode="numeric"
                      {...register('annualIncome', { valueAsNumber: true })}
                      className={`pl-10 ${errors.annualIncome ? 'border-destructive' : ''}`}
                    />
                  </div>
                  <Slider
                    value={incomeValue}
                    onValueChange={(value) => {
                      setIncomeValue(value);
                      setValue('annualIncome', value[0]);
                    }}
                    min={20000}
                    max={200000}
                    step={5000}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>$20k</span>
                    <span>${incomeValue[0].toLocaleString()}</span>
                    <span>$200k+</span>
                  </div>
                </div>
                {errors.annualIncome && <p className="text-sm text-destructive">{errors.annualIncome.message}</p>}
              </div>

              {showPreviousEmployer && (
                <div className="space-y-4 animate-in fade-in-50 duration-300 p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium">Previous Employer (Required for less than 2 years at current job)</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="previousEmployer.name">Previous Employer Name</Label>
                      <Input id="previousEmployer.name" {...register('previousEmployer.name')} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="previousEmployer.timeAtJob">Time at Previous Job</Label>
                      <Select {...register('previousEmployer.timeAtJob')} onValueChange={(value) => setValue('previousEmployer.timeAtJob', value as any)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="<1">Less than 1 year</SelectItem>
                          <SelectItem value="1-2">1-2 years</SelectItem>
                          <SelectItem value="2-3">2-3 years</SelectItem>
                          <SelectItem value="3-5">3-5 years</SelectItem>
                          <SelectItem value="5+">5+ years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Financial Information
              </h3>

              <div className="space-y-2">
                <Label>Credit Score Estimate *</Label>
                <RadioGroup {...register('creditScoreEstimate')} onValueChange={(value) => setValue('creditScoreEstimate', value as any)}>
                  <div className="grid md:grid-cols-2 gap-3">
                    {[
                      { value: 'excellent', label: '🌟 Excellent (750+)', color: 'bg-green-500/10 border-green-500/50' },
                      { value: 'good', label: '✅ Good (700-749)', color: 'bg-green-400/10 border-green-400/50' },
                      { value: 'fair', label: '📊 Fair (650-699)', color: 'bg-yellow-400/10 border-yellow-400/50' },
                      { value: 'poor', label: '⚠️ Poor (<650)', color: 'bg-orange-400/10 border-orange-400/50' },
                    ].map((score) => (
                      <Card key={score.value} className={`cursor-pointer hover:border-primary transition-colors ${score.color}`}>
                        <CardContent className="flex items-center space-x-3 p-3">
                          <RadioGroupItem value={score.value} id={`credit-${score.value}`} />
                          <Label htmlFor={`credit-${score.value}`} className="cursor-pointer flex-1">{score.label}</Label>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </RadioGroup>
                {errors.creditScoreEstimate && <p className="text-sm text-destructive">{errors.creditScoreEstimate.message}</p>}
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Monthly Financial Obligations</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="monthlyCarPayment">Monthly Car Payment</Label>
                    <Input
                      id="monthlyCarPayment"
                      type="number"
                      inputMode="numeric"
                      {...register('monthlyCarPayment', { valueAsNumber: true })}
                      placeholder="$0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthlyCreditCardPayments">Monthly Credit Card Payments</Label>
                    <Input
                      id="monthlyCreditCardPayments"
                      type="number"
                      inputMode="numeric"
                      {...register('monthlyCreditCardPayments', { valueAsNumber: true })}
                      placeholder="$0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="otherMonthlyDebt">Other Monthly Debt</Label>
                    <Input
                      id="otherMonthlyDebt"
                      type="number"
                      inputMode="numeric"
                      {...register('otherMonthlyDebt', { valueAsNumber: true })}
                      placeholder="$0"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Landmark className="h-4 w-4" />
                  Banking Information
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name *</Label>
                    <Input
                      id="bankName"
                      {...register('bankName')}
                      className={errors.bankName ? 'border-destructive' : ''}
                    />
                    {errors.bankName && <p className="text-sm text-destructive">{errors.bankName.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountType">Account Type *</Label>
                    <Select {...register('accountType')} onValueChange={(value) => setValue('accountType', value as any)}>
                      <SelectTrigger className={errors.accountType ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="chequing">Chequing</SelectItem>
                        <SelectItem value="savings">Savings</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.accountType && <p className="text-sm text-destructive">{errors.accountType.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeWithBank">Time with Bank *</Label>
                    <Select {...register('timeWithBank')} onValueChange={(value) => setValue('timeWithBank', value as any)}>
                      <SelectTrigger className={errors.timeWithBank ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="<1">Less than 1 year</SelectItem>
                        <SelectItem value="1-3">1-3 years</SelectItem>
                        <SelectItem value="3-5">3-5 years</SelectItem>
                        <SelectItem value="5+">5+ years</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.timeWithBank && <p className="text-sm text-destructive">{errors.timeWithBank.message}</p>}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Bankruptcy or Consumer Proposal History *</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <InfoIcon className="h-4 w-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>Required disclosure - won't automatically disqualify you</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <RadioGroup value={watchBankruptcy ? 'yes' : 'no'} onValueChange={(value) => setValue('hasBankruptcy', value === 'yes')}>
                  <div className="flex gap-4">
                    <Card className="cursor-pointer hover:border-primary transition-colors flex-1">
                      <CardContent className="flex items-center space-x-3 p-3">
                        <RadioGroupItem value="no" id="bankruptcy-no" />
                        <Label htmlFor="bankruptcy-no" className="cursor-pointer flex-1">No</Label>
                      </CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:border-primary transition-colors flex-1">
                      <CardContent className="flex items-center space-x-3 p-3">
                        <RadioGroupItem value="yes" id="bankruptcy-yes" />
                        <Label htmlFor="bankruptcy-yes" className="cursor-pointer flex-1">Yes</Label>
                      </CardContent>
                    </Card>
                  </div>
                </RadioGroup>
                {errors.hasBankruptcy && <p className="text-sm text-destructive">{errors.hasBankruptcy.message}</p>}
              </div>

              {showBankruptcyDetails && (
                <div className="space-y-4 animate-in fade-in-50 duration-300 p-4 border rounded-lg bg-muted/50">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bankruptcyDetails.date">Date</Label>
                      <Input
                        id="bankruptcyDetails.date"
                        type="date"
                        {...register('bankruptcyDetails.date', { valueAsDate: true })}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankruptcyDetails.status">Status</Label>
                      <Select {...register('bankruptcyDetails.status')} onValueChange={(value) => setValue('bankruptcyDetails.status', value as any)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="discharged">Discharged</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <MobileFormNavigation
            onBack={handleBack}
            onNext={handleSubmit(onSubmit)}
            nextLabel="Continue"
            isNextDisabled={!isValid}
          />
        </form>
      )}

      {!hasCoApplicant && (
        <MobileFormNavigation
          onBack={handleBack}
          onNext={handleSkip}
          nextLabel="Skip & Continue"
        />
      )}
    </div>
  );
}
