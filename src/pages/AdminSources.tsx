import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Upload, Link as LinkIcon, Image, FileText, DollarSign, Download, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminNav from "@/components/admin/AdminNav";

export default function AdminSources() {
  const { toast } = useToast();
  const [loading, setLoading] = useState({ pricelist: false, brochure: false, images: false });
  const [dryRun, setDryRun] = useState(true);
  const [lastIngested, setLastIngested] = useState({
    pricelist: null as Date | null,
    brochure: null as Date | null,
    images: null as Date | null,
  });
  const [pricelistUrl, setPricelistUrl] = useState("https://www.harrisboatworks.ca/mercurypricelist");
  const [msrpMarkup, setMsrpMarkup] = useState(1.10);
  const [forceIngest, setForceIngest] = useState(false);
  const [pricelistResults, setPricelistResults] = useState<any>(null);
  const [brochureUrl, setBrochureUrl] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState("");
  const [modelKeyMappings, setModelKeyMappings] = useState<Record<string, string>>({});
  const [bulkImportFile, setBulkImportFile] = useState<File | null>(null);

  const handlePricelistIngest = async (isDryRun: boolean) => {
    setLoading({ ...loading, pricelist: true });
    setPricelistResults(null);
    
    // Helper to pretty-print errors
    const pretty = (e: any) => {
      try { 
        if (typeof e === 'string') return e;
        if (e?.message) return e.message;
        if (e?.error?.message) return e.error.message;
        return JSON.stringify(e, null, 2);
      } catch { 
        return String(e); 
      }
    };
    
    try {
      const { data, error } = await supabase.functions.invoke('seed-from-pricelist', {
        body: { 
          url: pricelistUrl,
          dry_run: isDryRun,
          msrp_markup: msrpMarkup,
          force: forceIngest
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        setPricelistResults({
          success: false,
          title: 'Edge Function Error',
          step: error?.step || 'unknown',
          detail: pretty(error),
          artifacts: null
        });
        
        toast({
          title: "Error",
          description: `${pretty(error)}\nStep: ${error?.step || 'unknown'}`,
          variant: "destructive",
        });
        return;
      }

      // Check if data has error (when function returns status 200 but with error)
      if (data && !data.success) {
        console.error('Function returned error:', data);
        setPricelistResults({
          success: false,
          title: 'Ingest Error',
          step: data.step || 'unknown',
          detail: pretty(data.error),
          artifacts: data.artifacts || null
        });
        
        toast({
          title: "Ingest Error",
          description: `${pretty(data.error)}\nStep: ${data.step || 'unknown'}`,
          variant: "destructive",
        });
        return;
      }

      setPricelistResults(data);

      if (data.success) {
        if (data.skipped_due_to_same_checksum) {
          toast({
            title: "Skipped - No Changes",
            description: "Content unchanged since last run",
          });
        } else {
          toast({
            title: isDryRun ? "Price List Preview Complete" : "Price List Ingested",
            description: `${data.rows_parsed} parsed, ${data.rows_created} created, ${data.rows_updated || 0} updated`,
          });
        }

        if (!isDryRun && !data.skipped_due_to_same_checksum) {
          setLastIngested({ ...lastIngested, pricelist: new Date() });
        }
      }
    } catch (error) {
      console.error('Price list ingestion error:', error);
      setPricelistResults({
        success: false,
        title: 'Network Error',
        step: 'request',
        detail: pretty(error),
        artifacts: null
      });
      
      toast({
        title: "Error",
        description: pretty(error),
        variant: "destructive",
      });
    } finally {
      setLoading({ ...loading, pricelist: false });
    }
  };

  const handleBrochureIngest = async () => {
    setLoading({ ...loading, brochure: true });
    try {
      const { data, error } = await supabase.functions.invoke('attach-brochure-pdf', {
        body: { 
          url: brochureUrl,
          dry_run: dryRun
        }
      });

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

              <div className="flex gap-3">
                <Button 
                  onClick={() => handlePricelistIngest(true)}
                  disabled={loading.pricelist || !pricelistUrl.trim()}
                  variant="outline"
                  className="flex-1"
                >
                  {loading.pricelist ? "Processing..." : "Preview (Dry Run)"}
                </Button>
                
                <Button 
                  onClick={() => handlePricelistIngest(false)}
                  disabled={loading.pricelist || !pricelistUrl.trim()}
                  className="flex-1"
                >
                  {loading.pricelist ? "Processing..." : "Ingest"}
                </Button>
              </div>

              {pricelistResults && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  {pricelistResults.success ? (
                    <div className="space-y-4">
                      {/* Summary Badges */}
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">
                          {pricelistResults.rows_parsed} parsed
                        </Badge>
                        <Badge variant="default">
                          {pricelistResults.rows_created} created
                        </Badge>
                        <Badge variant="outline">
                          {pricelistResults.rows_updated || 0} updated
                        </Badge>
                        {pricelistResults.errors > 0 && (
                          <Badge variant="destructive">
                            {pricelistResults.errors} errors
                          </Badge>
                        )}
                        {pricelistResults.skipped_due_to_same_checksum && (
                          <Badge variant="secondary">
                            Skipped - No changes
                          </Badge>
                        )}
                      </div>

                      {/* Artifacts */}
                      {pricelistResults.artifacts && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Download Artifacts:</Label>
                          <div className="flex flex-wrap gap-2">
                            {pricelistResults.artifacts.html_url && (
                              <Button size="sm" variant="outline" asChild>
                                <a href={pricelistResults.artifacts.html_url} target="_blank" rel="noopener noreferrer">
                                  <Download className="w-4 h-4 mr-1" />
                                  HTML
                                </a>
                              </Button>
                            )}
                            {pricelistResults.artifacts.json_url && (
                              <Button size="sm" variant="outline" asChild>
                                <a href={pricelistResults.artifacts.json_url} target="_blank" rel="noopener noreferrer">
                                  <Download className="w-4 h-4 mr-1" />
                                  JSON
                                </a>
                              </Button>
                            )}
                            {pricelistResults.artifacts.csv_url && (
                              <Button size="sm" variant="outline" asChild>
                                <a href={pricelistResults.artifacts.csv_url} target="_blank" rel="noopener noreferrer">
                                  <Download className="w-4 h-4 mr-1" />
                                  CSV
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Sample Data */}
                      {pricelistResults.sample && pricelistResults.sample.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Sample Data (First 5 rows):</Label>
                          <div className="bg-background rounded border p-3 text-sm font-mono overflow-x-auto">
                            <div className="grid grid-cols-5 gap-2 font-semibold border-b pb-2 mb-2">
                              <div>Model</div>
                              <div>Key</div>
                              <div>Dealer Price</div>
                              <div>MSRP</div>
                              <div>HP</div>
                            </div>
                            {pricelistResults.sample.slice(0, 5).map((row: any, index: number) => (
                              <div key={index} className="grid grid-cols-5 gap-2 py-1">
                                <div className="truncate" title={row.model_display}>{row.model_display}</div>
                                <div className="text-muted-foreground">{row.model_key}</div>
                                <div>${row.dealer_price}</div>
                                <div>${row.msrp}</div>
                                <div>{row.horsepower || '-'}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-2">
                          <div><strong>Error:</strong> {pricelistResults.title}</div>
                          <div><strong>Step:</strong> {pricelistResults.step}</div>
                          <div>
                            <strong>Detail:</strong>
                            <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto whitespace-pre-wrap">
                              {pricelistResults.detail}
                            </pre>
                          </div>
                          {/* Show artifact download buttons even on error */}
                          {pricelistResults.artifacts && (
                            <div className="mt-3">
                              <div className="text-sm font-medium mb-2">Debug Artifacts:</div>
                              <div className="flex gap-2">
                                {pricelistResults.artifacts.html_url && (
                                  <Button size="sm" variant="outline" asChild>
                                    <a href={pricelistResults.artifacts.html_url} target="_blank" rel="noopener noreferrer">
                                      HTML
                                    </a>
                                  </Button>
                                )}
                                {pricelistResults.artifacts.json_url && (
                                  <Button size="sm" variant="outline" asChild>
                                    <a href={pricelistResults.artifacts.json_url} target="_blank" rel="noopener noreferrer">
                                      JSON
                                    </a>
                                  </Button>
                                )}
                                {pricelistResults.artifacts.csv_url && (
                                  <Button size="sm" variant="outline" asChild>
                                    <a href={pricelistResults.artifacts.csv_url} target="_blank" rel="noopener noreferrer">
                                      CSV
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
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
              <Tabs defaultValue="url" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="url">URL</TabsTrigger>
                  <TabsTrigger value="file">Upload</TabsTrigger>
                </TabsList>
                
                <TabsContent value="url" className="space-y-3">
                  <Label htmlFor="brochure-url">Brochure PDF URL</Label>
                  <Input
                    id="brochure-url"
                    value={brochureUrl}
                    onChange={(e) => setBrochureUrl(e.target.value)}
                    placeholder="https://example.com/brochure.pdf"
                  />
                </TabsContent>
                
                <TabsContent value="file" className="space-y-3">
                  <Label htmlFor="brochure-file">Upload PDF</Label>
                  <Input
                    id="brochure-file"
                    type="file"
                    accept=".pdf"
                  />
                </TabsContent>
              </Tabs>

              <Button 
                onClick={handleBrochureIngest}
                disabled={loading.brochure || !brochureUrl.trim()}
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
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="upload">Upload</TabsTrigger>
                  <TabsTrigger value="urls">URLs</TabsTrigger>
                  <TabsTrigger value="bulk">Bulk Import</TabsTrigger>
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
              </Tabs>

              <Button 
                onClick={bulkImportFile ? handleBulkImport : handleImageUpload}
                disabled={loading.images || (!bulkImportFile && selectedImages.length === 0 && !imageUrls.trim())}
                className="w-full"
              >
                {loading.images ? "Processing..." : bulkImportFile ? "Import Hero Images" : "Upload Hero Images"}
              </Button>

              {lastIngested.images && (
                <div className="text-sm text-muted-foreground">
                  Last uploaded: {lastIngested.images.toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}