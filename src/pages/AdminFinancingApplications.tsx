import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FinancingApplicationDetailModal } from '@/components/admin/FinancingApplicationDetailModal';
import { FileText, Search, Filter } from 'lucide-react';

type FinancingApplication = {
  id: string;
  applicant_data: any;
  purchase_data: any;
  status: string;
  created_at: string;
  updated_at: string;
  current_step: number;
};

export default function AdminFinancingApplications() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: applications, isLoading } = useQuery({
    queryKey: ['financing_applications', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('financing_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as FinancingApplication[];
    },
  });

  const filteredApplications = applications?.filter((app) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    const applicantName = `${app.applicant_data?.firstName || ''} ${app.applicant_data?.lastName || ''}`.toLowerCase();
    const email = app.applicant_data?.email?.toLowerCase() || '';
    return applicantName.includes(searchLower) || email.includes(searchLower);
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; icon: string }> = {
      draft: { variant: 'secondary', label: 'Draft', icon: '🟡' },
      pending: { variant: 'default', label: 'Pending Review', icon: '🔵' },
      approved: { variant: 'default', label: 'Approved', icon: '🟢' },
      declined: { variant: 'destructive', label: 'Declined', icon: '🔴' },
      expired: { variant: 'outline', label: 'Expired', icon: '⚪' },
    };
    const config = variants[status] || variants.pending;
    return (
      <Badge variant={config.variant}>
        {config.icon} {config.label}
      </Badge>
    );
  };

  const getPendingCount = () => {
    return applications?.filter((app) => app.status === 'pending').length || 0;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-6 w-6" />
                Financing Applications
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {getPendingCount()} pending review
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="text-center py-8">Loading applications...</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ref #</TableHead>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Motor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No applications found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredApplications?.map((app) => (
                      <TableRow
                        key={app.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedId(app.id)}
                      >
                        <TableCell className="font-mono text-sm">
                          #{app.id.substring(0, 8).toUpperCase()}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {app.applicant_data?.firstName} {app.applicant_data?.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {app.applicant_data?.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{app.purchase_data?.motorModel || 'N/A'}</TableCell>
                        <TableCell>
                          ${app.purchase_data?.amountToFinance?.toLocaleString() || 'N/A'}
                        </TableCell>
                        <TableCell>{getStatusBadge(app.status)}</TableCell>
                        <TableCell>
                          {new Date(app.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedId(app.id);
                            }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedId && (
        <FinancingApplicationDetailModal
          applicationId={selectedId}
          open={!!selectedId}
          onOpenChange={(open) => !open && setSelectedId(null)}
        />
      )}
    </div>
  );
}
