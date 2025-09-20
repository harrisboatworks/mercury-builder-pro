import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MotorData {
  make: string;
  model: string;
  year: string;
  stockNumber: string;
  internetPrice: string;
  isNew: boolean;
  type: string;
  horsepower: string;
}

interface AnalysisData {
  totalUnits: number;
  mercuryUnits: number;
  parsedMotors: number;
  sampleMotors: MotorData[];
}

export const RawHTMLViewer = () => {
  const [xmlData, setXmlData] = useState('');
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchXMLFeed = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Fetching XML feed...');
      
      const { data, error } = await supabase.functions.invoke('test-scraper-simple', {
        body: {}
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data.success && data.xmlSample) {
        setXmlData(data.xmlSample);
        setAnalysisData(data.analysis);
        
        toast({
          title: "XML Feed Fetched Successfully",
          description: data.summary,
        });
      } else {
        throw new Error(data.error || 'Failed to fetch XML');
      }
      
    } catch (error) {
      console.error('❌ Error fetching XML:', error);
      toast({
        title: "Error",
        description: `Failed to fetch XML: ${error.message}`,
        variant: "destructive",
      });
      setXmlData(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>XML Feed Tester</CardTitle>
        <p className="text-sm text-muted-foreground">
          Test the direct XML feed from Harris Boatworks inventory (bypassing JavaScript)
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={fetchXMLFeed} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Fetching XML Feed...
            </>
          ) : (
            'Test XML Feed'
          )}
        </Button>
        
        {analysisData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{analysisData.totalUnits}</div>
              <div className="text-sm text-muted-foreground">Total Units</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{analysisData.mercuryUnits}</div>
              <div className="text-sm text-muted-foreground">Mercury Motors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{analysisData.parsedMotors}</div>
              <div className="text-sm text-muted-foreground">Successfully Parsed</div>
            </div>
          </div>
        )}

        {analysisData?.sampleMotors && analysisData.sampleMotors.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Sample Mercury Motors Found:</label>
            <div className="space-y-2">
              {analysisData.sampleMotors.map((motor, index) => (
                <div key={index} className="p-3 bg-muted rounded text-sm">
                  <div><strong>Model:</strong> {motor.model}</div>
                  <div><strong>Year:</strong> {motor.year} | <strong>HP:</strong> {motor.horsepower}</div>
                  <div><strong>Stock #:</strong> {motor.stockNumber} | <strong>Price:</strong> {motor.internetPrice}</div>
                  <div><strong>New:</strong> {motor.isNew ? 'Yes' : 'No'}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {xmlData && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Raw XML Content (First 10,000 characters):</label>
            <Textarea
              value={xmlData}
              readOnly
              className="min-h-[400px] font-mono text-xs"
              placeholder="XML content will appear here..."
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};