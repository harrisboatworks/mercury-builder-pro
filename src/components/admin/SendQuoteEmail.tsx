import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mail, Loader2, Check } from 'lucide-react';
import { SITE_URL } from '@/lib/site';

interface Props {
  quoteId: string;
  customerName: string;
  customerEmail: string;
  motorModel: string;
  totalPrice: number;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SendQuoteEmail = ({ quoteId, customerName, customerEmail, motorModel, totalPrice }: Props) => {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const sendKeyRef = useRef<string>('');

  const handleSend = async () => {
    setSending(true);
    sendKeyRef.current = crypto.randomUUID();
    try {
      // Only attach a real generated PDF artifact. Previously this passed
      // `${SITE_URL}/quote/saved/<id>` — an HTML page — which the edge function
      // fetched and attached as `Quote-*.pdf`, so customers received a broken
      // attachment. Look for an actual stored PDF instead; if there is none,
      // send without an attachment rather than mislabelling a web page.
      let pdfUrl: string | undefined;
      const { data: storedFiles } = await supabase.storage
        .from('spec-sheets')
        .list(quoteId, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
      const newestPdf = storedFiles?.find((file) => file.name.toLowerCase().endsWith('.pdf'));
      if (newestPdf) {
        const { data: publicUrlData } = supabase.storage
          .from('spec-sheets')
          .getPublicUrl(`${quoteId}/${newestPdf.name}`);
        pdfUrl = publicUrlData?.publicUrl;
      }

      const { data, error } = await supabase.functions.invoke('send-quote-email', {
        body: {
          customerEmail,
          customerName,
          quoteNumber: quoteId.slice(0, 8).toUpperCase(),
          motorModel,
          totalPrice,
          ...(pdfUrl ? { pdfUrl } : {}),
          emailType: 'quote_delivery',
          // Stable for the duration of this click so a transport-level retry
          // cannot produce a second customer email.
          // Only namespace by quote when it is a real uuid; otherwise fall
          // back to the per-click key alone so a malformed id cannot collide
          // with, or squat, another quote's delivery key.
          idempotencyKey: UUID_RE.test(quoteId)
            ? `admin-resend:${quoteId}:${sendKeyRef.current}`
            : `admin-resend:${sendKeyRef.current}`,
          leadData: {
            quoteId,
          },
        },
      });
      if (error) throw error;
      // A 2xx body can still report failure; never show "Email Sent" unless the
      // provider actually accepted the message.
      if (!data?.success) {
        throw new Error(data?.error || 'Email delivery was not confirmed');
      }
      setSent(true);
      toast({ title: 'Email Sent', description: `Quote emailed to ${customerEmail}` });
      setTimeout(() => setSent(false), 5000);
    } catch (err: any) {
      toast({ title: 'Failed to Send', description: err.message || 'Could not send email.', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleSend}
      disabled={sending || !customerEmail}
      className="flex-1"
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
  );
};

export default SendQuoteEmail;
