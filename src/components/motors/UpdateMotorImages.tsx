import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, RefreshCw, Image, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function UpdateMotorImages() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [dryRun, setDryRun] = useState(true);
  const [hpMin, setHpMin] = useState('');
  const [hpMax, setHpMax] = useState('');
  const [batchSize, setBatchSize] = useState('10');
  const { toast } = useToast();

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

  return (
    <div className="container mx-auto p-8 space-y-6">
      {/* Alberni Power Marine Scraper Card */}
      <Card className="max-w-2xl mx-auto border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Scrape from Alberni Power Marine
          </CardTitle>
          <CardDescription>
            Use Firecrawl to scrape high-quality motor images from Alberni Power Marine's product pages.
            Each motor will be matched to its correct product page using model display names.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
            <p className="text-xs text-muted-foreground">
              Number of motors to process per run. Higher = longer runtime.
            </p>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <Label htmlFor="dryRun" className="font-medium">Dry Run Mode</Label>
              <p className="text-xs text-muted-foreground">
                Preview what will be scraped without updating the database
              </p>
            </div>
            <Switch
              id="dryRun"
              checked={dryRun}
              onCheckedChange={setDryRun}
            />
          </div>
          
          <Button 
            onClick={scrapeAlberniImages}
            disabled={loading}
            className="w-full"
            variant={dryRun ? "outline" : "default"}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Download className="mr-2 h-4 w-4" />
            {dryRun ? "Preview Scrape (Dry Run)" : "Scrape & Update Images"}
          </Button>
        </CardContent>
      </Card>

      {/* Legacy Tools Card */}
      <Card className="max-w-2xl mx-auto">
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
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <RefreshCw className="mr-2 h-4 w-4" />
              Migrate Images to Storage
            </Button>
            
            <Button 
              onClick={updateMotorImages}
              disabled={loading}
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