import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Clock, FileText } from 'lucide-react';

interface QuoteHistoryItem {
  id: string;
  created_at: string | null;
  final_price: number;
  lead_status: string | null;
  is_admin_quote: boolean | null;
  motor_model_id: string | null;
  quote_data: any;
}

interface Props {
  customerEmail: string;
  currentQuoteId: string;
}

const QuoteHistoryTimeline = ({ customerEmail, currentQuoteId }: Props) => {
  const [quotes, setQuotes] = useState<QuoteHistoryItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!customerEmail) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('customer_quotes')
        .select('id, created_at, final_price, lead_status, is_admin_quote, motor_model_id, quote_data')
        .eq('customer_email', customerEmail)
        .order('created_at', { ascending: false });
      setQuotes((data as any) || []);
    };
    fetch();
  }, [customerEmail]);

  if (quotes.length <= 1) return null;

  const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;

  const getMotorLabel = (q: QuoteHistoryItem) => {
    const motor = q.quote_data?.motor;
    if (motor?.model) return motor.model;
    return 'Unknown motor';
  };

  return (
    <Card className="p-4">
      <h2 className="font-semibold mb-3 flex items-center gap-2">
        <Clock className="w-4 h-4" />
        Quote History ({quotes.length} quotes)
      </h2>
      <div className="space-y-2">
        {quotes.map((q) => {
          const isCurrent = q.id === currentQuoteId;
          return (
            <div
              key={q.id}
              className={`flex items-center gap-3 p-2 rounded text-sm cursor-pointer transition-colors ${
                isCurrent
                  ? 'bg-primary/10 border border-primary/30'
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => !isCurrent && navigate(`/admin/quotes/${q.id}`)}
            >
              <FileText className="w-4 h-4 shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {getMotorLabel(q)}
                  {isCurrent && (
                    <Badge variant="outline" className="ml-2 text-xs">Current</Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {q.created_at ? new Date(q.created_at).toLocaleDateString() : 'No date'}
                </div>
              </div>
              <div className="font-medium">{fmt(q.final_price)}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default QuoteHistoryTimeline;
