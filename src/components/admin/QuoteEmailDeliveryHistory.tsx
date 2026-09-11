import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  ADMIN_QUOTE_EMAIL_HISTORY_EMPTY,
  ADMIN_QUOTE_EMAIL_HISTORY_SCOPE,
  ADMIN_QUOTE_EMAIL_HISTORY_UNAVAILABLE,
  fetchAdminQuoteEmailDeliveries,
  presentQuoteEmailDelivery,
  sortQuoteEmailDeliveriesNewestFirst,
  type QuoteEmailDeliveryRecord,
} from '@/lib/admin-quote-email';

interface Props {
  quoteId: string;
  refreshKey?: number;
}

const QuoteEmailDeliveryHistory = ({ quoteId, refreshKey = 0 }: Props) => {
  const [rows, setRows] = useState<QuoteEmailDeliveryRecord[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadState('loading');
      const result = await fetchAdminQuoteEmailDeliveries(quoteId, (name, args) =>
        supabase.rpc(name as never, args as never),
      );
      if (cancelled) return;
      if (!result.ok) {
        setRows([]);
        setLoadState('error');
        return;
      }
      setRows(result.rows);
      setLoadState('ready');
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [quoteId, refreshKey]);

  const presented = sortQuoteEmailDeliveriesNewestFirst(rows).map(presentQuoteEmailDelivery);

  return (
    <Card className="p-4">
      <h2 className="font-semibold mb-3 flex items-center gap-2">
        <Mail className="w-4 h-4" />
        Email history
      </h2>
      <p className="text-xs text-muted-foreground mb-3">
        {ADMIN_QUOTE_EMAIL_HISTORY_SCOPE}
      </p>
      {loadState === 'loading' ? (
        <p className="text-sm text-muted-foreground">Loading email history…</p>
      ) : loadState === 'error' ? (
        <p className="text-sm text-muted-foreground">
          {ADMIN_QUOTE_EMAIL_HISTORY_UNAVAILABLE}
        </p>
      ) : presented.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">{ADMIN_QUOTE_EMAIL_HISTORY_EMPTY}</p>
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
