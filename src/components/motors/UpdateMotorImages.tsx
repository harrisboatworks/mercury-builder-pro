import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, RefreshCw, Image, Download, Play, Square, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const FAMILY_OPTIONS = [
  { value: '', label: 'All Families' },
  { value: 'proxs', label: 'ProXS (~17 motors)' },
  { value: 'seapro', label: 'SeaPro' },
  { value: 'verado', label: 'Verado' },
  { value: 'fourstroke', label: 'FourStroke' },
];
// Smaller batches (6-8 motors each) with offset support to avoid timeout
const HP_BATCHES = [
  { label: "2.5-5 HP", min: 2.5, max: 5, batchSize: 8, offset: 0, estimatedCount: 8 },
  { label: "6-8 HP", min: 6, max: 8, batchSize: 6, offset: 0, estimatedCount: 6 },
  { label: "9.9 HP (Part 1)", min: 9.9, max: 9.9, batchSize: 6, offset: 0, estimatedCount: 6 },
  { label: "9.9 HP (Part 2)", min: 9.9, max: 9.9, batchSize: 6, offset: 6, estimatedCount: 6 },
  { label: "15 HP (Part 1)", min: 15, max: 15, batchSize: 6, offset: 0, estimatedCount: 6 },
  { label: "15 HP (Part 2)", min: 15, max: 15, batchSize: 6, offset: 6, estimatedCount: 6 },
  { label: "20 HP (Part 1)", min: 20, max: 20, batchSize: 6, offset: 0, estimatedCount: 6 },
  { label: "20 HP (Part 2)", min: 20, max: 20, batchSize: 6, offset: 6, estimatedCount: 6 },
  { label: "25-30 HP", min: 25, max: 30, batchSize: 8, offset: 0, estimatedCount: 10 },
  { label: "40-60 HP", min: 40, max: 60, batchSize: 8, offset: 0, estimatedCount: 8 },
  { label: "75-115 HP", min: 75, max: 115, batchSize: 8, offset: 0, estimatedCount: 8 },
  { label: "150 HP", min: 150, max: 150, batchSize: 7, offset: 0, estimatedCount: 7 },
  { label: "175-200 HP", min: 175, max: 200, batchSize: 8, offset: 0, estimatedCount: 8 },
  { label: "225-250 HP", min: 225, max: 250, batchSize: 8, offset: 0, estimatedCount: 10 },
  { label: "300 HP (Part 1)", min: 300, max: 300, batchSize: 6, offset: 0, estimatedCount: 6 },
  { label: "300 HP (Part 2)", min: 300, max: 300, batchSize: 6, offset: 6, estimatedCount: 5 },
];

const DELAY_BETWEEN_BATCHES = 30000; // 30 seconds
const FETCH_TIMEOUT = 180000; // 3 minutes

interface BatchResult {
  label: string;
  status: 'pending' | 'running' | 'complete' | 'error' | 'cancelled';
  motorsProcessed?: number;
  imagesUploaded?: number;
  successCount?: number;
  failCount?: number;
  error?: string;
}

export default function UpdateMotorImages() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [dryRun, setDryRun] = useState(true);
  const [hpMin, setHpMin] = useState('');
  const [hpMax, setHpMax] = useState('');
  const [batchSize, setBatchSize] = useState('10');
  const [selectedFamily, setSelectedFamily] = useState('');
  const { toast } = useToast();

  // Automated batch processing state
  const [isAutomatedRunning, setIsAutomatedRunning] = useState(false);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(-1);
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);
  const [countdown, setCountdown] = useState(0);
  const [totalStats, setTotalStats] = useState({ motors: 0, images: 0, success: 0, failed: 0 });
  const cancelRef = useRef(false);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const runAllBatchesAutomatically = async () => {
    cancelRef.current = false;
    setIsAutomatedRunning(true);
    setCurrentBatchIndex(0);
    setTotalStats({ motors: 0, images: 0, success: 0, failed: 0 });
    setResult(null);

    // Initialize batch results
    const initialResults: BatchResult[] = HP_BATCHES.map(batch => ({
      label: batch.label,
      status: 'pending'
    }));
    setBatchResults(initialResults);

    toast({
      title: dryRun ? "Starting automated dry run..." : "Starting automated processing...",
      description: `Processing ~128 motors in ${HP_BATCHES.length} small batches with 30s delays.`,
    });

    let runningStats = { motors: 0, images: 0, success: 0, failed: 0 };

    for (let i = 0; i < HP_BATCHES.length; i++) {
      if (cancelRef.current) {
        setBatchResults(prev => prev.map((r, idx) => 
          idx >= i ? { ...r, status: 'cancelled' } : r
        ));
        break;
      }

      const batch = HP_BATCHES[i];
      setCurrentBatchIndex(i);

      // Update current batch to running
      setBatchResults(prev => prev.map((r, idx) => 
        idx === i ? { ...r, status: 'running' } : r
      ));

      try {
        // Use raw fetch with explicit 2-minute timeout to avoid client timeout issues
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Not authenticated');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

        const response = await fetch(
          `https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/scrape-motor-images`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1dHNvcWRwanVya25qc3NoeGVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NTI0NzIsImV4cCI6MjA3MDEyODQ3Mn0.QsPdm3kQx1XC-epK1MbAQVyaAY1oxGyKdSYzrctGMaU',
            },
            body: JSON.stringify({ 
              dryRun, 
              hpMin: batch.min, 
              hpMax: batch.max, 
              batchSize: batch.batchSize,
              offset: batch.offset 
            }),
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();

        const batchMotors = data?.totalProcessed || 0;
        const batchImages = data?.totalImagesUploaded || 0;
        const batchSuccess = data?.successCount || 0;
        const batchFail = data?.failCount || 0;

        runningStats = {
          motors: runningStats.motors + batchMotors,
          images: runningStats.images + batchImages,
          success: runningStats.success + batchSuccess,
          failed: runningStats.failed + batchFail,
        };
        setTotalStats(runningStats);

        setBatchResults(prev => prev.map((r, idx) => 
          idx === i ? { 
            ...r, 
            status: 'complete',
            motorsProcessed: batchMotors,
            imagesUploaded: batchImages,
            successCount: batchSuccess,
            failCount: batchFail,
          } : r
        ));

      } catch (error) {
        const errorMessage = (error as Error).message;
        setBatchResults(prev => prev.map((r, idx) => 
          idx === i ? { ...r, status: 'error', error: errorMessage } : r
        ));
        runningStats.failed++;
        setTotalStats(runningStats);
      }

      // Wait between batches (except for last batch)
      if (i < HP_BATCHES.length - 1 && !cancelRef.current) {
        for (let s = DELAY_BETWEEN_BATCHES / 1000; s > 0; s--) {
          if (cancelRef.current) break;
          setCountdown(s);
          await sleep(1000);
        }
        setCountdown(0);
      }
    }

    setIsAutomatedRunning(false);
    setCurrentBatchIndex(-1);

    if (!cancelRef.current) {
      toast({
        title: dryRun ? "Dry run complete!" : "All batches complete!",
        description: `Processed ${runningStats.motors} motors, uploaded ${runningStats.images} images.`,
      });
    } else {
      toast({
        title: "Processing cancelled",
        description: `Stopped after ${runningStats.motors} motors processed.`,
        variant: "destructive",
      });
    }
  };

  const cancelProcessing = () => {
    cancelRef.current = true;
    toast({
      title: "Cancelling...",
      description: "Will stop after current batch completes.",
    });
  };

  const scrapeAlberniImages = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      toast({
        title: dryRun ? "Starting dry run..." : "Starting image scraping...",
        description: "Scraping Alberni Power Marine for motor images.",
      });

      const options: Record<string, unknown> = {
        dryRun,
        batchSize: parseInt(batchSize) || 10,
      };
      
      if (hpMin) options.hpMin = parseFloat(hpMin);
      if (hpMax) options.hpMax = parseFloat(hpMax);
      if (selectedFamily) options.family = selectedFamily;

      const { data, error } = await supabase.functions.invoke('scrape-motor-images', {
        body: options
      });
      
      if (error) throw error;
      
      setResult(data);
      toast({
        title: dryRun ? "Dry run complete!" : "Image scraping complete!",
        description: `Processed ${data?.totalProcessed || 0} motors. Success: ${data?.successCount || 0}, Failed: ${data?.failCount || 0}`,
      });
    } catch (error) {
      console.error('Error scraping images:', error);
      const errorMessage = (error as Error).message;
      setResult({ error: errorMessage });
      toast({
        title: "Error scraping images",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateMotorImages = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      toast({
        title: "Starting image collection...",
        description: "This will scrape motor details and collect images from manufacturer pages.",
      });

      const { data, error } = await supabase.functions.invoke('update-motor-images');
      
      if (error) throw error;
      
      setResult(data);
      toast({
        title: "Motor images updated successfully!",
        description: `Updated ${data?.updated || 0} motors with new images.`,
      });
    } catch (error) {
      console.error('Error updating motor images:', error);
      const errorMessage = (error as Error).message;
      setResult({ error: errorMessage });
      toast({
        title: "Error updating images",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const migrateMotorImages = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      toast({
        title: "Starting image migration...",
        description: "Downloading and storing motor images in Supabase Storage.",
      });

      const { data, error } = await supabase.functions.invoke('migrate-motor-images', {
        body: { batchSize: 10, forceRedownload: false }
      });
      
      if (error) throw error;
      
      setResult(data);
      toast({
        title: "Image migration completed!",
        description: `Migrated ${data?.successful || 0} of ${data?.processed || 0} motor images.`,
      });
    } catch (error) {
      console.error('Error migrating images:', error);
      const errorMessage = (error as Error).message;
      setResult({ error: errorMessage });
      toast({
        title: "Error migrating images",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const completedBatches = batchResults.filter(b => b.status === 'complete').length;
  const progressPercent = HP_BATCHES.length > 0 ? (completedBatches / HP_BATCHES.length) * 100 : 0;

  return (
    <div className="container mx-auto p-8 space-y-6">
      {/* Automated Batch Processing Card */}
      <Card className="max-w-2xl mx-auto border-primary/30 bg-gradient-to-br from-background to-muted/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Process All Motors Automatically
          </CardTitle>
          <CardDescription>
            Automatically process all ~128 motors in {HP_BATCHES.length} small batches (8-12 motors each) with 30-second delays. Uses 2-minute timeout per batch to avoid failures. Estimated time: 15-25 minutes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <Label htmlFor="autoDryRun" className="font-medium">Dry Run Mode</Label>
              <p className="text-xs text-muted-foreground">
                Preview what will be scraped without making changes
              </p>
            </div>
            <Switch
              id="autoDryRun"
              checked={dryRun}
              onCheckedChange={setDryRun}
              disabled={isAutomatedRunning}
            />
          </div>

          {!isAutomatedRunning ? (
            <Button 
              onClick={runAllBatchesAutomatically}
              disabled={loading}
              className="w-full h-12 text-lg"
              variant={dryRun ? "outline" : "default"}
            >
              <Play className="mr-2 h-5 w-5" />
              {dryRun ? "Preview All 128 Motors (Dry Run)" : "Process All 128 Motors"}
            </Button>
          ) : (
            <Button 
              onClick={cancelProcessing}
              variant="destructive"
              className="w-full h-12"
            >
              <Square className="mr-2 h-4 w-4" />
              Cancel Processing
            </Button>
          )}

          {/* Progress Section */}
          {batchResults.length > 0 && (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress</span>
                  <span>{completedBatches}/{HP_BATCHES.length} batches</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>

              {/* Countdown Timer */}
              {countdown > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-2 rounded">
                  <Clock className="h-4 w-4" />
                  Waiting {countdown}s before next batch...
                </div>
              )}

              {/* Batch Status List */}
              <div className="space-y-2">
                {batchResults.map((batch, idx) => (
                  <div 
                    key={batch.label}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      batch.status === 'running' ? 'bg-primary/5 border-primary/30' :
                      batch.status === 'complete' ? 'bg-green-500/5 border-green-500/30' :
                      batch.status === 'error' ? 'bg-destructive/5 border-destructive/30' :
                      batch.status === 'cancelled' ? 'bg-muted border-muted' :
                      'bg-background border-border'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {batch.status === 'pending' && <Clock className="h-4 w-4 text-muted-foreground" />}
                      {batch.status === 'running' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                      {batch.status === 'complete' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      {batch.status === 'error' && <AlertCircle className="h-4 w-4 text-destructive" />}
                      {batch.status === 'cancelled' && <Square className="h-4 w-4 text-muted-foreground" />}
                      <div>
                        <p className="font-medium text-sm">Batch {idx + 1}: {batch.label}</p>
                        {batch.status === 'complete' && (
                          <p className="text-xs text-muted-foreground">
                            {batch.motorsProcessed} motors • {batch.imagesUploaded} images uploaded
                          </p>
                        )}
                        {batch.status === 'error' && (
                          <p className="text-xs text-destructive">{batch.error}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ~{HP_BATCHES[idx].estimatedCount} motors
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Stats */}
              {(totalStats.motors > 0 || totalStats.images > 0) && (
                <div className="grid grid-cols-4 gap-2 p-3 bg-muted rounded-lg text-center">
                  <div>
                    <p className="text-lg font-semibold">{totalStats.motors}</p>
                    <p className="text-xs text-muted-foreground">Motors</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{totalStats.images}</p>
                    <p className="text-xs text-muted-foreground">Images</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-green-600">{totalStats.success}</p>
                    <p className="text-xs text-muted-foreground">Success</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-destructive">{totalStats.failed}</p>
                    <p className="text-xs text-muted-foreground">Failed</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Scraper Card */}
      <Card className="max-w-2xl mx-auto border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Manual Batch Scrape
          </CardTitle>
          <CardDescription>
            Manually scrape a specific HP range, family, or batch size.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Family Selector */}
          <div className="space-y-2">
            <Label htmlFor="familySelect">Motor Family</Label>
            <Select value={selectedFamily || "all"} onValueChange={(val) => setSelectedFamily(val === "all" ? "" : val)}>
              <SelectTrigger id="familySelect">
                <SelectValue placeholder="Select motor family..." />
              </SelectTrigger>
              <SelectContent>
                {FAMILY_OPTIONS.map((option) => (
                  <SelectItem key={option.value || "all"} value={option.value || "all"}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {selectedFamily === 'proxs' && "Will scrape only ProXS motors with correct URLs"}
              {selectedFamily === 'seapro' && "Will scrape only SeaPro motors"}
              {selectedFamily === 'verado' && "Will scrape only Verado motors"}
              {selectedFamily === 'fourstroke' && "Will scrape only standard FourStroke motors"}
              {(!selectedFamily || selectedFamily === 'all') && "Leave empty to scrape all families"}
            </p>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hpMin">Min HP</Label>
              <Input
                id="hpMin"
                type="number"
                placeholder="e.g., 2.5"
                value={hpMin}
                onChange={(e) => setHpMin(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hpMax">Max HP</Label>
              <Input
                id="hpMax"
                type="number"
                placeholder="e.g., 300"
                value={hpMax}
                onChange={(e) => setHpMax(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="batchSize">Batch Size</Label>
              <Input
                id="batchSize"
                type="number"
                placeholder="10"
                value={batchSize}
                onChange={(e) => setBatchSize(e.target.value)}
              />
            </div>
          </div>
          
          <Button 
            onClick={scrapeAlberniImages}
            disabled={loading || isAutomatedRunning}
            className="w-full"
            variant="outline"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Download className="mr-2 h-4 w-4" />
            {dryRun ? "Preview Scrape (Dry Run)" : "Scrape & Update Images"}
            {selectedFamily && ` - ${FAMILY_OPTIONS.find(f => f.value === selectedFamily)?.label}`}
          </Button>
        </CardContent>
      </Card>

      {/* Legacy Tools Card */}
      <Card className="max-w-2xl mx-auto opacity-60">
        <CardHeader>
          <CardTitle>Legacy Image Tools</CardTitle>
          <CardDescription>
            Previous image management tools for migration and updates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <Button 
              onClick={migrateMotorImages}
              disabled={loading || isAutomatedRunning}
              variant="outline"
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <RefreshCw className="mr-2 h-4 w-4" />
              Migrate Images to Storage
            </Button>
            
            <Button 
              onClick={updateMotorImages}
              disabled={loading || isAutomatedRunning}
              variant="outline"
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <RefreshCw className="mr-2 h-4 w-4" />
              Update External Image URLs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Display */}
      {result && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm whitespace-pre-wrap overflow-auto max-h-96 bg-muted p-4 rounded-lg">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
