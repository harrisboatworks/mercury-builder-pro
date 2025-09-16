import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExternalLink, Play, FileText, Download, Upload, CheckCircle, AlertCircle, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { invokePricelist } from '@/lib/invokeEdge';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';

interface ParseResult {
  ok?: boolean;
  success?: boolean;
  step?: string;
  raw_found?: number;
  parsed?: number;
  would_create?: number;
  would_update?: number;
  rows_created?: number;
  rows_updated?: number;
  message?: string;
  echo?: {
    price_list_url?: string;
    msrp_markup?: number;
    create_missing_brochures?: boolean;
  };
  skip_reasons?: Record<string, number>;
  sample_created?: Array<{
    model_display?: string;
    model_number?: string;
    dealer_price?: number;
    msrp?: number;
  }>;
  error?: any;
}

interface BrochureSummary {
  total_brochure_count: number;
  families: Array<{ family: string; count: number }>;
  latest_samples: Array<{
    id: string;
    model_display?: string;
    model: string;
    model_number?: string;
    mercury_model_no?: string;
    model_key: string;
    family?: string;
    horsepower?: number;
    rigging_code?: string;
    dealer_price: number;
    msrp: number;
    created_at: string;
  }>;
}

export default function AdminBrochureTest() {
  const { toast } = useToast();
  const [dryRunResults, setDryRunResults] = useState<ParseResult | null>(null);
  const [ingestResults, setIngestResults] = useState<ParseResult | null>(null);
  const [summary, setSummary] = useState<BrochureSummary | null>(null);
  const [running, setRunning] = useState(false);
  const [sanityResults, setSanityResults] = useState<any>(null);

  useEffect(() => {
    loadBrochureSummary();
  }, []);

  const loadBrochureSummary = async () => {
    try {
      const { count: totalCount } = await supabase
        .from('motor_models')
        .select('*', { count: 'exact', head: true })
        .eq('is_brochure', true);

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

      const { data: samples } = await supabase
        .from('motor_models')
        .select('id, model_display, model_number, model, mercury_model_no, model_key, family, horsepower, rigging_code, dealer_price, msrp, created_at')
        .eq('is_brochure', true)
        .eq('make', 'Mercury')
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

  const runPriceListParser = async (isDryRun: boolean, markup = 1.0) => {
    setRunning(true);
    try {
      const result = await invokePricelist({
        price_list_url: "https://www.mercurymarine.com/en-us/outboards/",
        dry_run: isDryRun,
        msrp_markup: markup,
        create_missing_brochures: true
      });

      if (isDryRun) {
        setDryRunResults(result);
        toast({
          title: "Dry Run Complete",
          description: `Found ${result.raw_found} raw items, parsed ${result.parsed}. Would create ${result.would_create}, would update ${result.would_update}.`,
        });
      } else {
        setIngestResults(result);
        toast({
          title: "Ingest Complete",
          description: `Created ${result.rows_created} new records, updated ${result.rows_updated} existing records.`,
        });
      }
      
      await loadBrochureSummary();
    } catch (error: any) {
      console.error('Price list operation failed:', error);
      toast({
        title: "Operation Failed",
        description: error.message || 'Unknown error occurred',
        variant: "destructive",
      });
      
      if (isDryRun) {
        setDryRunResults({ error: error.message, step: 'failed' });
      } else {
        setIngestResults({ error: error.message, step: 'failed' });
      }
    } finally {
      setRunning(false);
    }
  };

  const exportBrochureCsv = async () => {
    try {
      setRunning(true);
      
      const { data: models, error } = await supabase
        .from('motor_models')
        .select('model_display, model_number, mercury_model_no, model, model_key, family, horsepower, rigging_code, accessories_included, dealer_price, msrp, created_at')
        .eq('is_brochure', true)
        .eq('make', 'Mercury')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      if (!models || models.length === 0) {
        throw new Error('No brochure models found to export');
      }

      const headers = ['model_display', 'model_number', 'mercury_model_no', 'model', 'model_key', 'family', 'horsepower', 'rigging_code', 'accessories_included', 'dealer_price', 'msrp', 'created_at'];
      const csvRows = [
        headers.join(','),
        ...models.map(row => 
          headers.map(header => {
            let value = row[header as keyof typeof row];
            if (header === 'accessories_included' && Array.isArray(value)) {
              value = value.join('; ');
            }
            if (value === null || value === undefined) {
              value = '';
            }
            return `"${String(value).replace(/"/g, '""')}"`;
          }).join(',')
        )
      ];

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mercury_brochure_models.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `Exported ${models.length} brochure models successfully`
      });
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setRunning(false);
    }
  };

  const handleCsvImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setRunning(true);
      
      const formData = new FormData();
      formData.append('file', file);

      const { data, error } = await supabase.functions.invoke('bulk-upsert-brochure', {
        body: formData
      });

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Import Complete",
        description: `Successfully imported ${data?.rows_processed || 0} rows`
      });

      await loadBrochureSummary();
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed", 
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setRunning(false);
    }
  };

  const runSanityQueries = async () => {
    try {
      setRunning(true);
      
      const { count: totalCount } = await supabase
        .from('motor_models')
        .select('*', { count: 'exact', head: true })
        .eq('is_brochure', true);

      const { data: latestData } = await supabase
        .from('motor_models')
        .select('model_number, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      setSanityResults({
        totalBrochureRows: totalCount || 0,
        latestRecords: latestData || [],
        executedAt: new Date().toLocaleString()
      });
      
      toast({
        title: "Sanity Check Complete",
        description: `Found ${totalCount} brochure models. Latest 5 records retrieved.`
      });
    } catch (error: any) {
      console.error('Sanity check error:', error);
      toast({
        title: "Sanity Check Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setRunning(false);
    }
  };

const ResultCard = ({ title, result, type }: { 
  title: string; 
  result: ParseResult | null; 
  type: 'dry-run' | 'ingest' 
}) => {
  if (!result) return null;

  const isSuccess = result.ok || result.success;
  const isDryRun = type === 'dry-run';

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isSuccess ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isSuccess ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {result.raw_found !== undefined && (
                <div>
                  <div className="font-medium text-muted-foreground">Raw Found</div>
                  <div className="text-lg font-bold">{result.raw_found}</div>
                </div>
              )}
              {result.parsed !== undefined && (
                <div>
                  <div className="font-medium text-muted-foreground">Parsed</div>
                  <div className="text-lg font-bold">{result.parsed}</div>
                </div>
              )}
              {isDryRun ? (
                <>
                  {result.would_create !== undefined && (
                    <div>
                      <div className="font-medium text-muted-foreground">Would Create</div>
                      <div className="text-lg font-bold text-green-600">{result.would_create}</div>
                    </div>
                  )}
                  {result.would_update !== undefined && (
                    <div>
                      <div className="font-medium text-muted-foreground">Would Update</div>
                      <div className="text-lg font-bold text-blue-600">{result.would_update}</div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {result.rows_created !== undefined && (
                    <div>
                      <div className="font-medium text-muted-foreground">Created</div>
                      <div className="text-lg font-bold text-green-600">{result.rows_created}</div>
                    </div>
                  )}
                  {result.rows_updated !== undefined && (
                    <div>
                      <div className="font-medium text-muted-foreground">Updated</div>
                      <div className="text-lg font-bold text-blue-600">{result.rows_updated}</div>
                    </div>
                  )}
                </>
              )}
            </div>

            {result.echo && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md text-sm">
                <div className="font-medium text-blue-800 dark:text-blue-200 mb-1">Configuration Used:</div>
                <div className="text-blue-700 dark:text-blue-300 space-y-1">
                  <div>URL: {result.echo.price_list_url}</div>
                  <div>MSRP Markup: {result.echo.msrp_markup}x</div>
                  <div>Create Missing: {result.echo.create_missing_brochures ? 'Yes' : 'No'}</div>
                </div>
              </div>
            )}

            {result.message && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md text-sm text-green-800 dark:text-green-200">
                {result.message}
              </div>
            )}

            {result.sample_created && result.sample_created.length > 0 && (
              <Collapsible>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium">
                  View Sample Data ({result.sample_created.length} items) <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs border border-border rounded">
                      <thead>
                        <tr className="bg-muted">
                          <th className="p-2 text-left border-b">Model Number</th>
                          <th className="p-2 text-left border-b">Display</th>
                          <th className="p-2 text-left border-b">Dealer Price</th>
                          <th className="p-2 text-left border-b">MSRP</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.sample_created.slice(0, 10).map((item, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="p-2 font-mono">{item.model_number || 'N/A'}</td>
                            <td className="p-2">{item.model_display || 'N/A'}</td>
                            <td className="p-2">{item.dealer_price ? `$${item.dealer_price}` : 'N/A'}</td>
                            <td className="p-2">{item.msrp ? `$${item.msrp}` : 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {result.skip_reasons && Object.keys(result.skip_reasons).length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-amber-600 mb-2">Skip Reasons:</h4>
                <div className="text-xs space-y-1">
                  {Object.entries(result.skip_reasons).map(([reason, count]) => (
                    <div key={reason} className="flex justify-between">
                      <span>{reason}</span>
                      <Badge variant="outline" className="text-xs">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-red-600 font-medium">Operation Failed</div>
            {result.step && (
              <div className="text-sm text-muted-foreground">Step: {result.step}</div>
            )}
            {result.error && (
              <div className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
                {typeof result.error === 'string' ? result.error : JSON.stringify(result.error)}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Brochure Test & Management
          </CardTitle>
          <CardDescription>
            Test and manage the Mercury brochure data pipeline. Run dry runs to preview changes or perform live ingests to update the database.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Button
              onClick={() => runPriceListParser(true, 1.1)}
              disabled={running}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Dry Run (1.1x)
            </Button>
            
            <Button
              onClick={() => runPriceListParser(false, 1.1)}
              disabled={running}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Live Ingest (1.1x)
            </Button>

            <Button
              onClick={runSanityQueries}
              disabled={running}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Sanity Check
            </Button>

            <Button
              onClick={exportBrochureCsv}
              disabled={running}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <Upload className="h-4 w-4" />
              Import CSV
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvImport}
                className="hidden"
              />
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Current Brochure Summary */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle>Current Brochure Summary</CardTitle>
            <CardDescription>Overview of brochure models in the database</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{summary.total_brochure_count}</div>
                <div className="text-sm text-muted-foreground">Total Brochure Models</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{summary.families.length}</div>
                <div className="text-sm text-muted-foreground">Motor Families</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{summary.latest_samples.length}</div>
                <div className="text-sm text-muted-foreground">Latest Samples</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm mb-2">Family Breakdown:</h4>
                <div className="flex flex-wrap gap-2">
                  {summary.families.map(({ family, count }) => (
                    <Badge key={family} variant="secondary">
                      {family}: {count}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2">Latest 10 Samples:</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Model Display</TableHead>
                        <TableHead>Model Number</TableHead>
                        <TableHead>Family</TableHead>
                        <TableHead>HP</TableHead>
                        <TableHead>Dealer Price</TableHead>
                        <TableHead>MSRP</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summary.latest_samples.map((sample) => (
                        <TableRow key={sample.id}>
                          <TableCell className="font-medium">{sample.model_display || sample.model}</TableCell>
                          <TableCell className="font-mono text-xs">{sample.model_number || 'N/A'}</TableCell>
                          <TableCell>{sample.family || 'N/A'}</TableCell>
                          <TableCell>{sample.horsepower || 'N/A'}</TableCell>
                          <TableCell>${sample.dealer_price?.toLocaleString()}</TableCell>
                          <TableCell>${sample.msrp?.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      <ResultCard title="Dry Run Results" result={dryRunResults} type="dry-run" />
      <ResultCard title="Ingest Results" result={ingestResults} type="ingest" />

      {/* Sanity Check Results */}
      {sanityResults && (
        <Card>
          <CardHeader>
            <CardTitle>Sanity Check Results</CardTitle>
            <CardDescription>Database validation queries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="text-lg font-bold">Total Brochure Rows: {sanityResults.totalBrochureRows}</div>
                <div className="text-sm text-muted-foreground">Executed at: {sanityResults.executedAt}</div>
              </div>
              
              {sanityResults.latestRecords?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Latest 5 Records:</h4>
                  <div className="space-y-1 text-sm font-mono">
                    {sanityResults.latestRecords.map((record: any, idx: number) => (
                      <div key={idx}>
                        {record.model_number} - {new Date(record.created_at).toLocaleString()}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}