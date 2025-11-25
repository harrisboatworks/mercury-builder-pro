import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { saveLead } from "@/lib/leadCapture";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateSocialProofMessage } from "@/lib/activityGenerator";

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
  const { toast } = useToast();

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
      const resumeToken = `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      const { data: savedQuote, error: savedQuoteError } = await supabase
        .from('saved_quotes')
        .insert({
          email: email,
          resume_token: resumeToken,
          quote_state: quoteData, // Full QuoteContext state
          user_id: null, // Anonymous for now
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

      // Send email with quote link
      const { error: emailError } = await supabase.functions.invoke('send-saved-quote-email', {
        body: {
          customerEmail: email,
          customerName: name || 'Valued Customer',
          quoteId: leadRecord.id,
          savedQuoteId: savedQuote?.id, // NEW: Full restoration ID
          resumeToken: resumeToken, // NEW: Security token
          motorModel: motorModel || 'Mercury Motor',
          finalPrice: finalPrice || 0,
          quoteData: quoteData,
        }
      });

      if (emailError) {
        console.error('Error sending email:', emailError);
        // Don't fail the save if email fails
      }

      // Silent success - dialog closes
      onOpenChange(false);
      setEmail("");
      setName("");
      setPhone("");
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Your Quote</DialogTitle>
          <DialogDescription>
            Enter your email to save this configuration. We'll send you a link so you can return anytime.
          </DialogDescription>
        </DialogHeader>
        
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

        <DialogFooter>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
