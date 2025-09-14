import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MotorManualOverride } from './MotorManualOverride';
import { 
  Loader2, 
  Database, 
  Globe, 
  User, 
  Zap, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Filter,
  Eye
} from 'lucide-react';

interface Motor {
  id: string;
  model: string;
  horsepower: number;
  data_quality_score: number;
  data_sources: any;
  last_enriched: string | null;
  manual_overrides: any;
}

interface EnrichmentLog {
  id: string;
  motor_id: string;
  source_name: string;
  action: string;
  success: boolean;
  error_message?: string;
  created_at: string;
}

export const DataEnrichmentDashboard: React.FC = () => {
  const { toast } = useToast();
  const [motors, setMotors] = useState<Motor[]>([]);
  const [logs, setLogs] = useState<EnrichmentLog[]>([]);
  const [selectedMotor, setSelectedMotor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnriching, setIsEnriching] = useState(false);
  const [qualityFilter, setQualityFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, [qualityFilter, sourceFilter]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch motors
      let motorsQuery = supabase
        .from('motor_models')
        .select('id, model, horsepower, data_quality_score, data_sources, last_enriched, manual_overrides')
        .order('data_quality_score', { ascending: true });

      if (qualityFilter !== 'all') {
        const [min, max] = qualityFilter.split('-').map(Number);
        motorsQuery = motorsQuery.gte('data_quality_score', min).lt('data_quality_score', max);
      }

      const { data: motorsData, error: motorsError } = await motorsQuery.limit(50);
      if (motorsError) throw motorsError;

      // Fetch enrichment logs
      const { data: logsData, error: logsError } = await supabase
        .from('motor_enrichment_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (logsError) throw logsError;

      setMotors(motorsData || []);
      setLogs(logsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch enrichment data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const triggerEnrichment = async (motorId?: string, sourceName?: string) => {
    setIsEnriching(true);
    try {
      const { error } = await supabase.functions.invoke('multi-source-scraper', {
        body: {
          motor_id: motorId,
          source_name: sourceName,
          batch_size: motorId ? 1 : 10,
          background: !motorId,
        },
      });

      if (error) throw error;
      
      toast({
        title: 'Success',
        description: motorId 
          ? 'Motor enrichment started' 
          : 'Batch enrichment started',
      });

      // Refresh data after a short delay
      setTimeout(fetchData, 2000);
    } catch (error) {
      console.error('Error triggering enrichment:', error);
      toast({
        title: 'Error',
        description: 'Failed to trigger enrichment',
        variant: 'destructive',
      });
    } finally {
      setIsEnriching(false);
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>;
    if (score >= 40) return <Badge className="bg-orange-100 text-orange-800">Fair</Badge>;
    return <Badge className="bg-red-100 text-red-800">Poor</Badge>;
  };

  const getSourceIcon = (sourceName: string) => {
    switch (sourceName) {
      case 'harris': return <Database className="h-4 w-4" />;
      case 'mercury_official': return <Globe className="h-4 w-4" />;
      case 'manual': return <User className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const filteredMotors = motors.filter(motor => {
    if (sourceFilter === 'all') return true;
    return motor.data_sources?.[sourceFilter]?.success === true;
  });

  const overallStats = {
    total: motors.length,
    excellent: motors.filter(m => m.data_quality_score >= 80).length,
    good: motors.filter(m => m.data_quality_score >= 60 && m.data_quality_score < 80).length,
    poor: motors.filter(m => m.data_quality_score < 60).length,
    avgScore: motors.reduce((acc, m) => acc + m.data_quality_score, 0) / motors.length || 0,
  };

  if (selectedMotor) {
    return (
      <MotorManualOverride
        motorId={selectedMotor}
        onClose={() => setSelectedMotor(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <div className="text-2xl font-bold">{overallStats.total}</div>
            </div>
            <p className="text-xs text-muted-foreground">Total Motors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div className="text-2xl font-bold">{overallStats.excellent}</div>
            </div>
            <p className="text-xs text-muted-foreground">Excellent Quality</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <div className="text-2xl font-bold">{overallStats.poor}</div>
            </div>
            <p className="text-xs text-muted-foreground">Needs Enrichment</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <div className="text-2xl font-bold">{overallStats.avgScore.toFixed(1)}%</div>
            </div>
            <p className="text-xs text-muted-foreground">Avg Quality Score</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Motor Data Enrichment
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => triggerEnrichment()}
                disabled={isEnriching}
                className="flex items-center gap-2"
              >
                {isEnriching && <Loader2 className="h-4 w-4 animate-spin" />}
                <Zap className="h-4 w-4" />
                Enrich All Low Quality
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <Select value={qualityFilter} onValueChange={setQualityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Quality</SelectItem>
                  <SelectItem value="0-40">Poor (0-40%)</SelectItem>
                  <SelectItem value="40-60">Fair (40-60%)</SelectItem>
                  <SelectItem value="60-80">Good (60-80%)</SelectItem>
                  <SelectItem value="80-100">Excellent (80%+)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="harris">Harris</SelectItem>
                <SelectItem value="mercury_official">Mercury</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="motors" className="space-y-6">
            <TabsList>
              <TabsTrigger value="motors">Motors ({filteredMotors.length})</TabsTrigger>
              <TabsTrigger value="logs">Activity Log ({logs.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="motors">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredMotors.map((motor) => (
                    <div key={motor.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium">{motor.model}</h3>
                          <Badge variant="outline">{motor.horsepower} HP</Badge>
                          {getQualityBadge(motor.data_quality_score)}
                        </div>
                        
                        <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Database className="h-3 w-3" />
                            Harris: {motor.data_sources?.harris?.success ? '✓' : '✗'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            Mercury: {motor.data_sources?.mercury_official?.success ? '✓' : '✗'}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Manual: {motor.manual_overrides && Object.keys(motor.manual_overrides).length > 0 ? '✓' : '✗'}
                          </div>
                          {motor.last_enriched && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(motor.last_enriched).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span>Data Quality</span>
                            <span className={getQualityColor(motor.data_quality_score)}>
                              {motor.data_quality_score}%
                            </span>
                          </div>
                          <Progress value={motor.data_quality_score} className="h-2" />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedMotor(motor.id)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => triggerEnrichment(motor.id)}
                          disabled={isEnriching}
                        >
                          <Zap className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="logs">
              <div className="space-y-2">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      {getSourceIcon(log.source_name)}
                      <div>
                        <p className="font-medium text-sm">{log.action}</p>
                        <p className="text-xs text-muted-foreground">
                          Source: {log.source_name} • Motor: {log.motor_id.substring(0, 8)}...
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {log.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};