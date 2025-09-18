import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, AlertCircle, TrendingUp, Plus } from "lucide-react";

interface ImportResult {
  success: boolean;
  totalRecordsProcessed: number;
  priceUpdatesApplied: number;
  newModelsAdded: number;
  skippedRecords: number;
  message: string;
  error?: string;
}

export default function Import2026Pricing() {
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Auto-execute import on page load
    console.log('🚀 Auto-executing 2026 pricing import on page load...');
    handleImport();
  }, []); // Empty dependency array means this runs once when component mounts

  const handleImport = async () => {
    setIsImporting(true);
    setImportResult(null);

    try {
      console.log("🚀 Starting 2026 Mercury pricing import...");
      
      const { data, error } = await supabase.functions.invoke('import-2026-pricing', {
        body: {}
      });

      if (error) {
        throw new Error(error.message);
      }

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
      console.error("Import error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      
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
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold text-foreground">Mercury 2026 Pricing Import</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Import the official Mercury 2026 dealer pricing list to update existing models and add new variants 
            including DTS, color options, ProXS, and ProKicker models.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              2026 Pricing Data Import
            </CardTitle>
            <CardDescription>
              This will update pricing for existing models and add approximately 100+ new model variants from the official Mercury catalog.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>259 official model records</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span>Accurate MSRP & dealer pricing</span>
              </div>
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-purple-600" />
                <span>New variants & configurations</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={handleImport} 
                disabled={isImporting}
                className="flex items-center gap-2"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-4 w-4" />
                    Import 2026 Pricing
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

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
                  <Badge variant="secondary">🆕 New Models Added</Badge>
                  <Badge variant="secondary">🎯 Official Mercury Data</Badge>
                  <Badge variant="secondary">📊 2026 Catalog</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">What This Import Includes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-semibold">Price Corrections:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Updated MSRP for all existing models</li>
                  <li>• Corrected dealer pricing</li>
                  <li>• Fixed pricing discrepancies in 115HP+ motors</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">New Model Variants:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• DTS (Digital Throttle & Shift) models</li>
                  <li>• Cold/Warm/Pearl Fusion White colors</li>
                  <li>• ProXS high-performance versions</li>
                  <li>• ProKicker trolling configurations</li>
                  <li>• Command Thrust models</li>
                  <li>• Tiller steering options</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}