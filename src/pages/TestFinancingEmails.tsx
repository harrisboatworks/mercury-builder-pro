import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TestFinancingEmails = () => {
  const [isSendingResume, setIsSendingResume] = useState(false);
  const [isSendingConfirmation, setIsSendingConfirmation] = useState(false);
  const [email, setEmail] = useState("harrisboatworks@hotmail.com");
  const { toast } = useToast();

  const handleTestResumeEmail = async () => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter an email address",
      });
      return;
    }

    setIsSendingResume(true);
    try {
      // Step 1: Create a test application in the database with a resume token
      const testResumeToken = `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      const { data: appData, error: appError } = await supabase
        .from('financing_applications')
        .insert({
          applicant_data: {
            email: email,
            firstName: 'Test',
            lastName: 'Applicant',
            phone: '555-0123'
          },
          purchase_data: {
            motorModel: 'Mercury 115HP FourStroke',
            estimatedPrice: 12500
          },
          employment_data: {},
          financial_data: {},
          references_data: {},
          current_step: 3,
          completed_steps: [1, 2, 3],
          status: 'draft',
          resume_token: testResumeToken,
          resume_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
        .select('id')
        .single();

      if (appError) {
        console.error('Error creating test application:', appError);
        throw new Error('Failed to create test application: ' + appError.message);
      }

      console.log('Test application created:', appData);

      // Step 2: Send the resume email using the real application ID
      const { data, error } = await supabase.functions.invoke('send-financing-resume-email', {
        body: {
          applicationId: appData.id,
          email: email,
          applicantName: 'Test Applicant',
          completedSteps: 3,
        }
      });

      if (error) throw error;

      toast({
        title: "Resume Email Sent!",
        description: `Check ${email} for the resume link email. Test application ID: ${appData.id}`,
      });

      // Step 3: Clean up - delete the test application after a delay
      setTimeout(async () => {
        await supabase
          .from('financing_applications')
          .delete()
          .eq('id', appData.id);
        console.log('Test application cleaned up');
      }, 5000);

    } catch (error: any) {
      console.error('Error sending resume email:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send resume email",
      });
    } finally {
      setIsSendingResume(false);
    }
  };

  const handleTestConfirmationEmail = async () => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter an email address",
      });
      return;
    }

    setIsSendingConfirmation(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-financing-confirmation-email', {
        body: {
          email: email,
          applicantName: 'Test Applicant',
          referenceNumber: 'FIN-TEST-123456',
          motorDetails: 'Mercury 115HP FourStroke',
          amountFinanced: 12500,
          sendAdminNotification: true,
        }
      });

      if (error) throw error;

      toast({
        title: "Confirmation Email Sent!",
        description: `Check ${email} for the confirmation email. Admin notification also sent.`,
      });
    } catch (error: any) {
      console.error('Error sending confirmation email:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send confirmation email",
      });
    } finally {
      setIsSendingConfirmation(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Test Financing Emails
          </CardTitle>
          <CardDescription>
            Test both financing email functions to verify Resend integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">1. Resume Application Email</h3>
              <p className="text-sm text-muted-foreground">
                Tests the "Save & Continue Later" email with a resume link
              </p>
              <Button
                onClick={handleTestResumeEmail}
                disabled={isSendingResume || !email}
                className="w-full"
              >
                {isSendingResume ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Resume Email...
                  </>
                ) : (
                  "Test Resume Email"
                )}
              </Button>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">2. Confirmation Email</h3>
              <p className="text-sm text-muted-foreground">
                Tests the submission confirmation email (applicant + admin notification)
              </p>
              <Button
                onClick={handleTestConfirmationEmail}
                disabled={isSendingConfirmation || !email}
                className="w-full"
                variant="secondary"
              >
                {isSendingConfirmation ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Confirmation Email...
                  </>
                ) : (
                  "Test Confirmation Email"
                )}
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t space-y-2">
            <p className="text-sm font-semibold">What to verify:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Email arrives in inbox (check spam folder)</li>
              <li>All text renders correctly on desktop and mobile</li>
              <li>Resume link works and navigates to application</li>
              <li>Confirmation email has correct formatting and details</li>
              <li>Admin notification email arrives (check jayharris97@gmail.com)</li>
            </ul>
            
            <div className="pt-2">
              <p className="text-sm font-semibold">Check edge function logs:</p>
              <a 
                href="https://supabase.com/dashboard/project/eutsoqdpjurknjsshxes/functions/send-financing-resume-email/logs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline block"
              >
                Resume Email Logs →
              </a>
              <a 
                href="https://supabase.com/dashboard/project/eutsoqdpjurknjsshxes/functions/send-financing-confirmation-email/logs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline block"
              >
                Confirmation Email Logs →
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestFinancingEmails;
