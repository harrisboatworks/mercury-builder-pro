import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';
import { z } from 'zod';

const depositInfoSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(100),
  email: z.string().trim().email('Please enter a valid email').max(255),
  phone: z.string().trim().min(7, 'Phone number is required').max(30),
});

export interface DepositCustomerInfo {
  name: string;
  email: string;
  phone: string;
}

interface DepositInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (info: DepositCustomerInfo) => void;
  depositAmount: number;
  defaultValues?: Partial<DepositCustomerInfo>;
  isProcessing?: boolean;
}

export function DepositInfoDialog({
  open, onOpenChange, onSubmit, depositAmount, defaultValues, isProcessing
}: DepositInfoDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setName(defaultValues?.name || '');
      setEmail(defaultValues?.email || '');
      setPhone(defaultValues?.phone || '');
      setErrors({});
    }
  }, [open, defaultValues?.name, defaultValues?.email, defaultValues?.phone]);

  const handleSubmit = () => {
    const result = depositInfoSchema.safeParse({ name, email, phone });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach(i => {
        const field = String(i.path[0]);
        if (!fieldErrors[field]) fieldErrors[field] = i.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    onSubmit({ name: result.data.name, email: result.data.email, phone: result.data.phone });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reserve Your Motor</DialogTitle>
          <DialogDescription>
            Enter your details to proceed with the ${depositAmount} deposit.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="deposit-name">Full Name *</Label>
            <Input
              id="deposit-name"
              placeholder="John Doe"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deposit-email">Email Address *</Label>
            <Input
              id="deposit-email"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deposit-phone">Phone Number *</Label>
            <Input
              id="deposit-phone"
              type="tel"
              placeholder="(905) 555-1234"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={handleSubmit}
            disabled={isProcessing}
            className="w-full"
            size="lg"
          >
            {isProcessing ? 'Processing...' : `Continue to Payment`}
          </Button>
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="h-3 w-3" />
            <span>Secure checkout powered by Stripe</span>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
