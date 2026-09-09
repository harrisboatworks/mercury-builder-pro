import { useState } from 'react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';

interface PhoneCaptureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  savedQuoteId?: string;
}

const PHONE_SAVE_FAILED = {
  title: 'Could not save phone number',
  description: 'We could not save your phone number. Please try again, or call us at (905) 342-2153.',
  variant: 'destructive' as const,
};

function asQuoteState(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export function PhoneCapture({ open, onOpenChange, savedQuoteId }: PhoneCaptureProps) {
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useMediaQuery('(max-width: 640px)');

  const isValid = phone.replace(/\D/g, '').length >= 10;

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);

    try {
      const cleanPhone = phone.replace(/\D/g, '');
      let persisted = false;

      if (savedQuoteId) {
        const { data: existing, error: loadError } = await supabase
          .from('saved_quotes')
          .select('quote_state')
          .eq('id', savedQuoteId)
          .maybeSingle();

        if (loadError || !existing) {
          toast(PHONE_SAVE_FAILED);
          return;
        }

        const { error: quoteError } = await supabase
          .from('saved_quotes')
          .update({
            quote_state: { ...asQuoteState(existing.quote_state), customerPhone: cleanPhone },
          })
          .eq('id', savedQuoteId);

        if (quoteError) {
          toast(PHONE_SAVE_FAILED);
          return;
        }
        persisted = true;
      }

      if (user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ phone: cleanPhone })
          .eq('user_id', user.id);

        if (profileError) {
          toast({
            title: PHONE_SAVE_FAILED.title,
            description: persisted
              ? 'Your quote was updated, but we could not save the number to your profile. Please try again, or call us at (905) 342-2153.'
              : PHONE_SAVE_FAILED.description,
            variant: 'destructive',
          });
          return;
        }
        persisted = true;
      }

      if (!persisted) {
        toast(PHONE_SAVE_FAILED);
        return;
      }

      // Admin SMS is best-effort. The customer write already succeeded; a
      // notify failure must not look like the save failed, and must not be
      // swallowed without a record.
      const { error: smsError } = await supabase.functions.invoke('send-sms', {
        body: {
          to: 'admin',
          message: `📱 PHONE CAPTURED!\n\n${user?.user_metadata?.full_name || user?.user_metadata?.name || 'Customer'} added their phone: ${cleanPhone}\nEmail: ${user?.email || 'N/A'}\n\n- Harris Boat Works`,
          messageType: 'phone_capture_alert',
        },
      });
      if (smsError) {
        console.error('Phone capture admin SMS failed:', smsError);
      }

      toast({
        title: '✓ Phone saved',
        description: "We'll text you updates about your quote.",
      });
      onOpenChange(false);
    } catch (err) {
      console.error('Phone capture error:', err);
      toast(PHONE_SAVE_FAILED);
    } finally {
      setSaving(false);
    }
  };

  const content = (
    <div className="space-y-4 px-1">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Phone className="w-5 h-5 text-primary" />
        <p className="text-sm">We'll only text you about this quote, no spam.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone-capture">Phone number</Label>
        <Input
          id="phone-capture"
          type="tel"
          placeholder="(905) 555-1234"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          autoFocus
        />
      </div>
      <div className="flex gap-3">
        <Button
          onClick={handleSave}
          disabled={!isValid || saving}
          className="flex-1"
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          className="flex-1"
        >
          Skip
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Want text updates on your quote?</DrawerTitle>
            <DrawerDescription>Get notified about promotions and status changes</DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-8">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Want text updates on your quote?</DialogTitle>
          <DialogDescription>Get notified about promotions and status changes</DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
