import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Send, Clock, Users } from 'lucide-react';

export const EmailDashboard = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailData, setEmailData] = useState({
    customerEmail: '',
    customerName: '',
    quoteNumber: '',
    motorModel: '',
    totalPrice: '',
    emailType: 'follow_up' as 'quote_delivery' | 'follow_up' | 'reminder'
  });
  const { toast } = useToast();

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-quote-email', {
        body: {
          customerEmail: emailData.customerEmail,
          customerName: emailData.customerName,
          quoteNumber: emailData.quoteNumber,
          motorModel: emailData.motorModel || 'Mercury Motor',
          totalPrice: parseFloat(emailData.totalPrice) || 0,
          emailType: emailData.emailType
        }
      });

      if (error) throw error;

      toast({
        title: "Email Sent Successfully",
        description: `${emailData.emailType.replace('_', ' ')} email sent to ${emailData.customerEmail}`,
      });

      // Reset form
      setEmailData({
        customerEmail: '',
        customerName: '',
        quoteNumber: '',
        motorModel: '',
        totalPrice: '',
        emailType: 'follow_up'
      });

    } catch (error) {
      console.error('Email send error:', error);
      toast({
        title: "Email Failed",
        description: "Failed to send email. Please check your settings and try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestEmail = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-quote-email', {
        body: {
          customerEmail: 'harrisboatworks@hotmail.com', // Your verified Resend email
          customerName: 'Test Customer',
          quoteNumber: 'TEST-001',
          motorModel: 'Mercury 150HP Outboard',
          totalPrice: 12500,
          emailType: 'quote_delivery'
        }
      });

      if (error) throw error;

      toast({
        title: "Test Email Sent",
        description: "Test email sent to harrisboatworks@hotmail.com (your verified address)",
      });
    } catch (error) {
      console.error('Test email error:', error);
      toast({
        title: "Test Failed",
        description: "Test email failed. Check your Resend API key configuration.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Email Management</h2>
          <p className="text-muted-foreground">Send transactional emails and manage email automation</p>
          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>Email Setup:</strong> Emails are sent from onboarding@resend.dev with Reply-To set to harrisboatworks@hotmail.com. 
              When customers reply, responses go directly to your business email.
            </p>
          </div>
        </div>
        <Button onClick={handleTestEmail} disabled={isLoading} variant="outline">
          <Mail className="w-4 h-4 mr-2" />
          Test Email System
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quote Emails</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Auto-Send</div>
            <p className="text-xs text-muted-foreground">
              Sent automatically when quotes are created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Follow-ups</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Manual</div>
            <p className="text-xs text-muted-foreground">
              Send follow-up emails to prospects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3 Types</div>
            <p className="text-xs text-muted-foreground">
              Quote delivery, follow-up, reminders
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Send Manual Email</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendEmail} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  value={emailData.customerName}
                  onChange={(e) => setEmailData(prev => ({ ...prev, customerName: e.target.value }))}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Customer Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={emailData.customerEmail}
                  onChange={(e) => setEmailData(prev => ({ ...prev, customerEmail: e.target.value }))}
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quoteNumber">Quote Number</Label>
                <Input
                  id="quoteNumber"
                  value={emailData.quoteNumber}
                  onChange={(e) => setEmailData(prev => ({ ...prev, quoteNumber: e.target.value }))}
                  placeholder="Q-2024-001"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="motorModel">Motor Model</Label>
                <Input
                  id="motorModel"
                  value={emailData.motorModel}
                  onChange={(e) => setEmailData(prev => ({ ...prev, motorModel: e.target.value }))}
                  placeholder="Mercury 150HP Outboard"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalPrice">Total Price</Label>
                <Input
                  id="totalPrice"
                  type="number"
                  value={emailData.totalPrice}
                  onChange={(e) => setEmailData(prev => ({ ...prev, totalPrice: e.target.value }))}
                  placeholder="12500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailType">Email Type</Label>
              <Select 
                value={emailData.emailType} 
                onValueChange={(value: any) => setEmailData(prev => ({ ...prev, emailType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select email type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quote_delivery">Quote Delivery</SelectItem>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              <Send className="w-4 h-4 mr-2" />
              {isLoading ? 'Sending...' : 'Send Email'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Email Templates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold">Quote Delivery</h4>
              <p className="text-sm text-muted-foreground mt-2">
                Professional quote with pricing, motor details, and next steps. Sent automatically when quotes are created.
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold">Follow-up</h4>
              <p className="text-sm text-muted-foreground mt-2">
                Friendly follow-up for prospects who haven't responded. Includes quote summary and contact information.
              </p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold">Reminder</h4>
              <p className="text-sm text-muted-foreground mt-2">
                Gentle reminder for quotes nearing expiration. Encourages action with urgency messaging.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};