import React, { useState } from 'react';
import { Button } from '../ui/button';
import { useToast } from '../ui/use-toast';
import { supabase } from '../../integrations/supabase/client';
import { Loader2, Database, RefreshCw, Sparkles } from 'lucide-react';
import { Progress } from '../ui/progress';

interface CatalogScrapeResult {
  success: boolean;
  message?: string;
  summary?: {
    total: number;
    updated: number;
    failed: number;
    sources: {
      firecrawl: number;
      perplexity: number;
      staticDatabase: number;
    };
  };
  next_offset?: number;
  error?: string;
}

export function ScrapeMotorSpecs() {
  const [isLoading, setIsLoading] = useState(false);
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);
  const [catalogProgress, setCatalogProgress] = useState(0);
  const [catalogResult, setCatalogResult] = useState<CatalogScrapeResult | null>(null);
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

  const handleCatalogScrape = async () => {
    setIsCatalogLoading(true);
    setCatalogProgress(0);
    setCatalogResult(null);

    try {
      // Get total count of motors needing data
      const { count } = await supabase
        .from('motor_models')
        .select('id', { count: 'exact', head: true })
        .eq('make', 'Mercury')
        .or('description.is.null,description.eq.');

      const totalMotors = count || 0;
      const batchSize = 10;
      let offset = 0;
      let totalUpdated = 0;
      let totalFailed = 0;
      const sources = { firecrawl: 0, perplexity: 0, staticDatabase: 0 };

      toast({
        title: "Catalog Population Started",
        description: `Processing ~${totalMotors} motors with Mercury specs...`,
      });

      // Process in batches
      while (offset < totalMotors + batchSize) {
        const { data, error } = await supabase.functions.invoke('scrape-mercury-catalog', {
          body: {
            batch_size: batchSize,
            offset,
            prioritize_missing: true
          }
        });

        if (error) throw error;

        if (data?.summary) {
          totalUpdated += data.summary.updated || 0;
          totalFailed += data.summary.failed || 0;
          sources.firecrawl += data.summary.sources?.firecrawl || 0;
          sources.perplexity += data.summary.sources?.perplexity || 0;
          sources.staticDatabase += data.summary.sources?.staticDatabase || 0;
        }

        // If no results returned, we're done
        if (!data?.results || data.results.length === 0) {
          break;
        }

        offset = data.next_offset || offset + batchSize;
        setCatalogProgress(Math.min(100, Math.round((offset / Math.max(totalMotors, 1)) * 100)));

        // Small delay between batches
        await new Promise(r => setTimeout(r, 1000));
      }

      const result: CatalogScrapeResult = {
        success: true,
        message: `Processed ${offset} motors`,
        summary: {
          total: offset,
          updated: totalUpdated,
          failed: totalFailed,
          sources
        }
      };

      setCatalogResult(result);
      setCatalogProgress(100);

      toast({
        title: "Catalog Population Complete",
        description: `Updated ${totalUpdated} motors with Mercury specs`,
      });

    } catch (error) {
      console.error('Catalog scrape error:', error);
      setCatalogResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      toast({
        title: "Error",
        description: "Failed to populate Mercury catalog data",
        variant: "destructive",
      });
    } finally {
      setIsCatalogLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Existing scraping section */}
      <div className="space-y-4 p-4 border rounded-lg">
        <div>
          <h3 className="text-lg font-semibold mb-2">Motor Specifications Scraping</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Scrape detailed specifications from motor detail pages to display technical specs in motor details.
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleSingleScrape}
            disabled={isLoading || isCatalogLoading}
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
            disabled={isLoading || isCatalogLoading}
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

      {/* New Mercury Catalog section */}
      <div className="space-y-4 p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
        <div>
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            Mercury Catalog Data Population
          </h3>
          <p className="text-sm text-muted-foreground mb-2">
            Populate all Mercury motors with official descriptions, features, and specifications.
          </p>
          <p className="text-xs text-muted-foreground">
            Uses Firecrawl → Perplexity → Static Database fallback chain for maximum data coverage.
          </p>
        </div>

        <Button
          onClick={handleCatalogScrape}
          disabled={isLoading || isCatalogLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isCatalogLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          Populate Mercury Catalog Data
        </Button>

        {isCatalogLoading && (
          <div className="space-y-2">
            <Progress value={catalogProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Processing... {catalogProgress}% complete
            </p>
          </div>
        )}

        {catalogResult && (
          <div className={`p-4 rounded-lg ${catalogResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {catalogResult.success ? (
              <div className="space-y-2">
                <p className="font-medium text-green-800">
                  ✓ {catalogResult.message}
                </p>
                {catalogResult.summary && (
                  <div className="text-sm text-green-700 space-y-1">
                    <p>• Motors updated: {catalogResult.summary.updated}</p>
                    <p>• Failed: {catalogResult.summary.failed}</p>
                    <p className="text-xs mt-2 text-green-600">
                      Sources: Firecrawl ({catalogResult.summary.sources.firecrawl}) | 
                      Perplexity ({catalogResult.summary.sources.perplexity}) | 
                      Static DB ({catalogResult.summary.sources.staticDatabase})
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-red-800">
                ✗ Error: {catalogResult.error}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}