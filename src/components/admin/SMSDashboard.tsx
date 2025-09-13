import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Send, Clock, Users, AlertTriangle, CheckCircle, Phone } from 'lucide-react';
import { SMS_TEMPLATES, generateSMSMessage, DEFAULT_SMS_PREFERENCES, type SMSPreferences } from '@/lib/smsTemplates';

interface SMSLog {
  id: string;
  to_phone: string;
  message: string;
  status: string;
  error?: string;
  created_at: string;
  notification_id?: string;
}

export const SMSDashboard = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [smsLogs, setSMSLogs] = useState<SMSLog[]>([]);
  const [preferences, setPreferences] = useState<SMSPreferences>(DEFAULT_SMS_PREFERENCES);
  const [testSMS, setTestSMS] = useState({
    phoneNumber: '',
    messageType: 'manual' as keyof typeof SMS_TEMPLATES,
    customMessage: ''
  });
  const { toast } = useToast();

  // Load SMS logs and preferences
  useEffect(() => {
    loadSMSLogs();
    loadPreferences();
  }, []);

  const loadSMSLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('sms_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSMSLogs(data || []);
    } catch (error) {
      console.error('Error loading SMS logs:', error);
    }
  };

  const loadPreferences = async () => {
    try {
      // In a real app, this would load from user preferences table
      const stored = localStorage.getItem('sms_preferences');
      if (stored) {
        setPreferences({ ...DEFAULT_SMS_PREFERENCES, ...JSON.parse(stored) });
      }
    } catch (error) {
      console.error('Error loading SMS preferences:', error);
    }
  };

  const savePreferences = async () => {
    try {
      localStorage.setItem('sms_preferences', JSON.stringify(preferences));
      toast({
        title: "Preferences Saved",
        description: "Your SMS notification preferences have been updated.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save SMS preferences.",
        variant: "destructive"
      });
    }
  };

  const sendTestSMS = async () => {
    if (!testSMS.phoneNumber) {
      toast({
        title: "Phone Number Required",
        description: "Please enter a phone number to send the test SMS.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      let message = '';
      
      if (testSMS.messageType === 'manual' && testSMS.customMessage) {
        message = testSMS.customMessage;
      } else {
        // Generate sample message for testing
        const sampleData = {
          customerName: 'John Smith',
          leadScore: 85,
          finalPrice: 12500,
          motorModel: 'Mercury 150HP Outboard',
          quoteNumber: 'Q-2024-001',
          totalPrice: 12500,
          daysSinceQuote: 3,
          expiresIn: 7,
          customMessage: testSMS.customMessage
        };
        
        message = generateSMSMessage(testSMS.messageType, sampleData);
      }

      console.log('Sending test SMS:', { to: testSMS.phoneNumber, message });

      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          to: testSMS.phoneNumber,
          message: message,
          messageType: testSMS.messageType
        }
      });

      if (error) throw error;

      toast({
        title: "Test SMS Sent",
        description: `SMS sent successfully to ${testSMS.phoneNumber}`,
      });

      // Reload logs to show the new message
      await loadSMSLogs();

      // Clear form
      setTestSMS({
        phoneNumber: '',
        messageType: 'manual',
        customMessage: ''
      });

    } catch (error: any) {
      console.error('SMS send error:', error);
      toast({
        title: "SMS Failed",
        description: error.message || "Failed to send SMS. Please check your settings.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const stats = {
    totalSent: smsLogs.filter(log => log.status === 'sent').length,
    totalFailed: smsLogs.filter(log => log.status === 'failed').length,
    last24h: smsLogs.filter(log => 
      new Date(log.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000
    ).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">SMS Alerts Dashboard</h2>
          <p className="text-muted-foreground">Manage SMS notifications and alerts for your team</p>
        </div>
        <Button onClick={loadSMSLogs} variant="outline">
          <MessageSquare className="w-4 h-4 mr-2" />
          Refresh Logs
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Sent</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSent}</div>
            <p className="text-xs text-muted-foreground">
              Successfully delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFailed}</div>
            <p className="text-xs text-muted-foreground">
              Delivery failures
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last 24h</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.last24h}</div>
            <p className="text-xs text-muted-foreground">
              Recent activity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {smsLogs.length > 0 ? Math.round((stats.totalSent / smsLogs.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Overall delivery rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Test SMS */}
      <Card>
        <CardHeader>
          <CardTitle>Send Test SMS</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="testPhone">Phone Number</Label>
              <Input
                id="testPhone"
                placeholder="+1 (555) 123-4567"
                value={testSMS.phoneNumber}
                onChange={(e) => setTestSMS(prev => ({ ...prev, phoneNumber: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="messageType">Message Type</Label>
              <Select 
                value={testSMS.messageType} 
                onValueChange={(value: any) => setTestSMS(prev => ({ ...prev, messageType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select message type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hot_lead">Hot Lead Alert</SelectItem>
                  <SelectItem value="quote_confirmation">Quote Confirmation</SelectItem>
                  <SelectItem value="follow_up">Follow-up Reminder</SelectItem>
                  <SelectItem value="reminder">Expiring Quote</SelectItem>
                  <SelectItem value="manual">Custom Message</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {testSMS.messageType === 'manual' && (
            <div className="space-y-2">
              <Label htmlFor="customMessage">Custom Message</Label>
              <Textarea
                id="customMessage"
                placeholder="Enter your custom SMS message..."
                value={testSMS.customMessage}
                onChange={(e) => setTestSMS(prev => ({ ...prev, customMessage: e.target.value }))}
                rows={3}
              />
            </div>
          )}

          <Button onClick={sendTestSMS} disabled={isLoading} className="w-full">
            <Send className="w-4 h-4 mr-2" />
            {isLoading ? 'Sending...' : 'Send Test SMS'}
          </Button>
        </CardContent>
      </Card>

      {/* SMS Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>SMS Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="teamPhone">Team Phone Number</Label>
            <Input
              id="teamPhone"
              placeholder="+1 (555) 123-4567"
              value={preferences.phoneNumber}
              onChange={(e) => setPreferences(prev => ({ ...prev, phoneNumber: e.target.value }))}
            />
            <p className="text-sm text-muted-foreground">
              Phone number to receive SMS alerts
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Alert Types</h4>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="hotLeads" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Hot Lead Alerts
                </Label>
                <Switch
                  id="hotLeads"
                  checked={preferences.hotLeads}
                  onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, hotLeads: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="quoteDelivered">Quote Delivered</Label>
                <Switch
                  id="quoteDelivered"
                  checked={preferences.quoteDelivered}
                  onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, quoteDelivered: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="followUpReminders">Follow-up Reminders</Label>
                <Switch
                  id="followUpReminders"
                  checked={preferences.followUpReminders}
                  onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, followUpReminders: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="quoteExpiring">Quote Expiring</Label>
                <Switch
                  id="quoteExpiring"
                  checked={preferences.quoteExpiring}
                  onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, quoteExpiring: checked }))}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Quiet Hours</h4>
              
              <div className="space-y-2">
                <Label htmlFor="quietStart">Start Time</Label>
                <Input
                  id="quietStart"
                  type="time"
                  value={preferences.quietHoursStart}
                  onChange={(e) => setPreferences(prev => ({ ...prev, quietHoursStart: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quietEnd">End Time</Label>
                <Input
                  id="quietEnd"
                  type="time"
                  value={preferences.quietHoursEnd}
                  onChange={(e) => setPreferences(prev => ({ ...prev, quietHoursEnd: e.target.value }))}
                />
              </div>

              <p className="text-sm text-muted-foreground">
                SMS alerts will be paused during these hours
              </p>
            </div>
          </div>

          <Button onClick={savePreferences} className="w-full">
            Save Preferences
          </Button>
        </CardContent>
      </Card>

      {/* Recent SMS Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent SMS Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {smsLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No SMS messages sent yet.
              </div>
            ) : (
              smsLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-4 border rounded-lg">
                  <div className="mt-1">
                    {getStatusIcon(log.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{log.to_phone}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        log.status === 'sent' ? 'bg-green-100 text-green-800' :
                        log.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {log.message}
                    </p>
                    {log.error && (
                      <p className="text-xs text-red-600 mb-1">
                        Error: {log.error}
                      </p>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                      {log.notification_id && ` • ID: ${log.notification_id}`}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};