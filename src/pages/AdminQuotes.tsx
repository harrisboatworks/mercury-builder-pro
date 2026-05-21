import { useEffect, useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Download, Plus, FilePlus, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AdminNav from '@/components/admin/AdminNav';
import { useQuote } from '@/contexts/QuoteContext';

interface UnifiedQuoteRow {
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
  lead_status?: string;
  lead_source?: string;
  lead_score?: number;
  anonymous_session_id?: string;
  contact_attempts?: number;
  last_contact_attempt?: string | null;
  notes?: string | null;
  follow_up_date?: string | null;
  // Unified source tracking
  _source: 'customer_quotes' | 'saved_quotes';
  _source_label: string;
  _motor_info?: string;
  _deposit_status?: string | null;
  _is_soft_lead?: boolean;
  _reference_number?: string | null;
}

const AdminQuotes = () => {
  const [customerQuoteRows, setCustomerQuoteRows] = useState<UnifiedQuoteRow[]>([]);
  const [savedQuoteRows, setSavedQuoteRows] = useState<UnifiedQuoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { dispatch } = useQuote();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showPenalizedOnly, setShowPenalizedOnly] = useState(false);
  const [penalizedTotal, setPenalizedTotal] = useState(0);
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>('all');
  const [leadSourceFilter, setLeadSourceFilter] = useState<string>('all');
  const [quoteSourceFilter, setQuoteSourceFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hpFilter, setHpFilter] = useState<string>('all');
  const [modelFilter, setModelFilter] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 50;

  // Parse HP from "40HP 40 ELPT Command Thrust FourStroke"
  const parseHp = (motorInfo: string): number | null => {
    if (!motorInfo) return null;
    const m = motorInfo.match(/^(\d+(?:\.\d+)?)\s*HP/i);
    return m ? parseFloat(m[1]) : null;
  };
  const hpInBucket = (hp: number | null, bucket: string): boolean => {
    if (bucket === 'all') return true;
    if (hp == null) return false;
    switch (bucket) {
      case '2.5-9.9': return hp >= 2.5 && hp <= 9.9;
      case '15-25': return hp >= 15 && hp <= 25;
      case '30-60': return hp >= 30 && hp <= 60;
      case '75-115': return hp >= 75 && hp <= 115;
      case '150+': return hp >= 150;
      default: return true;
    }
  };
  const dateInRange = (created: string | null, range: string): boolean => {
    if (range === 'all' || !created) return true;
    const d = new Date(created).getTime();
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    if (range === 'today') {
      const start = new Date(); start.setHours(0,0,0,0);
      return d >= start.getTime();
    }
    if (range === '7d') return d >= now - 7 * day;
    if (range === '30d') return d >= now - 30 * day;
    return true;
  };

  useEffect(() => {
    document.title = 'Quotes | Admin';
    let desc = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!desc) { desc = document.createElement('meta'); desc.name = 'description'; document.head.appendChild(desc); }
    desc.content = 'View and export customer quotes with trade-in penalty details.';
    let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    canonical.href = window.location.origin + '/admin/quotes';
  }, []);

  const normalizeSavedQuote = (sq: any): UnifiedQuoteRow => {
    const qs = sq.quote_state || {};
    const motor = qs.motor || {};
    const isAnonymous = sq.email === 'anonymous@soft-lead.local' || sq.email === 'pdf-download@placeholder.com';
    const isSoftLead = sq.is_soft_lead === true;
    const customerName = qs.customerName || (isAnonymous ? 'Anonymous Visitor' : sq.email?.split('@')[0] || 'Unknown');
    const motorInfo = motor.model
      ? `${motor.hp || ''}HP ${motor.model || ''}`
      : qs.motorModel || '';

    let sourceLabel = 'Saved Quote';
    if (isSoftLead || sq.email === 'anonymous@soft-lead.local') sourceLabel = 'Anonymous';
    if (sq.email === 'pdf-download@placeholder.com') sourceLabel = 'PDF Download';
    if (sq.deposit_status === 'paid') sourceLabel = 'Deposit Paid';

    return {
      id: sq.id,
      created_at: sq.created_at,
      customer_name: customerName,
      customer_email: isAnonymous ? '' : sq.email,
      customer_phone: qs.customerPhone || null,
      base_price: qs.basePrice || motor.price || 0,
      final_price: qs.finalPrice || qs.frozenPricing?.total || 0,
      deposit_amount: sq.deposit_amount || 0,
      loan_amount: 0,
      monthly_payment: 0,
      term_months: 0,
      total_cost: qs.finalPrice || qs.frozenPricing?.total || 0,
      tradein_value_pre_penalty: qs.tradeInInfo?.estimatedValue || null,
      tradein_value_final: qs.tradeInInfo?.finalValue || null,
      penalty_applied: false,
      lead_status: sq.deposit_status === 'paid' ? 'deposit_paid' : (isSoftLead || isAnonymous ? 'browsing' : 'saved'),
      lead_source: sq.email === 'pdf-download@placeholder.com' ? 'pdf_download' : 'website',
      lead_score: sq.deposit_status === 'paid' ? 90 : (isAnonymous ? 10 : 50),
      _source: 'saved_quotes',
      _source_label: sourceLabel,
      _motor_info: motorInfo,
      _deposit_status: sq.deposit_status,
      _is_soft_lead: isSoftLead || isAnonymous,
      _reference_number: sq.reference_number || null,
    };
  };

  const load = async (penalizedOnly: boolean = showPenalizedOnly, statusFilter: string = leadStatusFilter, sourceFilter: string = leadSourceFilter) => {
    setLoading(true);

    // Fetch customer_quotes
    let cqQuery = supabase
      .from('customer_quotes')
      .select('*')
      .order('created_at', { ascending: false });
    if (penalizedOnly) cqQuery = cqQuery.eq('penalty_applied', true);
    if (statusFilter && statusFilter !== 'all') cqQuery = cqQuery.eq('lead_status', statusFilter);
    if (sourceFilter && sourceFilter !== 'all') cqQuery = cqQuery.eq('lead_source', sourceFilter);

    // Fetch saved_quotes
    const sqQuery = (supabase as any)
      .from('saved_quotes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);

    const [cqResult, sqResult, penalizedResult] = await Promise.all([
      cqQuery,
      sqQuery,
      supabase.from('customer_quotes').select('*', { count: 'exact', head: true }).eq('penalty_applied', true),
    ]);

    setPenalizedTotal(penalizedResult.count || 0);

    if (cqResult.error) {
      toast({ title: 'Error', description: 'Failed to load customer quotes', variant: 'destructive' });
    }

    const cqRows: UnifiedQuoteRow[] = (cqResult.data || []).map((r: any) => ({
      ...r,
      _source: 'customer_quotes' as const,
      _source_label: 'Lead',
      _motor_info: '',
      _deposit_status: null,
      _is_soft_lead: false,
      _reference_number: null,
    }));

    const sqRows: UnifiedQuoteRow[] = (sqResult.data || []).map(normalizeSavedQuote);

    setCustomerQuoteRows(cqRows);
    setSavedQuoteRows(sqRows);
    setLoading(false);
  };

  useEffect(() => {
    const initial = (searchParams.get('penalized') === '1');
    setShowPenalizedOnly(initial);
    load(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Merge and filter
  const rows = useMemo(() => {
    let merged: UnifiedQuoteRow[] = [];

    if (quoteSourceFilter === 'all') {
      merged = [...customerQuoteRows, ...savedQuoteRows];
    } else if (quoteSourceFilter === 'leads') {
      merged = customerQuoteRows;
    } else if (quoteSourceFilter === 'saved') {
      merged = savedQuoteRows.filter(r => !r._is_soft_lead && r._deposit_status !== 'paid');
    } else if (quoteSourceFilter === 'anonymous') {
      merged = savedQuoteRows.filter(r => r._is_soft_lead);
    } else if (quoteSourceFilter === 'deposits') {
      merged = savedQuoteRows.filter(r => r._deposit_status === 'paid');
    }

    // Sort by date descending
    merged.sort((a, b) => {
      const da = a.created_at ? new Date(a.created_at).getTime() : 0;
      const db = b.created_at ? new Date(b.created_at).getTime() : 0;
      return db - da;
    });

    // Text search (with HBW- ref prioritization)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const isRef = /^hbw-?\d+/i.test(q);
      if (isRef) {
        const normalized = q.replace(/^hbw-?/i, 'hbw-');
        merged = merged.filter(r => (r._reference_number || '').toLowerCase().includes(normalized));
      } else {
        merged = merged.filter(r =>
          (r.customer_name || '').toLowerCase().includes(q) ||
          (r.customer_email || '').toLowerCase().includes(q) ||
          (r._motor_info || '').toLowerCase().includes(q) ||
          (r._reference_number || '').toLowerCase().includes(q)
        );
      }
    }

    // HP filter
    if (hpFilter !== 'all') {
      merged = merged.filter(r => hpInBucket(parseHp(r._motor_info || ''), hpFilter));
    }

    // Model contains filter
    if (modelFilter.trim()) {
      const mf = modelFilter.toLowerCase().trim();
      merged = merged.filter(r => (r._motor_info || '').toLowerCase().includes(mf));
    }

    // Date range filter
    if (dateRangeFilter !== 'all') {
      merged = merged.filter(r => dateInRange(r.created_at, dateRangeFilter));
    }

    return merged;
  }, [customerQuoteRows, savedQuoteRows, quoteSourceFilter, searchQuery, hpFilter, modelFilter, dateRangeFilter]);

  // Reset page on filter change
  useEffect(() => { setCurrentPage(1); }, [searchQuery, hpFilter, modelFilter, dateRangeFilter, quoteSourceFilter]);

  // Paginate
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pagedRows = rows.slice(pageStart, pageStart + PAGE_SIZE);

  // Recent anonymous quotes grouped by motor (last 24h)
  const recentAnonGroups = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const anon = savedQuoteRows.filter(r =>
      r._is_soft_lead && r.created_at && new Date(r.created_at).getTime() >= cutoff
    );
    const groups = new Map<string, UnifiedQuoteRow[]>();
    anon.forEach(r => {
      const key = r._motor_info || 'Unknown motor';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(r);
    });
    return Array.from(groups.entries())
      .map(([motor, items]) => ({ motor, items }))
      .sort((a, b) => b.items.length - a.items.length);
  }, [savedQuoteRows]);
  const [showAnonPanel, setShowAnonPanel] = useState(true);

  const fmt = (n: number | null | undefined) => (n == null ? '-' : `$${Math.round(Number(n)).toLocaleString()}`);

  const toCSV = (items: UnifiedQuoteRow[]) => {
    const headers = [
      'id','source','created_at','customer_name','customer_email','customer_phone','lead_status','lead_source','lead_score','motor_info','final_price','base_price','deposit_amount','deposit_status','tradein_value_pre_penalty','tradein_value_final','penalty_applied','penalty_factor','penalty_reason','notes'
    ];
    const esc = (v: any) => {
      const s = v == null ? '' : String(v);
      if (s.includes('"')) return '"' + s.replace(/"/g, '""') + '"';
      if (s.includes(',') || s.includes('\n')) return '"' + s + '"';
      return s;
    };
    const csvRows = items.map(r => [
      r.id, r._source_label, r.created_at || '', r.customer_name || '', r.customer_email || '', r.customer_phone || '', r.lead_status || '', r.lead_source || '', r.lead_score || '', r._motor_info || '', r.final_price, r.base_price, r.deposit_amount, r._deposit_status || '', r.tradein_value_pre_penalty ?? '', r.tradein_value_final ?? '', r.penalty_applied ? 'true' : 'false', r.penalty_factor ?? '', r.penalty_reason ?? '', r.notes ?? ''
    ].map(esc).join(','));
    return [headers.join(','), ...csvRows].join('\n');
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

  const getSourceBadge = (row: UnifiedQuoteRow) => {
    switch (row._source_label) {
      case 'Deposit Paid':
        return <Badge className="bg-green-600 text-white text-[10px]">💰 Deposit</Badge>;
      case 'Anonymous':
        return <Badge variant="outline" className="text-[10px]">👤 Anonymous</Badge>;
      case 'PDF Download':
        return <Badge variant="outline" className="text-[10px]">📄 PDF</Badge>;
      case 'Saved Quote':
        return <Badge variant="secondary" className="text-[10px]">💾 Saved</Badge>;
      case 'Lead':
      default:
        return <Badge variant="default" className="text-[10px]">📋 Lead</Badge>;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'downloaded': return <Badge variant="secondary">Downloaded</Badge>;
      case 'scheduled': return <Badge variant="default">Scheduled</Badge>;
      case 'contacted': return <Badge variant="outline">Contacted</Badge>;
      case 'closed': return <Badge variant="destructive">Closed</Badge>;
      case 'deposit_paid': return <Badge className="bg-green-600 text-white">Deposit Paid</Badge>;
      case 'saved': return <Badge variant="secondary">Saved</Badge>;
      case 'browsing': return <Badge variant="outline">Browsing</Badge>;
      default: return <Badge variant="secondary">{status || 'Unknown'}</Badge>;
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <AdminNav />
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Lead & Quote Management</h1>
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate('/admin/quote/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Quote
            </Button>
            <Button variant="secondary" onClick={() => load(showPenalizedOnly, leadStatusFilter, leadSourceFilter)}>Refresh</Button>
            <Button onClick={downloadCSV}><Download className="w-4 h-4 mr-2"/>CSV</Button>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name, email, motor, ref # (e.g. HBW-00827)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          {/* Quote Source Filter */}
          <div className="flex items-center gap-1.5">
            <Label className="text-sm whitespace-nowrap">View:</Label>
            <select
              value={quoteSourceFilter}
              onChange={(e) => setQuoteSourceFilter(e.target.value)}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="all">All ({customerQuoteRows.length + savedQuoteRows.length})</option>
              <option value="leads">Leads ({customerQuoteRows.length})</option>
              <option value="saved">Saved Quotes ({savedQuoteRows.filter(r => !r._is_soft_lead && r._deposit_status !== 'paid').length})</option>
              <option value="anonymous">Anonymous / PDF ({savedQuoteRows.filter(r => r._is_soft_lead).length})</option>
              <option value="deposits">Deposits ({savedQuoteRows.filter(r => r._deposit_status === 'paid').length})</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
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

          {/* Penalized */}
          <div className="flex items-center gap-1.5">
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
            <Label htmlFor="penalized-only" className="text-sm">Penalized only</Label>
            <Badge variant="secondary" className="text-xs">{showPenalizedOnly ? customerQuoteRows.length : penalizedTotal}</Badge>
          </div>
        </div>

        {/* Secondary filter row: HP / Model / Date */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Label className="text-sm">HP:</Label>
            <select
              value={hpFilter}
              onChange={(e) => setHpFilter(e.target.value)}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="all">All HP</option>
              <option value="2.5-9.9">2.5 to 9.9</option>
              <option value="15-25">15 to 25</option>
              <option value="30-60">30 to 60</option>
              <option value="75-115">75 to 115</option>
              <option value="150+">150+</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <Label className="text-sm whitespace-nowrap">Model contains:</Label>
            <Input
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
              placeholder="e.g. Command Thrust"
              className="h-8 w-48 text-sm"
            />
          </div>

          <div className="flex items-center gap-1">
            <Label className="text-sm mr-1">Date:</Label>
            {[
              { v: 'today', l: 'Today' },
              { v: '7d', l: 'Last 7d' },
              { v: '30d', l: 'Last 30d' },
              { v: 'all', l: 'All' },
            ].map(opt => (
              <Button
                key={opt.v}
                variant={dateRangeFilter === opt.v ? 'default' : 'outline'}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setDateRangeFilter(opt.v)}
              >
                {opt.l}
              </Button>
            ))}
          </div>

          <div className="text-xs text-muted-foreground ml-auto">
            Showing {rows.length === 0 ? 0 : pageStart + 1}{rows.length > 0 ? `-${Math.min(pageStart + PAGE_SIZE, rows.length)}` : ''} of {rows.length}
          </div>
        </div>
      </div>

      {/* Recent anonymous quotes panel (last 24h) */}
      {recentAnonGroups.length > 0 && (
        <Card className="p-3 mb-4 border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20">
          <button
            type="button"
            onClick={() => setShowAnonPanel(v => !v)}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">👤 Anonymous, last 24h</Badge>
              <span className="text-sm font-medium">
                {recentAnonGroups.reduce((s, g) => s + g.items.length, 0)} quotes across {recentAnonGroups.length} models
              </span>
              <span className="text-xs text-muted-foreground">Useful when a caller can't find their quote</span>
            </div>
            <span className="text-xs text-muted-foreground">{showAnonPanel ? 'Hide' : 'Show'}</span>
          </button>
          {showAnonPanel && (
            <div className="mt-3 space-y-2">
              {recentAnonGroups.map(g => {
                const refs = g.items
                  .map(i => i._reference_number)
                  .filter(Boolean) as string[];
                const refRange = refs.length === 0
                  ? '-'
                  : refs.length === 1
                    ? refs[0]
                    : `${refs[refs.length - 1]} to ${refs[0]}`;
                return (
                  <div key={g.motor} className="flex items-center justify-between gap-3 text-sm bg-background/60 rounded px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="secondary" className="text-[10px]">{g.items.length}x</Badge>
                      <span className="font-medium truncate">{g.motor}</span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{refRange}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        setModelFilter(g.motor.replace(/^\d+(\.\d+)?HP\s*/i, ''));
                        setDateRangeFilter('today');
                        setQuoteSourceFilter('anonymous');
                      }}
                    >
                      View configurations
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      <Card className="p-4">

        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead>Ref #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Motor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Trade-In</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={11}>Loading...</TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11}>{searchQuery ? 'No results matching search.' : 'No quotes found.'}</TableCell>
                </TableRow>
              ) : (
                pagedRows.map((r) => {
                  const penalty = !!r.penalty_applied;
                  const percent = r.penalty_factor != null ? Math.round((1 - Number(r.penalty_factor)) * 100) : null;
                  return (
                    <TableRow
                      key={`${r._source}-${r.id}`}
                      className="cursor-pointer"
                      onClick={() => navigate(`/admin/quotes/${r.id}`)}
                    >
                      <TableCell className="text-xs font-mono font-medium text-primary">{r._reference_number || '-'}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{r.created_at ? new Date(r.created_at).toLocaleString() : '-'}</TableCell>
                      <TableCell>{getSourceBadge(r)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {r.customer_name}
                          {r.follow_up_date && (() => {
                            const isOverdue = new Date(r.follow_up_date) < new Date();
                            const isToday = new Date(r.follow_up_date).toDateString() === new Date().toDateString();
                            return (
                              <Badge variant={isOverdue && !isToday ? 'destructive' : isToday ? 'default' : 'secondary'} className="text-[10px] px-1 py-0 ml-1">
                                📅 {isToday ? 'Today' : isOverdue ? 'Overdue' : new Date(r.follow_up_date).toLocaleDateString()}
                              </Badge>
                            );
                          })()}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{r.customer_email || '-'}</TableCell>
                      <TableCell className="text-xs">{r._motor_info || '-'}</TableCell>
                      <TableCell>{getStatusBadge(r.lead_status)}</TableCell>
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
                                  Penalty applied: -{percent}%. {r.penalty_reason}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {r.contact_attempts && r.contact_attempts > 0 && (
                            <Badge variant="outline" className="text-xs">
                              Contacted {r.contact_attempts}x
                            </Badge>
                          )}
                          {r._source === 'customer_quotes' && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      localStorage.removeItem('quoteBuilder');
                                      dispatch({ type: 'RESET_TO_ADMIN_MODE', payload: { editingQuoteId: null } });
                                      setTimeout(() => {
                                        dispatch({ type: 'SET_ADMIN_QUOTE_DATA', payload: {
                                          adminDiscount: 0,
                                          adminNotes: '',
                                          customerNotes: '',
                                          customerName: r.customer_name || '',
                                          customerEmail: r.customer_email || '',
                                          customerPhone: r.customer_phone || ''
                                        }});
                                        navigate('/quote/motor-selection');
                                      }, 50);
                                    }}
                                  >
                                    <FilePlus className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>New quote for {r.customer_name || 'this customer'}</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
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
