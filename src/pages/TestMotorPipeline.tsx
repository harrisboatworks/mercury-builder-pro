import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle, Play } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TestResult {
  step: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  data?: any;
}

export default function TestMotorPipeline() {
  const { toast } = useToast();
  const [results, setResults] = useState<TestResult[]>([
    { step: 'Step 1: Price List Dry Run', status: 'pending', message: 'Ready to test' },
    { step: 'Step 1: Price List Ingest', status: 'pending', message: 'Ready to test' },
    { step: 'Step 2: Brochure PDF Attach', status: 'pending', message: 'Ready to test' },
    { step: 'Step 3: Hero Images Upload', status: 'pending', message: 'Ready to test' },
    { step: 'Step 4: XML Discovery', status: 'pending', message: 'Ready to test' },
    { step: 'Step 5: Sanity Check', status: 'pending', message: 'Ready to test' },
  ]);
  const [currentStep, setCurrentStep] = useState(0);

  const updateResult = (index: number, status: TestResult['status'], message: string, data?: any) => {
    setResults(prev => prev.map((result, i) => 
      i === index ? { ...result, status, message, data } : result
    ));
  };

  const logCheckpoint = (message: string) => {
    console.log(`🔍 CHECKPOINT: ${message}`);
    toast({ title: "Checkpoint", description: message });
  };

  const runStep1DryRun = async () => {
    const stepIndex = 0;
    updateResult(stepIndex, 'running', 'Testing price list dry run...');
    
    try {
      const { data, error } = await supabase.functions.invoke('seed-from-pricelist', {
        body: { 
          url: 'https://www.harrisboatworks.ca/mercurypricelist',
          dry_run: true
        }
      });

      if (error) {
        console.error('Edge fn error', { 
          status: error.status, 
          name: error.name, 
          message: error.message, 
          context: (error as any)?.context 
        });
        throw new Error(`${error.status}: ${error.message}\n${JSON.stringify((error as any)?.context ?? {}, null, 2)}`);
      }

      const message = `DRY RUN → parsed: ${data.rows_parsed}, would create: ${data.rows_created}, would update: ${data.rows_updated || 0}`;
      logCheckpoint(message);
      updateResult(stepIndex, 'success', message, data);
    } catch (error: any) {
      updateResult(stepIndex, 'error', `Error: ${error.message}`);
    }
  };

  const runStep1Ingest = async () => {
    const stepIndex = 1;
    updateResult(stepIndex, 'running', 'Ingesting price list with msrp_markup 1.10...');
    
    try {
      const { data, error } = await supabase.functions.invoke('seed-from-pricelist', {
        body: { 
          url: 'https://www.harrisboatworks.ca/mercurypricelist',
          dry_run: false,
          msrp_markup: 1.10
        }
      });

      if (error) {
        console.error('Edge fn error', { 
          status: error.status, 
          name: error.name, 
          message: error.message, 
          context: (error as any)?.context 
        });
        throw new Error(`${error.status}: ${error.message}\n${JSON.stringify((error as any)?.context ?? {}, null, 2)}`);
      }

      const message = `PriceList → parsed: ${data.rows_parsed}, upserts: ${data.rows_created} created, ${data.rows_updated || 0} updated, errors: ${data.errors || 0}`;
      logCheckpoint(message);
      updateResult(stepIndex, 'success', message, data);
    } catch (error: any) {
      updateResult(stepIndex, 'error', `Error: ${error.message}`);
    }
  };

  const runStep2BrochurePDF = async () => {
    const stepIndex = 2;
    updateResult(stepIndex, 'running', 'Attaching brochure PDF...');
    
    try {
      // Using a sample Mercury brochure PDF URL
      const brochureUrl = 'https://www.mercurymarine.com/content/dam/mercury-marine/pdf/2024_FourStroke_Brochure_EN.pdf';
      
      const { data, error } = await supabase.functions.invoke('attach-brochure-pdf', {
        body: { 
          url: brochureUrl,
          dry_run: false
        }
      });

      if (error) {
        console.error('Edge fn error', { 
          status: error.status, 
          name: error.name, 
          message: error.message, 
          context: (error as any)?.context 
        });
        throw new Error(`${error.status}: ${error.message}\n${JSON.stringify((error as any)?.context ?? {}, null, 2)}`);
      }

      const message = `BrochurePDF → attached to ${data.models_matched} models`;
      logCheckpoint(message);
      updateResult(stepIndex, 'success', message, data);
    } catch (error: any) {
      updateResult(stepIndex, 'error', `Error: ${error.message}`);
    }
  };

  const runStep3HeroImages = async () => {
    const stepIndex = 3;
    updateResult(stepIndex, 'running', 'Uploading hero images...');
    
    try {
      // Test with sample hero images
      const heroSamples = [
        { "model_key": "FOURSTROKE-25HP-EFI-ELHPT", "url": "https://assets.mercurymarine.com/motors/fourstroke-25-elhpt.jpg" },
        { "model_key": "FOURSTROKE-90HP-ELPT", "url": "https://assets.mercurymarine.com/motors/fourstroke-90-elpt.jpg" },
        { "model_key": "PROXS-150HP-XL", "url": "https://assets.mercurymarine.com/motors/proxs-150-xl.jpg" }
      ];

      let uploadedCount = 0;
      for (const item of heroSamples) {
        const { data, error } = await supabase.functions.invoke('upload-hero-image', {
          body: { 
            model_key: item.model_key,
            url: item.url,
            dry_run: false
          }
        });

        if (error) {
          console.error(`Hero upload error for ${item.model_key}:`, error);
        } else {
          uploadedCount++;
        }
      }

      const message = `Heroes → uploaded ${uploadedCount}, updated rows: ${uploadedCount}`;
      logCheckpoint(message);
      updateResult(stepIndex, 'success', message, { uploaded: uploadedCount });
    } catch (error: any) {
      updateResult(stepIndex, 'error', `Error: ${error.message}`);
    }
  };

  const runStep4XMLDiscovery = async () => {
    const stepIndex = 4;
    updateResult(stepIndex, 'running', 'Running XML discovery...');
    
    try {
      const { data, error } = await supabase.functions.invoke('scrape-inventory-v2', {
        body: { 
          source: 'harris',
          dry_run: false
        }
      });

      if (error) {
        console.error('XML discovery error', { 
          status: error.status, 
          name: error.name, 
          message: error.message, 
          context: (error as any)?.context 
        });
        throw new Error(`${error.status}: ${error.message}\n${JSON.stringify((error as any)?.context ?? {}, null, 2)}`);
      }

      const message = `XML → in_stock merged: ${data.motors_updated || 0}, new created: ${data.motors_created || 0}, images stored: ${data.images_processed || 0}`;
      logCheckpoint(message);
      updateResult(stepIndex, 'success', message, data);
    } catch (error: any) {
      updateResult(stepIndex, 'error', `Error: ${error.message}`);
    }
  };

  const runStep5SanityCheck = async () => {
    const stepIndex = 5;
    updateResult(stepIndex, 'running', 'Running sanity queries...');
    
    try {
      // Query 1: Breakdown by brochure/stock status
      const { data: breakdown, error: breakdownError } = await supabase
        .from('motor_models')
        .select('is_brochure, in_stock, count(*)', { count: 'exact' });

      if (breakdownError) throw breakdownError;

      // Query 2: Sample of recent motors
      const { data: samples, error: samplesError } = await supabase
        .from('motor_models')
        .select('model, model_key, dealer_price, msrp, price_source, in_stock, hero_image_url, image_url')
        .order('updated_at', { ascending: false, nullsFirst: false })
        .limit(10);

      if (samplesError) throw samplesError;

      logCheckpoint(`Sanity Check → Database queries completed`);
      updateResult(stepIndex, 'success', `Completed database sanity check`, { breakdown, samples });
    } catch (error: any) {
      updateResult(stepIndex, 'error', `Error: ${error.message}`);
    }
  };

  const runSingleStep = async (stepIndex: number) => {
    setCurrentStep(stepIndex);
    
    switch (stepIndex) {
      case 0: await runStep1DryRun(); break;
      case 1: await runStep1Ingest(); break;
      case 2: await runStep2BrochurePDF(); break;
      case 3: await runStep3HeroImages(); break;
      case 4: await runStep4XMLDiscovery(); break;
      case 5: await runStep5SanityCheck(); break;
    }
  };

  const runAllSteps = async () => {
    for (let i = 0; i < results.length; i++) {
      await runSingleStep(i);
      // Small delay between steps
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'running': return <Clock className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <div className="h-4 w-4 rounded-full border border-gray-300" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Motor Pipeline Test Suite</h1>
        <p className="text-muted-foreground">Comprehensive testing of the motor data pipeline</p>
      </div>

      <div className="flex gap-4 mb-6">
        <Button onClick={runAllSteps} disabled={currentStep >= 0}>
          <Play className="h-4 w-4 mr-2" />
          Run All Tests
        </Button>
      </div>

      <div className="space-y-4">
        {results.map((result, index) => (
          <Card key={index} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {getStatusIcon(result.status)}
                  {result.step}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(result.status)}>
                    {result.status}
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => runSingleStep(index)}
                    disabled={result.status === 'running'}
                  >
                    Run
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                {result.message}
              </CardDescription>
              {result.data && (
                <details className="mt-2">
                  <summary className="text-sm text-muted-foreground cursor-pointer">
                    View Details
                  </summary>
                  <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}