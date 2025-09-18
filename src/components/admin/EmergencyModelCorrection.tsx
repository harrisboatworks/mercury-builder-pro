// Emergency Model Number Correction Dashboard
// Admin interface for fixing motor model number inaccuracies

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, CheckCircle, XCircle, Trash2, Edit, Bomb } from 'lucide-react';
import { emergencyModelCorrection, validateAllMotors, nuclearRebuildFromOfficial, CorrectionResult } from '@/lib/emergency-model-correction';
import { useToast } from '@/hooks/use-toast';

export function EmergencyModelCorrection() {
  const [isRunning, setIsRunning] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isNuking, setIsNuking] = useState(false);
  const [result, setResult] = useState<CorrectionResult | null>(null);
  const [validationResult, setValidationResult] = useState<{ valid: number; invalid: number; issues: string[] } | null>(null);
  const [nuclearResult, setNuclearResult] = useState<CorrectionResult | null>(null);
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

  const handleValidateAll = async () => {
    setIsValidating(true);
    setValidationResult(null);
    
    try {
      const validation = await validateAllMotors();
      setValidationResult(validation);
      
      toast({
        title: "Validation complete",
        description: `${validation.valid} valid, ${validation.invalid} invalid motors`,
        variant: validation.invalid > 0 ? "destructive" : "default"
      });
    } catch (error) {
      console.error('Validation failed:', error);
      toast({
        title: "Validation failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleNuclearRebuild = async () => {
    setIsNuking(true);
    setNuclearResult(null);
    
    try {
      const rebuild = await nuclearRebuildFromOfficial();
      setNuclearResult(rebuild);
      
      if (rebuild.errors.length === 0) {
        toast({
          title: "Nuclear Rebuild Complete! 💥",
          description: `Deleted ${rebuild.motorsDeleted} old motors, inserted ${rebuild.motorsCorrected} official models`,
          variant: "default"
        });
      } else {
        toast({
          title: "Nuclear Rebuild Completed with Issues",
          description: `${rebuild.errors.length} errors occurred during rebuild`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Nuclear rebuild failed:', error);
      toast({
        title: "Nuclear Rebuild Failed",
        description: "A critical error occurred during the rebuild process",
        variant: "destructive"
      });
    } finally {
      setIsNuking(false);
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Validation Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>Validate Model Numbers</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Check all brochure motors against the official Mercury reference to identify issues.
            </p>
            
            <Button 
              onClick={handleValidateAll}
              disabled={isValidating || isRunning || isNuking}
              className="w-full"
              variant="outline"
            >
              {isValidating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                'Validate All Motors'
              )}
            </Button>

            {validationResult && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Valid Motors:</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {validationResult.valid}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Invalid Motors:</span>
                  <Badge variant="destructive">
                    {validationResult.invalid}
                  </Badge>
                </div>
                
                {validationResult.issues.length > 0 && (
                  <div className="mt-4 p-3 bg-muted rounded text-xs">
                    <p className="font-medium mb-2">Issues Found:</p>
                    <ul className="space-y-1">
                      {validationResult.issues.slice(0, 10).map((issue, index) => (
                        <li key={index} className="text-muted-foreground">• {issue}</li>
                      ))}
                      {validationResult.issues.length > 10 && (
                        <li className="text-muted-foreground">• ... and {validationResult.issues.length - 10} more</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Emergency Correction Card */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span>Emergency Correction</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Fix all model number inaccuracies and remove duplicate motors. This action cannot be undone.
            </p>
            
            <Button 
              onClick={handleRunCorrection}
              disabled={isRunning || isValidating || isNuking}
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

        {/* Nuclear Option Card */}
        <Card className="border-red-600 bg-red-50/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bomb className="h-5 w-5 text-red-600" />
              <CardTitle className="text-red-800">Nuclear Option</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-red-200">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                <strong>Complete database wipe and rebuild</strong> - Delete ALL brochure motors 
                and rebuild with exactly 167 official Mercury models.
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={handleNuclearRebuild}
              disabled={isNuking || isRunning || isValidating}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              {isNuking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Nuclear Rebuild...
                </>
              ) : (
                <>
                  <Bomb className="mr-2 h-4 w-4" />
                  Execute Nuclear Rebuild
                </>
              )}
            </Button>

            {nuclearResult && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Motors Deleted:</span>
                  <Badge className="bg-red-100 text-red-800">{nuclearResult.motorsDeleted}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Motors Inserted:</span>
                  <Badge className="bg-green-100 text-green-800">{nuclearResult.motorsCorrected}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Expected:</span>
                  <Badge variant="secondary">167</Badge>
                </div>
                
                {nuclearResult.errors.length > 0 && (
                  <div className="mt-4 p-3 bg-red-100 rounded text-xs">
                    <p className="font-medium mb-2 text-red-800">Errors:</p>
                    <ul className="space-y-1">
                      {nuclearResult.errors.slice(0, 5).map((error, index) => (
                        <li key={index} className="text-red-700">• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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