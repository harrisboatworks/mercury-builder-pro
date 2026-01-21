import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Image, Globe, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const FAMILY_OPTIONS = ['FourStroke', 'Pro XS', 'Verado', 'SeaPro', 'ProKicker'];

export default function UpdateImages() {
  const [loading, setLoading] = useState(false);
  const [publicLoading, setPublicLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [publicResult, setPublicResult] = useState<any>(null);
  
  // Public scraper inputs
  const [hp, setHp] = useState('150');
  const [family, setFamily] = useState('FourStroke');
  const [dryRun, setDryRun] = useState(true);

  const updateImages = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('update-motor-images');
      
      if (error) {
        throw error;
      }
      
      setResult(data);
      toast.success('Image update complete');
    } catch (error) {
      console.error('Error updating images:', error);
      setResult({ error: (error as Error).message });
      toast.error('Failed to update images');
    } finally {
      setLoading(false);
    }
  };

  const scrapePublicImages = async () => {
    setPublicLoading(true);
    setPublicResult(null);
    
    try {
      toast.info(`${dryRun ? 'Previewing' : 'Scraping'} Mercury public page for ${hp}HP ${family}...`);
      
      const { data, error } = await supabase.functions.invoke('scrape-mercury-public', {
        body: {
          hp: parseFloat(hp),
          family,
          dryRun,
        },
      });
      
      if (error) {
        throw error;
      }
      
      setPublicResult(data);
      
      if (data.success) {
        if (dryRun) {
          toast.success(`Found ${data.imagesFound} images (dry run)`);
        } else {
          toast.success(`Uploaded ${data.imagesUploaded} images`);
        }
      } else {
        toast.error(data.error || 'Scrape failed');
      }
    } catch (error) {
      console.error('Error scraping public images:', error);
      setPublicResult({ error: (error as Error).message });
      toast.error('Failed to scrape public images');
    } finally {
      setPublicLoading(false);
    }
  };

  const scrapeAllMotors = async () => {
    setPublicLoading(true);
    setPublicResult(null);
    
    try {
      toast.info('Fetching motors that need images...');
      
      // Get motors without images (check all three image fields)
      const { data: motors, error: fetchError } = await supabase
        .from('motor_models')
        .select('id, horsepower, family, model_display')
        .or('image_url.is.null,image_url.eq.')
        .or('images.is.null,images.eq.[]')
        .or('hero_image_url.is.null,hero_image_url.eq.')
        .not('horsepower', 'is', null)
        .limit(10);
      
      if (fetchError) throw fetchError;
      
      if (!motors || motors.length === 0) {
        toast.info('No motors found that need images');
        setPublicResult({ message: 'No motors need images' });
        return;
      }
      
      toast.info(`Found ${motors.length} motors, starting scrape...`);
      
      const results: any[] = [];
      for (const motor of motors) {
        const motorFamily = motor.family || 'FourStroke';
        
        const { data, error } = await supabase.functions.invoke('scrape-mercury-public', {
          body: {
            hp: motor.horsepower,
            family: motorFamily,
            motorId: motor.id,
            dryRun: false,
          },
        });
        
        results.push({
          motorId: motor.id,
          hp: motor.horsepower,
          family: motorFamily,
          display: motor.model_display,
          success: data?.success,
          imagesUploaded: data?.imagesUploaded || 0,
          error: error?.message || data?.error,
        });
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      const successCount = results.filter(r => r.success && r.imagesUploaded > 0).length;
      toast.success(`Updated ${successCount} of ${motors.length} motors`);
      
      setPublicResult({ motorsProcessed: motors.length, results });
    } catch (error) {
      console.error('Error scraping all motors:', error);
      setPublicResult({ error: (error as Error).message });
      toast.error('Failed to scrape motors');
    } finally {
      setPublicLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 space-y-6">
      {/* Public Image Scraper - Primary Method */}
      <Card className="max-w-2xl mx-auto border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Scrape Public Mercury Images
          </CardTitle>
          <CardDescription>
            Scrapes product images from Mercury's PUBLIC website - no login required! 
            This is the fastest and most reliable method.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hp">Horsepower</Label>
              <Input
                id="hp"
                type="number"
                value={hp}
                onChange={(e) => setHp(e.target.value)}
                placeholder="e.g. 150"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="family">Motor Family</Label>
              <Select value={family} onValueChange={setFamily}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FAMILY_OPTIONS.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="dryRun"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="dryRun" className="text-sm">
              Dry run (preview only, don't download)
            </Label>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={scrapePublicImages}
              disabled={publicLoading}
              className="flex-1"
            >
              {publicLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Image className="mr-2 h-4 w-4" />
              {dryRun ? 'Preview Images' : 'Scrape & Upload'}
            </Button>
            
            <Button 
              onClick={scrapeAllMotors}
              disabled={publicLoading}
              variant="outline"
            >
              {publicLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <RefreshCw className="mr-2 h-4 w-4" />
              Auto-Update All
            </Button>
          </div>
          
          {publicResult && (
            <div className="mt-4 p-4 bg-muted rounded-lg max-h-96 overflow-auto">
              <h3 className="font-semibold mb-2">Result:</h3>
              <pre className="text-sm whitespace-pre-wrap">
                {JSON.stringify(publicResult, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legacy thumbnail updater */}
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Update Thumbnail URLs</CardTitle>
          <CardDescription>
            This will update all motors that are using low-quality thumbnail images to use higher quality detail images instead.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={updateImages}
            disabled={loading}
            variant="secondary"
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Motor Images
          </Button>
          
          {result && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Result:</h3>
              <pre className="text-sm whitespace-pre-wrap">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
