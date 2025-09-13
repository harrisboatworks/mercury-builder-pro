import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function UpdateMotorImages() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const updateMotorImages = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      toast({
        title: "Starting image collection...",
        description: "This will scrape motor details and collect images from manufacturer pages.",
      });

      const { data, error } = await supabase.functions.invoke('update-motor-images');
      
      if (error) {
        throw error;
      }
      
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

  const scrapeMotorDetails = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      toast({
        title: "Starting motor detail scraping...",
        description: "This will collect detailed information and images for motors.",
      });

      // Trigger the cron job that scrapes motor details
      const response = await fetch('/api/cron/scrape-motor-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CRON_SECRET}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      
      toast({
        title: "Motor details scraped successfully!",
        description: `Processed ${data?.processed || 0} motors, ${data?.successful || 0} successful.`,
      });
    } catch (error) {
      console.error('Error scraping motor details:', error);
      const errorMessage = (error as Error).message;
      setResult({ error: errorMessage });
      toast({
        title: "Error scraping details",
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
      
      if (error) {
        throw error;
      }
      
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
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Motor Image Management</CardTitle>
          <CardDescription>
            Manage motor images with migration to internal storage and enhanced scraping capabilities.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <Button 
              onClick={migrateMotorImages}
              disabled={loading}
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
            
            <Button 
              onClick={scrapeMotorDetails}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <RefreshCw className="mr-2 h-4 w-4" />
              Scrape Motor Details & Images
            </Button>
          </div>
          
          {result && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Result:</h3>
              <pre className="text-sm whitespace-pre-wrap overflow-auto max-h-64">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}