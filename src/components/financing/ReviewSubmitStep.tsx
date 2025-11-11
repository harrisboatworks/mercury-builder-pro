import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFinancing } from '@/contexts/FinancingContext';
import { consentSchema, completeApplicationSchema, type Consent } from '@/lib/financingValidation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { encryptSIN } from '@/lib/sinEncryption';
import { useNavigate } from 'react-router-dom';
import { Loader2, Check, Edit, ShieldCheck, FileText, CalendarCheck } from 'lucide-react';
import { useState } from 'react';
import { formatPhoneNumber } from '@/lib/validation';
import { SuccessConfetti } from './SuccessConfetti';

export function ReviewSubmitStep() {
  const { state, dispatch } = useFinancing();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors, isValid } } = useForm<Consent>({
    resolver: zodResolver(consentSchema),
    mode: 'onChange',
    defaultValues: {},
  });

  const creditCheckConsent = watch('creditCheckConsent');
  const accuracyConfirmation = watch('accuracyConfirmation');
  const termsAndPrivacy = watch('termsAgreement');
  const signature = watch('signature');

  const applicantFullName = state.applicant 
    ? [
        state.applicant.firstName,
        state.applicant.middleName,
        state.applicant.lastName
      ]
        .filter(Boolean) // Remove undefined/empty values
        .join(' ')       // Join with single spaces
        .trim()
    : '';

  const signatureMatches = signature?.toLowerCase().trim() === applicantFullName.toLowerCase().trim();

  const onSubmit = async (data: Consent) => {
    setIsSubmitting(true);
    try {
      // Set consent data
      dispatch({ type: 'SET_CONSENT', payload: data });
      dispatch({ type: 'COMPLETE_STEP', payload: 7 });

      // Compile complete application
      const completeApplication = {
        purchaseDetails: state.purchaseDetails!,
        applicant: state.applicant!,
        employment: state.employment!,
        financial: state.financial!,
        coApplicant: state.hasCoApplicant ? state.coApplicant : null,
        references: state.references!,
        consent: data,
      };

      // Validate with complete schema
      const validated = completeApplicationSchema.parse(completeApplication);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Save to database
      const { data: application, error } = await supabase
        .from('financing_applications')
        .upsert({
          id: state.applicationId || undefined,
          user_id: user?.id,
          quote_id: state.quoteId,
          purchase_data: validated.purchaseDetails,
          applicant_data: validated.applicant,
          employment_data: validated.employment,
          financial_data: validated.financial,
          co_applicant_data: validated.coApplicant,
          references_data: validated.references,
          status: 'pending',
          current_step: 7,
          completed_steps: [1, 2, 3, 4, 5, 6, 7],
          applicant_sin_encrypted: await encryptSIN(validated.applicant.sin),
          co_applicant_sin_encrypted: validated.coApplicant?.sin 
            ? await encryptSIN(validated.coApplicant.sin)
            : null,
        })
        .select()
        .single();

      // Send confirmation emails (non-blocking - don't fail submission if email fails)
      try {
        await supabase.functions.invoke('send-financing-confirmation-email', {
          body: {
            applicationId: application.id,
            email: validated.applicant.email,
            applicantName: `${validated.applicant.firstName} ${validated.applicant.lastName}`,
            motorInfo: validated.purchaseDetails.motorModel || 'Selected Motor',
            financingAmount: validated.purchaseDetails.amountToFinance,
            sendAdminNotification: true,
          }
        });
      } catch (emailError) {
        console.error('Failed to send confirmation email (non-critical):', emailError);
        // Don't show error to user - submission was successful
      }

      // Clear localStorage
      localStorage.removeItem('financing_application');

      // Trigger success confetti
      setShowConfetti(true);

      // Show success message
      toast({
        title: "Application Submitted!",
        description: "Your financing application has been submitted successfully.",
      });

      // Redirect to success page after a brief delay to show confetti
      setTimeout(() => {
        navigate(`/financing/success?id=${application.id}`);
      }, 1500);

    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Submission Failed",
        description: "Please check your information and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {showConfetti && <SuccessConfetti />}
      
      <Alert role="status">
        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        <AlertDescription>
          Please review your application carefully before submitting. You can edit any section by clicking the Edit button.
        </AlertDescription>
      </Alert>

      {/* Application Summary */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Application Summary</h3>
          
          <Accordion type="multiple" defaultValue={['purchase']} className="w-full">
            {/* Purchase Details */}
            <AccordionItem value="purchase">
              <AccordionTrigger>Purchase Details</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Motor:</span>
                    <span className="font-medium">{state.purchaseDetails?.motorModel || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Purchase Price:</span>
                    <span className="font-medium">${state.purchaseDetails?.motorPrice?.toLocaleString() || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Down Payment:</span>
                    <span className="font-medium">${state.purchaseDetails?.downPayment?.toLocaleString() || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount to Finance:</span>
                    <span className="font-medium">${state.purchaseDetails?.amountToFinance?.toLocaleString() || 'N/A'}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dispatch({ type: 'SET_CURRENT_STEP', payload: 1 })}
                    className="mt-2"
                  >
                    <Edit className="h-3 w-3 mr-1" /> Edit Step 1
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Personal Information */}
            <AccordionItem value="personal">
              <AccordionTrigger>Personal Information</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{applicantFullName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date of Birth:</span>
                    <span className="font-medium">{state.applicant?.dateOfBirth?.toString() || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-medium">{state.applicant?.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium">{state.applicant?.primaryPhone ? formatPhoneNumber(state.applicant.primaryPhone) : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Address:</span>
                    <span className="font-medium text-right">
                      {state.applicant?.currentAddress?.street}, {state.applicant?.currentAddress?.city}, {state.applicant?.currentAddress?.province}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dispatch({ type: 'SET_CURRENT_STEP', payload: 2 })}
                    className="mt-2"
                  >
                    <Edit className="h-3 w-3 mr-1" /> Edit Step 2
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Employment & Income */}
            <AccordionItem value="employment">
              <AccordionTrigger>Employment & Income</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-medium">{state.employment?.status || 'N/A'}</span>
                  </div>
                  {(state.employment?.status === 'employed' || state.employment?.status === 'self_employed') && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Employer:</span>
                        <span className="font-medium">{state.employment?.employerName || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Job Title:</span>
                        <span className="font-medium">{state.employment?.jobTitle || 'N/A'}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Annual Income:</span>
                    <span className="font-medium">${state.employment?.annualIncome?.toLocaleString() || 'N/A'}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dispatch({ type: 'SET_CURRENT_STEP', payload: 3 })}
                    className="mt-2"
                  >
                    <Edit className="h-3 w-3 mr-1" /> Edit Step 3
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Financial Information */}
            <AccordionItem value="financial">
              <AccordionTrigger>Financial Information</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Credit Score:</span>
                    <span className="font-medium">{state.financial?.creditScoreEstimate || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly Housing:</span>
                    <span className="font-medium">${state.financial?.monthlyHousingPayment?.toLocaleString() || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bank:</span>
                    <span className="font-medium">{state.financial?.bankName || 'N/A'}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dispatch({ type: 'SET_CURRENT_STEP', payload: 4 })}
                    className="mt-2"
                  >
                    <Edit className="h-3 w-3 mr-1" /> Edit Step 4
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Co-Applicant (if applicable) */}
            {state.hasCoApplicant && state.coApplicant && (
              <AccordionItem value="coapplicant">
                <AccordionTrigger>Co-Applicant</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">
                        {state.coApplicant.firstName} {state.coApplicant.lastName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Annual Income:</span>
                      <span className="font-medium">${state.coApplicant.annualIncome?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dispatch({ type: 'SET_CURRENT_STEP', payload: 5 })}
                      className="mt-2"
                    >
                      <Edit className="h-3 w-3 mr-1" /> Edit Step 5
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* References */}
            <AccordionItem value="references">
              <AccordionTrigger>References</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="font-medium mb-1">Reference #1</p>
                    <div className="space-y-1 pl-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span>{state.references?.reference1.fullName || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Relationship:</span>
                        <span>{state.references?.reference1.relationship || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Reference #2</p>
                    <div className="space-y-1 pl-4">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span>{state.references?.reference2.fullName || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Relationship:</span>
                        <span>{state.references?.reference2.relationship || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dispatch({ type: 'SET_CURRENT_STEP', payload: 6 })}
                    className="mt-2"
                  >
                    <Edit className="h-3 w-3 mr-1" /> Edit Step 6
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      {/* Consent Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Authorization & Consent
            </h3>

            {/* Credit Check Consent */}
            <div className="flex items-start space-x-3">
              <Checkbox
                id="creditCheckConsent"
                {...register('creditCheckConsent')}
                onCheckedChange={(checked) => setValue('creditCheckConsent', checked as boolean)}
              />
              <div className="space-y-1">
                <Label htmlFor="creditCheckConsent" className="font-medium cursor-pointer">
                  Credit Check Authorization *
                </Label>
                <p className="text-sm text-muted-foreground">
                  I authorize the company to obtain my credit report and verify information provided in this application.
                </p>
              </div>
            </div>

            {/* Accuracy Confirmation */}
            <div className="flex items-start space-x-3">
              <Checkbox
                id="accuracyConfirmation"
                {...register('accuracyConfirmation')}
                onCheckedChange={(checked) => setValue('accuracyConfirmation', checked as boolean)}
              />
              <div className="space-y-1">
                <Label htmlFor="accuracyConfirmation" className="font-medium cursor-pointer">
                  Accuracy Confirmation *
                </Label>
                <p className="text-sm text-muted-foreground">
                  I confirm that all information provided is true and accurate to the best of my knowledge.
                </p>
              </div>
            </div>

            {/* Terms & Privacy */}
            <div className="flex items-start space-x-3">
              <Checkbox
                id="termsAndPrivacy"
                {...register('termsAgreement')}
                onCheckedChange={(checked) => setValue('termsAgreement', checked as boolean)}
              />
              <div className="space-y-1">
                <Label htmlFor="termsAndPrivacy" className="font-medium cursor-pointer">
                  Terms & Privacy Policy *
                </Label>
                <p className="text-sm text-muted-foreground">
                  I have read and agree to the Terms of Service and Privacy Policy.
                </p>
              </div>
            </div>

            {errors.creditCheckConsent && <p className="text-sm text-destructive">{errors.creditCheckConsent.message}</p>}
            {errors.accuracyConfirmation && <p className="text-sm text-destructive">{errors.accuracyConfirmation.message}</p>}
            {errors.termsAgreement && <p className="text-sm text-destructive">{errors.termsAgreement.message}</p>}
          </CardContent>
        </Card>

        {/* Digital Signature */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CalendarCheck className="h-5 w-5" />
              Your Signature
            </h3>

            <Alert>
              <AlertDescription>
                By typing your full name below, you electronically sign this application.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="signature">Full Name (as signature) *</Label>
              <div className="relative">
                <Input
                  id="signature"
                  {...register('signature')}
                  placeholder="Type your full name"
                  className={errors.signature ? 'border-destructive' : ''}
                />
                {signatureMatches && signature && (
                  <Check className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Must match: <span className="font-medium">{applicantFullName}</span>
              </p>
              {signature && !signatureMatches && (
                <p className="text-sm text-destructive">Signature must match your name</p>
              )}
              {errors.signature && <p className="text-sm text-destructive">{errors.signature.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                value={new Date().toLocaleDateString()}
                disabled
                className="bg-muted"
              />
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => dispatch({ type: 'SET_CURRENT_STEP', payload: 6 })}
            disabled={isSubmitting}
          >
            ← Back
          </Button>
          <Button
            type="submit"
            disabled={!creditCheckConsent || !accuracyConfirmation || !termsAndPrivacy || !signatureMatches || isSubmitting}
            className="min-w-[180px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Application →'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
