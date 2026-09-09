import { adminConsultationDocument } from '@/lib/consultation-document-client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mail, Loader2, Check } from 'lucide-react';
import { SITE_URL } from '@/lib/site';
import { adminQuoteEmailRef, mintAdminQuoteEmailIdempotencyKey } from '@/lib/admin-quote-email';

interface Props {
  isSubmitted?: boolean;
  quoteId: string;
  customerName: string;
  customerEmail: string;
  motorModel: string;
  totalPrice: number;
  onDeliverySettled?: () => void;
}

const SendQuoteEmail = ({
  quoteId,
  customerName,
  customerEmail,
  motorModel,
  totalPrice,
  isSubmitted,
  onDeliverySettled,
}: Props) => {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSend = async (intent: 'send' | 'resend') => {
    setSending(true);
    try {
      if (isSubmitted) {
        const result = await adminConsultationDocument(quoteId, 'admin-email', intent);
        if (intent === 'send' && result?.duplicate) {
          setSent(true);
          toast({
            title: 'Already sent',
            description: 'This quote was already emailed. Use Send again to deliver another copy to the customer.',
          });
          setTimeout(() => setSent(false), 5000);
          onDeliverySettled?.();
          return;
        }
      } else {
        const { data, error } = await supabase.functions.invoke('send-quote-email', {
          body: {
            customerEmail,
            customerName,
            quoteNumber: adminQuoteEmailRef(quoteId),
            motorModel,
            totalPrice,
            quotePageUrl: `${SITE_URL}/quote/saved/${quoteId}`,
            emailType: 'quote_delivery',
            leadData: {
              quoteId,
            },
            idempotencyKey: mintAdminQuoteEmailIdempotencyKey({
              quoteId,
              emailType: 'quote_delivery',
              intent,
            }),
          },
        });
        if (error) throw error;
        const result = data as { success?: boolean; duplicate?: boolean; error?: string } | null;
        if (result?.success === false) {
          throw new Error(result.error || 'Could not send email.');
        }
        if (intent === 'send' && result?.duplicate) {
          setSent(true);
          toast({
            title: 'Already sent',
            description: 'This quote was already emailed. Use Send again to deliver another copy to the customer.',
          });
          setTimeout(() => setSent(false), 5000);
          onDeliverySettled?.();
          return;
        }
      }
      setSent(true);
      toast({
        title: intent === 'resend' ? 'Another copy sent' : 'Email Sent',
        description: intent === 'resend'
          ? 'The customer will receive another copy of this quote.'
          : `Quote emailed to ${customerEmail}`,
      });
      setTimeout(() => setSent(false), 5000);
      onDeliverySettled?.();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not send email.';
      toast({ title: 'Failed to Send', description: message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        onClick={() => handleSend('send')}
        disabled={sending || !customerEmail}
        className="w-full"
      >
        {sending ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : sent ? (
          <Check className="w-4 h-4 mr-2 text-green-600" />
        ) : (
          <Mail className="w-4 h-4 mr-2" />
        )}
        {sent ? 'Sent!' : 'Email Quote'}
      </Button>
      <div className="rounded-md border border-dashed p-2 space-y-2">
        <p className="text-xs text-muted-foreground">
          Send again emails the customer another copy of this quote. Use it after a bounce or if they ask you to resend.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={sending || !customerEmail}
            >
              Send again
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Send another copy?</AlertDialogTitle>
              <AlertDialogDescription>
                The customer will receive another copy of this quote email. This is a deliberate resend, not a retry of the same send.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  void handleSend('resend');
                }}
              >
                Send another copy
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default SendQuoteEmail;
