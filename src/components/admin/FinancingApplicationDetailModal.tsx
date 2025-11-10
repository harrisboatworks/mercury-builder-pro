import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, Mail, FileText, CheckCircle, XCircle, Download } from 'lucide-react';
import { StatusHistorySection } from '@/components/financing/StatusHistorySection';
import { NotesTimeline } from './NotesTimeline';
import { FinancingApplicationPDF } from './FinancingApplicationPDF';
import { pdf } from '@react-pdf/renderer';

interface FinancingApplicationDetailModalProps {
  applicationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FinancingApplicationDetailModal({
  applicationId,
  open,
  onOpenChange,
}: FinancingApplicationDetailModalProps) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { data: application, isLoading } = useQuery({
    queryKey: ['financing_application', applicationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financing_applications')
        .select('*')
        .eq('id', applicationId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!applicationId,
  });

  const handleStatusUpdate = async () => {
    if (!status) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('financing_applications')
        .update({
          status: status,
          notes: notes || null,
          processed_at: new Date().toISOString(),
        })
        .eq('id', applicationId);

      if (error) throw error;

      toast.success('Application updated successfully');
      queryClient.invalidateQueries({ queryKey: ['financing_applications'] });
      queryClient.invalidateQueries({ queryKey: ['financing_application', applicationId] });
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating application:', error);
      toast.error('Failed to update application');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmailApplicant = () => {
    const email = application?.applicant_data?.email;
    if (email) {
      window.location.href = `mailto:${email}`;
    }
  };

  const handleExportPDF = async () => {
    if (!application) return;
    
    setIsExporting(true);
    try {
      const blob = await pdf(
        <FinancingApplicationPDF application={application} refNumber={refNumber} />
      ).toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `financing-application-${refNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleNotesUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['financing_application', applicationId] });
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!application) return null;

  const refNumber = applicationId.substring(0, 8).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Application #{refNumber}
            </DialogTitle>
            <Badge>
              {application.status === 'pending' && '🔵'}
              {application.status === 'approved' && '🟢'}
              {application.status === 'declined' && '🔴'}
              {application.status === 'draft' && '🟡'}
              {' '}{application.status.toUpperCase()}
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Application Details</TabsTrigger>
            <TabsTrigger value="financial">Financial Info</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Purchase Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">Motor:</div>
                    <div className="font-medium">{application.purchase_data?.motorModel}</div>
                    <div className="text-muted-foreground">Purchase Price:</div>
                    <div className="font-medium">
                      ${application.purchase_data?.motorPrice?.toLocaleString()}
                    </div>
                    <div className="text-muted-foreground">Down Payment:</div>
                    <div className="font-medium">
                      ${application.purchase_data?.downPayment?.toLocaleString()}
                    </div>
                    <div className="text-muted-foreground">Amount to Finance:</div>
                    <div className="font-medium text-lg">
                      ${application.purchase_data?.amountToFinance?.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Applicant Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">Name:</div>
                    <div className="font-medium">
                      {application.applicant_data?.firstName} {application.applicant_data?.lastName}
                    </div>
                    <div className="text-muted-foreground">Email:</div>
                    <div className="font-medium">{application.applicant_data?.email}</div>
                    <div className="text-muted-foreground">Phone:</div>
                    <div className="font-medium">{application.applicant_data?.primaryPhone}</div>
                    <div className="text-muted-foreground">Date of Birth:</div>
                    <div className="font-medium">{application.applicant_data?.dateOfBirth}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Employment</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">Status:</div>
                    <div className="font-medium">{application.employment_data?.status}</div>
                    <div className="text-muted-foreground">Employer:</div>
                    <div className="font-medium">{application.employment_data?.employerName || 'N/A'}</div>
                    <div className="text-muted-foreground">Annual Income:</div>
                    <div className="font-medium">
                      ${application.employment_data?.annualIncome?.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Financial Details</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">Credit Score Estimate:</div>
                    <div className="font-medium">{application.financial_data?.creditScoreEstimate}</div>
                    <div className="text-muted-foreground">Monthly Housing:</div>
                    <div className="font-medium">
                      ${application.financial_data?.monthlyHousingPayment?.toLocaleString()}
                    </div>
                    <div className="text-muted-foreground">Bank:</div>
                    <div className="font-medium">{application.financial_data?.bankName}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions" className="space-y-4">
            {/* Status History */}
            <Card>
              <CardContent className="pt-6">
                <StatusHistorySection applicationId={applicationId} />
              </CardContent>
            </Card>
            
            {/* Actions */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label htmlFor="status">Update Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="declined">Declined</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleStatusUpdate}
                    disabled={!status || isSaving}
                    className="flex-1"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : status === 'approved' ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve Application
                      </>
                    ) : status === 'declined' ? (
                      <>
                        <XCircle className="mr-2 h-4 w-4" />
                        Decline Application
                      </>
                    ) : (
                      'Update Status'
                    )}
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={handleEmailApplicant}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Email Applicant
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleExportPDF}
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Export PDF
                      </>
                    )}
                  </Button>
                </div>

                {/* Notes Timeline */}
                <div className="border-t pt-4">
                  <NotesTimeline
                    applicationId={applicationId}
                    notesHistory={(application.notes_history as any[]) || []}
                    onNotesUpdate={handleNotesUpdate}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
