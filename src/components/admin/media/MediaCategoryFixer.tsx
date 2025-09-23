import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface MiscategorizedMedia {
  id: string;
  motor_id: string;
  title: string;
  media_type: string;
  category: string;
  media_url: string;
}

export function MediaCategoryFixer() {
  const [checking, setChecking] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [issues, setIssues] = useState<MiscategorizedMedia[]>([]);
  const { toast } = useToast();

  const checkForIssues = async () => {
    setChecking(true);
    try {
      // Find PDFs categorized as 'gallery' (incorrect)
      const { data, error } = await supabase
        .from('motor_media')
        .select('id, motor_id, title, media_type, category, media_url')
        .eq('media_type', 'pdf')
        .eq('category', 'gallery')
        .eq('is_active', true);

      if (error) throw error;

      setIssues(data || []);
      
      if (data && data.length > 0) {
        toast({
          title: "Issues Found",
          description: `Found ${data.length} PDFs incorrectly categorized as gallery items.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "No Issues Found",
          description: "All media items appear to be correctly categorized.",
        });
      }
    } catch (error) {
      console.error('Error checking for issues:', error);
      toast({
        title: "Error",
        description: "Failed to check for categorization issues.",
        variant: "destructive",
      });
    } finally {
      setChecking(false);
    }
  };

  const fixIssues = async () => {
    if (issues.length === 0) return;

    setFixing(true);
    try {
      let fixedCount = 0;
      
      for (const issue of issues) {
        // Update PDFs from 'gallery' to 'specs' category
        const { error } = await supabase
          .from('motor_media')
          .update({ category: 'specs' })
          .eq('id', issue.id);

        if (!error) {
          fixedCount++;
        }
      }

      toast({
        title: "Issues Fixed",
        description: `Successfully fixed ${fixedCount} of ${issues.length} categorization issues.`,
      });

      // Clear the issues list since they've been fixed
      setIssues([]);
    } catch (error) {
      console.error('Error fixing issues:', error);
      toast({
        title: "Error",
        description: "Failed to fix some categorization issues.",
        variant: "destructive",
      });
    } finally {
      setFixing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          Media Category Fixer
        </CardTitle>
        <CardDescription>
          Check for and fix media items that are incorrectly categorized (e.g., PDFs in gallery).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={checkForIssues} 
            disabled={checking || fixing}
            variant="outline"
          >
            {checking ? "Checking..." : "Check for Issues"}
          </Button>
          
          {issues.length > 0 && (
            <Button 
              onClick={fixIssues} 
              disabled={fixing}
              variant="default"
            >
              {fixing ? "Fixing..." : `Fix ${issues.length} Issues`}
            </Button>
          )}
        </div>

        {issues.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Found Issues:</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {issues.map((issue) => (
                <div key={issue.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{issue.title}</p>
                      <p className="text-xs text-muted-foreground">Motor ID: {issue.motor_id}</p>
                    </div>
                    <div className="flex gap-1">
                      <Badge variant="outline">{issue.media_type.toUpperCase()}</Badge>
                      <Badge variant="destructive">{issue.category}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {issues.length === 0 && !checking && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm">No categorization issues found.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}