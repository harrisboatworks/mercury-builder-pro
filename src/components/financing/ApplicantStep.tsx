import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { applicantSchema, type Applicant } from '@/lib/financingValidation';
import { useFinancing } from '@/contexts/FinancingContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MaskedInput } from './MaskedInput';
import { FieldValidationIndicator } from './FormErrorMessage';
import { MobileFormNavigation } from './MobileFormNavigation';
import { useEffect } from 'react';

const provinces = [
  'Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba',
  'Saskatchewan', 'Nova Scotia', 'New Brunswick', 'Newfoundland and Labrador',
  'Prince Edward Island', 'Northwest Territories', 'Yukon', 'Nunavut'
];

export function ApplicantStep() {
  const { state, dispatch } = useFinancing();
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid, touchedFields },
  } = useForm<Applicant>({
    resolver: zodResolver(applicantSchema),
    mode: 'onChange',
    defaultValues: state.applicant || {},
  });

  const timeAtAddress = watch('currentAddress.timeAtAddress');
  const housingStatus = watch('housingStatus');
  const dateOfBirth = watch('dateOfBirth');

  // Calculate age from date of birth
  const age = dateOfBirth ? Math.floor((new Date().getTime() - new Date(dateOfBirth).getTime()) / (1000 * 60 * 60 * 24 * 365)) : null;

  // Show previous address if less than 3 years at current address
  const showPreviousAddress = timeAtAddress && ['<1', '1-2', '2-3'].includes(timeAtAddress);

  // Auto-set housing payment to 0 if living with family
  useEffect(() => {
    if (housingStatus === 'family') {
      setValue('monthlyHousingPayment', 0, { shouldValidate: true });
    }
  }, [housingStatus, setValue]);

  const onSubmit = (data: Applicant) => {
    dispatch({ type: 'SET_APPLICANT', payload: data });
    dispatch({ type: 'COMPLETE_STEP', payload: 2 });
    dispatch({ type: 'SET_CURRENT_STEP', payload: 3 });
  };

  const handleBack = () => {
    dispatch({ type: 'SET_CURRENT_STEP', payload: 1 });
  };

  const isFieldValid = (fieldName: keyof Applicant | string) => {
    const keys = fieldName.split('.');
    let error: any = errors;
    let touched: any = touchedFields;
    
    for (const key of keys) {
      error = error?.[key];
      touched = touched?.[key];
    }
    
    return !error && touched;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Tell Us About Yourself</h2>
        <p className="text-muted-foreground">We need this information for credit verification</p>
      </div>

      {/* Full Legal Name */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="flex items-center gap-2">
            First Name *
            <FieldValidationIndicator isValid={isFieldValid('firstName')} isTouched={!!touchedFields.firstName} />
          </Label>
          <Input
            id="firstName"
            {...register('firstName')}
            autoComplete="given-name"
            className={isFieldValid('firstName') ? 'border-green-500' : ''}
          />
          {errors.firstName && (
            <p className="text-sm text-destructive">{errors.firstName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="middleName">Middle Name</Label>
          <Input id="middleName" {...register('middleName')} autoComplete="additional-name" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName" className="flex items-center gap-2">
            Last Name *
            <FieldValidationIndicator isValid={isFieldValid('lastName')} isTouched={!!touchedFields.lastName} />
          </Label>
          <Input
            id="lastName"
            {...register('lastName')}
            autoComplete="family-name"
            className={isFieldValid('lastName') ? 'border-green-500' : ''}
          />
          {errors.lastName && (
            <p className="text-sm text-destructive">{errors.lastName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="suffix">Suffix</Label>
          <Select onValueChange={(value) => setValue('suffix', value as any)}>
            <SelectTrigger>
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              <SelectItem value="Jr.">Jr.</SelectItem>
              <SelectItem value="Sr.">Sr.</SelectItem>
              <SelectItem value="II">II</SelectItem>
              <SelectItem value="III">III</SelectItem>
              <SelectItem value="IV">IV</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Date of Birth */}
      <div className="space-y-2">
        <Label htmlFor="dateOfBirth" className="flex items-center gap-2">
          Date of Birth *
          <FieldValidationIndicator isValid={isFieldValid('dateOfBirth')} isTouched={!!touchedFields.dateOfBirth} />
        </Label>
        <Input
          id="dateOfBirth"
          type="date"
          autoComplete="bday"
          {...register('dateOfBirth', { valueAsDate: true })}
          max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
          className={isFieldValid('dateOfBirth') ? 'border-green-500' : ''}
        />
        {age && age >= 18 && (
          <p className="text-sm text-green-500">Age: {age} years old ✓</p>
        )}
        {errors.dateOfBirth && (
          <p className="text-sm text-destructive">{errors.dateOfBirth.message}</p>
        )}
      </div>

      {/* SIN */}
      <div className="space-y-2">
        <Label htmlFor="sin" className="flex items-center gap-2">
          Social Insurance Number (SIN) *
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Required for credit check. Your SIN is encrypted and stored securely.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <FieldValidationIndicator isValid={isFieldValid('sin')} isTouched={!!touchedFields.sin} />
        </Label>
        <MaskedInput
          id="sin"
          maskType="sin"
          inputMode="numeric"
          {...register('sin')}
          className={isFieldValid('sin') ? 'border-green-500' : ''}
        />
        {errors.sin && (
          <p className="text-sm text-destructive">{errors.sin.message}</p>
        )}
      </div>

      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            Email *
            <FieldValidationIndicator isValid={isFieldValid('email')} isTouched={!!touchedFields.email} />
          </Label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            {...register('email')}
            className={isFieldValid('email') ? 'border-green-500' : ''}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="primaryPhone" className="flex items-center gap-2">
            Primary Phone *
            <FieldValidationIndicator isValid={isFieldValid('primaryPhone')} isTouched={!!touchedFields.primaryPhone} />
          </Label>
          <MaskedInput
            id="primaryPhone"
            maskType="phone"
            inputMode="tel"
            autoComplete="tel"
            {...register('primaryPhone')}
            className={isFieldValid('primaryPhone') ? 'border-green-500' : ''}
          />
          {errors.primaryPhone && (
            <p className="text-sm text-destructive">{errors.primaryPhone.message}</p>
          )}
        </div>
      </div>

      {/* Current Address */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h3 className="font-semibold text-foreground">Current Address</h3>
        
        <div className="space-y-2">
          <Label htmlFor="street" className="flex items-center gap-2">
            Street Address *
            <FieldValidationIndicator isValid={isFieldValid('currentAddress.street')} isTouched={!!touchedFields.currentAddress?.street} />
          </Label>
          <Input
            id="street"
            autoComplete="street-address"
            {...register('currentAddress.street')}
            className={isFieldValid('currentAddress.street') ? 'border-green-500' : ''}
          />
          {errors.currentAddress?.street && (
            <p className="text-sm text-destructive">{errors.currentAddress.street.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city" className="flex items-center gap-2">
              City *
              <FieldValidationIndicator isValid={isFieldValid('currentAddress.city')} isTouched={!!touchedFields.currentAddress?.city} />
            </Label>
            <Input
              id="city"
              autoComplete="address-level2"
              {...register('currentAddress.city')}
              className={isFieldValid('currentAddress.city') ? 'border-green-500' : ''}
            />
            {errors.currentAddress?.city && (
              <p className="text-sm text-destructive">{errors.currentAddress.city.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="province">Province *</Label>
            <Select onValueChange={(value) => setValue('currentAddress.province', value, { shouldValidate: true })}>
              <SelectTrigger>
                <SelectValue placeholder="Select province" />
              </SelectTrigger>
              <SelectContent>
                {provinces.map(province => (
                  <SelectItem key={province} value={province}>{province}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="postalCode" className="flex items-center gap-2">
              Postal Code *
              <FieldValidationIndicator isValid={isFieldValid('currentAddress.postalCode')} isTouched={!!touchedFields.currentAddress?.postalCode} />
            </Label>
            <MaskedInput
              id="postalCode"
              maskType="postal"
              autoComplete="postal-code"
              {...register('currentAddress.postalCode')}
              className={isFieldValid('currentAddress.postalCode') ? 'border-green-500' : ''}
            />
            {errors.currentAddress?.postalCode && (
              <p className="text-sm text-destructive">{errors.currentAddress.postalCode.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="timeAtAddress">Time at Address *</Label>
          <Select onValueChange={(value) => setValue('currentAddress.timeAtAddress', value as any, { shouldValidate: true })}>
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
        </div>
      </div>

      {/* Housing Status */}
      <div className="space-y-3 pt-4">
        <Label>Housing Status *</Label>
        <RadioGroup onValueChange={(value) => setValue('housingStatus', value as any, { shouldValidate: true })}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="own" id="own" />
            <Label htmlFor="own" className="font-normal cursor-pointer">Own</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="rent" id="rent" />
            <Label htmlFor="rent" className="font-normal cursor-pointer">Rent</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="family" id="family" />
            <Label htmlFor="family" className="font-normal cursor-pointer">Living with Family</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="other" id="other" />
            <Label htmlFor="other" className="font-normal cursor-pointer">Other</Label>
          </div>
        </RadioGroup>
        {errors.housingStatus && (
          <p className="text-sm text-destructive">{errors.housingStatus.message}</p>
        )}

        <div className="space-y-2 pt-2">
          <Label htmlFor="monthlyHousingPayment">
            Monthly Housing Payment {housingStatus === 'family' ? '' : '*'}
          </Label>
          <Input
            id="monthlyHousingPayment"
            type="number"
            inputMode="decimal"
            step="50"
            disabled={housingStatus === 'family'}
            {...register('monthlyHousingPayment', { valueAsNumber: true })}
            className={isFieldValid('monthlyHousingPayment') ? 'border-green-500' : ''}
          />
          {errors.monthlyHousingPayment && (
            <p className="text-sm text-destructive">{errors.monthlyHousingPayment.message}</p>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <MobileFormNavigation
        onBack={handleBack}
        nextLabel="Continue to Employment"
        isNextDisabled={!isValid}
        className="sm:relative sm:bottom-auto sm:py-0 sm:px-0 sm:border-0 sm:shadow-none"
      />
    </form>
  );
}
