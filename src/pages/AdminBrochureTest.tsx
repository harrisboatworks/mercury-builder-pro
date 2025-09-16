import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExternalLink, Play, FileText, Download, Upload, CheckCircle, AlertCircle, ChevronDown, Link as LinkIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { invokeEdge, pingEdge } from '@/lib/invokeEdge';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import AdminNav from '@/components/admin/AdminNav';

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
  const [sanityResults, setSanityResults] = useState<any>(null);
  const [dryRun, setDryRun] = useState(true);
  const [pricelistUrl, setPricelistUrl] = useState("https://www.harrisboatworks.ca/mercurypricelist");
  const [msrpMarkup, setMsrpMarkup] = useState(1.10);
  const [loading, setLoading] = useState({ pricelist: false, ping: false });

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

  const runPriceListParser = async () => {
    setLoading({ ...loading, pricelist: true });
    try {
      const payload = {
        action: 'brochure',
        price_list_url: pricelistUrl?.trim() || 'https://www.harrisboatworks.ca/mercurypricelist',
        dry_run: dryRun,
        msrp_markup: Number(msrpMarkup || 1.1),
        create_missing_brochures: true
      };
      
      const result = await invokeEdge(payload);

      if (!result?.ok) {
        toast({
          title: 'Error',
          description: `Error (status ${result.status}, step ${result.step}): ${result.error}`,
          variant: 'destructive',
        });
        
        if (dryRun) {
          setDryRunResults(result);
        } else {
          setIngestResults(result);
        }
        return;
      }

      if (dryRun) {
        setDryRunResults(result);
        toast({
          title: "Price List Preview Complete",
          description: `${result.parsed || 0} parsed, ${result.would_create || 0} would create, ${result.would_update || 0} would update`,
        });
      } else {
        setIngestResults(result);
        toast({
          title: "Price List Ingested",
          description: `${result.parsed || 0} parsed, ${result.rows_created || 0} created, ${result.rows_updated || 0} updated`,
        });
      }
      
      await loadBrochureSummary();
    } finally {
      setLoading({ ...loading, pricelist: false });
    }
  };

  const pingEdgeFunction = async () => {
    setLoading({ ...loading, ping: true });
    try {
      const result = await pingEdge();
      toast({
        title: "Ping Successful",
        description: `Edge OK (${result.step})`,
      });
    } catch (e: any) {
      toast({
        title: "Ping Failed",
        description: `Edge ping failed: ${e?.message || String(e)}`,
        variant: "destructive",
      });
    } finally {
      setLoading({ ...loading, ping: false });
    }
  };

  const exportBrochureCsv = async () => {
    try {
      setLoading({ ...loading, pricelist: true });
      
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
      setLoading({ ...loading, pricelist: false });
    }
  };

  const handleCsvImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading({ ...loading, pricelist: true });
      
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
      setLoading({ ...loading, pricelist: false });
    }
  };

  const runSanityQueries = async () => {
    try {
      setLoading({ ...loading, pricelist: true });
      
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
      setLoading({ ...loading, pricelist: false });
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
                            <td className="p-2">{(item.dealer_price && item.dealer_price > 0) ? `$${item.dealer_price}` : '—'}</td>
                            <td className="p-2">{(item.msrp && item.msrp > 0) ? `$${item.msrp}` : '—'}</td>
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
    <div className="min-h-screen bg-background">
      <AdminNav />
      
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Brochure Test & Management</h1>
            <p className="text-muted-foreground">Test and manage the Mercury brochure data pipeline</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="dry-run"
                checked={dryRun}
                onCheckedChange={setDryRun}
              />
              <Label htmlFor="dry-run">Dry Run (Preview Only)</Label>
            </div>
          </div>
        </div>

        {dryRun && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Dry run mode is enabled. Changes will be previewed but not saved to the database.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Mercury Price List Ingestion
              </CardTitle>
              <CardDescription>
                Parse and ingest Mercury motor data from the price list
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pricelist-url">Price List URL</Label>
                  <Input
                    id="pricelist-url"
                    value={pricelistUrl}
                    onChange={(e) => setPricelistUrl(e.target.value)}
                    placeholder="https://www.harrisboatworks.ca/mercurypricelist"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="msrp-markup">MSRP Markup Multiplier</Label>
                  <Input
                    id="msrp-markup"
                    type="number"
                    step="0.01"
                    min="1"
                    max="2"
                    value={msrpMarkup}
                    onChange={(e) => setMsrpMarkup(parseFloat(e.target.value) || 1.1)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={pingEdgeFunction}
                  disabled={loading.ping}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <LinkIcon className="h-4 w-4" />
                  {loading.ping ? "Pinging..." : "Ping Edge"}
                </Button>
                
                <Button
                  onClick={runPriceListParser}
                  disabled={loading.pricelist}
                  className="flex items-center gap-2 flex-1"
                >
                  <Play className="h-4 w-4" />
                  {loading.pricelist 
                    ? "Processing..." 
                    : dryRun 
                      ? "Dry Run Preview" 
                      : "Run Ingest"
                  }
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tools & Utilities</CardTitle>
              <CardDescription>
                Additional brochure management tools
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={runSanityQueries}
                disabled={loading.pricelist}
                variant="secondary"
                className="w-full flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Sanity Check
              </Button>

              <Button
                onClick={exportBrochureCsv}
                disabled={loading.pricelist}
                variant="outline"
                className="w-full flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              
              <div className="space-y-2">
                <Label htmlFor="csv-import" className="text-sm">Import CSV</Label>
                <input
                  id="csv-import"
                  type="file"
                  accept=".csv"
                  onChange={handleCsvImport}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      
        {/* Current Summary */}
        {summary && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Current Brochure Summary</CardTitle>
              <CardDescription>Overview of Mercury brochure data in the database</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{summary.total_brochure_count}</div>
                  <div className="text-sm text-muted-foreground">Total Brochure Models</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{summary.families.length}</div>
                  <div className="text-sm text-muted-foreground">Motor Families</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{summary.latest_samples.length}</div>
                  <div className="text-sm text-muted-foreground">Latest Samples</div>
                </div>
              </div>

              {/* Family Distribution */}
              {summary.families.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Family Distribution</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {summary.families.slice(0, 8).map((family) => (
                      <div key={family.family} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                        <span className="font-medium">{family.family}</span>
                        <Badge variant="secondary">{family.count}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Latest Samples */}
              {summary.latest_samples.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Latest Brochure Models</h3>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Model</TableHead>
                          <TableHead>Family</TableHead>
                          <TableHead>HP</TableHead>
                          <TableHead>Dealer Price</TableHead>
                          <TableHead>MSRP</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {summary.latest_samples.slice(0, 10).map((sample) => (
                          <TableRow key={sample.id}>
                            <TableCell className="font-medium">
                              {sample.model_display || sample.model}
                            </TableCell>
                            <TableCell>{sample.family || 'N/A'}</TableCell>
                            <TableCell>{sample.horsepower || '—'}</TableCell>
                            <TableCell>{(sample.dealer_price && sample.dealer_price > 0) ? `$${sample.dealer_price.toLocaleString()}` : '—'}</TableCell>
                            <TableCell>{(sample.msrp && sample.msrp > 0) ? `$${sample.msrp.toLocaleString()}` : '—'}</TableCell>
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

        {/* Sanity Check Results */}
        {sanityResults && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Sanity Check Results</CardTitle>
              <CardDescription>Executed at {sanityResults.executedAt}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{sanityResults.totalBrochureRows}</div>
                    <div className="text-sm text-muted-foreground">Total Brochure Rows</div>
                  </div>
                </div>
                
                {sanityResults.latestRecords && sanityResults.latestRecords.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Latest 5 Records</h4>
                    <div className="space-y-1 text-sm font-mono bg-gray-50 dark:bg-gray-800 p-3 rounded">
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

        {/* Results Display */}
        {dryRunResults && (
          <ResultCard 
            title="Dry Run Results" 
            result={dryRunResults} 
            type="dry-run" 
          />
        )}

        {ingestResults && (
          <ResultCard 
            title="Ingest Results" 
            result={ingestResults} 
            type="ingest" 
          />
        )}
      </div>
    </div>
  );
}