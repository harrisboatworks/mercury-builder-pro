import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, DollarSign, Shield, CheckCircle } from 'lucide-react';

interface DepositOption {
  amount: string;
  label: string;
  description: string;
  recommended?: boolean;
}

const DEPOSIT_OPTIONS: DepositOption[] = [
  {
    amount: "500",
    label: "$500 CAD",
    description: "Small motors (under 50HP)",
  },
  {
    amount: "1000", 
    label: "$1,000 CAD",
    description: "Mid-range motors (50-150HP)",
    recommended: true,
  },
  {
    amount: "2500",
    label: "$2,500 CAD", 
    description: "High-performance motors (150HP+)",
  }
];

export const DepositPayment = () => {
  const [selectedDeposit, setSelectedDeposit] = useState("1000");
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    if (!customerInfo.email || !customerInfo.name) {
      toast({
        title: "Missing Information",
        description: "Please provide your name and email address.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('Creating deposit payment:', { selectedDeposit, customerInfo });

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          paymentType: 'deposit',
          depositAmount: selectedDeposit,
          customerInfo
        }
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe Checkout in new tab
        window.open(data.url, '_blank');
        
        toast({
          title: "Redirecting to Payment",
          description: "Opening secure payment window...",
        });
      } else {
        throw new Error('No payment URL received');
      }

    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to create payment session. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedOption = DEPOSIT_OPTIONS.find(opt => opt.amount === selectedDeposit);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Motor Deposit Payment</h1>
        <p className="text-muted-foreground">
          Secure your Mercury motor with a deposit. Complete payment processing through Stripe.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Select Deposit Amount
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            {DEPOSIT_OPTIONS.map((option) => (
              <div key={option.amount} className="relative">
                <Button
                  variant={selectedDeposit === option.amount ? "default" : "outline"}
                  className={`w-full p-4 h-auto justify-between ${
                    option.recommended ? 'ring-2 ring-primary ring-offset-2' : ''
                  }`}
                  onClick={() => setSelectedDeposit(option.amount)}
                >
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">{option.label}</span>
                      {option.recommended && (
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full">
                          Most Popular
                        </span>
                      )}
                    </div>
                    <div className="text-sm opacity-75">{option.description}</div>
                  </div>
                  {selectedDeposit === option.amount && (
                    <CheckCircle className="w-5 h-5" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Full Name *</Label>
              <Input
                id="customerName"
                placeholder="John Doe"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email Address *</Label>
              <Input
                id="customerEmail"
                type="email"
                placeholder="john@example.com"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerPhone">Phone Number (Optional)</Label>
            <Input
              id="customerPhone"
              type="tel"
              placeholder="(555) 123-4567"
              value={customerInfo.phone}
              onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-lg">Deposit Amount:</span>
            <span className="text-2xl font-bold text-primary">{selectedOption?.label}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {selectedOption?.description}
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4 border-t">
            <Shield className="w-4 h-4" />
            <span>Secure payment powered by Stripe. Your payment information is encrypted and protected.</span>
          </div>

          <Button 
            onClick={handlePayment}
            disabled={isLoading || !customerInfo.email || !customerInfo.name}
            className="w-full"
            size="lg"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            {isLoading ? 'Processing...' : `Pay ${selectedOption?.label} Deposit`}
          </Button>

          <div className="text-xs text-center text-muted-foreground">
            By proceeding, you agree to our terms of service. Deposits are refundable within 30 days.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};