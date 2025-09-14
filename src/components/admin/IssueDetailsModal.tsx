import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, CheckCircle, Loader2, RefreshCw, Wrench, ExternalLink } from 'lucide-react';

interface HealthCheck {
  motorId: string;
  model: string;
  issues: string[];
  fixed: boolean;
  suggestions: string[];
}

interface IssueDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  healthData: {
    checks: HealthCheck[];
    criticalIssues: number;
    issuesFound: number;
    summary: {
      brokenImages: number;
      missingData: number;
      outdatedInfo: number;
      lowQualityImages: number;
    };
  } | null;
  onRefresh: () => void;
}

export const IssueDetailsModal = ({ open, onOpenChange, healthData, onRefresh }: IssueDetailsModalProps) => {
  const { toast } = useToast();
  const [fixingAll, setFixingAll] = useState(false);
  const [fixingIndividual, setFixingIndividual] = useState<string | null>(null);

  const problematicMotors = healthData?.checks?.filter(check => check.issues.length > 0) || [];

  const getCriticalityLevel = (issues: string[]) => {
    const criticalKeywords = ['unreachable', 'broken', 'missing description'];
    const isCritical = issues.some(issue => 
      criticalKeywords.some(keyword => issue.toLowerCase().includes(keyword))
    );
    return isCritical ? 'critical' : 'warning';
  };

  const fixAllIssues = async () => {
    setFixingAll(true);
    try {
      const { data, error } = await supabase.functions.invoke('motor-health-monitor', {
        body: { 
          checkBrokenImages: true,
          fixIssues: true,
          generateReport: true,
          notifyAdmin: false
        }
      });

      if (error) throw error;

      toast({
        title: 'Bulk Fix Complete',
        description: `Attempted to fix ${healthData?.issuesFound || 0} issues. Fixed ${data?.report?.issuesFixed || 0}.`,
        duration: 5000,
      });

      onRefresh();
    } catch (error) {
      console.error('Failed to fix issues:', error);
      toast({
        title: 'Fix Failed',
        description: 'Failed to run bulk fix operation',
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setFixingAll(false);
    }
  };

  const fixIndividualMotor = async (motorId: string, model: string) => {
    setFixingIndividual(motorId);
    try {
      // Trigger image update for specific motor
      const { data, error } = await supabase.functions.invoke('update-motor-images');
      
      if (error) throw error;

      toast({
        title: 'Motor Fixed',
        description: `Attempted repairs for ${model}`,
        duration: 3000,
      });

      onRefresh();
    } catch (error) {
      console.error('Failed to fix motor:', error);
      toast({
        title: 'Fix Failed',
        description: `Failed to fix issues for ${model}`,
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setFixingIndividual(null);
    }
  };

  const triggerImageMigration = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('migrate-motor-images', {
        body: { 
          batchSize: 50,
          forceRedownload: false,
          autoRetry: true,
          qualityEnhancement: true,
          selfHeal: true
        }
      });

      if (error) throw error;

      toast({
        title: 'Image Migration Started',
        description: 'Image migration process has been triggered',
        duration: 3000,
      });

      onRefresh();
    } catch (error) {
      console.error('Failed to trigger migration:', error);
      toast({
        title: 'Migration Failed',
        description: 'Failed to start image migration',
        variant: 'destructive',
        duration: 3000,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span>Critical Issues & Repair Options</span>
          </DialogTitle>
          <DialogDescription>
            Found {healthData?.issuesFound || 0} motors with issues ({healthData?.criticalIssues || 0} critical)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={fixAllIssues}
              disabled={fixingAll}
              className="flex items-center space-x-2"
            >
              {fixingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wrench className="h-4 w-4" />}
              <span>Fix All Issues</span>
            </Button>
            
            <Button 
              onClick={triggerImageMigration}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Run Image Migration</span>
            </Button>
            
            <Button 
              onClick={onRefresh}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-3">
              <div className="text-center">
                <div className="text-xl font-bold text-destructive">{healthData?.summary.brokenImages || 0}</div>
                <div className="text-xs text-muted-foreground">Broken Images</div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-center">
                <div className="text-xl font-bold text-yellow-600">{healthData?.summary.missingData || 0}</div>
                <div className="text-xs text-muted-foreground">Missing Data</div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-center">
                <div className="text-xl font-bold text-orange-600">{healthData?.summary.outdatedInfo || 0}</div>
                <div className="text-xs text-muted-foreground">Outdated Info</div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600">{healthData?.summary.lowQualityImages || 0}</div>
                <div className="text-xs text-muted-foreground">Low Quality</div>
              </div>
            </Card>
          </div>

          {/* Issues List */}
          <ScrollArea className="h-[400px] w-full">
            <div className="space-y-3 pr-4">
              {problematicMotors.length === 0 ? (
                <Card className="p-6 text-center">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <h3 className="font-semibold text-green-700">All Systems Healthy!</h3>
                  <p className="text-sm text-muted-foreground">No critical issues found in motor database</p>
                </Card>
              ) : (
                problematicMotors.map((check) => (
                  <Card key={check.motorId} className="p-4">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span>{check.model}</span>
                          <Badge 
                            variant={getCriticalityLevel(check.issues) === 'critical' ? 'destructive' : 'secondary'}
                          >
                            {getCriticalityLevel(check.issues)}
                          </Badge>
                          {check.fixed && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Fixed
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => fixIndividualMotor(check.motorId, check.model)}
                            disabled={fixingIndividual === check.motorId}
                          >
                            {fixingIndividual === check.motorId ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Wrench className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(`/admin/quotes?motor=${check.motorId}`, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="pt-2 space-y-2">
                      {/* Issues */}
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground mb-1">Issues Found:</h4>
                        <ul className="text-xs space-y-1">
                          {check.issues.map((issue, idx) => (
                            <li key={idx} className="flex items-start space-x-2">
                              <span className="text-destructive">•</span>
                              <span>{issue}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {/* Suggestions */}
                      {check.suggestions.length > 0 && (
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground mb-1">Suggested Fixes:</h4>
                          <ul className="text-xs space-y-1">
                            {check.suggestions.map((suggestion, idx) => (
                              <li key={idx} className="flex items-start space-x-2">
                                <span className="text-blue-500">→</span>
                                <span>{suggestion}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground">
                        Motor ID: {check.motorId}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};