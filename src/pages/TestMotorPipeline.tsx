import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle, Clock, AlertCircle, Play, ChevronDown, RotateCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TestResult {
  step: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  data?: any;
}

const STORAGE_KEY = 'motor-pipeline-results';

export default function TestMotorPipeline() {
  const { toast } = useToast();
  const [results, setResults] = useState<TestResult[]>(() => {
    // Load from localStorage on init
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved results:', e);
      }
    }
    return [
      { step: '1. Price List Dry Run', status: 'pending', message: 'Ready to test dry run with parse validation' },
      { step: '2. Price List Ingest', status: 'pending', message: 'Ready to ingest with msrp_markup: 1.10' },
      { step: '3. Attach Brochure PDFs', status: 'pending', message: 'Ready to attach brochure documentation' },
      { step: '4. Hero Images Upload', status: 'pending', message: 'Ready to upload and store hero images' },
      { step: '5. XML Discovery', status: 'pending', message: 'Ready to discover and merge inventory' },
      { step: '6. Sanity Queries', status: 'pending', message: 'Ready to run database health checks' },
      { step: '🔧 Test Single Insert', status: 'pending', message: 'Debug: Test inserting one record' },
      { step: '📊 Check Table Status', status: 'pending', message: 'Debug: Check motor_models table' },
    ];
  });
  const [currentStep, setCurrentStep] = useState(-1);
  const [sourceSettings, setSourceSettings] = useState<any>(null);

  // Save to localStorage whenever results change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
  }, [results]);

  // Load source settings on mount
  useEffect(() => {
    loadSourceSettings();
  }, []);

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
      const markupToSend = Number(1.10);
      
      const { data, error } = await supabase.functions.invoke('seed-from-pricelist', {
        body: { 
          price_list_url: sourceUrl,
          dry_run: true,
          msrp_markup: markupToSend,
          force: false,
          create_missing_brochures: true,
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
        throw new Error(`Status ${error.status}: ${error.message}\nStep: ${(error as any)?.context?.step || 'unknown'}`);
      }

      // Handle function-returned errors
      if (!data || (!data.ok && !data.success)) {
        const errorMsg = `Step: ${data?.step || 'unknown'} - ${data?.error || 'Unknown error'}`;
        console.error('Function returned error:', data);
        throw new Error(errorMsg);
      }

      const skipCount = Object.values(data.skip_reasons || {}).reduce((sum: number, count: any) => sum + Number(count), 0);
      const message = `Found ${data.raw_found || 0} • Parsed ${data.parsed || 0} • Would Create ${data.would_create || 0} • Would Update ${data.would_update || 0} • Skipped ${skipCount}`;
      logCheckpoint(`DRY RUN → ${message}`);
      updateResult(stepIndex, 'success', message, data);
    } catch (error: any) {
      updateResult(stepIndex, 'error', `Error: ${error.message}`);
    }
  };

  const runStep2Ingest = async () => {
    const stepIndex = 1;
    updateResult(stepIndex, 'running', 'Ingesting price list with msrp_markup 1.10...');
    
    try {
      const sourceUrl = getSourceUrl();
      const sourceContent = await getSourceContent();
      const markupToSend = Number(1.10);
      
      const { data, error } = await supabase.functions.invoke('seed-from-pricelist', {
        body: { 
          price_list_url: sourceUrl,
          dry_run: false,
          msrp_markup: markupToSend,
          force: false,
          create_missing_brochures: true,
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
        throw new Error(`Status ${error.status}: ${error.message}\nStep: ${(error as any)?.context?.step || 'unknown'}`);
      }

      // Handle function-returned errors
      if (!data || (!data.ok && !data.success)) {
        const errorMsg = `Step: ${data?.step || 'unknown'} - ${data?.error || 'Unknown error'}`;
        console.error('Function returned error:', data);
        throw new Error(errorMsg);
      }

      const skipCount = Object.values(data.skip_reasons || {}).reduce((sum: number, count: any) => sum + Number(count), 0);
      const message = `Found ${data.raw_found || 0} • Parsed ${data.parsed || 0} • Created ${data.rows_created || 0} • Updated ${data.rows_updated || 0} • Skipped ${skipCount}`;
      logCheckpoint(`INGEST → ${message}`);
      updateResult(stepIndex, 'success', message, data);
    } catch (error: any) {
      updateResult(stepIndex, 'error', `Error: ${error.message}`);
    }
  };

  const runStep3BrochurePDF = async () => {
    const stepIndex = 2;
    updateResult(stepIndex, 'running', 'Attaching brochure PDF...');
    
    try {
      // Using a sample Mercury brochure PDF URL
      const brochureUrl = 'https://www.mercurymarine.com/content/dam/mercury-marine/pdf/2024_FourStroke_Brochure_EN.pdf';
      
      const { data, error } = await supabase.functions.invoke('attach-brochure-pdf', {
        body: { 
          url: brochureUrl,
          apply_to: 'all',
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

      const message = `BrochurePDF → attached to ${data.models_matched || data.models_updated} models`;
      logCheckpoint(message);
      updateResult(stepIndex, 'success', message, data);
    } catch (error: any) {
      updateResult(stepIndex, 'error', `Error: ${error.message}`);
    }
  };

  const runStep4HeroImages = async () => {
    const stepIndex = 3;
    updateResult(stepIndex, 'running', 'Uploading hero images...');
    
    try {
      // Test with sample hero images - using more realistic model keys
      const heroSamples = [
        { "model_key": "FOURSTROKE-25HP-EFI-L-E-PT", "url": "https://www.mercurymarine.com/content/dam/mercury-marine/engines/outboard/fourstroke/25-60-hp/25-fourStroke-main.png" },
        { "model_key": "FOURSTROKE-90HP-EFI-L-PT-CT", "url": "https://www.mercurymarine.com/content/dam/mercury-marine/engines/outboard/fourstroke/75-150-hp/90-fourStroke-main.png" },
        { "model_key": "PROXS-150HP-EFI-XL-CT", "url": "https://www.mercurymarine.com/content/dam/mercury-marine/engines/outboard/proxs/150-pro-xs-main.png" }
      ];

      let uploadedCount = 0;
      const results = [];
      
      for (const item of heroSamples) {
        try {
          const { data, error } = await supabase.functions.invoke('upload-hero-image', {
            body: { 
              model_key: item.model_key,
              url: item.url,
              dry_run: false
            }
          });

          if (error) {
            console.error(`Hero upload error for ${item.model_key}:`, error);
            results.push({ model_key: item.model_key, success: false, error: error.message });
          } else if (data.stored) {
            uploadedCount++;
            results.push({ model_key: item.model_key, success: true, public_url: data.public_url });
          }
        } catch (err) {
          console.error(`Hero upload exception for ${item.model_key}:`, err);
          results.push({ model_key: item.model_key, success: false, error: err.message });
        }
      }

      const message = `Heroes → uploaded ${uploadedCount}/${heroSamples.length} images successfully`;
      logCheckpoint(message);
      updateResult(stepIndex, 'success', message, { uploaded: uploadedCount, total: heroSamples.length, results });
    } catch (error: any) {
      updateResult(stepIndex, 'error', `Error: ${error.message}`);
    }
  };

  const runStep5XMLDiscovery = async () => {
    const stepIndex = 4;
    updateResult(stepIndex, 'running', 'Running XML discovery and full inventory scrape...');
    
    try {
      // First run discovery mode
      const { data: discoveryData, error: discoveryError } = await supabase.functions.invoke('scrape-inventory-v2', {
        body: { 
          mode: 'discovery',
          source: 'harris'
        }
      });

      if (discoveryError) throw discoveryError;

      // Then run full mode with specified parameters
      const { data: fullData, error: fullError } = await supabase.functions.invoke('scrape-inventory-v2', {
        body: { 
          mode: 'full',
          batch_size: 12,
          concurrency: 3,
          source: 'harris'
        }
      });

      if (fullError) {
        console.error('XML full scrape error', { 
          status: fullError.status, 
          name: fullError.name, 
          message: fullError.message, 
          context: (fullError as any)?.context 
        });
        throw new Error(`${fullError.status}: ${fullError.message}\n${JSON.stringify((fullError as any)?.context ?? {}, null, 2)}`);
      }

      const message = `XML → discovered: ${discoveryData?.discovered || 0}, full scrape: ${fullData.motors_updated || 0} updated, ${fullData.motors_created || 0} new`;
      logCheckpoint(message);
      updateResult(stepIndex, 'success', message, { discovery: discoveryData, full: fullData });
    } catch (error: any) {
      updateResult(stepIndex, 'error', `Error: ${error.message}`);
    }
  };

  const runStep6SanityCheck = async () => {
    const stepIndex = 5;
    updateResult(stepIndex, 'running', 'Running sanity queries...');
    
    try {
      // Query 1: Counts by type
      const { count: brochureCount } = await supabase
        .from('motor_models')
        .select('*', { count: 'exact', head: true })
        .eq('is_brochure', true);

      const { count: inStockCount } = await supabase
        .from('motor_models')
        .select('*', { count: 'exact', head: true })
        .eq('in_stock', true);

      // Query 2: Recent sample with decoded fields
      const { data: samples, error: samplesError } = await supabase
        .from('motor_models')
        .select(`
          model, model_key, family, horsepower, shaft_code, 
          start_type, control_type, has_power_trim, has_command_thrust,
          dealer_price, msrp, hero_image_url, in_stock, stock_number
        `)
        .order('updated_at', { ascending: false, nullsFirst: false })
        .limit(20);

      if (samplesError) throw samplesError;

      // Query 3: Missing images (brochure)
      const { count: missingImagesCount } = await supabase
        .from('motor_models')
        .select('*', { count: 'exact', head: true })
        .eq('is_brochure', true)
        .or('hero_image_url.is.null,hero_image_url.eq.');

      const counts = {
        brochure_total: brochureCount || 0,
        in_stock_total: inStockCount || 0,
        missing_images: missingImagesCount || 0
      };

      const message = `Sanity → Brochure: ${counts.brochure_total}, In-Stock: ${counts.in_stock_total}, Missing Images: ${counts.missing_images}`;
      logCheckpoint(message);
      updateResult(stepIndex, 'success', message, { counts, samples });
    } catch (error: any) {
      updateResult(stepIndex, 'error', `Error: ${error.message}`);
    }
  };

  // Debug function to test single record insertion
  const testSingleInsert = async () => {
    const stepIndex = 6; // Step 7 (0-indexed)
    updateResult(stepIndex, 'running', 'Testing single record insertion...');
    
    try {
      const { data, error } = await supabase.rpc('test_single_motor_insert', {
        p_model_number: 'TEST-12345',
        p_model_display: 'Test Motor 15HP',
        p_dealer_price: 3500
      });
      
      if (error) {
        updateResult(stepIndex, 'error', `Single insert test failed: ${error.message}`);
        return;
      }
      
      // Verify the record exists
      const { data: verifyData, error: verifyError } = await supabase
        .from('motor_models')
        .select('*')
        .eq('model_number', 'TEST-12345')
        .single();
      
      if (verifyError) {
        updateResult(stepIndex, 'error', `Verification failed: ${verifyError.message}`);
        return;
      }
      
      updateResult(stepIndex, 'success', `✅ Single insert successful! Created record ID: ${data}`, {
        inserted_id: data,
        verified_record: verifyData
      });
      
    } catch (error) {
      updateResult(stepIndex, 'error', `Single insert test error: ${error}`);
    }
  };

  // Check motor_models table status
  const checkTableStatus = async () => {
    const stepIndex = 7; // Step 8 (0-indexed)
    updateResult(stepIndex, 'running', 'Checking motor_models table status...');
    
    try {
      const { data, error } = await supabase
        .from('motor_models')
        .select('id, model_number, model_display, is_brochure, created_at')
        .eq('is_brochure', true)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) {
        updateResult(stepIndex, 'error', `Table check failed: ${error.message}`);
        return;
      }
      
      const totalCount = data?.length || 0;
      updateResult(stepIndex, 'success', `📊 Found ${totalCount} brochure records in motor_models table`, {
        total_brochure_records: totalCount,
        sample_records: data?.slice(0, 5)
      });
      
    } catch (error) {
      updateResult(stepIndex, 'error', `Table check error: ${error}`);
    }
  };

  const runSingleStep = async (stepIndex: number) => {
    setCurrentStep(stepIndex);
    
    switch (stepIndex) {
      case 0: await runStep1DryRun(); break;
      case 1: await runStep2Ingest(); break;
      case 2: await runStep3BrochurePDF(); break;
      case 3: await runStep4HeroImages(); break;
      case 4: await runStep5XMLDiscovery(); break;
      case 5: await runStep6SanityCheck(); break;
      case 6: await testSingleInsert(); break;
      case 7: await checkTableStatus(); break;
    }
    
    setCurrentStep(-1);
  };

  const runAllSteps = async () => {
    for (let i = 0; i < results.length; i++) {
      await runSingleStep(i);
      // Small delay between steps
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    toast({ title: "Pipeline Complete", description: "All steps have been executed" });
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
        <Button onClick={runAllSteps} disabled={currentStep >= 0} size="lg">
          <Play className="h-4 w-4 mr-2" />
          Run All Steps
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
                    disabled={result.status === 'running' || currentStep >= 0}
                  >
                    Run
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => runSingleStep(index)}
                    disabled={result.status === 'running' || currentStep >= 0}
                    title="Retry step"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm mb-2">
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
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-auto p-2 font-mono text-xs">
                      <ChevronDown className="h-3 w-3 mr-1" />
                      View Details
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-2">
                    {/* Enhanced Results Display for Steps 1 and 2 */}
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
                            <div key={idx} className="grid grid-cols-6 gap-2 py-1 border-b border-muted-foreground/20">
                              <div className="truncate">{model.mercury_model_no || model.model_number || 'N/A'}</div>
                              <div className="truncate font-medium">{model.model_key || 'N/A'}</div>
                              <div className="truncate">{model.family || 'N/A'}</div>
                              <div>{model.horsepower || 'N/A'}</div>
                              <div className="text-green-600">${model.dealer_price || 'N/A'}</div>
                              <div className="text-blue-600">${model.msrp || 'N/A'}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Raw JSON for all steps */}
                    <div className="bg-muted rounded p-2 text-xs font-mono overflow-auto max-h-64">
                      <pre>{JSON.stringify(result.data, null, 2)}</pre>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}