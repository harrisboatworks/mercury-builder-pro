import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertTriangle, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface QuoteRow {
  id: string;
  created_at: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  base_price: number;
  final_price: number;
  deposit_amount: number;
  loan_amount: number;
  monthly_payment: number;
  term_months: number;
  total_cost: number;
  tradein_value_pre_penalty?: number | null;
  tradein_value_final?: number | null;
  penalty_applied?: boolean;
  penalty_factor?: number | null;
  penalty_reason?: string | null;
}

const AdminQuotes = () => {
  const [rows, setRows] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Quotes | Admin';
    let desc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!desc) { desc = document.createElement('meta'); desc.name = 'description'; document.head.appendChild(desc); }
    desc.content = 'View and export customer quotes with trade-in penalty details.';
    let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    canonical.href = window.location.origin + '/admin/quotes';
  }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('customer_quotes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Error', description: 'Failed to load quotes', variant: 'destructive' });
    } else {
      setRows((data as any) || []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const fmt = (n: number | null | undefined) => (n == null ? '-' : `$${Math.round(Number(n)).toLocaleString()}`);

  const toCSV = (items: QuoteRow[]) => {
    const headers = [
      'id','created_at','customer_name','customer_email','customer_phone','base_price','final_price','deposit_amount','loan_amount','monthly_payment','term_months','total_cost','tradein_value_pre_penalty','tradein_value_final','penalty_applied','penalty_factor','penalty_reason'
    ];
    const esc = (v: any) => {
      const s = v == null ? '' : String(v);
      if (s.includes('"')) return '"' + s.replace(/"/g, '""') + '"';
      if (s.includes(',') || s.includes('\n')) return '"' + s + '"';
      return s;
    };
    const rows = items.map(r => [
      r.id, r.created_at || '', r.customer_name, r.customer_email, r.customer_phone || '', r.base_price, r.final_price, r.deposit_amount, r.loan_amount, r.monthly_payment, r.term_months, r.total_cost, r.tradein_value_pre_penalty ?? '', r.tradein_value_final ?? '', r.penalty_applied ? 'true' : 'false', r.penalty_factor ?? '', r.penalty_reason ?? ''
    ].map(esc).join(','));
    return [headers.join(','), ...rows].join('\n');
  };

  const downloadCSV = () => {
    const csv = toCSV(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0,10);
    a.href = url;
    a.download = `quotes_export_${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Quotes</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={load}>Refresh</Button>
          <Button onClick={downloadCSV}><Download className="w-4 h-4 mr-2"/>Download CSV</Button>
        </div>
      </div>
      <Card className="p-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Trade-In (final)</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5}>Loading...</TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={5}>No quotes found.</TableCell></TableRow>
              ) : (
                rows.map((r) => {
                  const penalty = !!r.penalty_applied;
                  const percent = r.penalty_factor != null ? Math.round((1 - Number(r.penalty_factor)) * 100) : null;
                  return (
                    <TableRow key={r.id} className="cursor-pointer" onClick={() => navigate(`/admin/quotes/${r.id}`)}>
                      <TableCell>{r.created_at ? new Date(r.created_at).toLocaleString() : '-'}</TableCell>
                      <TableCell>{r.customer_name}</TableCell>
                      <TableCell>{r.customer_email}</TableCell>
                      <TableCell className="flex items-center gap-2">
                        <span>{fmt(r.tradein_value_final)}</span>
                        {penalty && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span aria-label="Penalty applied" className="inline-flex items-center text-yellow-600 dark:text-yellow-400"><AlertTriangle className="w-4 h-4"/></span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="max-w-[260px]">
                                  Penalty applied: -{percent}% — {r.penalty_reason}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </main>
  );
};

export default AdminQuotes;
