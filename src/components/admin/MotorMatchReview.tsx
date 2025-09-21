import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MotorMatchReviewProps {
  isOpen: boolean;
  onClose: () => void;
  onReviewComplete: () => void;
}

export function MotorMatchReview({ isOpen, onClose, onReviewComplete }: MotorMatchReviewProps) {
  const [pendingMatches, setPendingMatches] = useState<any[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // Load pending matches when dialog opens
  const loadPendingMatches = async () => {
    if (!isOpen) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pending_motor_matches')
        .select('*')
        .eq('review_status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPendingMatches(data || []);
      setCurrentMatchIndex(0);
    } catch (error) {
      console.error('Error loading pending matches:', error);
      toast({
        title: "Error",
        description: "Failed to load pending matches",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadPendingMatches();
    }
  }, [isOpen]);

  // Handle match selection
  const handleMatchSelection = async (selectedMotorId: string | null) => {
    if (!pendingMatches[currentMatchIndex]) return;

    setSubmitting(true);
    try {
      const currentMatch = pendingMatches[currentMatchIndex];
      
      await supabase
        .from('pending_motor_matches')
        .update({
          selected_match_id: selectedMotorId,
          review_status: selectedMotorId ? 'approved' : 'no_match',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', currentMatch.id);

      if (selectedMotorId) {
        await supabase
          .from('motor_models')
          .update({ in_stock: true, last_stock_check: new Date().toISOString() })
          .eq('id', selectedMotorId);
      }

      if (currentMatchIndex < pendingMatches.length - 1) {
        setCurrentMatchIndex(currentMatchIndex + 1);
      } else {
        toast({
          title: "Review Complete",
          description: `Reviewed ${pendingMatches.length} pending matches`,
        });
        onReviewComplete();
        onClose();
      }
    } catch (error) {
      console.error('Error processing match selection:', error);
      toast({
        title: "Error",
        description: "Failed to process match selection",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const currentMatch = pendingMatches[currentMatchIndex];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Review Motor Matches
            <Badge variant="outline">
              {currentMatchIndex + 1} of {pendingMatches.length}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="w-8 h-8 animate-spin" />
            <span className="ml-2">Loading pending matches...</span>
          </div>
        ) : pendingMatches.length === 0 ? (
          <div className="text-center p-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-semibold">No pending matches to review!</p>
            <Button onClick={onClose} className="mt-4">Close</Button>
          </div>
        ) : currentMatch ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  Scraped Motor Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{currentMatch.scraped_motor_data?.name || 'Unknown'}</p>
              </CardContent>
            </Card>

            <div className="flex justify-between pt-4">
              <Button 
                variant="outline" 
                onClick={() => handleMatchSelection(null)}
                disabled={submitting}
              >
                <XCircle className="w-4 h-4 mr-2" />
                No Match
              </Button>
              <Button onClick={onClose} variant="outline">
                Close Review
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}