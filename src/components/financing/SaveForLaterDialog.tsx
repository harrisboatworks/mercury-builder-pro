import { useState } from 'react';
import { useFinancing } from '@/contexts/FinancingContext';
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
  const [emailDelivered, setEmailDelivered] = useState(false);
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
      
      // The server stores the draft and sends the private resume link in one
      // operation, so anonymous applicants never need direct database access.
      const savedData = await saveToDatabase(email);
      console.log('📧 [SaveForLater] saveToDatabase returned:', savedData);

      setResumeUrl(savedData.resumeUrl);
      setEmailSent(true);
      setEmailDelivered(savedData.emailSent);
      if (!savedData.emailSent) {
        toast({
          title: "Application Saved",
          description: "Application saved, but email failed to send. Please copy the link below.",
          variant: "destructive",
        });
        return;
      }

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
    setEmailDelivered(false);
    setResumeUrl('');
    onOpenChange(false);
  };

  // Shared header content
  const headerContent = (
    <>
      <div className="flex items-center gap-2">
        {emailSent ? (
          <>
            <Check className="h-5 w-5 text-repower-gold" />
            {emailDelivered ? 'Link emailed' : 'Application saved'}
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
    ? emailDelivered
      ? "Your private resume link is on its way."
      : "Copy the private link below so you can return later."
    : "Enter your email to receive a link to continue this application later.";

  // Shared form content
  const formContent = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="font-sans text-repower-navy-900">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="your.email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSending}
          className="h-12 rounded-sm border-repower-navy-900/15 focus-visible:ring-repower-gold"
        />
      </div>

      <div className="rounded-sm border border-repower-gold/35 bg-repower-cream p-4 font-sans text-[13px] text-repower-navy-900/70">
        <p><strong className="text-repower-navy-900">Progress saved:</strong> {state.completedSteps.length} of 7 steps</p>
        <p className="mt-1">The link is valid for 30 days. Your SIN is excluded from the saved draft.</p>
      </div>
    </div>
  );

  // Shared success content
  const successContent = (
    <div className="space-y-4">
      <div className="rounded-sm border border-repower-gold/35 bg-repower-cream p-4 font-sans text-[13px]">
        <p className="text-repower-navy-900/75">
          {emailDelivered
            ? <>A private resume link was sent to <strong className="text-repower-navy-900">{email}</strong>.</>
            : <>Email delivery did not complete, but your application is saved. Copy the private link below.</>}
        </p>
      </div>

      <div className="space-y-2">
        <Label className="font-sans text-repower-navy-900">Private resume link</Label>
        <div className="flex gap-2">
          <Input
            value={resumeUrl}
            readOnly
            className="h-11 rounded-sm border-repower-navy-900/15 text-sm"
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
        className="h-12 flex-1 rounded-none border-repower-navy-900/20 bg-white font-sans text-[12px] font-bold uppercase tracking-[0.1em] text-repower-navy-900"
      >
        Cancel
      </Button>
      <Button
        onClick={handleSendEmail}
        disabled={isSending || !email}
        className="h-12 flex-1 rounded-none bg-repower-mercury-red font-sans text-[12px] font-bold uppercase tracking-[0.1em] text-white hover:bg-repower-mercury-red-deep"
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
        <DrawerContent className="border-repower-navy-900/10 bg-repower-paper px-4 pb-8 text-repower-navy-900">
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
              <Button onClick={handleClose} className="h-12 w-full rounded-none bg-repower-navy-900 font-bold uppercase tracking-[0.1em] text-white">
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
      <DialogContent className="rounded-sm border-repower-navy-900/10 bg-repower-paper p-6 text-repower-navy-900 shadow-2xl sm:max-w-lg">
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
            <Button onClick={handleClose} className="h-12 w-full rounded-none bg-repower-navy-900 font-bold uppercase tracking-[0.1em] text-white">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
