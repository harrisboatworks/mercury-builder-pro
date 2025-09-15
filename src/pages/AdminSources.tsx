import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Upload, Link as LinkIcon, Image, FileText, DollarSign } from "lucide-react";
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
  const [brochureUrl, setBrochureUrl] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState("");
  const [modelKeyMappings, setModelKeyMappings] = useState<Record<string, string>>({});
  const [bulkImportFile, setBulkImportFile] = useState<File | null>(null);

  const handlePricelistIngest = async () => {
    setLoading({ ...loading, pricelist: true });
    try {
      const { data, error } = await supabase.functions.invoke('seed-from-pricelist', {
        body: { 
          url: pricelistUrl,
          dry_run: dryRun
        }
      });

      if (error) throw error;

      toast({
        title: dryRun ? "Price List Preview" : "Price List Ingested",
        description: `${data.rows_parsed} rows parsed, ${data.rows_updated || 0} updated, ${data.rows_created} created`,
      });

      if (!dryRun) {
        setLastIngested({ ...lastIngested, pricelist: new Date() });
      }
    } catch (error) {
      console.error('Price list ingestion error:', error);
      toast({
        title: "Error",
        description: "Failed to ingest price list",
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
          {/* Price List Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Price List
              </CardTitle>
              <CardDescription>
                Ingest pricing data from URL or uploaded file
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="url" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="url">URL</TabsTrigger>
                  <TabsTrigger value="file">Upload</TabsTrigger>
                </TabsList>
                
                <TabsContent value="url" className="space-y-3">
                  <Label htmlFor="pricelist-url">Price List URL</Label>
                  <Input
                    id="pricelist-url"
                    value={pricelistUrl}
                    onChange={(e) => setPricelistUrl(e.target.value)}
                    placeholder="https://www.harrisboatworks.ca/mercurypricelist"
                  />
                </TabsContent>
                
                <TabsContent value="file" className="space-y-3">
                  <Label htmlFor="pricelist-file">Upload File</Label>
                  <Input
                    id="pricelist-file"
                    type="file"
                    accept=".csv,.xlsx,.pdf,.html"
                  />
                </TabsContent>
              </Tabs>

              <Button 
                onClick={handlePricelistIngest}
                disabled={loading.pricelist}
                className="w-full"
              >
                {loading.pricelist ? "Processing..." : "Ingest Price List"}
              </Button>

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