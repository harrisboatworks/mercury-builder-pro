import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExternalLink, Play, FileText, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ParseResult {
  success: boolean;
  rows_found_raw: number;
  rows_parsed: number;
  rows_parsed_total: number;
  rows_created: number;
  rows_updated: number;
  rows_rejected: number;
  rows_skipped_total: number;
  rows_skipped_by_reason: Record<string, number>;
  top_skip_reasons: string[];
  reject_reasons?: string[];
  sample_created?: Array<{
    model: string;
    model_key: string;
    family: string;
    horsepower: number;
    dealer_price: number;
    msrp: number;
  }>;
  sample_skipped?: Array<{
    line: number;
    reason: string;
    raw_model: string;
    model_key: string;
    dealer_price_raw: string;
  }>;
  html_saved_url?: string;
  source_kind?: string;
  error?: any;
}

interface BrochureSummary {
  total_brochure_count: number;
  families: Array<{ family: string; count: number }>;
  latest_samples: Array<{
    model: string;
    model_key: string;
    dealer_price: number;
    msrp: number;
    created_at: string;
  }>;
}

export default function AdminBrochureTest() {
  const { toast } = useToast();
  const [dryRunResult, setDryRunResult] = useState<ParseResult | null>(null);
  const [ingestResult, setIngestResult] = useState<ParseResult | null>(null);
  const [summary, setSummary] = useState<BrochureSummary | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Load brochure summary on page load
  useEffect(() => {
    loadBrochureSummary();
  }, []);

  const loadBrochureSummary = async () => {
    try {
      // Get total brochure count
      const { count: totalCount } = await supabase
        .from('motor_models')
        .select('*', { count: 'exact', head: true })
        .eq('is_brochure', true);

      // Get family counts
      const { data: familyData } = await supabase
        .from('motor_models')
        .select('family')
        .eq('is_brochure', true)
        .not('family', 'is', null);
      
      const familyCounts = (familyData || []).reduce((acc: Record<string, number>, item) => {
        acc[item.family] = (acc[item.family] || 0) + 1;
        return acc;
      }, {});

      const families = Object.entries(familyCounts).map(([family, count]) => ({
        family,
        count: count as number
      }));

      // Get latest 10 samples
      const { data: samples } = await supabase
        .from('motor_models')
        .select('model, model_key, dealer_price, msrp, created_at')
        .eq('is_brochure', true)
        .order('created_at', { ascending: false })
        .limit(10);

      setSummary({
        total_brochure_count: totalCount || 0,
        families: families.sort((a, b) => b.count - a.count),
        latest_samples: samples || []
      });
    } catch (error) {
      console.error('Error loading brochure summary:', error);
      toast({
        title: "Error",
        description: "Failed to load brochure summary",
        variant: "destructive"
      });
    }
  };

  const runPriceListParser = async (dryRun: boolean) => {
    setIsRunning(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('seed-from-pricelist', {
        body: {
          url: 'https://www.harrisboatworks.ca/mercurypricelist',
          dry_run: dryRun,
          msrp_markup: 1.10,
          parse_mode: 'auto'
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`${error.status}: ${error.message}`);
      }

      const result: ParseResult = {
        success: data.success,
        rows_found_raw: data.rows_found_raw || 0,
        rows_parsed: data.rows_parsed || 0,
        rows_parsed_total: data.rows_parsed_total || 0,
        rows_created: data.rows_created || 0,
        rows_updated: data.rows_updated || 0,
        rows_rejected: data.rows_rejected || 0,
        rows_skipped_total: data.rows_skipped_total || 0,
        rows_skipped_by_reason: data.rows_skipped_by_reason || {},
        top_skip_reasons: data.top_skip_reasons || [],
        reject_reasons: data.reject_reasons || [],
        sample_created: data.sample_created || data.sample_models || [],
        sample_skipped: data.sample_skipped || [],
        html_saved_url: data.artifacts?.html_url,
        source_kind: data.source_kind
      };

      if (dryRun) {
        setDryRunResult(result);
        toast({
          title: "Dry Run Complete",
          description: `Found ${result.rows_found_raw} raw, parsed ${result.rows_parsed} (would create ${result.rows_created}, update ${result.rows_updated})`
        });
      } else {
        setIngestResult(result);
        toast({
          title: "Ingest Complete", 
          description: `Parsed ${result.rows_parsed} rows → Created ${result.rows_created} and updated ${result.rows_updated} brochure models`,
          variant: result.rows_created > 0 ? "default" : "destructive"
        });
        // Reload summary after successful ingest
        await loadBrochureSummary();
      }

    } catch (error: any) {
      console.error('Price list parser error:', error);
      const errorResult: ParseResult = {
        success: false,
        rows_found_raw: 0,
        rows_parsed: 0,
        rows_parsed_total: 0,
        rows_created: 0,
        rows_updated: 0,
        rows_rejected: 0,
        rows_skipped_total: 0,
        rows_skipped_by_reason: {},
        top_skip_reasons: [],
        error: error.message
      };
      
      if (dryRun) {
        setDryRunResult(errorResult);
      } else {
        setIngestResult(errorResult);
      }
      
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const exportBrochureCsv = async () => {
    try {
      const { data } = await supabase
        .from('motor_models')
        .select('model, model_key, family, horsepower, fuel_type, model_code, dealer_price, msrp')
        .eq('is_brochure', true)
        .order('family', { ascending: true })
        .order('horsepower', { ascending: true });

      if (!data || data.length === 0) {
        toast({
          title: "No Data",
          description: "No brochure models found to export",
          variant: "destructive"
        });
        return;
      }

      // Create CSV content
      const headers = ['model', 'model_key', 'family', 'horsepower', 'fuel_type', 'model_code', 'dealer_price', 'msrp'];
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => `"${row[header as keyof typeof row] || ''}"`).join(','))
      ].join('\n');

      // Download the CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `brochure-models-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `Exported ${data.length} brochure models to CSV`
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export brochure models",
        variant: "destructive"
      });
    }
  };

  const ResultCard = ({ title, result, variant }: { title: string; result: ParseResult | null; variant: 'dry-run' | 'ingest' }) => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {variant === 'dry-run' ? <FileText className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          {title}
        </CardTitle>
        <CardDescription>
          {variant === 'dry-run' ? 'Preview parsing without writing to database' : 'Parse and write brochure models to database'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {result ? (
          <div className="space-y-4">
            {result.success ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{result.rows_found_raw || result.rows_parsed_total || 0}</div>
                    <div className="text-sm text-muted-foreground">Raw Found</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{result.rows_parsed || 0}</div>
                    <div className="text-sm text-muted-foreground">Parsed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{result.rows_created}</div>
                    <div className="text-sm text-muted-foreground">Created</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{result.rows_updated}</div>
                    <div className="text-sm text-muted-foreground">Updated</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{result.rows_skipped_total || result.rows_rejected}</div>
                    <div className="text-sm text-muted-foreground">Skipped</div>
                  </div>
                </div>

                {result.html_saved_url && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{result.source_kind}</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(result.html_saved_url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Saved HTML
                    </Button>
                  </div>
                )}

                {result.top_skip_reasons && result.top_skip_reasons.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-sm mb-2">Top Skip Reasons:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {result.top_skip_reasons.map((reason, idx) => (
                        <li key={idx}>• {reason}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.reject_reasons && result.reject_reasons.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-sm mb-2">Reject Reasons:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {result.reject_reasons.slice(0, 5).map((reason, idx) => (
                        <li key={idx}>• {reason}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.sample_created && result.sample_created.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-sm mb-2">Sample Created (First 10):</h4>
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Model</TableHead>
                            <TableHead>Model Key</TableHead>
                            <TableHead>Family</TableHead>
                            <TableHead>HP</TableHead>
                            <TableHead>Dealer Price</TableHead>
                            <TableHead>MSRP</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {result.sample_created.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">{item.model}</TableCell>
                              <TableCell className="font-mono text-xs">{item.model_key}</TableCell>
                              <TableCell>
                                <Badge variant="secondary">{item.family}</Badge>
                              </TableCell>
                              <TableCell>{item.horsepower}</TableCell>
                              <TableCell>${item.dealer_price?.toLocaleString()}</TableCell>
                              <TableCell>${item.msrp?.toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                {result.sample_skipped && result.sample_skipped.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold text-sm mb-2">Sample Skipped (First 10):</h4>
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Line</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Raw Model</TableHead>
                            <TableHead>Model Key</TableHead>
                            <TableHead>Price Raw</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {result.sample_skipped.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{item.line}</TableCell>
                              <TableCell>
                                <Badge variant="destructive">{item.reason}</Badge>
                              </TableCell>
                              <TableCell className="font-medium">{item.raw_model}</TableCell>
                              <TableCell className="font-mono text-xs">{item.model_key}</TableCell>
                              <TableCell>{item.dealer_price_raw}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-red-600">
                <h4 className="font-semibold">Error:</h4>
                <p>{result.error}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground">No results yet. Click the button above to run.</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Brochure Test</h1>
          <p className="text-muted-foreground">
            Test the price list parser to create brochure models from https://www.harrisboatworks.ca/mercurypricelist
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => runPriceListParser(true)}
            disabled={isRunning}
            variant="outline"
          >
            <FileText className="h-4 w-4 mr-2" />
            Dry Run Price List
          </Button>
          <Button
            onClick={() => runPriceListParser(false)}
            disabled={isRunning}
          >
            <Play className="h-4 w-4 mr-2" />
            Ingest Price List
          </Button>
        </div>
      </div>

      {/* Current Brochure Summary */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>Current Brochure Summary</CardTitle>
            <CardDescription>Overview of existing brochure models in database</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{summary.total_brochure_count}</div>
                <div className="text-sm text-muted-foreground">Total Brochure Models</div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Families:</h4>
                <div className="space-y-1">
                  {summary.families.map(({ family, count }) => (
                    <div key={family} className="flex justify-between items-center">
                      <Badge variant="outline">{family}</Badge>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={loadBrochureSummary}
                  variant="outline"
                  size="sm"
                >
                  Refresh Summary
                </Button>
                <Button
                  onClick={exportBrochureCsv}
                  variant="outline"
                  size="sm"
                  disabled={summary.total_brochure_count === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>

            {summary.latest_samples.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-2">Latest 10 Brochure Models:</h4>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Model</TableHead>
                        <TableHead>Model Key</TableHead>
                        <TableHead>Dealer Price</TableHead>
                        <TableHead>MSRP</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summary.latest_samples.map((sample, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{sample.model}</TableCell>
                          <TableCell className="font-mono text-xs">{sample.model_key}</TableCell>
                          <TableCell>${sample.dealer_price?.toLocaleString()}</TableCell>
                          <TableCell>${sample.msrp?.toLocaleString()}</TableCell>
                          <TableCell>{new Date(sample.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results */}
      <ResultCard title="Dry Run Results" result={dryRunResult} variant="dry-run" />
      <ResultCard title="Ingest Results" result={ingestResult} variant="ingest" />
    </div>
  );
}