import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Upload, Image, FileText, DollarSign, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { invokeEdge, pingEdge } from "@/lib/invokeEdge";
import AdminNav from "@/components/admin/AdminNav";
import { parsePriceListFromHtml } from "@/lib/html-parser-helpers";

interface ParsedMotor {
  model_number: string;
  description: string;
  price: number;
  section: string;
}

export default function AdminSources() {
  const { toast } = useToast();
  const [loading, setLoading] = useState({ 
    pricelist: false, 
    brochure: false, 
    images: false, 
    ping: false, 
    htmlParse: false, 
    htmlImport: false,
    sanity: false 
  });
  
  const [dryRun, setDryRun] = useState(true);
  const [lastIngested, setLastIngested] = useState({
    pricelist: null as Date | null,
    brochure: null as Date | null,
    images: null as Date | null,
  });
  
  // Price List state
  const [pricelistUrl, setPricelistUrl] = useState("https://www.harrisboatworks.ca/mercurypricelist");
  const [msrpMarkup, setMsrpMarkup] = useState(1.10);
  const [pricelistResults, setPricelistResults] = useState<any>(null);

  // Brochure state
  const [brochureUrl, setBrochureUrl] = useState("");
  const [brochureApplyTo, setBrochureApplyTo] = useState<"all" | "family" | "keys">("all");
  const [brochureFamily, setBrochureFamily] = useState("");
  const [brochureKeys, setBrochureKeys] = useState("");

  // Hero Images state
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState("");
  const [modelKeyMappings, setModelKeyMappings] = useState<Record<string, string>>({});
  const [bulkImportFile, setBulkImportFile] = useState<File | null>(null);
  const [bulkJsonText, setBulkJsonText] = useState("");

  // HTML Import state
  const [parsedHtmlData, setParsedHtmlData] = useState<ParsedMotor[]>([]);

  // Sanity Check state
  const [sanityData, setSanityData] = useState<{
    counts: { brochure: number; inStock: number };
    recentSample: any[];
    missingImages: any[];
    keyCollisions: any[];
  } | null>(null);

  useEffect(() => {
    loadBrochureSummary();
  }, []);

  const loadBrochureSummary = async () => {
    try {
      const { count: totalCount } = await supabase
        .from('motor_models')
        .select('*', { count: 'exact', head: true })
        .eq('is_brochure', true);

      toast({
        title: "Summary loaded",
        description: `Found ${totalCount || 0} brochure models`
      });
    } catch (error) {
      console.error('Error loading brochure summary:', error);
    }
  };

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

  const parseHtmlFile = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.html,.htm';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      setLoading({ ...loading, htmlParse: true });
      try {
        const htmlContent = await file.text();
        const parsedData = parsePriceListFromHtml(htmlContent, msrpMarkup);
        
        // Convert to the format expected by the component
        const motors: ParsedMotor[] = parsedData.map(motor => ({
          model_number: motor.model_number,
          description: motor.model_display,
          price: motor.dealer_price,
          section: motor.family || 'Unknown'
        }));
        
        setParsedHtmlData(motors);
        toast({
          title: "HTML Parsed",
          description: `Found ${motors.length} motors from ${file.name}`
        });
      } catch (error) {
        console.error('HTML parse error:', error);
        toast({
          title: "Parse Error",
          description: "Failed to parse HTML file",
          variant: "destructive"
        });
      } finally {
        setLoading({ ...loading, htmlParse: false });
      }
    };
    input.click();
  };


  const importHtmlToDatabase = async () => {
    if (parsedHtmlData.length === 0) {
      toast({
        title: "No Data",
        description: "Parse an HTML file first",
        variant: "destructive"
      });
      return;
    }

    setLoading({ ...loading, htmlImport: true });
    try {
      console.log('[AdminSources] Converting parsed data for database import');
      
      const rows = parsedHtmlData.map(motor => {
        // Extract rigging codes from description
        const extractRiggingCode = (description: string) => {
          // Common rigging patterns: ELPT, CT, XL, XXL, L, H, M, E, PT
          const riggingPattern = /\b((?:E|M)?(?:L|XL|XXL)?(?:H)?(?:PT)?(?:CT)?)\b/g;
          const matches = description.match(riggingPattern) || [];
          return matches.join(' ').trim();
        };
        
        // Clean model name by removing rigging codes and HP
        const cleanModel = (description: string, horsepower: number) => {
          let cleaned = description
            .replace(/††|‡|†/g, '') // Remove HTML artifacts
            .replace(/\b(?:E|M)?(?:L|XL|XXL)?(?:H)?(?:PT)?(?:CT)?\b/g, '') // Remove rigging codes
            .replace(/\s+/g, ' ')    // Normalize whitespace
            .trim();
          
          // If we have horsepower, use it as the model name, otherwise use cleaned string
          return horsepower ? horsepower.toString() : cleaned;
        };
        
        const riggingCode = extractRiggingCode(motor.description);
        const cleanModelName = cleanModel(motor.description, 0); // No HP available in simple interface
        
        return {
          model_number: motor.model_number,
          mercury_model_no: '', // Not available in simple interface
          model: cleanModelName, // Clean model without rigging codes
          rigging_code: riggingCode, // Separate rigging codes field
          model_display: motor.description,
          dealer_price: motor.price,
          msrp: null, // Let bulk-upsert-brochure calculate MSRP with markup
          horsepower: 0, // Not available in simple interface
          family: motor.section || 'FourStroke', // Use detected family from section headers
          fuel_type: '', // Not available in simple interface
          motor_type: 'Outboard',
          year: 2025,
          is_brochure: true
        };
      });

      console.log('Sending rows to bulk-upsert-brochure with rigging codes extracted:', rows.slice(0, 3));

      const { data, error } = await supabase.functions.invoke('bulk-upsert-brochure', {
        body: { 
          rows,
          msrp_markup: Number(msrpMarkup || 1.1)
        }
      });

      if (error) throw error;

      toast({
        title: "Import Complete",
        description: `Imported ${data?.created || 0} new, updated ${data?.updated || 0} existing motors with proper rigging code extraction`
      });

      await loadBrochureSummary();
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import Error", 
        description: "Failed to import motors to database",
        variant: "destructive"
      });
    } finally {
      setLoading({ ...loading, htmlImport: false });
    }
  };

  const runSanityCheck = async () => {
    setLoading({ ...loading, sanity: true });
    try {
      // A) Counts
      const { count: brochureCount } = await supabase
        .from('motor_models')
        .select('*', { count: 'exact', head: true })
        .eq('is_brochure', true);

      const { count: inStockCount } = await supabase
        .from('motor_models')
        .select('*', { count: 'exact', head: true })
        .eq('in_stock', true);

      // B) Recent sample
      const { data: recentSample } = await supabase
        .from('motor_models')
        .select('model, model_key, family, horsepower, dealer_price, msrp, hero_image_url, in_stock')
        .order('updated_at', { ascending: false, nullsFirst: false })
        .limit(20);

      // C) Missing images (brochure)
      const { data: missingImages } = await supabase
        .from('motor_models')
        .select('model_key, model')
        .eq('is_brochure', true)
        .or('hero_image_url.is.null,hero_image_url.eq.');

      setSanityData({
        counts: {
          brochure: brochureCount || 0,
          inStock: inStockCount || 0
        },
        recentSample: recentSample || [],
        missingImages: missingImages || [],
        keyCollisions: []
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
      setLoading({ ...loading, sanity: false });
    }
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

        <Tabs defaultValue="price-lists" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="price-lists">Price Lists</TabsTrigger>
            <TabsTrigger value="brochures">Brochures</TabsTrigger>
            <TabsTrigger value="hero-images">Hero Images</TabsTrigger>
            <TabsTrigger value="database-health">Database Health</TabsTrigger>
          </TabsList>

          {/* Price Lists Tab */}
          <TabsContent value="price-lists" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Mercury Price List
                </CardTitle>
                <CardDescription>
                  Ingest Mercury motor price data from Harris Boat Works
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <Label htmlFor="msrp-markup">MSRP Markup (e.g. 1.10 for 10%)</Label>
                  <Input
                    id="msrp-markup"
                    type="number"
                    step="0.01"
                    min="1"
                    max="2"
                    value={msrpMarkup}
                    onChange={(e) => setMsrpMarkup(parseFloat(e.target.value))}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => runPricelist({ dryRun: true })}
                    disabled={loading.pricelist}
                    variant="outline"
                  >
                    {loading.pricelist ? 'Processing...' : 'Preview Changes'}
                  </Button>
                  <Button
                    onClick={() => runPricelist({ dryRun: false })}
                    disabled={loading.pricelist || dryRun}
                  >
                    {loading.pricelist ? 'Processing...' : 'Apply Changes'}
                  </Button>
                  <Button
                    onClick={pingEdgeFunction}
                    disabled={loading.ping}
                    variant="outline"
                    size="sm"
                  >
                    {loading.ping ? 'Pinging...' : 'Test Connection'}
                  </Button>
                </div>

                {pricelistResults && (
                  <div className="mt-4">
                    <div className="p-4 border rounded-lg bg-muted/50">
                      <h4 className="font-medium mb-2">Price List Results</h4>
                      <div className="text-sm space-y-1">
                        <div>Parsed: <strong>{pricelistResults.parsed || 0}</strong></div>
                        <div>Created: <strong>{pricelistResults.rows_created || pricelistResults.would_create || 0}</strong></div>
                        <div>Updated: <strong>{pricelistResults.rows_updated || pricelistResults.would_update || 0}</strong></div>
                        {pricelistResults.message && (
                          <div className="mt-2 text-green-700">{pricelistResults.message}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {lastIngested.pricelist && (
                  <div className="text-xs text-muted-foreground">
                    Last ingested: {lastIngested.pricelist.toLocaleString()}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* HTML Import Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  HTML Import
                </CardTitle>
                <CardDescription>
                  Parse and import motor data from HTML files
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <Button 
                    onClick={parseHtmlFile} 
                    disabled={loading.htmlParse}
                    variant="outline"
                  >
                    {loading.htmlParse ? 'Parsing...' : 'Parse HTML File'}
                  </Button>
                  
                  <Button 
                    onClick={importHtmlToDatabase} 
                    disabled={loading.htmlImport || parsedHtmlData.length === 0}
                  >
                    {loading.htmlImport ? 'Importing...' : `Import ${parsedHtmlData.length} Motors`}
                  </Button>
                </div>
                
                {parsedHtmlData.length > 0 && (
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      Found {parsedHtmlData.length} motors ready to import
                    </div>
                    
                    <div className="max-h-96 overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Model #</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Price</TableHead>
                            <TableHead>Section</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parsedHtmlData.slice(0, 20).map((motor, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-mono text-xs">{motor.model_number}</TableCell>
                              <TableCell>{motor.description}</TableCell>
                              <TableCell className="text-right">${motor.price.toLocaleString()}</TableCell>
                              <TableCell className="text-xs">{motor.section}</TableCell>
                            </TableRow>
                          ))}
                          {parsedHtmlData.length > 20 && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground">
                                ... and {parsedHtmlData.length - 20} more motors
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Brochures Tab */}
          <TabsContent value="brochures" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Brochure PDFs
                </CardTitle>
                <CardDescription>
                  Link brochure PDF files to motor models
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="brochure-url">Brochure PDF URL</Label>
                  <Input
                    id="brochure-url"
                    value={brochureUrl}
                    onChange={(e) => setBrochureUrl(e.target.value)}
                    placeholder="https://example.com/brochure.pdf"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Apply to</Label>
                  <Select value={brochureApplyTo} onValueChange={(value: "all" | "family" | "keys") => setBrochureApplyTo(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Motors</SelectItem>
                      <SelectItem value="family">Specific Family</SelectItem>
                      <SelectItem value="keys">Specific Model Keys</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {brochureApplyTo === 'family' && (
                  <div className="space-y-2">
                    <Label htmlFor="brochure-family">Family Name</Label>
                    <Input
                      id="brochure-family"
                      value={brochureFamily}
                      onChange={(e) => setBrochureFamily(e.target.value)}
                      placeholder="e.g., FourStroke"
                    />
                  </div>
                )}

                {brochureApplyTo === 'keys' && (
                  <div className="space-y-2">
                    <Label htmlFor="brochure-keys">Model Keys (one per line)</Label>
                    <Textarea
                      id="brochure-keys"
                      value={brochureKeys}
                      onChange={(e) => setBrochureKeys(e.target.value)}
                      placeholder="MODEL_KEY_1&#10;MODEL_KEY_2&#10;MODEL_KEY_3"
                      rows={5}
                    />
                  </div>
                )}

                <Button
                  onClick={handleBrochureIngest}
                  disabled={loading.brochure || !brochureUrl}
                >
                  {loading.brochure ? 'Processing...' : 'Link Brochure PDF'}
                </Button>

                {lastIngested.brochure && (
                  <div className="text-xs text-muted-foreground">
                    Last linked: {lastIngested.brochure.toLocaleString()}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Hero Images Tab */}
          <TabsContent value="hero-images" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Hero Images
                </CardTitle>
                <CardDescription>
                  Upload and manage hero images for motor models
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Hero Image Management</h3>
                  <p className="text-muted-foreground mb-4">
                    Hero image functionality is available but requires additional setup for file uploads and mappings.
                  </p>
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Database Health Tab */}
          <TabsContent value="database-health" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Database Health Check
                </CardTitle>
                <CardDescription>
                  Run sanity checks and view database statistics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    onClick={runSanityCheck}
                    disabled={loading.sanity}
                    variant="outline"
                  >
                    {loading.sanity ? 'Running...' : 'Run Sanity Check'}
                  </Button>
                </div>

                {sanityData && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <div className="text-2xl font-bold">{sanityData.counts.brochure}</div>
                        <div className="text-sm text-muted-foreground">Brochure Models</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="text-2xl font-bold">{sanityData.counts.inStock}</div>
                        <div className="text-sm text-muted-foreground">In Stock Models</div>
                      </div>
                    </div>

                    {sanityData.missingImages?.length > 0 && (
                      <div className="p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                        <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                          Missing Images ({sanityData.missingImages.length})
                        </h4>
                        <div className="text-sm space-y-1 max-h-32 overflow-auto">
                          {sanityData.missingImages.slice(0, 10).map((item: any, i: number) => (
                            <div key={i} className="text-yellow-700 dark:text-yellow-300">
                              {item.model_key} - {item.model}
                            </div>
                          ))}
                          {sanityData.missingImages.length > 10 && (
                            <div className="text-yellow-600">... and {sanityData.missingImages.length - 10} more</div>
                          )}
                        </div>
                      </div>
                    )}

                    {sanityData.recentSample?.length > 0 && (
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Recent Sample ({sanityData.recentSample.length})</h4>
                        <div className="max-h-32 overflow-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Model</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Stock</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {sanityData.recentSample.slice(0, 5).map((item: any, i: number) => (
                                <TableRow key={i}>
                                  <TableCell className="text-xs">{item.model}</TableCell>
                                  <TableCell className="text-xs">${item.dealer_price || 'N/A'}</TableCell>
                                  <TableCell className="text-xs">
                                    <Badge variant={item.in_stock ? "default" : "secondary"}>
                                      {item.in_stock ? "In Stock" : "Out"}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}