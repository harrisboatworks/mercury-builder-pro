import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, AlertCircle, Upload, FileText, Eye, Lock, Shield } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import AdminNav from "@/components/admin/AdminNav";

interface ImportResult {
  success: boolean;
  preview?: boolean;
  totalRecordsProcessed?: number;
  totalRecords?: number;
  priceUpdatesApplied?: number;
  newModelsAdded?: number;
  skippedRecords?: number;
  sampleRecords?: any[];
  message: string;
  error?: string;
  format?: string;
}

export default function AdminPricingImport() {
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [previewResult, setPreviewResult] = useState<ImportResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const { toast } = useToast();

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setPreviewResult(null);
    setImportResult(null);

    try {
      const content = await selectedFile.text();
      setFileContent(content);
      
      toast({
        title: "File Loaded",
        description: `${selectedFile.name} loaded successfully (${Math.round(selectedFile.size / 1024)}KB)`,
      });
    } catch (error) {
      toast({
        title: "File Error",
        description: "Failed to read file content",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      const input = document.createElement('input');
      input.type = 'file';
      input.files = event.dataTransfer.files;
      handleFileSelect({ target: input } as any);
    }
  }, [handleFileSelect]);

  const handlePreview = async () => {
    if (!fileContent) {
      toast({
        title: "No File",
        description: "Please select a file first",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setPreviewResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('universal-pricing-import', {
        body: {
          content: fileContent,
          filename: file?.name,
          preview_only: true
        }
      });

      if (error) throw new Error(error.message);

      setPreviewResult(data);
      
      toast({
        title: "Preview Generated",
        description: `Found ${data.totalRecords} valid pricing records`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Preview failed";
      toast({
        title: "Preview Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleImport = async () => {
    if (!fileContent) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('universal-pricing-import', {
        body: {
          content: fileContent,
          filename: file?.name,
          preview_only: false
        }
      });

      if (error) throw new Error(error.message);

      setImportResult(data);
      
      if (data.success) {
        toast({
          title: "Import Successful!",
          description: `Updated ${data.priceUpdatesApplied} prices and added ${data.newModelsAdded} new models.`,
        });
      } else {
        toast({
          title: "Import Failed",
          description: data.error || "An error occurred during import",
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Import failed";
      
      setImportResult({
        success: false,
        totalRecordsProcessed: 0,
        priceUpdatesApplied: 0,
        newModelsAdded: 0,
        skippedRecords: 0,
        message: "Import failed",
        error: errorMessage
      });

      toast({
        title: "Import Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <AdminNav />
      <div className="container mx-auto p-6 max-w-5xl">
        <div className="space-y-6">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-foreground">Pricing Import System</h1>
              <Lock className="h-6 w-6 text-amber-600" />
            </div>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              Upload CSV, Markdown, or JSON files to update motor pricing. Supports automatic format detection and preview before import.
            </p>
          </div>

          {/* File Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                File Upload
              </CardTitle>
              <CardDescription>
                Upload a pricing file in CSV, Markdown (pipe-delimited), or JSON format
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground mb-2">
                  Drop your pricing file here or click to browse
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports: CSV, Markdown (.md), JSON (.json)
                </p>
                <input
                  id="file-input"
                  type="file"
                  accept=".csv,.md,.json,.txt"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              {file && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({Math.round(file.size / 1024)}KB)
                  </span>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={handlePreview} 
                  disabled={!file || isUploading}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      Preview Import
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Format Support Guide */}
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg">Supported File Formats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="space-y-2">
                  <h4 className="font-semibold">📊 CSV Format</h4>
                  <p className="text-muted-foreground">
                    model_number, description, msrp, dealer_price
                  </p>
                  <code className="text-xs bg-background p-1 rounded">
                    1A25203BK,"25MH FourStroke",$5320,$4879
                  </code>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">📝 Markdown Format</h4>
                  <p className="text-muted-foreground">
                    Pipe-delimited format (current Mercury format)
                  </p>
                  <code className="text-xs bg-background p-1 rounded">
                    1A25203BK|25MH FourStroke|$5,320|$4,879
                  </code>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">🔧 JSON Format</h4>
                  <p className="text-muted-foreground">
                    Array of objects with pricing data
                  </p>
                  <code className="text-xs bg-background p-1 rounded">
                    {`[{"model_number":"1A25203BK",...}]`}
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview Results */}
          {previewResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-blue-600" />
                  Import Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Badge variant="secondary">
                    {previewResult.totalRecords} Records Found
                  </Badge>
                  {previewResult.format && (
                    <Badge variant="outline">
                      {previewResult.format} Format
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-muted-foreground">
                  {previewResult.message}
                </p>

                {previewResult.sampleRecords && previewResult.sampleRecords.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold">Sample Records:</h4>
                    <div className="bg-muted p-3 rounded-lg space-y-1">
                      {previewResult.sampleRecords.slice(0, 3).map((record, index) => (
                        <div key={index} className="text-xs font-mono">
                          {record.model_number} | {record.description} | ${record.msrp} | ${record.dealer_price}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      className="flex items-center gap-2"
                      disabled={isImporting}
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Import {previewResult.totalRecords} Records
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-amber-600" />
                        Confirm Pricing Import
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        <strong>⚠️ WARNING: This will permanently update motor pricing data.</strong>
                        <br /><br />
                        You are about to import {previewResult.totalRecords} pricing records. This will:
                        <ul className="mt-2 space-y-1">
                          <li>• Update MSRP and dealer prices for existing models</li>
                          <li>• Add new model variants if found</li>
                          <li>• Affect all quotes, spec sheets, and pricing displays</li>
                          <li>• Cannot be undone without a database restore</li>
                        </ul>
                        <br />
                        Are you sure you want to proceed?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleImport} className="bg-destructive hover:bg-destructive/90">
                        Yes, Import Pricing Data
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          )}

          {/* Import Results */}
          {importResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {importResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  Import Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {importResult.message}
                </p>

                {importResult.error && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <p className="text-sm text-destructive">{importResult.error}</p>
                  </div>
                )}

                {importResult.success && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">
                        {importResult.totalRecordsProcessed}
                      </div>
                      <div className="text-xs text-muted-foreground">Records Processed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {importResult.priceUpdatesApplied}
                      </div>
                      <div className="text-xs text-muted-foreground">Price Updates</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {importResult.newModelsAdded}
                      </div>
                      <div className="text-xs text-muted-foreground">New Models</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-muted-foreground">
                        {importResult.skippedRecords}
                      </div>
                      <div className="text-xs text-muted-foreground">Skipped</div>
                    </div>
                  </div>
                )}

                {importResult.success && (
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">✅ Pricing Updated</Badge>
                    <Badge variant="secondary">🆕 Models Added</Badge>
                    <Badge variant="secondary">🎯 {importResult.format} Format</Badge>
                    <Badge variant="secondary">📊 Annual Update</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}