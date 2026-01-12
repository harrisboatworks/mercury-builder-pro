import { useState } from 'react';
import { useFinancing } from '@/contexts/FinancingContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Check, Copy } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface SaveForLaterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaveForLaterDialog({ open, onOpenChange }: SaveForLaterDialogProps) {
  const { state, saveToDatabase } = useFinancing();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [email, setEmail] = useState(state.applicant?.email || '');
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resumeUrl, setResumeUrl] = useState('');

  const handleSendEmail = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    
    try {
      console.log('📧 [SaveForLater] Starting save and email process...');
      
      // Save to database and get IDs directly (avoids race condition)
      let savedData = await saveToDatabase();
      console.log('📧 [SaveForLater] saveToDatabase returned:', savedData);
      
      // Fallback: If savedData is undefined, try to fetch the most recent application
      if (!savedData?.applicationId || !savedData?.resumeToken) {
        console.log('⚠️ [SaveForLater] savedData is incomplete, attempting fallback query...');
        
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: recentApp, error: fetchError } = await supabase
            .from('financing_applications')
            .select('id, resume_token')
            .eq('user_id', user.id)
            .eq('status', 'draft')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          if (!fetchError && recentApp) {
            console.log('✅ [SaveForLater] Fallback successful, found application:', recentApp.id);
            savedData = {
              applicationId: recentApp.id,
              resumeToken: recentApp.resume_token
            };
          } else {
            console.error('❌ [SaveForLater] Fallback failed:', fetchError);
          }
        }
      }
      
      // Final check - if still no data, show error
      if (!savedData?.applicationId || !savedData?.resumeToken) {
        console.error('❌ [SaveForLater] Unable to retrieve application data after save and fallback');
        toast({
          title: "Error",
          description: "Failed to save application. Please try again.",
          variant: "destructive",
        });
        setIsSending(false);
        return;
      }

      // Generate resume URL using returned values
      const resumeLink = `${window.location.origin}/financing/resume?token=${savedData.resumeToken}`;
      setResumeUrl(resumeLink);
      console.log('📧 [SaveForLater] Resume link generated:', resumeLink);
      
      // Send the resume email with proper error handling
      console.log('📧 [SaveForLater] Invoking send-financing-resume-email edge function...');
      const { data: emailResponse, error: emailError } = await supabase.functions.invoke('send-financing-resume-email', {
        body: {
          applicationId: savedData.applicationId,
          email: email,
          applicantName: state.applicant 
            ? `${state.applicant.firstName} ${state.applicant.lastName}`
            : undefined,
          completedSteps: state.completedSteps.length,
        }
      });

      console.log('📧 [SaveForLater] Edge function response:', { emailResponse, emailError });

      // Check if email sending failed
      if (emailError) {
        console.error('❌ [SaveForLater] Email send failed:', emailError);
        toast({
          title: "Application Saved",
          description: "Application saved, but email failed to send. Please copy the link below.",
          variant: "destructive",
        });
        setEmailSent(true); // Still show the link so user can copy it
        return;
      }

      // Check for edge function errors in the response
      if (emailResponse?.error) {
        console.error('❌ [SaveForLater] Email delivery error:', emailResponse.error);
        toast({
          title: "Application Saved",
          description: "Application saved, but email failed to send. Please copy the link below.",
          variant: "destructive",
        });
        setEmailSent(true); // Still show the link so user can copy it
        return;
      }

      // Success - email was sent
      console.log('✅ [SaveForLater] Email sent successfully');
      setEmailSent(true);
      
      toast({
        title: "Application saved!",
        description: "Check your email for the resume link, or copy it below.",
      });
    } catch (error) {
      console.error('❌ [SaveForLater] Unexpected error:', error);
      toast({
        title: "Failed to save application",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyLink = () => {
    if (resumeUrl) {
      navigator.clipboard.writeText(resumeUrl);
      toast({
        title: "Link Copied!",
        description: "Resume link copied to clipboard.",
      });
    }
  };

  const handleClose = () => {
    setEmailSent(false);
    setResumeUrl('');
    onOpenChange(false);
  };

  // Shared header content
  const headerContent = (
    <>
      <div className="flex items-center gap-2">
        {emailSent ? (
          <>
            <Check className="h-5 w-5 text-green-500" />
            Email Sent!
          </>
        ) : (
          <>
            <Mail className="h-5 w-5" />
            Save & Continue Later
          </>
        )}
      </div>
    </>
  );

  const headerDescription = emailSent 
    ? "We've sent you an email with a link to resume your application."
    : "Enter your email to receive a link to continue this application later.";

  // Shared form content
  const formContent = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="your.email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSending}
        />
      </div>

      <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
        <p><strong>Progress saved:</strong> {state.completedSteps.length} of 7 steps</p>
        <p className="mt-1">Your link will be valid for 30 days.</p>
      </div>
    </div>
  );

  // Shared success content
  const successContent = (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
        <p className="text-green-800">
          {email === 'harrisboatworks@hotmail.com' ? (
            <>We've sent a resume link to <strong>{email}</strong>.</>
          ) : (
            <>
              We've sent a <strong>test email</strong> to{' '}
              <strong>harrisboatworks@hotmail.com</strong> (intended for: {email})
            </>
          )}
        </p>
      </div>

      <div className="space-y-2">
        <Label>Or copy the link directly:</Label>
        <div className="flex gap-2">
          <Input
            value={resumeUrl}
            readOnly
            className="text-sm"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopyLink}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  // Shared form buttons
  const formButtons = (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={handleClose}
        disabled={isSending}
        className="flex-1"
      >
        Cancel
      </Button>
      <Button
        onClick={handleSendEmail}
        disabled={isSending || !email}
        className="flex-1"
      >
        {isSending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Mail className="mr-2 h-4 w-4" />
            Email Me a Link
          </>
        )}
      </Button>
    </div>
  );

  // Mobile: Bottom drawer
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleClose}>
        <DrawerContent className="px-4 pb-8">
          <DrawerHeader className="text-left">
            <DrawerTitle>{headerContent}</DrawerTitle>
            <DrawerDescription>{headerDescription}</DrawerDescription>
          </DrawerHeader>

          <div className="px-4">
            {!emailSent ? formContent : successContent}
          </div>

          <DrawerFooter className="pt-4">
            {!emailSent ? (
              formButtons
            ) : (
              <Button onClick={handleClose} className="w-full">
                Close
              </Button>
            )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Centered dialog
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{headerContent}</DialogTitle>
          <DialogDescription>{headerDescription}</DialogDescription>
        </DialogHeader>

        {!emailSent ? (
          <div className="space-y-4">
            {formContent}
            {formButtons}
          </div>
        ) : (
          <div className="space-y-4">
            {successContent}
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
