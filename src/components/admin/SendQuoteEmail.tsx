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
import {
  adminQuoteEmailRef,
  describeAdminQuoteEmailSendVerdict,
  interpretAdminQuoteEmailSendResult,
  mintAdminQuoteEmailIdempotencyKey,
} from '@/lib/admin-quote-email';

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
      const invokeResult = isSubmitted
        ? await supabase.functions.invoke('admin-consultation-document', {
          body: { action: 'admin-email', quoteId, emailIntent: intent },
        })
        : await supabase.functions.invoke('send-quote-email', {
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
      const verdict = await interpretAdminQuoteEmailSendResult(invokeResult);
      const notice = describeAdminQuoteEmailSendVerdict(verdict, intent);
      if (verdict.kind === 'sent' || verdict.kind === 'duplicate') {
        setSent(true);
        toast(notice);
        setTimeout(() => setSent(false), 5000);
        onDeliverySettled?.();
        return;
      }
      toast({ ...notice, variant: 'destructive' });
      if (verdict.kind === 'failed') onDeliverySettled?.();
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
