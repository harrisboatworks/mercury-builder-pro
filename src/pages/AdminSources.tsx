import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Upload, Link as LinkIcon, Image, FileText, DollarSign, Download, ExternalLink, ChevronDown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { invokeEdge, pingEdge } from "@/lib/invokeEdge";
import AdminNav from "@/components/admin/AdminNav";

export default function AdminSources() {
  const { toast } = useToast();
  const [loading, setLoading] = useState({ pricelist: false, brochure: false, images: false, ping: false });
  const [dryRun, setDryRun] = useState(true);
  const [lastIngested, setLastIngested] = useState({
    pricelist: null as Date | null,
    brochure: null as Date | null,
    images: null as Date | null,
  });
  const [pricelistUrl, setPricelistUrl] = useState("https://www.harrisboatworks.ca/mercurypricelist");
  const [msrpMarkup, setMsrpMarkup] = useState(1.10);
  const [forceIngest, setForceIngest] = useState(false);
  const [createBrochureRows, setCreateBrochureRows] = useState(true);
  const [pricelistResults, setPricelistResults] = useState<any>(null);
  const [sanityResults, setSanityResults] = useState<any>(null);
  const [brochureUrl, setBrochureUrl] = useState("");
  const [brochureApplyTo, setBrochureApplyTo] = useState<"all" | "family" | "keys">("all");
  const [brochureFamily, setBrochureFamily] = useState("");
  const [brochureKeys, setBrochureKeys] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState("");
  const [modelKeyMappings, setModelKeyMappings] = useState<Record<string, string>>({});
  const [bulkImportFile, setBulkImportFile] = useState<File | null>(null);
  const [bulkJsonText, setBulkJsonText] = useState("");
  const [bulkResults, setBulkResults] = useState<{ success: number; total: number; errors: string[] } | null>(null);
  const [sanityLoading, setSanityLoading] = useState(false);
  const [sanityData, setSanityData] = useState<{
    counts: { brochure: number; inStock: number };
    recentSample: any[];
    missingImages: any[];
    keyCollisions: any[];
  } | null>(null);

  const runPricelist = async ({ dryRun }: { dryRun: boolean }) => {
    setLoading({ ...loading, pricelist: true });
    try {
      const payload = {
        action: 'brochure',
        dry_run: dryRun,
        msrp_markup: Number(msrpMarkup || 1.1),
        price_list_url: pricelistUrl?.trim() || 'https://www.harrisboatworks.ca/mercurypricelist',
      };
      
      const result = await invokeEdge(payload);
      
      if (!result?.ok) {
        toast({
          title: 'Error',
          description: `Error (status ${result.status}, step ${result.step}): ${result.error}`,
          variant: 'destructive',
        });
        setPricelistResults(result);
        return;
      }
      
      setPricelistResults(result);
      toast({
        title: dryRun ? "Price List Preview Complete" : "Price List Ingested",
        description: `${result.parsed || 0} parsed, ${result.rows_created || result.would_create || 0} created, ${result.rows_updated || result.would_update || 0} updated`,
      });
      
      if (!dryRun) {
        setLastIngested({ ...lastIngested, pricelist: new Date() });
      }
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

  const handleBrochureIngest = async () => {
    setLoading({ ...loading, brochure: true });
    try {
      const body: any = { 
        url: brochureUrl,
        apply_to: brochureApplyTo,
        dry_run: dryRun
      };

      if (brochureApplyTo === 'family' && brochureFamily) {
        body.family = brochureFamily;
      } else if (brochureApplyTo === 'keys' && brochureKeys.trim()) {
        body.keys = brochureKeys.split('\n').map(k => k.trim()).filter(k => k);
      }

      const { data, error } = await supabase.functions.invoke('attach-brochure-pdf', { body });

      if (error) throw error;

      toast({
        title: dryRun ? "Brochure Link Preview" : "Brochure PDF Linked",
        description: `${data.models_matched} models matched, ${data.models_updated || 0} updated`,
      });

      if (!dryRun) {
        setLastIngested({ ...lastIngested, brochure: new Date() });
      }
    } catch (error) {
      console.error('Brochure ingestion error:', error);
      toast({
        title: "Error",
        description: "Failed to link brochure PDF",
        variant: "destructive",
      });
    } finally {
      setLoading({ ...loading, brochure: false });
    }
  };

  const handleImageUpload = async () => {
    setLoading({ ...loading, images: true });
    try {
      let uploadedCount = 0;

      // Handle file uploads
      for (const file of selectedImages) {
        const modelKey = modelKeyMappings[file.name];
        if (!modelKey) continue;

        // Convert file to base64
        const reader = new FileReader();
        const fileData = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        const { data, error } = await supabase.functions.invoke('upload-hero-image', {
          body: { 
            model_key: modelKey,
            file_data: fileData,
            dry_run: dryRun
          }
        });

        if (error) {
          console.error(`Error uploading ${file.name}:`, error);
        } else {
          uploadedCount++;
        }
      }

      // Handle URL inputs
      if (imageUrls.trim()) {
        const urls = imageUrls.split('\n').filter(url => url.trim());
        for (const url of urls) {
          const modelKey = modelKeyMappings[url];
          if (!modelKey) continue;

          const { data, error } = await supabase.functions.invoke('upload-hero-image', {
            body: { 
              model_key: modelKey,
              url: url.trim(),
              dry_run: dryRun
            }
          });

          if (error) {
            console.error(`Error uploading ${url}:`, error);
          } else {
            uploadedCount++;
          }
        }
      }

      toast({
        title: dryRun ? "Hero Images Preview" : "Hero Images Uploaded",
        description: `${uploadedCount} images processed successfully`,
      });

      if (!dryRun) {
        setLastIngested({ ...lastIngested, images: new Date() });
        setSelectedImages([]);
        setImageUrls("");
        setModelKeyMappings({});
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload hero images",
        variant: "destructive",
      });
    } finally {
      setLoading({ ...loading, images: false });
    }
  };

  const handleBulkImport = async () => {
    if (!bulkImportFile) return;
    
    setLoading({ ...loading, images: true });
    try {
      const fileContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(bulkImportFile);
      });

      const heroData = JSON.parse(fileContent) as Array<{ model_key: string; url: string }>;
      let uploadedCount = 0;

      for (const item of heroData) {
        const { data, error } = await supabase.functions.invoke('upload-hero-image', {
          body: { 
            model_key: item.model_key,
            url: item.url,
            dry_run: dryRun
          }
        });

        if (error) {
          console.error(`Error uploading ${item.model_key}:`, error);
        } else {
          uploadedCount++;
        }
      }

      toast({
        title: dryRun ? "Bulk Import Preview" : "Bulk Import Complete",
        description: `${uploadedCount}/${heroData.length} hero images processed successfully`,
      });

      if (!dryRun) {
        setLastIngested({ ...lastIngested, images: new Date() });
        setBulkImportFile(null);
      }
    } catch (error) {
      console.error('Bulk import error:', error);
      toast({
        title: "Error",
        description: "Failed to process bulk import file",
        variant: "destructive",
      });
    } finally {
      setLoading({ ...loading, images: false });
    }
  };

  const handleBulkJsonUpload = async () => {
    if (!bulkJsonText.trim()) return;
    
    setLoading({ ...loading, images: true });
    setBulkResults(null);
    
    try {
      const heroData = JSON.parse(bulkJsonText) as Array<{ model_key: string; url: string }>;
      let successCount = 0;
      const errors: string[] = [];

      for (const item of heroData) {
        try {
          const { data, error } = await supabase.functions.invoke('upload-hero-image', {
            body: { 
              model_key: item.model_key,
              url: item.url,
              dry_run: dryRun
            }
          });

          if (error) {
            errors.push(`${item.model_key}: ${error.message || 'Unknown error'}`);
          } else if (data?.stored) {
            successCount++;
          }
        } catch (error) {
          errors.push(`${item.model_key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      setBulkResults({
        success: successCount,
        total: heroData.length,
        errors
      });

      toast({
        title: dryRun ? "Bulk JSON Preview" : "Bulk JSON Complete",
        description: `${successCount}/${heroData.length} hero images processed successfully`,
      });

      if (!dryRun && successCount > 0) {
        setLastIngested({ ...lastIngested, images: new Date() });
      }
    } catch (error) {
      console.error('Bulk JSON upload error:', error);
      toast({
        title: "Error",
        description: "Invalid JSON format or processing error",
        variant: "destructive",
      });
    } finally {
      setLoading({ ...loading, images: false });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedImages(files);
    
    // Initialize model key mappings for new files
    const newMappings = { ...modelKeyMappings };
    files.forEach(file => {
      if (!newMappings[file.name]) {
        newMappings[file.name] = file.name.replace(/\.[^/.]+$/, "").toUpperCase();
      }
    });
    setModelKeyMappings(newMappings);
  };

  const runSanityQueries = async () => {
    try {
      // Count by brochure/in_stock
      const { data: counts } = await supabase
        .from('motor_models')
        .select('is_brochure, in_stock')
        .then(({ data }) => {
          const brochure = data?.filter(row => row.is_brochure).length || 0;
          const in_stock = data?.filter(row => row.in_stock).length || 0;
          const total = data?.length || 0;
          return { data: { brochure, in_stock, total } };
        });

      // Updated today from pricelist
      const today = new Date().toISOString().split('T')[0];
      const { data: updatedToday, error: updatedError } = await supabase
        .from('motor_models')
        .select('id', { count: 'exact' })
        .eq('price_source', 'pricelist')
        .gte('updated_at', today);

      // Last 20 updated
      const { data: recentlyUpdated, error: recentError } = await supabase
        .from('motor_models')
        .select('model_key, dealer_price, msrp, price_source, is_brochure, in_stock, updated_at')
        .order('updated_at', { ascending: false })
        .limit(20);

      setSanityResults({
        counts: counts || { brochure: 0, in_stock: 0, total: 0 },
        updated_today: updatedToday?.length || 0,
        recently_updated: recentlyUpdated || []
      });

      toast({
        title: "Sanity Check Complete",
        description: "Database stats retrieved successfully"
      });
    } catch (error) {
      console.error('Sanity check error:', error);
      toast({
        title: "Error",
        description: "Failed to run sanity queries",
        variant: "destructive"
      });
    }
  };

  const runSanityCheck = async () => {
    setSanityLoading(true);
    try {
      // A) Counts
      const { data: brochureCount } = await supabase
        .from('motor_models')
        .select('*', { count: 'exact', head: true })
        .eq('is_brochure', true);

      const { data: inStockCount } = await supabase
        .from('motor_models')
        .select('*', { count: 'exact', head: true })
        .eq('in_stock', true);

      // B) Recent sample
      const { data: recentSample } = await supabase
        .from('motor_models')
        .select('model, model_key, family, horsepower, shaft_code, start_type, control_type, has_power_trim, has_command_thrust, dealer_price, msrp, hero_image_url, in_stock, stock_number')
        .order('updated_at', { ascending: false, nullsFirst: false })
        .limit(20);

      // C) Missing images (brochure)
      const { data: missingImages } = await supabase
        .from('motor_models')
        .select('model_key, model')
        .eq('is_brochure', true)
        .or('hero_image_url.is.null,hero_image_url.eq.');

      // D) Key collisions (should be 0 for brochure)
      const { data: keyCollisions } = await supabase
        .rpc('get_duplicate_brochure_keys');

      setSanityData({
        counts: {
          brochure: brochureCount?.length || 0,
          inStock: inStockCount?.length || 0
        },
        recentSample: recentSample || [],
        missingImages: missingImages || [],
        keyCollisions: keyCollisions || []
      });

      toast({
        title: "Sanity check completed",
        description: "Database stats retrieved successfully"
      });
    } catch (error) {
      console.error('Sanity check failed:', error);
      toast({
        title: "Error",
        description: "Sanity check failed",
        variant: "destructive"
      });
    } finally {
      setSanityLoading(false);
    }
  };

  const copyToClipboard = (data: any[], title: string) => {
    const text = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${title} data copied successfully`
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Data Sources</h1>
            <p className="text-muted-foreground">Manage price lists, brochures, and hero images</p>
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
          {/* Mercury Price List Card */}
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Mercury Price List
              </CardTitle>
              <CardDescription>
                Fetch and parse Mercury motor pricing data from Harris Boat Works
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="msrp-markup">MSRP Markup</Label>
                  <Input
                    id="msrp-markup"
                    type="number"
                    step="0.01"
                    min="1.00"
                    max="2.00"
                    value={msrpMarkup}
                    onChange={(e) => setMsrpMarkup(Number(e.target.value))}
                    placeholder="1.10"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="create-brochure-rows"
                    checked={createBrochureRows}
                    onCheckedChange={(checked) => setCreateBrochureRows(checked as boolean)}
                  />
                  <Label htmlFor="create-brochure-rows" className="text-sm">
                    Create brochure rows for missing models (default)
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="force-ingest"
                    checked={forceIngest}
                    onCheckedChange={(checked) => setForceIngest(checked as boolean)}
                  />
                  <Label htmlFor="force-ingest" className="text-sm">
                    Force ingest even if content is unchanged
                  </Label>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={pingEdgeFunction}
                  disabled={loading.ping}
                  variant="secondary"
                  size="sm"
                >
                  {loading.ping ? "Pinging..." : "Ping Edge"}
                </Button>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={() => runPricelist({ dryRun: true })}
                  disabled={loading.pricelist || !pricelistUrl.trim()}
                  variant="outline"
                  className="flex-1"
                >
                  {loading.pricelist ? "Processing..." : "Preview (Dry Run)"}
                </Button>
                
                <Button 
                  onClick={() => runPricelist({ dryRun: false })}
                  disabled={loading.pricelist || !pricelistUrl.trim()}
                  className="flex-1"
                >
                  {loading.pricelist ? "Processing..." : "Ingest"}
                </Button>
              </div>

              {pricelistResults && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Price List Results</h3>
                    <Badge variant={pricelistResults.success ? "default" : "destructive"}>
                      {pricelistResults.success ? "Success" : "Error"}
                    </Badge>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-muted p-3 rounded">
                      <div className="text-sm text-muted-foreground">Step</div>
                      <div className="font-medium">{pricelistResults.step || 'unknown'}</div>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <div className="text-sm text-muted-foreground">Raw Found</div>
                      <div className="font-medium">{pricelistResults.rows_found_raw ?? pricelistResults.found ?? 0}</div>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <div className="text-sm text-muted-foreground">Parsed</div>
                      <div className="font-medium">{pricelistResults.rows_parsed ?? pricelistResults.parsed ?? 0}</div>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <div className="text-sm text-muted-foreground">Created</div>
                      <div className="font-medium">{pricelistResults.rows_created ?? pricelistResults.created ?? 0}</div>
                    </div>
                    <div className="bg-muted p-3 rounded">
                      <div className="text-sm text-muted-foreground">Updated</div>
                      <div className="font-medium">{pricelistResults.rows_updated ?? pricelistResults.updated ?? 0}</div>
                    </div>
                  </div>

                  {/* Snapshot URL */}
                  {pricelistResults.snapshot_url && (
                    <div className="pt-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={pricelistResults.snapshot_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Saved HTML/JSON
                        </a>
                      </Button>
                    </div>
                  )}

                  {/* Skip Reasons */}
                  {pricelistResults.rows_skipped_by_reason && Object.keys(pricelistResults.rows_skipped_by_reason).length > 0 && (
                    <Collapsible>
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-muted rounded hover:bg-muted/80">
                        <span className="font-medium">Skip Reasons</span>
                        <ChevronDown className="h-4 w-4" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="p-3 border rounded-b bg-background">
                        <div className="space-y-2">
                          {Object.entries(pricelistResults.rows_skipped_by_reason).map(([reason, count]) => (
                            <div key={reason} className="flex justify-between">
                              <span className="text-sm">{reason.replace(/_/g, ' ')}</span>
                              <Badge variant="outline">{String(count)}</Badge>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Row Errors */}
                  {pricelistResults.rowErrors && pricelistResults.rowErrors.length > 0 && (
                    <Collapsible>
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-destructive/10 rounded hover:bg-destructive/20">
                        <span className="font-medium text-destructive">Row Errors ({pricelistResults.rowErrors.length})</span>
                        <ChevronDown className="h-4 w-4" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="p-3 border rounded-b bg-background">
                        <div className="space-y-3">
                          {pricelistResults.rowErrors.slice(0, 10).map((error, idx) => (
                            <div key={idx} className="border-l-2 border-destructive pl-3">
                              <div className="text-sm font-medium text-destructive">Row {error.row_index}: {error.error}</div>
                              <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                                {JSON.stringify(error.data, null, 2)}
                              </pre>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Sample Created Motors */}
                  {pricelistResults.sample_created && pricelistResults.sample_created.length > 0 && (
                    <Collapsible>
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-green-50 rounded hover:bg-green-100 dark:bg-green-950 dark:hover:bg-green-900">
                        <span className="font-medium text-green-700 dark:text-green-300">Sample Created Motors ({pricelistResults.sample_created.length})</span>
                        <ChevronDown className="h-4 w-4" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="p-3 border rounded-b bg-background">
                        <div className="space-y-3">
                          {pricelistResults.sample_created.map((motor, idx) => (
                            <div key={idx} className="border-l-2 border-green-500 pl-3">
                              <div className="text-sm font-medium">{motor.model_display}</div>
                              <div className="text-xs text-muted-foreground">
                                Model #: {motor.model_number} | Rigging: {motor.rigging_code || 'N/A'} | 
                                Price: {(motor.dealer_price && motor.dealer_price > 0) ? `$${motor.dealer_price}` : '—'} → MSRP: {(motor.msrp && motor.msrp > 0) ? `$${motor.msrp}` : '—'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Error Details */}
                  {!pricelistResults.success && (
                    <Collapsible>
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-destructive/10 rounded hover:bg-destructive/20">
                        <span className="font-medium text-destructive">
                          Error Details - Step: {pricelistResults.step || 'unknown'}
                        </span>
                        <ChevronDown className="h-4 w-4" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="p-3 border rounded-b bg-background">
                        <div className="space-y-2">
                          <div><strong>Step:</strong> {pricelistResults.step || 'unknown'}</div>
                          <div><strong>Error:</strong> {pricelistResults.error || 'Unknown error'}</div>
                          {pricelistResults.detail && (
                            <div>
                              <strong>Detail:</strong>
                              <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto whitespace-pre-wrap">
                                {pricelistResults.detail}
                              </pre>
                            </div>
                          )}
                          {pricelistResults.stack && (
                            <div>
                              <strong>Stack Trace:</strong>
                              <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                                {pricelistResults.stack}
                              </pre>
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Database Batch Errors */}
                  {pricelistResults.batchErrors && pricelistResults.batchErrors.length > 0 && (
                    <Collapsible>
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-destructive/10 rounded hover:bg-destructive/20">
                        <span className="font-medium text-destructive">
                          Database Errors ({pricelistResults.batchErrors.length})
                        </span>
                        <ChevronDown className="h-4 w-4" />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="p-3 border rounded-b bg-background">
                        <div className="space-y-3 text-sm max-h-60 overflow-y-auto">
                          {pricelistResults.batchErrors.map((error: any, i: number) => (
                            <div key={i} className="border-b pb-2 last:border-b-0">
                              <div className="font-medium text-destructive">Batch {error.batch}:</div>
                              <div className="text-destructive font-mono text-xs bg-destructive/5 p-1 rounded mt-1">{error.error}</div>
                              {error.code && <div className="text-muted-foreground text-xs">Code: {error.code}</div>}
                              {error.details && <div className="text-muted-foreground text-xs">Details: {error.details}</div>}
                              {error.sample_record && (
                                <Collapsible>
                                  <CollapsibleTrigger className="text-xs text-primary hover:underline mt-1">
                                    Show Sample Record
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
                                    <pre className="text-xs mt-1 p-2 bg-muted rounded overflow-x-auto border">
                                      {JSON.stringify(error.sample_record, null, 2)}
                                    </pre>
                                  </CollapsibleContent>
                                </Collapsible>
                              )}
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Failed Rows Summary */}
                  {pricelistResults.rows_failed && pricelistResults.rows_failed > 0 && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded">
                      <div className="text-destructive font-medium">❌ {pricelistResults.rows_failed} rows failed to insert</div>
                      <div className="text-destructive/80 text-sm mt-1">Check the database errors above for details</div>
                    </div>
                  )}

                  {/* Sanity Check Button */}
                  <div className="pt-4 border-t">
                    <Button onClick={runSanityQueries} variant="outline" size="sm">
                      Run Sanity Queries
                    </Button>
                    
                    {sanityResults && (
                      <div className="mt-3 p-3 bg-muted rounded-lg space-y-2">
                        <div className="text-sm font-medium">Database Stats:</div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="font-medium">{sanityResults.counts.brochure}</div>
                            <div className="text-muted-foreground text-xs">Brochure</div>
                          </div>
                          <div>
                            <div className="font-medium">{sanityResults.counts.in_stock}</div>
                            <div className="text-muted-foreground text-xs">In Stock</div>
                          </div>
                          <div>
                            <div className="font-medium">{sanityResults.counts.total}</div>
                            <div className="text-muted-foreground text-xs">Total</div>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Updated today: {sanityResults.updated_today} • Recent updates: {sanityResults.recently_updated.length}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {lastIngested.pricelist && (
                <div className="text-sm text-muted-foreground">
                  Last ingested: {lastIngested.pricelist.toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Brochure PDF Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Brochure PDF
              </CardTitle>
              <CardDescription>
                Link PDF to motor models for documentation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="brochure-url">Brochure PDF URL</Label>
                <Input
                  id="brochure-url"
                  value={brochureUrl}
                  onChange={(e) => setBrochureUrl(e.target.value)}
                  placeholder="https://example.com/brochure.pdf"
                />
                
                <div className="space-y-2">
                  <Label htmlFor="apply-to">Apply To</Label>
                  <Select value={brochureApplyTo} onValueChange={(value: "all" | "family" | "keys") => setBrochureApplyTo(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose target" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Brochure Models</SelectItem>
                      <SelectItem value="family">Specific Family</SelectItem>
                      <SelectItem value="keys">Specific Model Keys</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {brochureApplyTo === 'family' && (
                  <div className="space-y-2">
                    <Label htmlFor="brochure-family">Motor Family</Label>
                    <Select value={brochureFamily} onValueChange={setBrochureFamily}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select family" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FourStroke">FourStroke</SelectItem>
                        <SelectItem value="ProXS">ProXS</SelectItem>
                        <SelectItem value="SeaPro">SeaPro</SelectItem>
                        <SelectItem value="Verado">Verado</SelectItem>
                        <SelectItem value="Racing">Racing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {brochureApplyTo === 'keys' && (
                  <div className="space-y-2">
                    <Label htmlFor="brochure-keys">Model Keys (one per line)</Label>
                    <Textarea
                      id="brochure-keys"
                      className="font-mono text-sm h-24 resize-y"
                      value={brochureKeys}
                      onChange={(e) => setBrochureKeys(e.target.value)}
                      placeholder="FOURSTROKE-25HP-EFI-L-E-PT&#10;FOURSTROKE-30HP-EFI-L-E-PT&#10;..."
                    />
                  </div>
                )}
              </div>

              <Button 
                onClick={handleBrochureIngest}
                disabled={loading.brochure || !brochureUrl.trim() || 
                  (brochureApplyTo === 'family' && !brochureFamily) ||
                  (brochureApplyTo === 'keys' && !brochureKeys.trim())}
                className="w-full"
              >
                {loading.brochure ? "Processing..." : "Link Brochure PDF"}
              </Button>

              {lastIngested.brochure && (
                <div className="text-sm text-muted-foreground">
                  Last linked: {lastIngested.brochure.toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hero Images Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Hero Images
              </CardTitle>
              <CardDescription>
                Upload or link hero images to motor models
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="upload">Upload</TabsTrigger>
                  <TabsTrigger value="urls">URLs</TabsTrigger>
                  <TabsTrigger value="bulk">File</TabsTrigger>
                  <TabsTrigger value="json">JSON</TabsTrigger>
                </TabsList>
                
                <TabsContent value="upload" className="space-y-3">
                  <Label htmlFor="hero-images">Select Images</Label>
                  <Input
                    id="hero-images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                  />
                  
                  {selectedImages.length > 0 && (
                    <div className="space-y-2">
                      <Label>Model Key Mapping</Label>
                      {selectedImages.map((file) => (
                        <div key={file.name} className="flex items-center gap-2">
                          <span className="text-sm flex-1 truncate">{file.name}</span>
                          <Input
                            className="w-32"
                            value={modelKeyMappings[file.name] || ""}
                            onChange={(e) => setModelKeyMappings({
                              ...modelKeyMappings,
                              [file.name]: e.target.value
                            })}
                            placeholder="MODEL-KEY"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="urls" className="space-y-3">
                  <Label htmlFor="image-urls">Image URLs (one per line)</Label>
                  <textarea
                    id="image-urls"
                    className="w-full h-24 p-2 border rounded-md resize-none"
                    value={imageUrls}
                    onChange={(e) => setImageUrls(e.target.value)}
                    placeholder="https://example.com/image1.jpg"
                  />
                </TabsContent>
                
                <TabsContent value="bulk" className="space-y-3">
                  <Label htmlFor="bulk-import">JSON File</Label>
                  <Input
                    id="bulk-import"
                    type="file"
                    accept=".json"
                    onChange={(e) => setBulkImportFile(e.target.files?.[0] || null)}
                  />
                  <div className="text-sm text-muted-foreground">
                    Upload a JSON file with format: [{"{"}"model_key": "...", "url": "..."{"}"}]
                  </div>
                  {bulkImportFile && (
                    <Badge variant="secondary" className="text-xs">
                      {bulkImportFile.name}
                    </Badge>
                  )}
                </TabsContent>

                <TabsContent value="json" className="space-y-3">
                  <Label htmlFor="bulk-json">Paste JSON Array</Label>
                  <Textarea
                    id="bulk-json"
                    className="font-mono text-sm h-32 resize-y"
                    value={bulkJsonText}
                    onChange={(e) => setBulkJsonText(e.target.value)}
                    placeholder='[{"model_key":"FOURSTROKE-25HP-EFI-L-E-PT","url":"https://example.com/image1.jpg"},{"model_key":"FOURSTROKE-30HP-EFI-L-E-PT","url":"https://example.com/image2.jpg"}]'
                  />
                  <div className="text-sm text-muted-foreground">
                    Paste JSON array directly. Each object needs model_key and url properties.
                  </div>

                  <Button 
                    onClick={handleBulkJsonUpload}
                    disabled={loading.images || !bulkJsonText.trim()}
                    className="w-full"
                  >
                    {loading.images ? "Processing..." : "Upload from JSON"}
                  </Button>

                  {bulkResults && (
                    <div className="mt-3 p-3 bg-muted rounded-lg space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium">Success Rate:</span>
                        <span className="text-green-600 dark:text-green-400">
                          {bulkResults.success}/{bulkResults.total}
                        </span>
                      </div>
                      
                      {bulkResults.errors.length > 0 && (
                        <details className="space-y-2">
                          <summary className="cursor-pointer text-sm font-medium text-destructive">
                            Errors ({bulkResults.errors.length}) - Click to expand
                          </summary>
                          <div className="bg-background rounded border p-2 max-h-32 overflow-y-auto">
                            {bulkResults.errors.map((error, index) => (
                              <div key={index} className="text-xs text-destructive py-1 border-b border-border last:border-b-0">
                                {error}
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <Button 
                onClick={bulkImportFile ? handleBulkImport : handleImageUpload}
                disabled={loading.images || (!bulkImportFile && selectedImages.length === 0 && !imageUrls.trim())}
                className="w-full"
              >
                {loading.images ? "Processing..." : bulkImportFile ? "Import from File" : "Upload Hero Images"}
              </Button>

              {lastIngested.images && (
                <div className="text-sm text-muted-foreground">
                  Last uploaded: {lastIngested.images.toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sanity Check Panel */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Sanity Check
                </CardTitle>
                <CardDescription>
                  Quick database health checks for motor inventory and brochure data
                </CardDescription>
              </div>
              <Button 
                onClick={runSanityCheck} 
                disabled={sanityLoading}
                variant="outline"
              >
                {sanityLoading ? "Running..." : "Run Checks"}
              </Button>
            </div>
          </CardHeader>
          {sanityData && (
            <CardContent className="space-y-6">
              {/* A) Counts */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{sanityData.counts.brochure}</div>
                  <div className="text-sm text-muted-foreground">Brochure Models</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{sanityData.counts.inStock}</div>
                  <div className="text-sm text-muted-foreground">In-Stock Units</div>
                </div>
              </div>

              {/* B) Recent Sample */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">Recent Sample (20 latest)</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(sanityData.recentSample, "Recent Sample")}
                  >
                    Copy JSON
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border rounded">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-2 text-left">Model</th>
                        <th className="p-2 text-left">Key</th>
                        <th className="p-2 text-left">HP</th>
                        <th className="p-2 text-left">Price</th>
                        <th className="p-2 text-left">Stock</th>
                        <th className="p-2 text-left">Image</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sanityData.recentSample.slice(0, 10).map((row, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="p-2">{row.model || '-'}</td>
                          <td className="p-2 text-xs font-mono">{row.model_key || '-'}</td>
                          <td className="p-2">{row.horsepower || '-'}</td>
                          <td className="p-2">{(row.dealer_price && row.dealer_price > 0) ? `$${row.dealer_price}` : (row.msrp && row.msrp > 0) ? `$${row.msrp}` : '—'}</td>
                          <td className="p-2">
                            <Badge variant={row.in_stock ? "default" : "secondary"}>
                              {row.in_stock ? "Stock" : "Brochure"}
                            </Badge>
                          </td>
                          <td className="p-2">
                            {row.hero_image_url ? "✓" : "✗"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* C) Missing Images */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">Missing Images ({sanityData.missingImages.length})</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(sanityData.missingImages, "Missing Images")}
                  >
                    Copy JSON
                  </Button>
                </div>
                {sanityData.missingImages.length > 0 ? (
                  <div className="max-h-40 overflow-y-auto text-xs font-mono bg-muted p-3 rounded">
                    {sanityData.missingImages.slice(0, 20).map((row, idx) => (
                      <div key={idx}>
                        {row.model_key}: {row.model}
                      </div>
                    ))}
                    {sanityData.missingImages.length > 20 && (
                      <div className="text-muted-foreground">
                        ... and {sanityData.missingImages.length - 20} more
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-green-600 font-medium">All brochure models have images!</div>
                )}
              </div>

              {/* D) Key Collisions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">Key Collisions ({sanityData.keyCollisions.length})</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(sanityData.keyCollisions, "Key Collisions")}
                  >
                    Copy JSON
                  </Button>
                </div>
                {sanityData.keyCollisions.length > 0 ? (
                  <div className="space-y-2">
                    {sanityData.keyCollisions.map((collision, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-destructive/10 rounded border-l-4 border-destructive">
                        <span className="font-mono text-sm">{collision.model_key}</span>
                        <Badge variant="destructive">{collision.count} duplicates</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-green-600 font-medium">No key collisions found!</div>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}