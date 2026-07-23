import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Bell, Mail, MessageSquare, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
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

  // Shared success content
  const successContent = (
    <div className="flex flex-col items-center justify-center px-7 py-12 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-repower-gold/40 bg-repower-paper">
        <CheckCircle className="h-7 w-7 text-repower-gold" />
      </div>
      <div className="mb-2 font-display text-3xl font-bold tracking-[-0.025em] text-repower-navy-900">
        Price watch is on.
      </div>
      <p className="max-w-sm font-sans text-[15px] leading-relaxed text-repower-navy-900/65">
        We'll notify you when promotions are available for the {motorDetails?.model || 'motor'}.
      </p>
    </div>
  );

  // Shared header content
  const headerIcon = (
    <div className="mb-4 flex items-center gap-3 text-repower-mercury-red">
      <span className="h-px w-7 bg-repower-mercury-red" aria-hidden="true" />
      <Bell className="h-4 w-4" aria-hidden="true" />
      <span className="font-sans text-[11px] font-bold uppercase tracking-[0.22em]">
        Price watch
      </span>
    </div>
  );

  // Shared form content
  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-5 px-6 pb-7 pt-3 sm:px-8 sm:pb-8">
      <div className="space-y-2">
        <Label htmlFor="name" className="font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-repower-navy-900/70">
          Name (optional)
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-12 rounded-sm border-repower-navy-900/15 bg-repower-paper px-4 font-sans text-[15px] text-repower-navy-900 placeholder:text-repower-navy-900/35 focus-visible:border-repower-gold focus-visible:ring-repower-gold/15"
        />
      </div>

      <div className="space-y-3">
        <Label className="font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-repower-navy-900/70">
          How should we notify you?
        </Label>
        <RadioGroup
          value={channel}
          onValueChange={(v) => setChannel(v as 'email' | 'sms' | 'both')}
          className="grid grid-cols-3 gap-2"
        >
          <label
            className={`flex min-h-12 items-center justify-center gap-2 rounded-sm border px-3 py-3 font-sans cursor-pointer transition-colors ${
              channel === 'email' 
                ? 'border-repower-navy-900 bg-repower-navy-900 text-repower-cream'
                : 'border-repower-navy-900/15 bg-repower-paper text-repower-navy-900 hover:border-repower-navy-900/40'
            }`}
          >
            <RadioGroupItem value="email" id="email-option" className="sr-only" />
            <Mail className="h-4 w-4" />
            <span className="text-sm font-semibold">Email</span>
          </label>
          <label
            className={`flex min-h-12 items-center justify-center gap-2 rounded-sm border px-3 py-3 font-sans cursor-pointer transition-colors ${
              channel === 'sms' 
                ? 'border-repower-navy-900 bg-repower-navy-900 text-repower-cream'
                : 'border-repower-navy-900/15 bg-repower-paper text-repower-navy-900 hover:border-repower-navy-900/40'
            }`}
          >
            <RadioGroupItem value="sms" id="sms-option" className="sr-only" />
            <MessageSquare className="h-4 w-4" />
            <span className="text-sm font-semibold">Text</span>
          </label>
          <label
            className={`flex min-h-12 items-center justify-center gap-2 rounded-sm border px-3 py-3 font-sans cursor-pointer transition-colors ${
              channel === 'both' 
                ? 'border-repower-navy-900 bg-repower-navy-900 text-repower-cream'
                : 'border-repower-navy-900/15 bg-repower-paper text-repower-navy-900 hover:border-repower-navy-900/40'
            }`}
          >
            <RadioGroupItem value="both" id="both-option" className="sr-only" />
            <span className="text-sm font-semibold">Both</span>
          </label>
        </RadioGroup>
      </div>

      {(channel === 'email' || channel === 'both') && (
        <div className="space-y-2">
          <Label htmlFor="email" className="font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-repower-navy-900/70">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 rounded-sm border-repower-navy-900/15 bg-repower-paper px-4 font-sans text-[15px] text-repower-navy-900 placeholder:text-repower-navy-900/35 focus-visible:border-repower-gold focus-visible:ring-repower-gold/15"
            required={channel === 'email' || channel === 'both'}
          />
        </div>
      )}

      {(channel === 'sms' || channel === 'both') && (
        <div className="space-y-2">
          <Label htmlFor="phone" className="font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-repower-navy-900/70">
            Phone Number
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="(555) 123-4567"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            className="h-12 rounded-sm border-repower-navy-900/15 bg-repower-paper px-4 font-sans text-[15px] text-repower-navy-900 placeholder:text-repower-navy-900/35 focus-visible:border-repower-gold focus-visible:ring-repower-gold/15"
            required={channel === 'sms' || channel === 'both'}
          />
        </div>
      )}

      <Button 
        type="submit" 
        className="min-h-12 w-full rounded-sm bg-repower-mercury-red font-sans text-[12px] font-bold uppercase tracking-[0.13em] text-repower-cream hover:bg-repower-mercury-red-deep"
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
            Watch This Motor's Price
          </>
        )}
      </Button>

      <p className="text-center font-sans text-[12px] leading-relaxed text-repower-navy-900/55">
        We'll only contact you about promotions on this motor. Unsubscribe anytime.
      </p>
    </form>
  );

  // Mobile: Bottom drawer
  if (isMobile) {
    if (isSuccess) {
      return (
        <Drawer open={isOpen} onOpenChange={onClose}>
          <DrawerContent className="border-repower-gold/30 bg-repower-cream">
            {successContent}
          </DrawerContent>
        </Drawer>
      );
    }

    return (
      <Drawer open={isOpen} onOpenChange={onClose}>
        <DrawerContent className="max-h-[92vh] overflow-y-auto border-repower-gold/30 bg-repower-cream">
          <DrawerHeader className="px-6 pb-1 pt-6 text-left">
            {headerIcon}
            <DrawerTitle className="font-display text-[30px] font-bold leading-[1.05] tracking-[-0.025em] text-repower-navy-900">
              Get a price alert.
            </DrawerTitle>
            <DrawerDescription className="pt-2 font-sans text-[15px] leading-relaxed text-repower-navy-900/65">
              Get notified when the {motorDetails?.model || 'motor you configured'} goes on sale.
            </DrawerDescription>
          </DrawerHeader>
          {formContent}
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Centered dialog
  if (isSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="overflow-hidden rounded-sm border-repower-gold/30 bg-repower-cream p-0 shadow-[0_24px_80px_rgba(5,14,28,0.24)] sm:max-w-[520px]">
          {successContent}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="overflow-hidden rounded-sm border-repower-gold/30 bg-repower-cream p-0 shadow-[0_24px_80px_rgba(5,14,28,0.24)] sm:max-w-[520px]">
        <DialogHeader className="px-8 pb-1 pt-8 text-left">
          {headerIcon}
          <DialogTitle className="font-display text-[34px] font-bold leading-[1.05] tracking-[-0.025em] text-repower-navy-900">
            Get a price alert.
          </DialogTitle>
          <DialogDescription className="pt-2 font-sans text-[15px] leading-relaxed text-repower-navy-900/65">
            Get notified when the {motorDetails?.model || 'motor you configured'} goes on sale.
          </DialogDescription>
        </DialogHeader>

        {formContent}
      </DialogContent>
    </Dialog>
  );
};
