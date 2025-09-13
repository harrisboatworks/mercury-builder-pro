import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdminNav from '@/components/admin/AdminNav';

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
  // New lead tracking fields
  lead_status?: string;
  lead_source?: string;
  lead_score?: number;
  anonymous_session_id?: string;
  contact_attempts?: number;
  last_contact_attempt?: string | null;
  notes?: string | null;
}

const AdminQuotes = () => {
  const [rows, setRows] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showPenalizedOnly, setShowPenalizedOnly] = useState(false);
  const [penalizedTotal, setPenalizedTotal] = useState(0);
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>('all');
  const [leadSourceFilter, setLeadSourceFilter] = useState<string>('all');

  useEffect(() => {
    document.title = 'Quotes | Admin';
    let desc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!desc) { desc = document.createElement('meta'); desc.name = 'description'; document.head.appendChild(desc); }
    desc.content = 'View and export customer quotes with trade-in penalty details.';
    let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    canonical.href = window.location.origin + '/admin/quotes';
  }, []);

  const load = async (penalizedOnly: boolean = showPenalizedOnly, statusFilter: string = leadStatusFilter, sourceFilter: string = leadSourceFilter) => {
    setLoading(true);
    let query = supabase
      .from('customer_quotes')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (penalizedOnly) {
      query = query.eq('penalty_applied', true);
    }
    
    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('lead_status', statusFilter);
    }
    
    if (sourceFilter && sourceFilter !== 'all') {
      query = query.eq('lead_source', sourceFilter);
    }
    
    const { data, error } = await query;

    // Get total penalized count for the counter chip
    const { count } = await supabase
      .from('customer_quotes')
      .select('*', { count: 'exact', head: true })
      .eq('penalty_applied', true);
    setPenalizedTotal(count || 0);

    if (error) {
      toast({ title: 'Error', description: 'Failed to load quotes', variant: 'destructive' });
    } else {
      setRows((data as any) || []);
    }
    setLoading(false);
  };
  useEffect(() => {
    const initial = (searchParams.get('penalized') === '1');
    setShowPenalizedOnly(initial);
    load(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const fmt = (n: number | null | undefined) => (n == null ? '-' : `$${Math.round(Number(n)).toLocaleString()}`);

  const toCSV = (items: QuoteRow[]) => {
    const headers = [
      'id','created_at','customer_name','customer_email','customer_phone','lead_status','lead_source','lead_score','contact_attempts','final_price','base_price','deposit_amount','loan_amount','monthly_payment','term_months','total_cost','tradein_value_pre_penalty','tradein_value_final','penalty_applied','penalty_factor','penalty_reason','notes'
    ];
    const esc = (v: any) => {
      const s = v == null ? '' : String(v);
      if (s.includes('"')) return '"' + s.replace(/"/g, '""') + '"';
      if (s.includes(',') || s.includes('\n')) return '"' + s + '"';
      return s;
    };
    const rows = items.map(r => [
      r.id, r.created_at || '', r.customer_name || '', r.customer_email || '', r.customer_phone || '', r.lead_status || '', r.lead_source || '', r.lead_score || '', r.contact_attempts || '', r.final_price, r.base_price, r.deposit_amount, r.loan_amount, r.monthly_payment, r.term_months, r.total_cost, r.tradein_value_pre_penalty ?? '', r.tradein_value_final ?? '', r.penalty_applied ? 'true' : 'false', r.penalty_factor ?? '', r.penalty_reason ?? '', r.notes ?? ''
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
      <AdminNav />
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Lead & Quote Management</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Status:</Label>
            <select 
              value={leadStatusFilter} 
              onChange={(e) => {
                setLeadStatusFilter(e.target.value);
                load(showPenalizedOnly, e.target.value, leadSourceFilter);
              }}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="all">All Status</option>
              <option value="downloaded">Downloaded</option>
              <option value="scheduled">Scheduled</option>
              <option value="contacted">Contacted</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm">Source:</Label>
            <select 
              value={leadSourceFilter} 
              onChange={(e) => {
                setLeadSourceFilter(e.target.value);
                load(showPenalizedOnly, leadStatusFilter, e.target.value);
              }}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="all">All Sources</option>
              <option value="pdf_download">PDF Download</option>
              <option value="consultation">Consultation</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="penalized-only"
              checked={showPenalizedOnly}
              onCheckedChange={(checked) => {
                const on = Boolean(checked);
                setShowPenalizedOnly(on);
                const params = new URLSearchParams(searchParams);
                if (on) params.set('penalized', '1');
                else params.delete('penalized');
                setSearchParams(params);
                load(on, leadStatusFilter, leadSourceFilter);
              }}
            />
            <Label htmlFor="penalized-only" className="text-sm">Show penalized only</Label>
          </div>
          <Badge variant="secondary">Penalized: {showPenalizedOnly ? rows.length : penalizedTotal}</Badge>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => load(showPenalizedOnly, leadStatusFilter, leadSourceFilter)}>Refresh</Button>
            <Button onClick={downloadCSV}><Download className="w-4 h-4 mr-2"/>Download CSV</Button>
          </div>
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
                <TableHead>Lead Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Trade-In</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={9}>Loading...</TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9}>{showPenalizedOnly ? 'No penalized quotes found.' : 'No leads found.'}</TableCell>
                </TableRow>
              ) : (
                rows.map((r) => {
                  const penalty = !!r.penalty_applied;
                  const percent = r.penalty_factor != null ? Math.round((1 - Number(r.penalty_factor)) * 100) : null;
                  const getStatusBadge = (status?: string) => {
                    switch (status) {
                      case 'downloaded': return <Badge variant="secondary">Downloaded</Badge>;
                      case 'scheduled': return <Badge variant="default">Scheduled</Badge>;
                      case 'contacted': return <Badge variant="outline">Contacted</Badge>;
                      case 'closed': return <Badge variant="destructive">Closed</Badge>;
                      default: return <Badge variant="secondary">Unknown</Badge>;
                    }
                  };
                  return (
                    <TableRow key={r.id} className="cursor-pointer" onClick={() => navigate(`/admin/quotes/${r.id}`)}>
                      <TableCell>{r.created_at ? new Date(r.created_at).toLocaleString() : '-'}</TableCell>
                      <TableCell>{r.customer_name || (r.anonymous_session_id ? 'Anonymous Lead' : 'Unknown')}</TableCell>
                      <TableCell>{r.customer_email || '-'}</TableCell>
                      <TableCell>{getStatusBadge(r.lead_status)}</TableCell>
                      <TableCell>
                        <Badge variant={r.lead_source === 'pdf_download' ? 'outline' : 'default'}>
                          {r.lead_source === 'pdf_download' ? 'PDF' : 'Consult'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${
                          (r.lead_score || 0) >= 70 ? 'text-green-600' :
                          (r.lead_score || 0) >= 40 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {r.lead_score || 0}
                        </span>
                      </TableCell>
                      <TableCell>{fmt(r.final_price)}</TableCell>
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
                      <TableCell>
                        {r.contact_attempts && r.contact_attempts > 0 && (
                          <Badge variant="outline" className="text-xs">
                            Contacted {r.contact_attempts}x
                          </Badge>
                        )}
                      </TableCell>
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
