import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail, Loader2 } from 'lucide-react';

export default function TestEmail() {
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [email, setEmail] = useState('');

  const handleTestEmail = async () => {
    if (!email || !email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    
    try {
      console.log('Sending test email to:', email);
      
      const { data, error } = await supabase.functions.invoke('send-quote-email', {
        body: {
          customerEmail: email,
          customerName: 'Test Customer',
          quoteNumber: `TEST-${Date.now().toString().slice(-6)}`,
          motorModel: 'Mercury 115HP FourStroke',
          totalPrice: 12500,
          emailType: 'quote_delivery'
        }
      });

      if (error) {
        console.error('Email error:', error);
        throw error;
      }

      console.log('Email sent successfully:', data);

      toast({
        title: "Test Email Sent! ✓",
        description: `Check your inbox at ${email}`,
      });
    } catch (error: any) {
      console.error('Failed to send email:', error);
      toast({
        title: "Error Sending Email",
        description: error.message || 'Failed to send test email. Check console logs.',
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-8">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 space-y-6">
          <div className="text-center space-y-2">
            <Mail className="w-16 h-16 mx-auto text-blue-600" />
            <h1 className="text-3xl font-bold">Test Email Functionality</h1>
            <p className="text-muted-foreground">
              Send a test quote email to verify your Resend API integration
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Your Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
              />
            </div>

            <Button 
              onClick={handleTestEmail} 
              disabled={isSending}
              className="w-full"
              size="lg"
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending Email...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Test Email
                </>
              )}
            </Button>
          </div>

          <div className="border-t pt-6 space-y-4">
            <h3 className="font-semibold">What This Test Does:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✓ Calls the send-quote-email edge function</li>
              <li>✓ Uses your Resend API key from Supabase secrets</li>
              <li>✓ Sends a professional HTML email template</li>
              <li>✓ Includes a sample Mercury motor quote</li>
              <li>✓ Tests the complete email delivery pipeline</li>
            </ul>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-blue-900">
                Check both your inbox and spam folder for the test email!
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
