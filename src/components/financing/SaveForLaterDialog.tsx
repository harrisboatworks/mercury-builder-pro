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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Check, Copy } from 'lucide-react';

interface SaveForLaterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaveForLaterDialog({ open, onOpenChange }: SaveForLaterDialogProps) {
  const { state } = useFinancing();
  const { toast } = useToast();
  const [email, setEmail] = useState(state.applicant?.email || '');
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resumeUrl, setResumeUrl] = useState('');

  const handleSendEmail = async () => {
    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      // Make sure application is saved to database first
      if (!state.applicationId) {
        toast({
          title: "Error",
          description: "Application ID not found. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Get applicant name
      const applicantName = state.applicant 
        ? `${state.applicant.firstName} ${state.applicant.lastName}`
        : undefined;

      // Call edge function to send email
      const { error } = await supabase.functions.invoke('send-financing-resume-email', {
        body: {
          applicationId: state.applicationId,
          email: email,
          applicantName: applicantName,
          completedSteps: state.completedSteps.length,
        },
      });

      if (error) throw error;

      // Generate resume URL for display
      const url = `${window.location.origin}/financing/resume?token=${state.applicationId}`;
      setResumeUrl(url);
      setEmailSent(true);

      toast({
        title: "Email Sent!",
        description: "Check your inbox for a link to resume your application.",
      });

    } catch (error) {
      console.error('Error sending resume email:', error);
      toast({
        title: "Failed to Send Email",
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
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
          </DialogTitle>
          <DialogDescription>
            {emailSent 
              ? "We've sent you an email with a link to resume your application."
              : "Enter your email to receive a link to continue this application later."
            }
          </DialogDescription>
        </DialogHeader>

        {!emailSent ? (
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
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
              <p className="text-green-800">
                We've sent an email to <strong>{email}</strong> with your resume link.
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

            <Button
              onClick={handleClose}
              className="w-full"
            >
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
