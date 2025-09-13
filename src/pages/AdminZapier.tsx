import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, TestTube, Activity, Settings, Zap, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AdminNav from '@/components/admin/AdminNav';
import { WebhookConfig, WebhookType, triggerManualWebhook } from '@/lib/webhooks';

const webhookTypeLabels: Record<WebhookType, string> = {
  'hot_lead': 'Hot Lead Alert',
  'new_lead_summary': 'New Lead Summary',
  'follow_up_reminder': 'Follow-up Reminder', 
  'quote_delivery': 'Quote Delivery',
  'manual_trigger': 'Manual Trigger',
};

const webhookTypeDescriptions: Record<WebhookType, string> = {
  'hot_lead': 'Instant notification when lead score exceeds 70 points',
  'new_lead_summary': 'Daily digest of all new leads (scheduled)',
  'follow_up_reminder': 'Automated reminders based on lead age and status',
  'quote_delivery': 'Triggered when quotes are generated and delivered',
  'manual_trigger': 'Test webhook for manual triggering',
};

export default function AdminZapier() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    webhook_url: '',
    webhook_type: 'hot_lead' as WebhookType,
    is_active: true,
    test_payload: '{\n  "test": true,\n  "message": "Test webhook from admin"\n}',
  });

  useEffect(() => {
    document.title = 'Zapier Integration - Admin';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Manage Zapier webhook integrations for lead management and automation.');
    
    loadWebhooks();
    loadActivities();
  }, []);

  const loadWebhooks = async () => {
    try {
      const { data, error } = await supabase
        .from('webhook_configurations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWebhooks(data || []);
    } catch (error) {
      console.error('Error loading webhooks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load webhook configurations',
        variant: 'destructive',
      });
    }
  };

  const loadActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('webhook_activity_logs')
        .select(`
          *,
          webhook_configurations (name, webhook_type)
        `)
        .order('triggered_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error loading activities:', error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let payload;
      try {
        payload = JSON.parse(formData.test_payload);
      } catch {
        throw new Error('Invalid JSON in test payload');
      }

      const webhookData = {
        ...formData,
        test_payload: payload,
      };

      if (editingWebhook) {
        const { error } = await supabase
          .from('webhook_configurations')
          .update(webhookData)
          .eq('id', editingWebhook.id);
        
        if (error) throw error;
        toast({ title: 'Success', description: 'Webhook updated successfully' });
      } else {
        const { error } = await supabase
          .from('webhook_configurations')
          .insert(webhookData);
        
        if (error) throw error;
        toast({ title: 'Success', description: 'Webhook created successfully' });
      }

      setIsDialogOpen(false);
      setEditingWebhook(null);
      resetForm();
      loadWebhooks();
    } catch (error) {
      console.error('Error saving webhook:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save webhook',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;

    try {
      const { error } = await supabase
        .from('webhook_configurations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Success', description: 'Webhook deleted successfully' });
      loadWebhooks();
    } catch (error) {
      console.error('Error deleting webhook:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete webhook',
        variant: 'destructive',
      });
    }
  };

  const handleTest = async (webhook: WebhookConfig) => {
    try {
      const result = await triggerManualWebhook(webhook);
      
      if (result.success) {
        toast({ title: 'Success', description: 'Test webhook triggered successfully' });
      } else {
        toast({
          title: 'Warning',
          description: 'Webhook request sent but response status unknown (CORS)',
        });
      }
      
      // Refresh activity logs
      loadActivities();
    } catch (error) {
      console.error('Error testing webhook:', error);
      toast({
        title: 'Error',
        description: 'Failed to test webhook',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (webhook: WebhookConfig) => {
    try {
      const { error } = await supabase
        .from('webhook_configurations')
        .update({ is_active: !webhook.is_active })
        .eq('id', webhook.id);

      if (error) throw error;
      loadWebhooks();
      toast({ 
        title: 'Success', 
        description: `Webhook ${!webhook.is_active ? 'enabled' : 'disabled'}` 
      });
    } catch (error) {
      console.error('Error toggling webhook:', error);
      toast({
        title: 'Error',
        description: 'Failed to update webhook status',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      webhook_url: '',
      webhook_type: 'hot_lead',
      is_active: true,
      test_payload: '{\n  "test": true,\n  "message": "Test webhook from admin"\n}',
    });
  };

  const startEdit = (webhook: WebhookConfig) => {
    setEditingWebhook(webhook);
    setFormData({
      name: webhook.name,
      webhook_url: webhook.webhook_url,
      webhook_type: webhook.webhook_type,
      is_active: webhook.is_active,
      test_payload: JSON.stringify(webhook.test_payload, null, 2),
    });
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div>
        <AdminNav />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminNav />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Zap className="h-8 w-8 text-primary" />
              Zapier Integration
            </h1>
            <p className="text-muted-foreground mt-2">
              Automate lead follow-up, quote delivery, and customer communication workflows
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingWebhook(null); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Webhook
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingWebhook ? 'Edit Webhook' : 'Add New Webhook'}
                </DialogTitle>
                <DialogDescription>
                  Configure a Zapier webhook to automate your lead management workflow
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Hot Lead Alerts"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="webhook_type">Type</Label>
                    <Select 
                      value={formData.webhook_type} 
                      onValueChange={(value: WebhookType) => 
                        setFormData(prev => ({ ...prev, webhook_type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(webhookTypeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="webhook_url">Zapier Webhook URL</Label>
                  <Input
                    id="webhook_url"
                    type="url"
                    value={formData.webhook_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, webhook_url: e.target.value }))}
                    placeholder="https://hooks.zapier.com/hooks/catch/..."
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Get this URL from your Zapier webhook trigger
                  </p>
                </div>
                <div>
                  <Label htmlFor="test_payload">Test Payload (JSON)</Label>
                  <Textarea
                    id="test_payload"
                    value={formData.test_payload}
                    onChange={(e) => setFormData(prev => ({ ...prev, test_payload: e.target.value }))}
                    className="font-mono text-sm"
                    rows={6}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, is_active: checked }))
                    }
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingWebhook ? 'Update' : 'Create'} Webhook
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6">
          {/* Webhook Configurations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Webhook Configurations
              </CardTitle>
              <CardDescription>
                Manage your Zapier webhook integrations for automated lead follow-up
              </CardDescription>
            </CardHeader>
            <CardContent>
              {webhooks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No webhooks configured yet</p>
                  <p className="text-sm">Add your first webhook to start automating lead follow-ups</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {webhooks.map((webhook) => (
                    <div key={webhook.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{webhook.name}</h3>
                          <Badge variant={webhook.is_active ? 'default' : 'secondary'}>
                            {webhook.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="outline">
                            {webhookTypeLabels[webhook.webhook_type]}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {webhookTypeDescriptions[webhook.webhook_type]}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {webhook.webhook_url}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTest(webhook)}
                        >
                          <TestTube className="h-4 w-4" />
                        </Button>
                        <Switch
                          checked={webhook.is_active}
                          onCheckedChange={() => handleToggleActive(webhook)}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(webhook)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(webhook.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Webhook Activity
              </CardTitle>
              <CardDescription>
                Monitor webhook triggers and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No webhook activity yet</p>
                  <p className="text-sm">Activity will appear here when webhooks are triggered</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {activity.webhook_configurations?.name || 'Unknown Webhook'}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {activity.trigger_type}
                          </Badge>
                          <Badge 
                            variant={
                              activity.status === 'success' ? 'default' : 
                              activity.status === 'failed' ? 'destructive' : 'secondary'
                            }
                            className="text-xs"
                          >
                            {activity.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.triggered_at).toLocaleString()}
                        </p>
                        {activity.error_message && (
                          <p className="text-xs text-red-600 mt-1">{activity.error_message}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Setup Guide */}
          <Card>
            <CardHeader>
              <CardTitle>Setup Guide</CardTitle>
              <CardDescription>
                How to connect your Zapier account and create automation workflows
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center flex-shrink-0 mt-1">1</div>
                  <div>
                    <h4 className="font-medium">Create a Zapier Account</h4>
                    <p className="text-sm text-muted-foreground">
                      Sign up at zapier.com if you don't have an account yet
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center flex-shrink-0 mt-1">2</div>
                  <div>
                    <h4 className="font-medium">Create a Zap with Webhook Trigger</h4>
                    <p className="text-sm text-muted-foreground">
                      Use "Webhooks by Zapier" as your trigger and select "Catch Hook"
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center flex-shrink-0 mt-1">3</div>
                  <div>
                    <h4 className="font-medium">Copy the Webhook URL</h4>
                    <p className="text-sm text-muted-foreground">
                      Copy the webhook URL from Zapier and paste it in the form above
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center flex-shrink-0 mt-1">4</div>
                  <div>
                    <h4 className="font-medium">Configure Actions</h4>
                    <p className="text-sm text-muted-foreground">
                      Add actions like sending emails, SMS, or creating tasks in your CRM
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Button asChild variant="outline" className="w-full">
                  <a 
                    href="https://zapier.com/apps/webhook/integrations" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open Zapier Webhook Documentation
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}