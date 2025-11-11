import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFinancing } from '@/contexts/FinancingContext';
import { referencesSchema, type References } from '@/lib/financingValidation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, UserCheck, Users } from 'lucide-react';
import { MaskedInput } from './MaskedInput';
import { FormErrorMessage, FieldValidationIndicator } from './FormErrorMessage';
import { MobileFormNavigation } from './MobileFormNavigation';

export function ReferencesStep() {
  const { state, dispatch } = useFinancing();

  const { register, handleSubmit, watch, setValue, control, formState: { errors, isValid, touchedFields } } = useForm<References>({
    resolver: zodResolver(referencesSchema),
    mode: 'onChange',
    defaultValues: state.references || {},
  });

  const onSubmit = (data: References) => {
    dispatch({ type: 'SET_REFERENCES', payload: data });
    dispatch({ type: 'COMPLETE_STEP', payload: 6 });
    dispatch({ type: 'SET_CURRENT_STEP', payload: 7 });
  };

  const handleBack = () => {
    dispatch({ type: 'SET_CURRENT_STEP', payload: 5 });
  };

  const reference1Phone = watch('reference1.phone');
  const reference2Phone = watch('reference2.phone');

  return (
    <div className="space-y-6">
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription className="font-light">
          Please provide 2 personal references who have known you for at least 1 year (cannot be relatives or co-applicant).
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Reference 1 */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Reference #1
            </h3>

            <div className="space-y-2">
              <Label htmlFor="ref1-fullName">Full Name *</Label>
              <div className="relative">
                <Input
                  id="ref1-fullName"
                  {...register('reference1.fullName')}
                  autoComplete="name"
                  className="pr-10"
                />
                <FieldValidationIndicator 
                  isValid={!errors.reference1?.fullName && !!watch('reference1.fullName')}
                  isTouched={touchedFields.reference1?.fullName}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                />
              </div>
              <FormErrorMessage error={errors.reference1?.fullName?.message} field="Full name" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ref1-relationship">Relationship *</Label>
              <Select
                value={watch('reference1.relationship')}
                onValueChange={(value) => setValue('reference1.relationship', value, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Friend">Friend</SelectItem>
                  <SelectItem value="Colleague">Colleague</SelectItem>
                  <SelectItem value="Neighbor">Neighbor</SelectItem>
                  <SelectItem value="Former Employer">Former Employer</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormErrorMessage error={errors.reference1?.relationship?.message} field="Relationship" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ref1-phone">Phone Number *</Label>
              <div className="relative">
                <Controller
                  name="reference1.phone"
                  control={control}
                  render={({ field }) => (
                    <MaskedInput
                      id="ref1-phone"
                      maskType="phone"
                      inputMode="tel"
                      autoComplete="tel"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      className="pr-10"
                    />
                  )}
                />
                <FieldValidationIndicator 
                  isValid={!errors.reference1?.phone && !!watch('reference1.phone')}
                  isTouched={touchedFields.reference1?.phone}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                />
              </div>
              <FormErrorMessage error={errors.reference1?.phone?.message} field="Phone number" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ref1-howLongKnown">How long have you known them? *</Label>
              <Select
                value={watch('reference1.howLongKnown')}
                onValueChange={(value) => setValue('reference1.howLongKnown', value as any, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-3">1-3 years</SelectItem>
                  <SelectItem value="3-5">3-5 years</SelectItem>
                  <SelectItem value="5-10">5-10 years</SelectItem>
                  <SelectItem value="10+">10+ years</SelectItem>
                </SelectContent>
              </Select>
              <FormErrorMessage error={errors.reference1?.howLongKnown?.message} field="Duration" />
            </div>
          </CardContent>
        </Card>

        {/* Reference 2 */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Reference #2
            </h3>

            <div className="space-y-2">
              <Label htmlFor="ref2-fullName">Full Name *</Label>
              <div className="relative">
                <Input
                  id="ref2-fullName"
                  {...register('reference2.fullName')}
                  autoComplete="name"
                  className="pr-10"
                />
                <FieldValidationIndicator 
                  isValid={!errors.reference2?.fullName && !!watch('reference2.fullName')}
                  isTouched={touchedFields.reference2?.fullName}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                />
              </div>
              <FormErrorMessage error={errors.reference2?.fullName?.message} field="Full name" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ref2-relationship">Relationship *</Label>
              <Select
                value={watch('reference2.relationship')}
                onValueChange={(value) => setValue('reference2.relationship', value, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Friend">Friend</SelectItem>
                  <SelectItem value="Colleague">Colleague</SelectItem>
                  <SelectItem value="Neighbor">Neighbor</SelectItem>
                  <SelectItem value="Former Employer">Former Employer</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormErrorMessage error={errors.reference2?.relationship?.message} field="Relationship" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ref2-phone">Phone Number *</Label>
              <div className="relative">
                <Controller
                  name="reference2.phone"
                  control={control}
                  render={({ field }) => (
                    <MaskedInput
                      id="ref2-phone"
                      maskType="phone"
                      inputMode="tel"
                      autoComplete="tel"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      className="pr-10"
                    />
                  )}
                />
                <FieldValidationIndicator 
                  isValid={!errors.reference2?.phone && !!watch('reference2.phone')}
                  isTouched={touchedFields.reference2?.phone}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                />
              </div>
              <FormErrorMessage error={errors.reference2?.phone?.message} field="Phone number" />
              {reference1Phone && reference2Phone && reference1Phone === reference2Phone && (
                <FormErrorMessage error="References must be different people" />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ref2-howLongKnown">How long have you known them? *</Label>
              <Select
                value={watch('reference2.howLongKnown')}
                onValueChange={(value) => setValue('reference2.howLongKnown', value as any, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-3">1-3 years</SelectItem>
                  <SelectItem value="3-5">3-5 years</SelectItem>
                  <SelectItem value="5-10">5-10 years</SelectItem>
                  <SelectItem value="10+">10+ years</SelectItem>
                </SelectContent>
              </Select>
              <FormErrorMessage error={errors.reference2?.howLongKnown?.message} field="Duration" />
            </div>
          </CardContent>
        </Card>

        <MobileFormNavigation
          onBack={handleBack}
          onNext={handleSubmit(onSubmit)}
          nextLabel="Continue to Review"
          isNextDisabled={!isValid}
        />
      </form>
    </div>
  );
}
