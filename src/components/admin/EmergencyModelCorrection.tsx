// Emergency Model Number Correction Dashboard
// Admin interface for fixing motor model number inaccuracies

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, CheckCircle, Trash2, Edit } from 'lucide-react';
import { emergencyModelCorrection, CorrectionResult } from '@/lib/emergency-model-correction';
import { useToast } from '@/hooks/use-toast';

export function EmergencyModelCorrection() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<CorrectionResult | null>(null);
  const { toast } = useToast();

  const handleRunCorrection = async () => {
    setIsRunning(true);
    setResult(null);
    
    try {
      const correctionResult = await emergencyModelCorrection();
      setResult(correctionResult);
      
      if (correctionResult.errors.length > 0) {
        toast({
          title: "Correction completed with errors",
          description: `${correctionResult.motorsCorrected} motors corrected, ${correctionResult.errors.length} errors`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Emergency correction successful",
          description: `${correctionResult.motorsCorrected} motors corrected, ${correctionResult.motorsDeleted} duplicates removed`,
        });
      }
    } catch (error) {
      console.error('Emergency correction failed:', error);
      toast({
        title: "Correction failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <AlertTriangle className="h-6 w-6 text-destructive" />
        <h2 className="text-2xl font-bold text-destructive">Emergency Model Number Correction</h2>
      </div>

      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Critical Issue Detected:</strong> Motor model numbers in the database don't match the official Mercury reference. 
          This could cause ordering errors and warranty issues. Run the emergency correction to fix all inaccuracies.
        </AlertDescription>
      </Alert>

      {/* Emergency Correction Card */}
      <Card className="border-destructive max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>Emergency Correction</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Fix model number inaccuracies and remove duplicate motors. This action cannot be undone.
          </p>
          
          <Button 
            onClick={handleRunCorrection}
            disabled={isRunning}
            className="w-full"
            variant="destructive"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Correction...
              </>
            ) : (
              'Run Emergency Correction'
            )}
          </Button>

          {result && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Motors Processed:</span>
                <Badge variant="secondary">{result.motorsProcessed}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Motors Corrected:</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {result.motorsCorrected}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Duplicates Deleted:</span>
                <Badge variant="destructive">{result.motorsDeleted}</Badge>
              </div>
              
              {result.errors.length > 0 && (
                <div className="mt-4 p-3 bg-destructive/10 rounded text-xs">
                  <p className="font-medium mb-2 text-destructive">Errors:</p>
                  <ul className="space-y-1">
                    {result.errors.map((error, index) => (
                      <li key={index} className="text-destructive">• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Details */}
      {result && result.details.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Correction Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {result.details.map((detail, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm p-2 bg-muted rounded">
                  {detail.action === 'corrected' && <Edit className="h-4 w-4 text-blue-500" />}
                  {detail.action === 'deleted' && <Trash2 className="h-4 w-4 text-red-500" />}
                  {detail.action === 'display_fixed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                  
                  <span className="flex-1">
                    {detail.action === 'corrected' && (
                      <>Model {detail.oldModelNumber} → {detail.newModelNumber} ({detail.displayName})</>
                    )}
                    {detail.action === 'deleted' && (
                      <>Deleted duplicate: {detail.modelNumber}</>
                    )}
                    {detail.action === 'display_fixed' && (
                      <>Fixed display: {detail.newDisplay}</>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}