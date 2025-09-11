import React, { useState } from 'react';
import { Button } from '../ui/button';
import { useToast } from '../ui/use-toast';
import { supabase } from '../../integrations/supabase/client';
import { Loader2, Database, RefreshCw } from 'lucide-react';

export function ScrapeMotorSpecs() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleBatchScrape = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('scrape-motor-details-batch', {
        body: {
          prioritize_missing_images: true,
          batch_size: 20,
          background: true
        }
      });

      if (error) throw error;

      toast({
        title: "Scraping Started",
        description: `Batch scraping initiated for ${data?.processed_count || 0} motors. Check back in a few minutes.`,
      });
    } catch (error) {
      console.error('Scraping error:', error);
      toast({
        title: "Error",
        description: "Failed to start batch scraping",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSingleScrape = async () => {
    setIsLoading(true);
    try {
      // Get a motor that doesn't have specs yet
      const { data: motors, error } = await supabase
        .from('motor_models')
        .select('id, model, detail_url, specifications')
        .not('detail_url', 'is', null)
        .limit(1);

      if (error) throw error;

      const motor = motors?.[0];
      if (!motor) {
        toast({
          title: "No Motors Found",
          description: "No motors found that need scraping",
          variant: "destructive",
        });
        return;
      }

      const { data, error: scrapeError } = await supabase.functions.invoke('scrape-motor-details', {
        body: {
          motor_id: motor.id,
          detail_url: motor.detail_url
        }
      });

      if (scrapeError) throw scrapeError;

      toast({
        title: "Scraping Complete",
        description: `Successfully scraped specs for ${motor.model}`,
      });
    } catch (error) {
      console.error('Scraping error:', error);
      toast({
        title: "Error",
        description: "Failed to scrape motor specs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div>
        <h3 className="text-lg font-semibold mb-2">Motor Specifications Scraping</h3>
        <p className="text-sm text-gray-600 mb-4">
          Scrape detailed specifications from motor detail pages to display technical specs in motor details.
        </p>
      </div>
      
      <div className="flex gap-2">
        <Button
          onClick={handleSingleScrape}
          disabled={isLoading}
          variant="outline"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Database className="w-4 h-4 mr-2" />
          )}
          Scrape One Motor
        </Button>
        
        <Button
          onClick={handleBatchScrape}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Batch Scrape All
        </Button>
      </div>
    </div>
  );
}