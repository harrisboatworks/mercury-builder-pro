import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, Mail } from "lucide-react";
import { saveLead } from "@/lib/leadCapture";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateSocialProofMessage } from "@/lib/activityGenerator";
import { useAuth } from "@/components/auth/AuthProvider";
import { useIsMobile } from "@/hooks/use-mobile";

interface SaveQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quoteData: any;
  motorModel?: string;
  finalPrice?: number;
}

export function SaveQuoteDialog({ 
  open, 
  onOpenChange, 
  quoteData,
  motorModel,
  finalPrice 
}: SaveQuoteDialogProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const [emailError, setEmailError] = useState("");

  const handleSave = async () => {
    // Clear previous errors
    setEmailError("");
    
    if (!email) {
      setEmailError("Email address is required");
      return;
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      // Save lead to database
      const leadRecord = await saveLead({
        motor_model: motorModel,
        motor_hp: quoteData.selectedMotor?.hp,
        base_price: quoteData.selectedMotor?.msrp,
        final_price: finalPrice,
        customer_name: name || undefined,
        customer_email: email,
        customer_phone: phone || undefined,
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

      const { data: savedQuote, error: savedQuoteError } = await supabase
        .from('saved_quotes')
        .insert({
          email: email,
          resume_token: resumeToken,
          quote_state: quoteData, // Full QuoteContext state
          user_id: user?.id || null, // Link to user if logged in
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (savedQuoteError) {
        console.error('Error saving quote state:', savedQuoteError);
        // Continue anyway - we have the customer_quotes record
      } else if (savedQuote?.id) {
        // Store saved quote ID for QR code generation
        localStorage.setItem('current_saved_quote_id', savedQuote.id);
        console.log('Saved quote ID for QR code:', savedQuote.id);
      }

      // If user is not logged in, send magic link for account creation
      if (!user) {
        const siteUrl = window.location.origin;
        const { error: otpError } = await supabase.auth.signInWithOtp({
          email: email,
          options: {
            emailRedirectTo: `${siteUrl}/my-quotes`,
            data: {
              full_name: name || undefined,
              phone: phone || undefined,
            }
          }
        });

        if (otpError) {
          console.error('Error sending magic link:', otpError);
          // Don't fail the save if magic link fails
        }
      }

      // Send email with quote link
      const { error: emailError } = await supabase.functions.invoke('send-saved-quote-email', {
        body: {
          customerEmail: email,
          customerName: name || 'Valued Customer',
          quoteId: leadRecord.id,
          savedQuoteId: savedQuote?.id,
          resumeToken: resumeToken,
          motorModel: motorModel || 'Mercury Motor',
          finalPrice: finalPrice || 0,
          quoteData: quoteData,
          includeAccountInfo: !user, // Flag to include account access info
        }
      });

      if (emailError) {
        console.error('Error sending email:', emailError);
        // Don't fail the save if email fails
      }

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
      setEmail("");
      setName("");
      setPhone("");
    }, 300);
  };

  // Shared success content
  const successContent = (
    <div className="flex flex-col items-center text-center py-6 space-y-4">
      <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>
      <div className="text-xl font-semibold">Quote Saved!</div>
      <div className="space-y-3 text-muted-foreground">
        <p>We've saved your configuration and sent details to <strong className="text-foreground">{email}</strong>.</p>
        {!user && (
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
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          placeholder="your.email@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailError("");
          }}
          disabled={isLoading}
          className={emailError ? "border-destructive" : ""}
        />
        {emailError && (
          <p className="text-sm text-destructive">{emailError}</p>
        )}
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="name">Name (optional)</Label>
        <Input
          id="name"
          type="text"
          placeholder="John Smith"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
        />
      </div>
      
      <div className="grid gap-2">
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="(555) 123-4567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={isLoading}
        />
      </div>
      
      <p className="text-sm text-muted-foreground">
        {generateSocialProofMessage()}
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

  // Mobile: Use Drawer (slides up from bottom)
  if (isMobile) {
    if (isSaved) {
      return (
        <Drawer open={open} onOpenChange={handleClose}>
          <DrawerContent className="px-4 pb-8">
            {successContent}
          </DrawerContent>
        </Drawer>
      );
    }

    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="px-4 pb-8">
          <DrawerHeader className="text-left">
            <DrawerTitle>Save Your Quote</DrawerTitle>
            <DrawerDescription>
              Enter your email to save this configuration. We'll send you a link so you can return anytime.
            </DrawerDescription>
          </DrawerHeader>
          {formContent}
          <DrawerFooter className="flex-row gap-2 pt-2">
            {footerButtons}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Use Dialog (centered modal)
  if (isSaved) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[425px]">
          {successContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Your Quote</DialogTitle>
          <DialogDescription>
            Enter your email to save this configuration. We'll send you a link so you can return anytime.
          </DialogDescription>
        </DialogHeader>
        {formContent}
        <DialogFooter>
          {footerButtons}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
