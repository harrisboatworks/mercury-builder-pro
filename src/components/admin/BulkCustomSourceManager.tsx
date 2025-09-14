import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Play, Database, Globe, Zap } from 'lucide-react';

interface BulkStats {
  total_motors: number;
  motors_with_custom_sources: number;
  total_custom_sources: number;
  active_custom_sources: number;
}

export const BulkCustomSourceManager: React.FC = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<BulkStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      // Get motor counts
      const { count: totalMotors } = await supabase
        .from('motor_models')
        .select('*', { count: 'exact', head: true });

      // Get custom sources stats
      const { data: customSources, error: customSourcesError } = await supabase
        .from('motor_custom_sources')
        .select('motor_id, is_active');

      if (customSourcesError) throw customSourcesError;

      const totalCustomSources = customSources?.length || 0;
      const activeCustomSources = customSources?.filter(cs => cs.is_active).length || 0;
      const motorsWithCustomSources = new Set(customSources?.map(cs => cs.motor_id)).size;

      setStats({
        total_motors: totalMotors || 0,
        motors_with_custom_sources: motorsWithCustomSources,
        total_custom_sources: totalCustomSources,
        active_custom_sources: activeCustomSources,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch statistics',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkScrapeWithCustomSources = async () => {
    setIsProcessing(true);
    try {
      toast({
        title: 'Bulk Scraping Started',
        description: 'Processing all motors with custom sources...',
      });

      // Get all motors that have active custom sources
      const { data: motorsWithSources, error } = await supabase
        .from('motor_custom_sources')
        .select('motor_id')
        .eq('is_active', true);

      if (error) throw error;

      const uniqueMotorIds = [...new Set(motorsWithSources?.map(m => m.motor_id) || [])];

      // Process motors in batches
      for (const motorId of uniqueMotorIds) {
        try {
          await supabase.functions.invoke('multi-source-scraper', {
            body: {
              motor_id: motorId,
              include_custom_sources: true,
              background: true,
            },
          });
        } catch (motorError) {
          console.error(`Error processing motor ${motorId}:`, motorError);
        }
      }

      toast({
        title: 'Bulk Scraping Complete',
        description: `Processed ${uniqueMotorIds.length} motors with custom sources`,
      });

      fetchStats();
    } catch (error) {
      console.error('Error in bulk scraping:', error);
      toast({
        title: 'Bulk Scraping Failed',
        description: 'Failed to process motors with custom sources',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Bulk Custom Source Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total_motors}</div>
              <div className="text-sm text-muted-foreground">Total Motors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.motors_with_custom_sources}</div>
              <div className="text-sm text-muted-foreground">With Custom Sources</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total_custom_sources}</div>
              <div className="text-sm text-muted-foreground">Total Sources</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.active_custom_sources}</div>
              <div className="text-sm text-muted-foreground">Active Sources</div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h4 className="font-medium">Process All Custom Sources</h4>
            <p className="text-sm text-muted-foreground">
              Run the multi-source scraper on all motors with active custom sources
            </p>
          </div>
          <Button
            onClick={handleBulkScrapeWithCustomSources}
            disabled={isProcessing || !stats?.active_custom_sources}
          >
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Play className="mr-2 h-4 w-4" />
            Process All
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          <p>
            This will process all motors that have active custom sources configured. 
            The scraping runs in the background and may take several minutes to complete.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};