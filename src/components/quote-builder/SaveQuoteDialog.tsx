import { RequiredMark } from "@/components/ui/required-mark";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, Mail } from "lucide-react";
import { saveLead } from "@/lib/leadCapture";
import { trackAgentEvent } from "@/lib/agentEvents";
import { trackLeadConversion } from "@/lib/analytics";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { SITE_URL } from '@/lib/site';
import { Link } from 'react-router-dom';
import { useIsMobile } from "@/hooks/use-mobile";

interface SaveQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quoteData: any;
  motorModel?: string;
  finalPrice?: number;
  canSave?: () => boolean;
}

export function SaveQuoteDialog({ 
  open, 
  onOpenChange, 
  quoteData,
  motorModel,
  finalPrice,
  canSave
}: SaveQuoteDialogProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [accountLinkSent, setAccountLinkSent] = useState(false);
  const [savedQuoteUrl, setSavedQuoteUrl] = useState('');
  const [authError, setAuthError] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const [emailError, setEmailError] = useState("");
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const handleSave = async () => {
    if (canSave && !canSave()) {
      toast({ title: "Quote pricing changed", description: "Please refresh the quote before saving.", variant: "destructive" });
      return;
    }
    // Block save if no motor selected
    if (!quoteData?.selectedMotor && !quoteData?.motor) {
      toast({
        title: "No motor selected",
        description: "Please select a motor before saving your quote.",
        variant: "destructive",
      });
      return;
    }

    // Clear previous errors
    setEmailError("");
    setNameError("");
    setPhoneError("");
    
    let hasError = false;

    if (!name.trim()) {
      setNameError("Name is required");
      hasError = true;
    }

    if (!email.trim()) {
      setEmailError("Email address is required");
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError("Please enter a valid email address");
      hasError = true;
    }

    const phoneDigits = phone.replace(/\D/g, '');
    if (phone.trim() && (!/^[+()\d\s.-]+$/.test(phone.trim()) || !/^1?\d{10}$/.test(phoneDigits))) {
      setPhoneError("Please enter a 10-digit phone number, optionally starting with 1");
      hasError = true;
    }

    if (hasError) return;
    const contactPhone = phoneDigits ? `+${phoneDigits.length === 10 ? '1' : ''}${phoneDigits}` : undefined;

    setIsLoading(true);

    try {
      // Save lead to database
      const leadRecord = await saveLead({
        motor_model: motorModel,
        motor_hp: quoteData.selectedMotor?.hp,
        base_price: quoteData.selectedMotor?.msrp,
        final_price: finalPrice,
        customer_name: name.trim(),
        customer_email: email.trim(),
        customer_phone: contactPhone,
        lead_status: "downloaded",
        lead_source: "pdf_download",
        quote_data: quoteData,
      });

      // Save complete quote state to saved_quotes table for full restoration
      // Generate cryptographically secure resume token
      const tokenArray = new Uint8Array(24);
      crypto.getRandomValues(tokenArray);
      const resumeToken = `quote_${Array.from(tokenArray, b => b.toString(16).padStart(2, '0')).join('')}`;
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      // Anonymous visitors may INSERT saved_quotes but cannot SELECT the
      // row back under RLS. Generate the UUID client-side so a successful
      // insert is enough to bind the resumable quote without requesting a
      // representation that the SELECT policy correctly blocks.
      const savedQuoteId = crypto.randomUUID();
      localStorage.removeItem('current_saved_quote_id');
      const { error: savedQuoteError } = await supabase
        .from('saved_quotes')
        .insert({
          id: savedQuoteId,
          email: email.trim(),
          resume_token: resumeToken,
          quote_state: quoteData, // Full QuoteContext state
          user_id: user?.id || null, // Link to user if logged in
          expires_at: expiresAt.toISOString(),
        });

      if (savedQuoteError) {
        console.error('Error saving quote state:', savedQuoteError);
        throw savedQuoteError;
      }

      // Store saved quote ID for QR code generation
      localStorage.setItem('current_saved_quote_id', savedQuoteId);
      setSavedQuoteUrl(`/quote/saved/${savedQuoteId}`);

      // Analytics: quote_saved + lead_submitted
      trackAgentEvent({
        event_type: 'quote_saved',
        motor_model: motorModel ?? null,
        quote_value: finalPrice ?? null,
        metadata: { has_phone: !!phone, has_name: !!name },
      });
      trackAgentEvent({
        event_type: 'lead_submitted',
        motor_model: motorModel ?? null,
        quote_value: finalPrice ?? null,
        metadata: { source: 'save_quote_dialog' },
      });

      // Account access is optional; the saved quote link works without sign-in.
      let didSendAccountLink = false;
      if (!user) {
        const siteUrl = window.location.origin;
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: {
            emailRedirectTo: `${siteUrl}/my-quotes`,
            data: {
              full_name: name || undefined,
              phone: contactPhone,
            }
          }
        });

        if (otpError) {
          console.error('Error sending magic link:', otpError);
          // Don't fail the save if magic link fails
        } else {
          didSendAccountLink = true;
        }
      }
      setAccountLinkSent(didSendAccountLink);

      // Email delivery must not discard a successfully saved quote.
      try {
        const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-saved-quote-email', {
          body: {
            customerEmail: email.trim(),
            customerName: name.trim(),
            quoteId: leadRecord.id,
            savedQuoteId: savedQuoteId,
            resumeToken: resumeToken,
            motorModel: motorModel || 'Mercury Motor',
            finalPrice: finalPrice || 0,
            quoteData: quoteData,
            includeAccountInfo: didSendAccountLink,
          }
        });

        // The provider can return a failure inside a successful HTTP response.
        const deliveryError = emailError || emailResult?.error;
        setEmailSent(!deliveryError && Boolean(emailResult?.data?.id));
        if (deliveryError) {
          console.error('Error sending saved quote email:', deliveryError);
        }
      } catch (deliveryError) {
        setEmailSent(false);
        console.error('Error sending saved quote email:', deliveryError);
      }

      // Notify admin about new saved quote (email + SMS)
      try {
        await supabase.functions.invoke('send-quote-email', {
          body: {
            customerName: name,
            customerEmail: email.trim(),
            customerPhone: contactPhone || null,
            quoteNumber: quoteData.reference_number || leadRecord.id?.slice(0, 8)?.toUpperCase() || 'NEW',
            motorModel: motorModel || 'Mercury Motor',
            totalPrice: finalPrice || 0,
            emailType: 'admin_quote_notification',
            leadData: {
              leadScore: leadRecord.lead_score || 0,
              leadSource: 'save_for_later',
            },
          }
        });
        
        // Also send SMS to admin
        await supabase.functions.invoke('send-sms', {
          body: {
            to: 'admin',
            message: `📋 NEW SAVED QUOTE!\n\nName: ${name}\nPhone: ${phone.trim() || 'Not provided'}\nEmail: ${email}\nMotor: ${motorModel || 'Not specified'}\nPrice: $${(finalPrice || 0).toLocaleString()}\n\nAction: Follow up ASAP!\n\n- Harris Boat Works`,
            messageType: 'saved_quote_alert',
          }
        });
      } catch (notifyError) {
        console.error('Admin notification error (non-blocking):', notifyError);
      }

      // Insert confirmed above with an email address.
      trackLeadConversion('quote_saved_email', savedQuoteId);

      // Show success state
      setIsSaved(true);
    } catch (error) {
      console.error('Error saving quote:', error);
      toast({
        title: "Error saving quote",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after dialog closes
    setTimeout(() => {
      setIsSaved(false);
      setEmailSent(false);
      setAccountLinkSent(false);
      setSavedQuoteUrl('');
      setAuthError('');
      setEmail("");
      setName("");
      setPhone("");
    }, 300);
  };

  // Shared success content
  const successContent = (
    <div className="flex flex-col items-center text-center py-6 space-y-4">
      <div className="flex items-center justify-center">
        <CheckCircle className="h-12 w-12 text-repower-gold" strokeWidth={1.5} />
      </div>
      <div className="text-xl font-semibold">Quote Saved!</div>
      <div className="space-y-3 text-muted-foreground">
        {emailSent ? (
          <p>We've saved your configuration and sent details to <strong className="text-foreground">{email.trim()}</strong>.</p>
        ) : (
          <div role="status" className="space-y-2">
            <p>Your quote is saved, but we couldn't email the link. Open it below and bookmark it so you can return later.</p>
            <Button asChild variant="outline"><Link to={savedQuoteUrl}>Open saved quote</Link></Button>
          </div>
        )}
        {accountLinkSent && (
          <div className="bg-muted/50 rounded-lg p-4 mt-4 text-left">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-foreground">Check your email</p>
                <p className="text-muted-foreground mt-1">
                  Click the link in your email to access your account and view all your saved quotes anytime.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
      <Button onClick={handleClose} className="mt-4">
        Continue
      </Button>
    </div>
  );

  // Shared form content
  const formContent = (
    <div className="grid gap-4 py-4">
      
      <div className="grid gap-2">
        <Label htmlFor="email">Email <RequiredMark /></Label>
        <Input
          id="email"
          autoComplete="email"
          type="email"
          placeholder="your.email@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailError("");
          }}
          disabled={isLoading}
          aria-required="true"
          aria-invalid={Boolean(emailError)}
          aria-describedby={emailError ? "save-quote-email-error" : undefined}
          className={emailError ? "border-destructive" : ""}
        />
        {emailError && (
          <p id="save-quote-email-error" role="alert" className="text-sm text-destructive">{emailError}</p>
        )}
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="name">Name <RequiredMark /></Label>
        <Input
          id="name"
          autoComplete="name"
          type="text"
          placeholder="John Smith"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setNameError("");
          }}
          disabled={isLoading}
          aria-required="true"
          aria-invalid={Boolean(nameError)}
          aria-describedby={nameError ? "save-quote-name-error" : undefined}
          className={nameError ? "border-destructive" : ""}
        />
        {nameError && (
          <p id="save-quote-name-error" role="alert" className="text-sm text-destructive">{nameError}</p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="(555) 123-4567"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            setPhoneError("");
          }}
          disabled={isLoading}
          autoComplete="tel"
          aria-invalid={Boolean(phoneError)}
          aria-describedby={phoneError ? "save-quote-phone-error" : undefined}
          className={phoneError ? "border-destructive" : ""}
        />
        {phoneError && (
          <p id="save-quote-phone-error" role="alert" className="text-sm text-destructive">{phoneError}</p>
        )}
      </div>
      
      <p className="text-xs text-muted-foreground">
        We'll email a link to this quote. No Google account required. <Link to="/privacy" className="underline">Privacy policy</Link>
      </p>
    </div>
  );

  // Shared footer buttons
  const footerButtons = (
    <>
      <Button 
        variant="outline" 
        onClick={() => onOpenChange(false)}
        disabled={isLoading}
      >
        Cancel
      </Button>
      <Button onClick={handleSave} disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save My Quote"
        )}
      </Button>
    </>
  );

  const googleOption = !user && (
    <fieldset disabled={isLoading} className="mt-4 border-t pt-4 space-y-2">
      <p className="text-center text-xs text-muted-foreground">Or save with your Google account</p>
      <GoogleSignInButton
        redirectTo={`${SITE_URL}/quote/summary?auth_save=1`}
        variant="outline"
        onError={(error) => setAuthError(error.message)}
      />
      {authError && <p role="alert" className="text-sm text-destructive">{authError}</p>}
    </fieldset>
  );

  // Mobile: Use Drawer (slides up from bottom)
  if (isMobile) {
    if (isSaved) {
      return (
        <Drawer open={open} onOpenChange={handleClose}>
          <DrawerContent className="max-h-[90dvh] overflow-y-auto px-4 pb-8">
            <DrawerTitle className="sr-only">Quote saved</DrawerTitle>
            <DrawerDescription className="sr-only">
              Your configuration is saved. See the delivery status below.
            </DrawerDescription>
            {successContent}
          </DrawerContent>
        </Drawer>
      );
    }

    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90dvh] overflow-y-auto px-4 pb-8">
          <DrawerHeader className="text-left">
            <DrawerTitle>Save Your Quote</DrawerTitle>
            <DrawerDescription>
              Save by email. We'll send a link so you can return to this quote.
            </DrawerDescription>
          </DrawerHeader>
          {formContent}
          <DrawerFooter className="flex-row gap-2 pt-2">
            {footerButtons}
          </DrawerFooter>
          {googleOption}
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Use Dialog (centered modal)
  if (isSaved) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-[425px]">
          <DialogTitle className="sr-only">Quote saved</DialogTitle>
          <DialogDescription className="sr-only">
            Your configuration is saved. See the delivery status below.
          </DialogDescription>
          {successContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Your Quote</DialogTitle>
          <DialogDescription>
            Save by email. We'll send a link so you can return to this quote.
          </DialogDescription>
        </DialogHeader>
        {formContent}
        <DialogFooter>
          {footerButtons}
        </DialogFooter>
        {googleOption}
      </DialogContent>
    </Dialog>
  );
}
