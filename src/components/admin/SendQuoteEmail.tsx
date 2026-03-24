import { useState } from 'react';
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

const SendQuoteEmail = ({ quoteId, customerName, customerEmail, motorModel, totalPrice }: Props) => {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-quote-email', {
        body: {
          customerEmail,
          customerName,
          quoteNumber: quoteId.slice(0, 8).toUpperCase(),
          motorModel,
          totalPrice,
          pdfUrl: `${SITE_URL}/quote/saved/${quoteId}`,
          emailType: 'quote_delivery',
          leadData: {
            quoteId,
          },
        },
      });
      if (error) throw error;
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
