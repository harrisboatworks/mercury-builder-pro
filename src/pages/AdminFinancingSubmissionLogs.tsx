import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminNav from '@/components/admin/AdminNav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, FileSpreadsheet, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

type Outcome = 'all' | 'success' | 'failure';

interface LogRow {
  id: string;
  created_at: string;
  stage: string;
  outcome: string;
  correlation_id: string | null;
  application_id: string | null;
  user_id: string | null;
  error_code: string | null;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
}

const todayLocalISO = () => new Date().toISOString().slice(0, 10);
const daysAgoISO = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

const csvEscape = (val: unknown): string => {
  if (val === null || val === undefined) return '';
  const s = typeof val === 'string' ? val : typeof val === 'object' ? JSON.stringify(val) : String(val);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const buildCsv = (rows: LogRow[]): string => {
  const headers = [
    'created_at',
    'correlation_id',
    'stage',
    'outcome',
    'application_id',
    'user_id',
    'error_code',
    'error_message',
    'metadata',
  ];
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push([
      r.created_at,
      r.correlation_id,
      r.stage,
      r.outcome,
      r.application_id,
      r.user_id,
      r.error_code,
      r.error_message,
      r.metadata,
    ].map(csvEscape).join(','));
  }
  return lines.join('\n');
};

const downloadBlob = (filename: string, contents: string) => {
  const blob = new Blob([contents], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export default function AdminFinancingSubmissionLogs() {
  const [from, setFrom] = useState<string>(daysAgoISO(7));
  const [to, setTo] = useState<string>(todayLocalISO());
  const [outcome, setOutcome] = useState<Outcome>('all');
  const [previewing, setPreviewing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [preview, setPreview] = useState<LogRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateRange = (): { fromIso: string; toIso: string } | null => {
    if (!from || !to) {
      setError('Please choose both a From and To date.');
      return null;
    }
    if (from > to) {
      setError('From date must be on or before To date.');
      return null;
    }
    setError(null);
    // Inclusive end-of-day
    return {
      fromIso: new Date(`${from}T00:00:00`).toISOString(),
      toIso: new Date(`${to}T23:59:59.999`).toISOString(),
    };
  };

  const fetchLogs = async (limit: number): Promise<LogRow[]> => {
    const range = validateRange();
    if (!range) return [];
    let query = supabase
      .from('financing_submission_logs')
      .select('id, created_at, stage, outcome, correlation_id, application_id, user_id, error_code, error_message, metadata')
      .gte('created_at', range.fromIso)
      .lte('created_at', range.toIso)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (outcome !== 'all') query = query.eq('outcome', outcome);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as LogRow[];
  };

  const handlePreview = async () => {
    setPreviewing(true);
    try {
      const rows = await fetchLogs(50);
      setPreview(rows);
      if (rows.length === 0) toast.info('No logs found for that range.');
    } catch (e: any) {
      console.error(e);
      toast.error(`Preview failed: ${e?.message || 'Unknown error'}`);
    } finally {
      setPreviewing(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      // Page through in case > 1000
      const range = validateRange();
      if (!range) return;
      const pageSize = 1000;
      const all: LogRow[] = [];
      for (let offset = 0; offset < 50000; offset += pageSize) {
        let query = supabase
          .from('financing_submission_logs')
          .select('id, created_at, stage, outcome, correlation_id, application_id, user_id, error_code, error_message, metadata')
          .gte('created_at', range.fromIso)
          .lte('created_at', range.toIso)
          .order('created_at', { ascending: false })
          .range(offset, offset + pageSize - 1);
        if (outcome !== 'all') query = query.eq('outcome', outcome);
        const { data, error } = await query;
        if (error) throw error;
        const batch = (data ?? []) as LogRow[];
        all.push(...batch);
        if (batch.length < pageSize) break;
      }
      if (all.length === 0) {
        toast.info('No logs to export for that range.');
        return;
      }
      const csv = buildCsv(all);
      const filename = `financing_submission_logs_${from}_to_${to}${outcome !== 'all' ? `_${outcome}` : ''}.csv`;
      downloadBlob(filename, csv);
      toast.success(`Exported ${all.length} row${all.length === 1 ? '' : 's'}.`);
    } catch (e: any) {
      console.error(e);
      toast.error(`Export failed: ${e?.message || 'Unknown error'}`);
    } finally {
      setExporting(false);
    }
  };

  const setQuickRange = (days: number) => {
    setFrom(daysAgoISO(days));
    setTo(todayLocalISO());
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileSpreadsheet className="h-8 w-8 text-primary" />
            Financing Submission Logs
          </h1>
          <p className="text-muted-foreground mt-2">
            Export submission and SIN encryption telemetry by date range to share with the team.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter</CardTitle>
            <CardDescription>
              Times are interpreted in your local timezone, inclusive of the From and To days.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="from">From</Label>
                <Input id="from" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="to">To</Label>
                <Input id="to" type="date" value={to} min={from} max={todayLocalISO()} onChange={(e) => setTo(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="outcome">Outcome</Label>
                <Select value={outcome} onValueChange={(v) => setOutcome(v as Outcome)}>
                  <SelectTrigger id="outcome">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="failure">Failures only</SelectItem>
                    <SelectItem value="success">Successes only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setQuickRange(0)}>Today</Button>
              <Button variant="outline" size="sm" onClick={() => setQuickRange(7)}>Last 7 days</Button>
              <Button variant="outline" size="sm" onClick={() => setQuickRange(30)}>Last 30 days</Button>
              <Button variant="outline" size="sm" onClick={() => setQuickRange(90)}>Last 90 days</Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Invalid range</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-wrap gap-2">
              <Button onClick={handlePreview} variant="outline" disabled={previewing || exporting}>
                {previewing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Preview (first 50)
              </Button>
              <Button onClick={handleExport} disabled={previewing || exporting}>
                {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Export CSV
              </Button>
            </div>
          </CardContent>
        </Card>

        {preview && (
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                Showing the {preview.length} most recent matching row{preview.length === 1 ? '' : 's'}. Export to get the full result set.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {preview.length === 0 ? (
                <p className="text-sm text-muted-foreground">No logs in this range.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">When</th>
                        <th className="text-left p-2 font-medium">Reference</th>
                        <th className="text-left p-2 font-medium">Stage</th>
                        <th className="text-left p-2 font-medium">Outcome</th>
                        <th className="text-left p-2 font-medium">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((r) => (
                        <tr key={r.id} className="border-b">
                          <td className="p-2 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                          <td className="p-2 font-mono">{r.correlation_id || '—'}</td>
                          <td className="p-2">{r.stage}</td>
                          <td className="p-2">
                            <Badge variant={r.outcome === 'success' ? 'default' : 'destructive'}>{r.outcome}</Badge>
                          </td>
                          <td className="p-2">
                            {r.error_code ? (
                              <span><span className="font-mono">{r.error_code}</span>{r.error_message ? ` — ${r.error_message}` : ''}</span>
                            ) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
