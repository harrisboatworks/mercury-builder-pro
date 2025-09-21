import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Bug, Search, FileText, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DebugAnalysis {
  success: boolean;
  analysis?: {
    xmlSize: number;
    totalItems: number;
    itemPatterns: Record<string, number>;
    vinSearchResults: Record<string, { found: boolean; position?: number; xmlSnippet?: string }>;
    mercuryAnalysis: {
      totalMentions: number;
      itemsWithMercury: any[];
      fieldVariations: Record<string, number>;
    };
    fieldDiscovery: {
      manufacturerFields: string[];
      conditionFields: string[];
      modelFields: string[];
      stockFields: string[];
    };
    sampleItems: any[];
  };
  recommendations?: string[];
  error?: string;
}

export function XMLDebugAnalyzer() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DebugAnalysis | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true,
    vins: true,
    mercury: true,
    recommendations: true
  });
  const { toast } = useToast();

  const runDebugAnalysis = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('debug-xml-inventory');
      
      if (error) throw error;
      
      setResults(data);
      toast({
        title: "XML Debug Analysis Complete",
        description: `Found ${data.analysis?.totalItems || 0} total items, ${data.analysis?.mercuryAnalysis?.itemsWithMercury?.length || 0} Mercury motors`,
      });
    } catch (error) {
      console.error('Debug analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (!results) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            <CardTitle>XML Debug Analyzer</CardTitle>
          </div>
          <CardDescription>
            Comprehensive analysis of the Harris XML feed to debug Mercury motor parsing issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runDebugAnalysis} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Analyzing XML Feed...' : 'Run Complete XML Analysis'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!results.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Analysis Failed</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{results.error}</p>
          <Button onClick={() => setResults(null)} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { analysis, recommendations } = results;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              <CardTitle>XML Debug Results</CardTitle>
            </div>
            <Button onClick={() => setResults(null)} variant="outline" size="sm">
              Run New Analysis
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Overview Section */}
      <Card>
        <Collapsible open={expandedSections.overview} onOpenChange={() => toggleSection('overview')}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  XML Feed Overview
                </CardTitle>
                {expandedSections.overview ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{analysis?.xmlSize.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">XML Size (chars)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{analysis?.totalItems}</div>
                  <div className="text-sm text-muted-foreground">Total Items</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{analysis?.mercuryAnalysis?.totalMentions}</div>
                  <div className="text-sm text-muted-foreground">Mercury Mentions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{analysis?.mercuryAnalysis?.itemsWithMercury?.length}</div>
                  <div className="text-sm text-muted-foreground">Mercury Items Found</div>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div>
                <h4 className="font-medium mb-2">Item Patterns Detected:</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(analysis?.itemPatterns || {}).map(([pattern, count]) => (
                    <Badge key={pattern} variant={count > 0 ? "default" : "secondary"}>
                      {pattern}: {count}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* VIN Search Results */}
      <Card>
        <Collapsible open={expandedSections.vins} onOpenChange={() => toggleSection('vins')}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  VIN Search Results
                </CardTitle>
                {expandedSections.vins ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(analysis?.vinSearchResults || {}).map(([vin, result]) => (
                  <div key={vin} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">VIN: {vin}</span>
                      <Badge variant={result.found ? "default" : "destructive"}>
                        {result.found ? "Found" : "Missing"}
                      </Badge>
                    </div>
                    {result.found && result.xmlSnippet && (
                      <Textarea
                        value={result.xmlSnippet}
                        readOnly
                        className="mt-2 font-mono text-xs"
                        rows={6}
                      />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Mercury Analysis */}
      <Card>
        <Collapsible open={expandedSections.mercury} onOpenChange={() => toggleSection('mercury')}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  Mercury Motor Analysis
                </CardTitle>
                {expandedSections.mercury ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Field Variations in Mercury Items:</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(analysis?.mercuryAnalysis?.fieldVariations || {}).map(([field, count]) => (
                      <Badge key={field} variant="outline">
                        {field} ({count})
                      </Badge>
                    ))}
                  </div>
                </div>

                {analysis?.mercuryAnalysis?.itemsWithMercury?.map((item, idx) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <h5 className="font-medium mb-2">Mercury Item #{idx + 1}</h5>
                    <div className="space-y-2">
                      <div>
                        <strong>Parsed Fields:</strong>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {Object.entries(item.fields || {}).map(([field, value]) => (
                            <Badge key={field} variant="secondary" className="text-xs">
                              {field}: {String(value)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm text-muted-foreground">View Raw XML</summary>
                        <Textarea
                          value={item.rawXml}
                          readOnly
                          className="mt-2 font-mono text-xs"
                          rows={8}
                        />
                      </details>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Recommendations */}
      <Card>
        <Collapsible open={expandedSections.recommendations} onOpenChange={() => toggleSection('recommendations')}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Recommendations
                </CardTitle>
                {expandedSections.recommendations ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <ul className="space-y-2">
                {recommendations?.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}