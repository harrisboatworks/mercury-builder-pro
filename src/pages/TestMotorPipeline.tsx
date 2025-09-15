import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle, Play, Download, ExternalLink } from 'lucide-react';
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
    { step: 'Step 1: Import from Price List URL', status: 'pending', message: 'Ready to test' },
    { step: 'Step 2: Price List Ingest', status: 'pending', message: 'Ready to test' },
    { step: 'Step 3: Brochure PDF Attach', status: 'pending', message: 'Ready to test' },
    { step: 'Step 4: Hero Images Upload', status: 'pending', message: 'Ready to test' },
    { step: 'Step 5: XML Discovery', status: 'pending', message: 'Ready to test' },
    { step: 'Step 6: Sanity Check', status: 'pending', message: 'Ready to test' },
  ]);
  const [currentStep, setCurrentStep] = useState(0);
  const [sourceSettings, setSourceSettings] = useState<any>(null);

  // Load source settings on mount
  useState(() => {
    loadSourceSettings();
  });

  const loadSourceSettings = async () => {
    try {
      const { data } = await supabase
        .from('admin_sources')
        .select('*')
        .in('key', ['pricelist_default_source', 'pricelist_default_url', 'pricelist_last_csv', 'pricelist_last_html']);
      
      if (data) {
        const settings: any = {};
        data.forEach(item => {
          settings[item.key] = item.value;
        });
        setSourceSettings(settings);
      }
    } catch (error) {
      console.error('Error loading source settings:', error);
    }
  };

  const getSourceUrl = () => {
    if (!sourceSettings) return 'https://www.harrisboatworks.ca/mercurypricelist';
    
    const defaultSource = sourceSettings.pricelist_default_source;
    if (defaultSource === 'csv' && sourceSettings.pricelist_last_csv) {
      return null; // Use CSV content instead
    } else if (defaultSource === 'html' && sourceSettings.pricelist_last_html) {
      return sourceSettings.pricelist_default_url || 'https://www.harrisboatworks.ca/mercurypricelist';
    }
    
    return sourceSettings.pricelist_default_url || 'https://www.harrisboatworks.ca/mercurypricelist';
  };

  const getSourceContent = async () => {
    if (!sourceSettings) return {};
    
    const defaultSource = sourceSettings.pricelist_default_source;
    if (defaultSource === 'csv' && sourceSettings.pricelist_last_csv) {
      try {
        const response = await fetch(sourceSettings.pricelist_last_csv);
        const csvContent = await response.text();
        return { csv_content: csvContent };
      } catch (error) {
        console.error('Failed to fetch CSV content:', error);
        return {};
      }
    } else if (defaultSource === 'html' && sourceSettings.pricelist_last_html) {
      try {
        const response = await fetch(sourceSettings.pricelist_last_html);
        const htmlContent = await response.text();
        return { html_content: htmlContent };
      } catch (error) {
        console.error('Failed to fetch HTML content:', error);
        return {};
      }
    }
    
    return {};
  };

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
      const sourceUrl = getSourceUrl();
      const sourceContent = await getSourceContent();
      
      const { data, error } = await supabase.functions.invoke('seed-from-pricelist', {
        body: { 
          url: sourceUrl,
          dry_run: true,
          ...sourceContent
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

      const skipped = data.skipped_due_to_same_checksum ? 1 : 0;
      const message = `[${data.content_source?.toUpperCase() || 'URL'}] parsed ${data.rows_parsed_total || data.rows_parsed} • normalized ${data.rows_normalized || 0} • would create ${data.rows_created || 0} • would update ${data.rows_updated || 0} • errors ${data.rows_with_invalid_key + data.rows_with_invalid_price || 0} • skipped ${skipped}`;
      logCheckpoint(`DRY RUN → ${message}`);
      updateResult(stepIndex, 'success', message, data);
    } catch (error: any) {
      updateResult(stepIndex, 'error', `Error: ${error.message}`);
    }
  };

  const runUrlImport = async () => {
    const stepIndex = 1;
    updateResult(stepIndex, 'running', 'Importing from price list URL...');
    
    try {
      const defaultUrl = 'https://www.harrisboatworks.ca/mercurypricelist';
      
      const { data, error } = await supabase.functions.invoke('seed-from-pricelist', {
        body: { 
          url: defaultUrl,
          dry_run: false,
          msrp_markup: 1.10,
          parse_mode: 'auto'
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

      const message = `[${data.source_kind?.toUpperCase() || 'AUTO'}] parsed ${data.rows_parsed_total} • created ${data.rows_created} • updated ${data.rows_updated} • rejected ${data.rows_rejected || 0}`;
      logCheckpoint(`URL IMPORT → ${message}`);
      
      // Show reject reasons if less than 20 rows succeeded
      if ((data.rows_created + data.rows_updated) < 20 && data.reject_reasons?.length > 0) {
        console.log('Reject reasons:', data.reject_reasons);
        toast({
          title: "Low Success Rate",
          description: `Only ${data.rows_created + data.rows_updated} rows succeeded. Check console for reject reasons.`,
          variant: "destructive"
        });
      }
      
      updateResult(stepIndex, 'success', message, data);
    } catch (error: any) {
      updateResult(stepIndex, 'error', `Error: ${error.message}`);
    }
  };

  const runStep2Ingest = async () => {
    const stepIndex = 2;
    updateResult(stepIndex, 'running', 'Ingesting price list with msrp_markup 1.10...');
    
    try {
      const sourceUrl = getSourceUrl();
      const sourceContent = await getSourceContent();
      
      const { data, error } = await supabase.functions.invoke('seed-from-pricelist', {
        body: { 
          url: sourceUrl,
          dry_run: false,
          msrp_markup: 1.10,
          ...sourceContent
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

      const skipped = data.skipped_due_to_same_checksum ? 1 : 0;
      const message = `[${data.content_source?.toUpperCase() || 'URL'}] parsed ${data.rows_parsed_total || data.rows_parsed} • normalized ${data.rows_normalized || 0} • created ${data.rows_created || 0} • updated ${data.rows_updated || 0} • errors ${data.rows_with_invalid_key + data.rows_with_invalid_price || 0} • skipped ${skipped}`;
      logCheckpoint(`INGEST → ${message}`);
      updateResult(stepIndex, 'success', message, data);
    } catch (error: any) {
      updateResult(stepIndex, 'error', `Error: ${error.message}`);
    }
  };

  const runStep3BrochurePDF = async () => {
    const stepIndex = 3;
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

  const runStep4HeroImages = async () => {
    const stepIndex = 4;
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

  const runStep5XMLDiscovery = async () => {
    const stepIndex = 5;
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

  const runStep6SanityCheck = async () => {
    const stepIndex = 6;
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
      case 1: await runUrlImport(); break;
      case 2: await runStep2Ingest(); break;
      case 3: await runStep3BrochurePDF(); break;
      case 4: await runStep4HeroImages(); break;
      case 5: await runStep5XMLDiscovery(); break;
      case 6: await runStep6SanityCheck(); break;
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
              
              {/* Source Information */}
              {(index === 0 || index === 1) && sourceSettings && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Using source: {sourceSettings.pricelist_default_source?.toUpperCase() || 'URL'} 
                  {sourceSettings.pricelist_default_url && ` (${new URL(sourceSettings.pricelist_default_url).hostname})`}
                </div>
              )}
              
              {result.data && (
                <div className="mt-3 space-y-2">
                  {/* Enhanced Results Display for Steps 1A/1B */}
                  {(index === 0 || index === 1) && result.data.sample_models && (
                    <div className="space-y-3">
                      <div className="text-sm font-medium">Top 10 Parsed Models:</div>
                      <div className="bg-muted rounded p-2 text-xs font-mono overflow-x-auto max-h-40 overflow-y-auto">
                        <div className="grid grid-cols-6 gap-2 font-semibold border-b pb-1 mb-1 sticky top-0 bg-muted">
                          <div>Model Number</div>
                          <div>Model Key</div>
                          <div>Family</div>
                          <div>HP</div>
                          <div>Dealer $</div>
                          <div>MSRP $</div>
                        </div>
                        {result.data.sample_models.slice(0, 10).map((model: any, idx: number) => (
                          <div key={idx} className="grid grid-cols-6 gap-2 py-1">
                            <div className="truncate" title={model.model_number}>{model.model_number || '-'}</div>
                            <div className="truncate text-blue-600">{model.model_key}</div>
                            <div>{model.family || '-'}</div>
                            <div>{model.horsepower || '-'}</div>
                            <div>${model.dealer_price}</div>
                            <div>${model.msrp}</div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Enhanced counts display */}
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>Rows found: {result.data.rows_parsed_total || result.data.rows_parsed} • Valid: {result.data.rows_normalized} • Invalid keys: {result.data.rows_with_invalid_key} • Invalid prices: {result.data.rows_with_invalid_price}</div>
                        <div>Blank rows skipped: {result.data.rows_skipped_blank} • Missing required: {result.data.rows_missing_required} • Duplicates: {result.data.duplicates_in_feed}</div>
                      </div>
                    </div>
                  )}
                  
                  {/* Last Capture URLs */}
                  {(index === 0 || index === 1) && sourceSettings && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Open Last Capture:</div>
                      <div className="flex gap-2">
                        {sourceSettings.pricelist_last_html && (
                          <Button size="sm" variant="outline" onClick={() => window.open(sourceSettings.pricelist_last_html, '_blank')}>
                            <ExternalLink className="h-3 w-3 mr-1" />
                            HTML
                          </Button>
                        )}
                        {sourceSettings.pricelist_last_csv && (
                          <Button size="sm" variant="outline" onClick={() => window.open(sourceSettings.pricelist_last_csv, '_blank')}>
                            <ExternalLink className="h-3 w-3 mr-1" />
                            CSV
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Artifact downloads for steps 1A/1B */}
                  {(index === 0 || index === 1) && result.data.artifacts && (
                    <div className="flex gap-2">
                      {result.data.artifacts.csv_url && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(result.data.artifacts.csv_url, '_blank')}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download CSV
                        </Button>
                      )}
                      {result.data.artifacts.json_url && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(result.data.artifacts.json_url, '_blank')}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download JSON
                        </Button>
                      )}
                      {result.data.artifacts.html_url && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(result.data.artifacts.html_url, '_blank')}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download HTML
                        </Button>
                      )}
                    </div>
                  )}
                  
                  <details className="mt-2">
                    <summary className="text-sm text-muted-foreground cursor-pointer">
                      View Raw Details
                    </summary>
                    <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}