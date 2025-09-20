import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const RawHTMLViewer = () => {
  const [rawHTML, setRawHTML] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchRawHTML = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Fetching raw HTML from Firecrawl...');
      
      const { data, error } = await supabase.functions.invoke('test-scraper-simple', {
        body: {}
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data.success && data.htmlSample) {
        // Show first 10,000 characters as requested
        const htmlToShow = data.htmlSample.length > 10000 
          ? data.htmlSample.substring(0, 10000) + '\n\n... (truncated, showing first 10,000 characters)'
          : data.htmlSample;
        
        setRawHTML(htmlToShow);
        
        toast({
          title: "Raw HTML Fetched",
          description: `Showing ${Math.min(data.htmlSample.length, 10000)} characters`,
        });
      } else {
        throw new Error(data.error || 'Failed to fetch HTML');
      }
      
    } catch (error) {
      console.error('❌ Error fetching raw HTML:', error);
      toast({
        title: "Error",
        description: `Failed to fetch raw HTML: ${error.message}`,
        variant: "destructive",
      });
      setRawHTML(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Raw HTML Viewer</CardTitle>
        <p className="text-sm text-muted-foreground">
          View the raw HTML content from Firecrawl to understand the structure
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={fetchRawHTML} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Fetching Raw HTML...
            </>
          ) : (
            'View Raw HTML'
          )}
        </Button>
        
        {rawHTML && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Raw HTML Content (First 10,000 characters):</label>
            <Textarea
              value={rawHTML}
              readOnly
              className="min-h-[400px] font-mono text-xs"
              placeholder="Raw HTML will appear here..."
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};