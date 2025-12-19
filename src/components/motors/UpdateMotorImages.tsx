import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Image, Download, Play, Square, CheckCircle2, Clock, AlertCircle, Zap, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { classifyMotorFamily, type MotorFamily } from '@/lib/motor-family-classifier';

const FAMILY_OPTIONS = [
  { value: 'all', label: 'All Families' },
  { value: 'proxs', label: 'ProXS (~17 motors)' },
  { value: 'seapro', label: 'SeaPro' },
  { value: 'verado', label: 'Verado' },
  { value: 'fourstroke', label: 'FourStroke' },
  { value: 'prokicker', label: 'ProKicker' },
];

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

const DELAY_BETWEEN_BATCHES = 30000;
const FETCH_TIMEOUT = 180000;

interface BatchResult {
  label: string;
  status: 'pending' | 'running' | 'complete' | 'error' | 'cancelled';
  motorsProcessed?: number;
  imagesUploaded?: number;
  successCount?: number;
  failCount?: number;
  error?: string;
}

interface HpFamilyGroup {
  key: string;
  hp: number;
  family: MotorFamily;
  motors: { id: string; model_display: string }[];
}

interface MercuryGroupResult {
  key: string;
  hp: number;
  family: string;
  motorCount: number;
  status: string;
  imagesFound?: number;
  imagesUploaded?: number;
  motorsUpdated?: number;
  imageUrls?: string[];
  motorDisplays?: string[];
  heroImage?: string;
}

export default function UpdateMotorImages() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [dryRun, setDryRun] = useState(true);
  const [hpMin, setHpMin] = useState('');
  const [hpMax, setHpMax] = useState('');
  const [batchSize, setBatchSize] = useState('50');
  const [selectedFamily, setSelectedFamily] = useState('all');
  const { toast } = useToast();

  // Mercury Portal state
  const [mercuryLoading, setMercuryLoading] = useState(false);
  const [mercuryResult, setMercuryResult] = useState<any>(null);
  const [hpFamilyGroups, setHpFamilyGroups] = useState<HpFamilyGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [includeOutOfStock, setIncludeOutOfStock] = useState(true);

  // Automated batch processing state
  const [isAutomatedRunning, setIsAutomatedRunning] = useState(false);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(-1);
  const [batchResults, setBatchResults] = useState<BatchResult[]>([]);
  const [countdown, setCountdown] = useState(0);
  const [totalStats, setTotalStats] = useState({ motors: 0, images: 0, success: 0, failed: 0 });
  const cancelRef = useRef(false);

  // Load HP+Family groups preview
  const loadGroupPreview = async () => {
    setLoadingGroups(true);
    try {
      let query = supabase
        .from('motor_models')
        .select('id, model_display, horsepower')
        .order('horsepower');

      // Only filter by stock if toggle is off
      if (!includeOutOfStock) {
        query = query.eq('in_stock', true);
      }

      const { data: motors, error } = await query;

      if (error) throw error;

      // Group motors by HP + Family
      const groups = new Map<string, HpFamilyGroup>();
      for (const motor of motors || []) {
        const hp = motor.horsepower || 0;
        const family = classifyMotorFamily(hp, motor.model_display || '');
        const key = `${hp}-${family}`;
        
        if (!groups.has(key)) {
          groups.set(key, { key, hp, family, motors: [] });
        }
        groups.get(key)!.motors.push({ 
          id: motor.id, 
          model_display: motor.model_display || '' 
        });
      }
      
      setHpFamilyGroups(Array.from(groups.values()).sort((a, b) => a.hp - b.hp));
    } catch (error) {
      console.error('Error loading groups:', error);
      toast({
        title: "Error loading groups",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoadingGroups(false);
    }
  };

  useEffect(() => {
    loadGroupPreview();
  }, [includeOutOfStock]);

  // Mercury Portal scraping with group-based approach
  const scrapeMercuryPortal = async (testSingleGroup = false) => {
    setMercuryLoading(true);
    setMercuryResult(null);
    
    try {
      toast({
        title: testSingleGroup 
          ? "Testing single group..." 
          : (dryRun ? "Starting Mercury Portal dry run..." : "Starting Mercury Portal scrape..."),
        description: testSingleGroup 
          ? "Processing just 1 group for debugging..."
          : `Processing ${hpFamilyGroups.length} HP+Family groups...`,
      });

      // Use supabase.functions.invoke() for better timeout handling
      const { data, error } = await supabase.functions.invoke('scrape-mercury-portal', {
        body: {
          dryRun,
          batchSize: parseInt(batchSize) || 50,
          maxImagesPerGroup: 10,
          includeOutOfStock,
          maxGroups: testSingleGroup ? 1 : 5, // Test mode: only 1 group
          saveScreenshots: true,
        },
      });

      if (error) {
        throw new Error(error.message || 'Edge function error');
      }

      setMercuryResult(data);
      
      const results = data?.results || data;
      toast({
        title: data?.success ? "Mercury Portal scrape complete!" : "Scrape completed with issues",
        description: `Processed ${results?.groupsProcessed || 0} groups, found ${results?.totalImagesFound || 0} images. ${results?.debugScreenshots?.length ? `${results.debugScreenshots.length} debug screenshots saved.` : ''}`,
        variant: data?.success ? "default" : "destructive",
      });
    } catch (error) {
      console.error('Error scraping Mercury portal:', error);
      const errorMessage = (error as Error).message;
      setMercuryResult({ error: errorMessage });
      toast({
        title: "Mercury Portal error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setMercuryLoading(false);
    }
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const runAllBatchesAutomatically = async () => {
    cancelRef.current = false;
    setIsAutomatedRunning(true);
    setCurrentBatchIndex(0);
    setTotalStats({ motors: 0, images: 0, success: 0, failed: 0 });
    setResult(null);

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

      setBatchResults(prev => prev.map((r, idx) => 
        idx === i ? { ...r, status: 'running' } : r
      ));

      try {
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      toast({
        title: dryRun ? "Starting dry run..." : "Starting image scraping...",
        description: "This may take 1-3 minutes. Please wait...",
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

      const options: Record<string, unknown> = {
        dryRun,
        batchSize: parseInt(batchSize) || 10,
      };
      
      if (hpMin) options.hpMin = parseFloat(hpMin);
      if (hpMax) options.hpMax = parseFloat(hpMax);
      if (selectedFamily && selectedFamily !== 'all') options.family = selectedFamily;

      const response = await fetch(
        `https://eutsoqdpjurknjsshxes.supabase.co/functions/v1/scrape-motor-images`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1dHNvcWRwanVya25qc3NoeGVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NTI0NzIsImV4cCI6MjA3MDEyODQ3Mn0.QsPdm3kQx1XC-epK1MbAQVyaAY1oxGyKdSYzrctGMaU',
          },
          body: JSON.stringify(options),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      setResult(data);
      toast({
        title: dryRun ? "Dry run complete!" : "Image scraping complete!",
        description: `Processed ${data?.totalProcessed || 0} motors. Success: ${data?.successCount || 0}, Failed: ${data?.failCount || 0}`,
      });
    } catch (error) {
      console.error('Error scraping images:', error);
      const errorMessage = (error as Error).name === 'AbortError' 
        ? 'Request timed out after 3 minutes' 
        : (error as Error).message;
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

  const completedBatches = batchResults.filter(b => b.status === 'complete').length;
  const progressPercent = HP_BATCHES.length > 0 ? (completedBatches / HP_BATCHES.length) * 100 : 0;

  const getFamilyColor = (family: string) => {
    switch (family) {
      case 'Verado': return 'bg-red-500/20 text-red-700 border-red-300';
      case 'Pro XS': return 'bg-orange-500/20 text-orange-700 border-orange-300';
      case 'FourStroke': return 'bg-blue-500/20 text-blue-700 border-blue-300';
      case 'ProKicker': return 'bg-green-500/20 text-green-700 border-green-300';
      case 'SeaPro': return 'bg-slate-500/20 text-slate-700 border-slate-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="container mx-auto p-8 space-y-6">
      {/* Mercury Portal Card - Primary */}
      <Card className="max-w-3xl mx-auto border-primary bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Mercury Product Knowledge Portal
          </CardTitle>
          <CardDescription>
            Scrape ALL images by HP + Family grouping. Each group shares the same images across all variants.
            {hpFamilyGroups.length > 0 && (
              <span className="block mt-1 text-foreground font-medium">
                {hpFamilyGroups.length} unique groups will be scraped
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Group Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="font-medium">HP + Family Groups Preview</Label>
              <Button variant="ghost" size="sm" onClick={loadGroupPreview} disabled={loadingGroups}>
                <RefreshCw className={`h-4 w-4 mr-1 ${loadingGroups ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
            
            {loadingGroups ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto border rounded-lg p-3 bg-muted/30">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {hpFamilyGroups.map((group) => (
                    <div key={group.key} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className={getFamilyColor(group.family)}>
                        {group.hp} HP
                      </Badge>
                      <span className="text-muted-foreground">{group.family}</span>
                      <span className="text-xs text-muted-foreground">
                        ({group.motors.length})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mercuryBatchSize">Max Motors</Label>
              <Input
                id="mercuryBatchSize"
                type="number"
                value={batchSize}
                onChange={(e) => setBatchSize(e.target.value)}
                placeholder="50"
              />
            </div>
            <div className="flex items-end">
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg w-full">
                <Switch
                  id="mercuryDryRun"
                  checked={dryRun}
                  onCheckedChange={setDryRun}
                  disabled={mercuryLoading}
                />
                <Label htmlFor="mercuryDryRun">Dry Run</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="includeOutOfStock"
                  checked={includeOutOfStock}
                  onCheckedChange={setIncludeOutOfStock}
                  disabled={mercuryLoading}
                />
                <Label htmlFor="includeOutOfStock">Include Out-of-Stock Motors</Label>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={() => scrapeMercuryPortal(true)}
              disabled={mercuryLoading}
              variant="outline"
            >
              {mercuryLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Zap className="mr-2 h-4 w-4" />
              )}
              Test 1 Group
            </Button>
            <Button 
              onClick={() => scrapeMercuryPortal(false)}
              disabled={mercuryLoading}
              className="flex-1"
              variant={dryRun ? "outline" : "default"}
            >
              {mercuryLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scraping...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  {dryRun ? "Preview All" : "Scrape All"}
                </>
              )}
            </Button>
          </div>

          {/* Mercury Results */}
          {mercuryResult && (
            <div className="mt-4 space-y-3">
              {mercuryResult.error ? (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                  {mercuryResult.error}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 bg-muted rounded-lg text-center">
                      <div className="text-2xl font-bold">{mercuryResult.groupsProcessed || 0}</div>
                      <div className="text-xs text-muted-foreground">Groups</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg text-center">
                      <div className="text-2xl font-bold">{mercuryResult.totalImagesFound || 0}</div>
                      <div className="text-xs text-muted-foreground">Images Found</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg text-center">
                      <div className="text-2xl font-bold">{mercuryResult.totalImagesUploaded || 0}</div>
                      <div className="text-xs text-muted-foreground">Uploaded</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg text-center">
                      <div className="text-2xl font-bold">{mercuryResult.totalMotorsUpdated || 0}</div>
                      <div className="text-xs text-muted-foreground">Motors Updated</div>
                    </div>
                  </div>

                  {/* Group details */}
                  {mercuryResult.groups && mercuryResult.groups.length > 0 && (
                    <div className="max-h-64 overflow-y-auto border rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-muted sticky top-0">
                          <tr>
                            <th className="text-left p-2">Group</th>
                            <th className="text-left p-2">Family</th>
                            <th className="text-center p-2">Motors</th>
                            <th className="text-center p-2">Images</th>
                            <th className="text-left p-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(mercuryResult.groups as MercuryGroupResult[]).map((group) => (
                            <tr key={group.key} className="border-t">
                              <td className="p-2 font-mono">{group.hp} HP</td>
                              <td className="p-2">
                                <Badge variant="outline" className={getFamilyColor(group.family)}>
                                  {group.family}
                                </Badge>
                              </td>
                              <td className="p-2 text-center">{group.motorCount}</td>
                              <td className="p-2 text-center">
                                {group.imagesFound || group.imagesUploaded || 0}
                              </td>
                              <td className="p-2">
                                {group.status === 'success' && (
                                  <span className="text-green-600 flex items-center gap-1">
                                    <CheckCircle2 className="h-4 w-4" /> Success
                                  </span>
                                )}
                                {group.status === 'dry_run' && (
                                  <span className="text-blue-600 flex items-center gap-1">
                                    <Clock className="h-4 w-4" /> Preview
                                  </span>
                                )}
                                {group.status === 'no_images' && (
                                  <span className="text-yellow-600 flex items-center gap-1">
                                    <AlertCircle className="h-4 w-4" /> No images
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Automated Batch Processing Card */}
      <Card className="max-w-2xl mx-auto border-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Alberni Automated Batch Processing
          </CardTitle>
          <CardDescription>
            Process all ~128 motors in {HP_BATCHES.length} small batches with 30-second delays.
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
              disabled={loading || mercuryLoading}
              className="w-full h-12 text-lg"
              variant={dryRun ? "outline" : "default"}
            >
              <Play className="mr-2 h-5 w-5" />
              {dryRun ? "Preview All Motors (Dry Run)" : "Process All Motors"}
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

              {countdown > 0 && (
                <div className="text-center text-sm text-muted-foreground">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Next batch in {countdown}s...
                </div>
              )}

              <div className="grid grid-cols-4 gap-2 text-center text-sm">
                <div className="p-2 bg-muted rounded">
                  <div className="font-bold">{totalStats.motors}</div>
                  <div className="text-xs text-muted-foreground">Motors</div>
                </div>
                <div className="p-2 bg-muted rounded">
                  <div className="font-bold">{totalStats.images}</div>
                  <div className="text-xs text-muted-foreground">Images</div>
                </div>
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded">
                  <div className="font-bold text-green-700 dark:text-green-400">{totalStats.success}</div>
                  <div className="text-xs text-muted-foreground">Success</div>
                </div>
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded">
                  <div className="font-bold text-red-700 dark:text-red-400">{totalStats.failed}</div>
                  <div className="text-xs text-muted-foreground">Failed</div>
                </div>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1">
                {batchResults.map((batch, idx) => (
                  <div 
                    key={batch.label}
                    className={`flex items-center justify-between p-2 rounded text-sm ${
                      batch.status === 'running' ? 'bg-primary/10 border border-primary/30' :
                      batch.status === 'complete' ? 'bg-green-50 dark:bg-green-900/20' :
                      batch.status === 'error' ? 'bg-red-50 dark:bg-red-900/20' :
                      batch.status === 'cancelled' ? 'bg-muted' :
                      'bg-background'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {batch.status === 'running' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                      {batch.status === 'complete' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                      {batch.status === 'error' && <AlertCircle className="h-4 w-4 text-red-600" />}
                      {batch.status === 'pending' && <Clock className="h-4 w-4 text-muted-foreground" />}
                      {batch.status === 'cancelled' && <Square className="h-4 w-4 text-muted-foreground" />}
                      {batch.label}
                    </span>
                    <span className="text-muted-foreground">
                      {batch.status === 'complete' && `${batch.imagesUploaded || 0} imgs`}
                      {batch.status === 'error' && 'Error'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Scraping Card */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Manual Alberni Scraper
          </CardTitle>
          <CardDescription>
            Scrape images for specific HP ranges or families
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hpMin">HP Min</Label>
              <Input
                id="hpMin"
                type="number"
                value={hpMin}
                onChange={(e) => setHpMin(e.target.value)}
                placeholder="e.g., 9.9"
              />
            </div>
            <div>
              <Label htmlFor="hpMax">HP Max</Label>
              <Input
                id="hpMax"
                type="number"
                value={hpMax}
                onChange={(e) => setHpMax(e.target.value)}
                placeholder="e.g., 15"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="family">Family</Label>
              <Select value={selectedFamily} onValueChange={setSelectedFamily}>
                <SelectTrigger>
                  <SelectValue placeholder="All Families" />
                </SelectTrigger>
                <SelectContent>
                  {FAMILY_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="manualBatchSize">Batch Size</Label>
              <Input
                id="manualBatchSize"
                type="number"
                value={batchSize}
                onChange={(e) => setBatchSize(e.target.value)}
                placeholder="10"
              />
            </div>
          </div>

          <Button 
            onClick={scrapeAlberniImages}
            disabled={loading || isAutomatedRunning || mercuryLoading}
            className="w-full"
            variant="outline"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scraping...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                {dryRun ? "Preview (Dry Run)" : "Scrape Images"}
              </>
            )}
          </Button>

          {result && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              {result.error ? (
                <p className="text-destructive">{result.error}</p>
              ) : (
                <pre className="text-xs overflow-auto max-h-48">
                  {JSON.stringify(result, null, 2)}
                </pre>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
