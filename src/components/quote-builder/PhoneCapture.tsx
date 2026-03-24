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

      // Update saved_quotes if we have an ID
      if (savedQuoteId) {
        await supabase
          .from('saved_quotes')
          .update({ quote_state: supabase.rpc ? undefined : undefined })
          .eq('id', savedQuoteId);
        
        // Actually update via raw — just store phone in the quote_state jsonb
        const { data: existing } = await (supabase as any)
          .from('saved_quotes')
          .select('quote_state')
          .eq('id', savedQuoteId)
          .single();
        
        if (existing?.quote_state) {
          const updatedState = { ...existing.quote_state, customerPhone: cleanPhone };
          await (supabase as any)
            .from('saved_quotes')
            .update({ quote_state: updatedState })
            .eq('id', savedQuoteId);
        }
      }

      // Update profile phone
      if (user) {
        await supabase
          .from('profiles')
          .update({ phone: cleanPhone })
          .eq('user_id', user.id);
      }

      // Notify admin
      const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || 'Customer';
      supabase.functions.invoke('send-sms', {
        body: {
          to: 'admin',
          message: `📱 PHONE CAPTURED!\n\n${userName} added their phone: ${cleanPhone}\nEmail: ${user?.email || 'N/A'}\n\n- Harris Boat Works`,
          messageType: 'phone_capture_alert',
        },
      }).catch(() => {});

      toast({
        title: '✓ Phone saved',
        description: "We'll text you updates about your quote.",
      });
      onOpenChange(false);
    } catch (err) {
      console.error('Phone capture error:', err);
    } finally {
      setSaving(false);
    }
  };

  const content = (
    <div className="space-y-4 px-1">
      <div className="flex items-center gap-3 text-muted-foreground">
        <Phone className="w-5 h-5 text-primary" />
        <p className="text-sm">We'll only text you about this quote — no spam.</p>
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
