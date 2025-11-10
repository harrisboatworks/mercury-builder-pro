import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFinancing } from '@/contexts/FinancingContext';
import { referencesSchema, type References } from '@/lib/financingValidation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, UserCheck, Users, Check } from 'lucide-react';

export function ReferencesStep() {
  const { state, dispatch } = useFinancing();

  const { register, handleSubmit, watch, setValue, formState: { errors, isValid } } = useForm<References>({
    resolver: zodResolver(referencesSchema),
    mode: 'onChange',
    defaultValues: state.references || {},
  });

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const onSubmit = (data: References) => {
    dispatch({ type: 'SET_REFERENCES', payload: data });
    dispatch({ type: 'COMPLETE_STEP', payload: 6 });
    dispatch({ type: 'SET_CURRENT_STEP', payload: 7 });
  };

  const reference1Phone = watch('reference1.phone');
  const reference2Phone = watch('reference2.phone');

  return (
    <div className="space-y-6">
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
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
                  className={errors.reference1?.fullName ? 'border-destructive' : ''}
                />
                {watch('reference1.fullName') && !errors.reference1?.fullName && (
                  <Check className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                )}
              </div>
              {errors.reference1?.fullName && (
                <p className="text-sm text-destructive">{errors.reference1.fullName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ref1-relationship">Relationship *</Label>
              <Select
                {...register('reference1.relationship')}
                onValueChange={(value) => setValue('reference1.relationship', value)}
              >
                <SelectTrigger className={errors.reference1?.relationship ? 'border-destructive' : ''}>
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
              {errors.reference1?.relationship && (
                <p className="text-sm text-destructive">{errors.reference1.relationship.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ref1-phone">Phone Number *</Label>
              <div className="relative">
                <Input
                  id="ref1-phone"
                  type="tel"
                  inputMode="tel"
                  {...register('reference1.phone')}
                  onChange={(e) => {
                    const formatted = formatPhone(e.target.value);
                    setValue('reference1.phone', formatted);
                  }}
                  placeholder="(XXX) XXX-XXXX"
                  maxLength={14}
                  className={errors.reference1?.phone ? 'border-destructive' : ''}
                />
                {watch('reference1.phone') && !errors.reference1?.phone && (
                  <Check className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                )}
              </div>
              {errors.reference1?.phone && (
                <p className="text-sm text-destructive">{errors.reference1.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ref1-howLongKnown">How long have you known them? *</Label>
              <Select
                {...register('reference1.howLongKnown')}
                onValueChange={(value) => setValue('reference1.howLongKnown', value as any)}
              >
                <SelectTrigger className={errors.reference1?.howLongKnown ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-3">1-3 years</SelectItem>
                  <SelectItem value="3-5">3-5 years</SelectItem>
                  <SelectItem value="5-10">5-10 years</SelectItem>
                  <SelectItem value="10+">10+ years</SelectItem>
                </SelectContent>
              </Select>
              {errors.reference1?.howLongKnown && (
                <p className="text-sm text-destructive">{errors.reference1.howLongKnown.message}</p>
              )}
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
                  className={errors.reference2?.fullName ? 'border-destructive' : ''}
                />
                {watch('reference2.fullName') && !errors.reference2?.fullName && (
                  <Check className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                )}
              </div>
              {errors.reference2?.fullName && (
                <p className="text-sm text-destructive">{errors.reference2.fullName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ref2-relationship">Relationship *</Label>
              <Select
                {...register('reference2.relationship')}
                onValueChange={(value) => setValue('reference2.relationship', value)}
              >
                <SelectTrigger className={errors.reference2?.relationship ? 'border-destructive' : ''}>
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
              {errors.reference2?.relationship && (
                <p className="text-sm text-destructive">{errors.reference2.relationship.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ref2-phone">Phone Number *</Label>
              <div className="relative">
                <Input
                  id="ref2-phone"
                  type="tel"
                  inputMode="tel"
                  {...register('reference2.phone')}
                  onChange={(e) => {
                    const formatted = formatPhone(e.target.value);
                    setValue('reference2.phone', formatted);
                  }}
                  placeholder="(XXX) XXX-XXXX"
                  maxLength={14}
                  className={errors.reference2?.phone ? 'border-destructive' : ''}
                />
                {watch('reference2.phone') && !errors.reference2?.phone && (
                  <Check className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                )}
              </div>
              {errors.reference2?.phone && (
                <p className="text-sm text-destructive">{errors.reference2.phone.message}</p>
              )}
              {reference1Phone && reference2Phone && reference1Phone === reference2Phone && (
                <p className="text-sm text-destructive">References must be different people</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ref2-howLongKnown">How long have you known them? *</Label>
              <Select
                {...register('reference2.howLongKnown')}
                onValueChange={(value) => setValue('reference2.howLongKnown', value as any)}
              >
                <SelectTrigger className={errors.reference2?.howLongKnown ? 'border-destructive' : ''}>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-3">1-3 years</SelectItem>
                  <SelectItem value="3-5">3-5 years</SelectItem>
                  <SelectItem value="5-10">5-10 years</SelectItem>
                  <SelectItem value="10+">10+ years</SelectItem>
                </SelectContent>
              </Select>
              {errors.reference2?.howLongKnown && (
                <p className="text-sm text-destructive">{errors.reference2.howLongKnown.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => dispatch({ type: 'SET_CURRENT_STEP', payload: 5 })}
          >
            ← Back
          </Button>
          <Button type="submit" disabled={!isValid}>
            Continue to Review →
          </Button>
        </div>
      </form>
    </div>
  );
}
