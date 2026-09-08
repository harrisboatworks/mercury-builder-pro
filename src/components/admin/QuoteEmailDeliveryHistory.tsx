import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  adminQuoteEmailRef,
  presentQuoteEmailDelivery,
  resolveQuoteEmailDisplayRecipient,
  sortQuoteEmailDeliveriesNewestFirst,
  type QuoteEmailDeliveryRecord,
} from '@/lib/admin-quote-email';

interface Props {
  quoteId: string;
  customerEmail: string;
  refreshKey?: number;
}

const QuoteEmailDeliveryHistory = ({ quoteId, customerEmail, refreshKey = 0 }: Props) => {
  const [rows, setRows] = useState<QuoteEmailDeliveryRecord[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadState('loading');
      try {
        const { data, error } = await supabase.rpc(
          'get_quote_email_deliveries_v1' as never,
          { _quote_number: adminQuoteEmailRef(quoteId) } as never,
        );
        if (cancelled) return;
        if (error) {
          setRows([]);
          setLoadState('error');
          return;
        }
        setRows((Array.isArray(data) ? data : []) as QuoteEmailDeliveryRecord[]);
        setLoadState('ready');
      } catch {
        if (cancelled) return;
        setRows([]);
        setLoadState('error');
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [quoteId, refreshKey]);

  const presented = sortQuoteEmailDeliveriesNewestFirst(rows)
    .map((row) => presentQuoteEmailDelivery(row, customerEmail));

  return (
    <Card className="p-4">
      <h2 className="font-semibold mb-3 flex items-center gap-2">
        <Mail className="w-4 h-4" />
        Email history
      </h2>
      <p className="text-xs text-muted-foreground mb-3">
        To: {resolveQuoteEmailDisplayRecipient(customerEmail)}
      </p>
      {loadState === 'loading' ? (
        <p className="text-sm text-muted-foreground">Loading email history…</p>
      ) : loadState === 'error' ? (
        <p className="text-sm text-muted-foreground">
          Email history is unavailable right now. The rest of this quote is still usable.
        </p>
      ) : presented.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">no emails sent yet</p>
      ) : (
        <div className="space-y-2">
          {presented.map((entry) => (
            <div key={entry.id} className="rounded border p-2 text-sm space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{entry.emailType}</Badge>
                <StatusBadge status={entry.status} />
                <span className="text-xs text-muted-foreground ml-auto">
                  {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : '—'}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Initiator: {entry.initiator || '—'}
                {' · '}
                Attachment: {entry.attachmentStatus}
              </div>
              {entry.errorDetail ? (
                <div className="text-xs text-destructive">Error: {entry.errorDetail}</div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

function StatusBadge({ status }: { status: string }) {
  if (status === 'sent') {
    return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">sent</Badge>;
  }
  if (status === 'failed') {
    return <Badge variant="destructive">failed</Badge>;
  }
  if (status === 'sending') {
    return <Badge variant="secondary">sending</Badge>;
  }
  return <Badge variant="outline">{status}</Badge>;
}

export default QuoteEmailDeliveryHistory;
