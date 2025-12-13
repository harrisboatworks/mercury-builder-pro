import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Bell, Mail, MessageSquare, X, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PromoReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  motorId?: string;
  motorDetails?: {
    model: string;
    horsepower: number;
    price: number;
    imageUrl?: string;
  };
  quoteConfig?: Record<string, any>;
}

export const PromoReminderModal = ({
  isOpen,
  onClose,
  motorId,
  motorDetails,
  quoteConfig
}: PromoReminderModalProps) => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [channel, setChannel] = useState<'email' | 'sms' | 'both'>('email');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email && !phone) {
      toast.error('Please enter an email or phone number');
      return;
    }

    if (channel === 'email' && !email) {
      toast.error('Please enter an email address');
      return;
    }

    if (channel === 'sms' && !phone) {
      toast.error('Please enter a phone number');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.functions.invoke('subscribe-promo-reminder', {
        body: {
          motorModelId: motorId,
          customerEmail: email || null,
          customerPhone: phone || null,
          customerName: name || null,
          preferredChannel: channel,
          motorDetails: motorDetails || {},
          quoteConfig: quoteConfig || {}
        }
      });

      if (error) throw error;

      setIsSuccess(true);
      toast.success('You\'ll be notified when this motor goes on sale!');
      
      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Failed to subscribe:', err);
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  if (isSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-xl font-semibold mb-2">You're All Set!</DialogTitle>
            <DialogDescription>
              We'll notify you when promotions are available for the {motorDetails?.model || 'motor'}.
            </DialogDescription>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <DialogHeader className="text-center pb-2">
          <div className="mx-auto rounded-full bg-primary/10 p-3 mb-3">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-xl font-semibold">
            Don't Miss a Deal!
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Get notified when the {motorDetails?.model || 'motor you configured'} goes on sale.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Name (optional)
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white border-border"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">How should we notify you?</Label>
            <RadioGroup
              value={channel}
              onValueChange={(v) => setChannel(v as 'email' | 'sms' | 'both')}
              className="flex gap-2"
            >
              <label
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                  channel === 'email' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-muted-foreground'
                }`}
              >
                <RadioGroupItem value="email" id="email-option" className="sr-only" />
                <Mail className="h-4 w-4" />
                <span className="text-sm font-medium">Email</span>
              </label>
              <label
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                  channel === 'sms' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-muted-foreground'
                }`}
              >
                <RadioGroupItem value="sms" id="sms-option" className="sr-only" />
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm font-medium">Text</span>
              </label>
              <label
                className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                  channel === 'both' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-muted-foreground'
                }`}
              >
                <RadioGroupItem value="both" id="both-option" className="sr-only" />
                <span className="text-sm font-medium">Both</span>
              </label>
            </RadioGroup>
          </div>

          {(channel === 'email' || channel === 'both') && (
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white border-border"
                required={channel === 'email' || channel === 'both'}
              />
            </div>
          )}

          {(channel === 'sms' || channel === 'both') && (
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                className="bg-white border-border"
                required={channel === 'sms' || channel === 'both'}
              />
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Subscribing...
              </>
            ) : (
              <>
                <Bell className="mr-2 h-4 w-4" />
                Notify Me of Sales
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            We'll only contact you about promotions on this motor. Unsubscribe anytime.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};
