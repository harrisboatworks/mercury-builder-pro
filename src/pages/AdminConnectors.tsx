import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Upload, Link as LinkIcon, FolderOpen, Download, ExternalLink, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminNav from "@/components/admin/AdminNav";

interface CapturedSource {
  key: string;
  url: string;
  type: 'html' | 'csv';
  timestamp: Date;
}

export default function AdminConnectors() {
  const { toast } = useToast();
  const [loading, setLoading] = useState({ upload: false, url: false, gdrive: false });
  const [urls, setUrls] = useState({ fetch: '', gdrive: '' });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [capturedSources, setCapturedSources] = useState<CapturedSource[]>([]);

  const refreshCapturedSources = async () => {
    try {
      const { data } = await supabase
        .from('admin_sources')
        .select('*')
        .in('key', ['pricelist_last_html', 'pricelist_last_csv']);

      if (data) {
        const sources = data.map(item => ({
          key: item.key,
          url: item.value,
          type: item.key.includes('csv') ? 'csv' : 'html' as 'html' | 'csv',
          timestamp: new Date(item.updated_at)
        }));
        setCapturedSources(sources);
      }
    } catch (error) {
      console.error('Error fetching sources:', error);
    }
  };

  // Refresh on component mount
  useState(() => {
    refreshCapturedSources();
  });

  const handleFileUpload = async () => {
    if (uploadedFiles.length === 0) return;
    
    setLoading({ ...loading, upload: true });
    try {
      for (const file of uploadedFiles) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileExt = file.name.toLowerCase().endsWith('.csv') ? 'csv' : 'html';
        const filename = `pricelist/${timestamp}-uploaded.${fileExt}`;
        
        // Upload to Supabase storage
        const { error: uploadError } = await supabase.storage
          .from('sources')
          .upload(filename, file, {
            contentType: file.type,
            cacheControl: 'public, max-age=86400'
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get signed URL
        const { data: signedUrl } = await supabase.storage
          .from('sources')
          .createSignedUrl(filename, 60 * 60 * 24 * 7, { download: true });

        if (signedUrl?.signedUrl) {
          // Store in admin_sources
          const sourceKey = fileExt === 'csv' ? 'pricelist_last_csv' : 'pricelist_last_html';
          await supabase.from('admin_sources').upsert({
            key: sourceKey,
            value: signedUrl.signedUrl
          });
        }
      }

      toast({
        title: "Files Uploaded",
        description: `${uploadedFiles.length} files uploaded and captured successfully`,
      });

      setUploadedFiles([]);
      await refreshCapturedSources();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Error",
        description: "Failed to upload files",
        variant: "destructive",
      });
    } finally {
      setLoading({ ...loading, upload: false });
    }
  };

  const handleUrlFetch = async () => {
    if (!urls.fetch.trim()) return;
    
    setLoading({ ...loading, url: true });
    try {
      // Fetch content from URL
      const response = await fetch(urls.fetch);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const content = await response.text();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      // Determine content type
      const isCSV = urls.fetch.toLowerCase().includes('.csv') || 
                   response.headers.get('content-type')?.includes('csv') ||
                   content.includes(',') && content.split('\n')[0].split(',').length > 2;
      
      const fileExt = isCSV ? 'csv' : 'html';
      const filename = `pricelist/${timestamp}-fetched.${fileExt}`;
      
      // Save to storage
      const { error: uploadError } = await supabase.storage
        .from('sources')
        .upload(filename, content, {
          contentType: isCSV ? 'text/csv' : 'text/html',
          cacheControl: 'public, max-age=86400'
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get signed URL and store
      const { data: signedUrl } = await supabase.storage
        .from('sources')
        .createSignedUrl(filename, 60 * 60 * 24 * 7, { download: true });

      if (signedUrl?.signedUrl) {
        const sourceKey = isCSV ? 'pricelist_last_csv' : 'pricelist_last_html';
        await supabase.from('admin_sources').upsert({
          key: sourceKey,
          value: signedUrl.signedUrl
        });

        // If HTML and contains table, also generate CSV
        if (!isCSV && content.toLowerCase().includes('<table')) {
          try {
            // Simple table to CSV conversion
            const parser = new DOMParser();
            const doc = parser.parseFromString(content, 'text/html');
            const tables = doc.querySelectorAll('table');
            
            if (tables.length > 0) {
              const csvRows: string[] = [];
              tables[0].querySelectorAll('tr').forEach(row => {
                const cells = Array.from(row.querySelectorAll('td, th')).map(cell => 
                  `"${cell.textContent?.trim().replace(/"/g, '""') || ''}"`
                );
                if (cells.length > 0) {
                  csvRows.push(cells.join(','));
                }
              });
              
              if (csvRows.length > 1) {
                const csvContent = csvRows.join('\n');
                const csvFilename = `pricelist/${timestamp}-fetched.csv`;
                
                await supabase.storage
                  .from('sources')
                  .upload(csvFilename, csvContent, {
                    contentType: 'text/csv',
                    cacheControl: 'public, max-age=86400'
                  });

                const { data: csvSignedUrl } = await supabase.storage
                  .from('sources')
                  .createSignedUrl(csvFilename, 60 * 60 * 24 * 7, { download: true });

                if (csvSignedUrl?.signedUrl) {
                  await supabase.from('admin_sources').upsert({
                    key: 'pricelist_last_csv',
                    value: csvSignedUrl.signedUrl
                  });
                }
              }
            }
          } catch (csvError) {
            console.warn('Failed to generate CSV from HTML table:', csvError);
          }
        }
      }

      toast({
        title: "Content Fetched",
        description: `Successfully captured ${isCSV ? 'CSV' : 'HTML'} content from URL`,
      });

      setUrls({ ...urls, fetch: '' });
      await refreshCapturedSources();
    } catch (error) {
      console.error('Fetch error:', error);
      toast({
        title: "Fetch Error",
        description: "Failed to fetch content from URL",
        variant: "destructive",
      });
    } finally {
      setLoading({ ...loading, url: false });
    }
  };

  const handleGDriveFetch = async () => {
    if (!urls.gdrive.trim()) return;
    
    // Convert Google Drive share URL to direct download URL
    let fetchUrl = urls.gdrive;
    const driveMatch = urls.gdrive.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9-_]+)/);
    if (driveMatch) {
      fetchUrl = `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
    }
    
    setLoading({ ...loading, gdrive: true });
    try {
      await handleUrlFetch(); // Reuse the same logic
      setUrls({ ...urls, gdrive: '' });
    } finally {
      setLoading({ ...loading, gdrive: false });
    }
  };

  const setAsDefaultSource = async (sourceKey: string, sourceUrl: string) => {
    try {
      const sourceType = sourceKey.includes('csv') ? 'csv' : 'html';
      
      // Update default source settings
      await supabase.from('admin_sources').upsert([
        { key: 'pricelist_default_source', value: sourceType },
        { key: 'pricelist_default_url', value: sourceUrl }
      ]);

      toast({
        title: "Default Source Set",
        description: `Test Suite will now use this ${sourceType.toUpperCase()} source by default`,
      });
    } catch (error) {
      console.error('Error setting default source:', error);
      toast({
        title: "Error",
        description: "Failed to set default source",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Connectors</h1>
            <p className="text-muted-foreground">Upload, fetch, and manage data sources for price list ingestion</p>
          </div>
        </div>

        {/* Captured Sources Section */}
        {capturedSources.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Captured Sources</CardTitle>
              <CardDescription>
                Recently captured price list sources. These can be used as defaults in the Test Suite.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {capturedSources.map((source, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant={source.type === 'csv' ? 'default' : 'secondary'}>
                        {source.type.toUpperCase()}
                      </Badge>
                      <div>
                        <div className="text-sm font-medium">
                          {source.type === 'csv' ? 'CSV Price List' : 'HTML Price List'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Captured {source.timestamp.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(source.url, '_blank')}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setAsDefaultSource(source.key, source.url)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Use as Source
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              URL
            </TabsTrigger>
            <TabsTrigger value="gdrive" className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              Google Drive
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <Card>
              <CardHeader>
                <CardTitle>Upload Files</CardTitle>
                <CardDescription>
                  Upload HTML or CSV files containing Mercury price list data to Supabase storage.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="file-upload">Select Files (HTML or CSV)</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    multiple
                    accept=".html,.csv,.txt"
                    onChange={(e) => setUploadedFiles(Array.from(e.target.files || []))}
                  />
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected Files:</Label>
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <span className="text-sm flex-1 truncate">{file.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {(file.size / 1024).toFixed(1)} KB
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                <Button 
                  onClick={handleFileUpload}
                  disabled={loading.upload || uploadedFiles.length === 0}
                  className="w-full"
                >
                  {loading.upload ? "Uploading..." : "Upload & Capture"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="url">
            <Card>
              <CardHeader>
                <CardTitle>Fetch from URL</CardTitle>
                <CardDescription>
                  Fetch price list data from a public URL. Both HTML pages and direct CSV links are supported.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="fetch-url">Price List URL</Label>
                  <Input
                    id="fetch-url"
                    value={urls.fetch}
                    onChange={(e) => setUrls({ ...urls, fetch: e.target.value })}
                    placeholder="https://www.harrisboatworks.ca/mercurypricelist"
                  />
                </div>

                <Alert>
                  <AlertDescription>
                    If the URL contains an HTML table, we'll also automatically generate a CSV version.
                  </AlertDescription>
                </Alert>

                <Button 
                  onClick={handleUrlFetch}
                  disabled={loading.url || !urls.fetch.trim()}
                  className="w-full"
                >
                  {loading.url ? "Fetching..." : "Fetch & Capture"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gdrive">
            <Card>
              <CardHeader>
                <CardTitle>Google Drive</CardTitle>
                <CardDescription>
                  Fetch price list data from a public Google Drive file or Google Sheets export URL.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="gdrive-url">Google Drive Share URL</Label>
                  <Input
                    id="gdrive-url"
                    value={urls.gdrive}
                    onChange={(e) => setUrls({ ...urls, gdrive: e.target.value })}
                    placeholder="https://drive.google.com/file/d/1234567890/view?usp=sharing"
                  />
                </div>

                <Alert>
                  <AlertDescription>
                    For Google Sheets, use File → Download → CSV or share a public link to the sheet.
                    The file must be publicly accessible (anyone with the link can view).
                  </AlertDescription>
                </Alert>

                <Button 
                  onClick={handleGDriveFetch}
                  disabled={loading.gdrive || !urls.gdrive.trim()}
                  className="w-full"
                >
                  {loading.gdrive ? "Fetching..." : "Fetch & Capture"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}