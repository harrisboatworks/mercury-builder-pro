import { RequiredMark } from "@/components/ui/required-mark";
import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';
import {
  DEFAULT_DEPOSIT_COUNTRY,
  safeParseDepositIdentity,
  type DepositIdentity,
} from '@/lib/deposit-identity';

export interface DepositCustomerInfo {
  name: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

interface DepositInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (info: DepositCustomerInfo) => void;
  depositAmount: number;
  defaultValues?: Partial<DepositCustomerInfo>;
  isProcessing?: boolean;
}

function toCustomerInfo(identity: DepositIdentity): DepositCustomerInfo {
  return {
    name: identity.fullName,
    email: identity.email,
    phone: identity.phone,
    addressLine1: identity.address.addressLine1,
    addressLine2: identity.address.addressLine2 || '',
    city: identity.address.city,
    region: identity.address.region,
    postalCode: identity.address.postalCode,
    country: identity.address.country,
  };
}

export function DepositInfoDialog({
  open, onOpenChange, onSubmit, depositAmount, defaultValues, isProcessing
}: DepositInfoDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState(DEFAULT_DEPOSIT_COUNTRY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setName(defaultValues?.name || '');
      setEmail(defaultValues?.email || '');
      setPhone(defaultValues?.phone || '');
      setAddressLine1(defaultValues?.addressLine1 || '');
      setAddressLine2(defaultValues?.addressLine2 || '');
      setCity(defaultValues?.city || '');
      setRegion(defaultValues?.region || '');
      setPostalCode(defaultValues?.postalCode || '');
      setCountry(defaultValues?.country || DEFAULT_DEPOSIT_COUNTRY);
      setErrors({});
    }
  }, [
    open,
    defaultValues?.name,
    defaultValues?.email,
    defaultValues?.phone,
    defaultValues?.addressLine1,
    defaultValues?.addressLine2,
    defaultValues?.city,
    defaultValues?.region,
    defaultValues?.postalCode,
    defaultValues?.country,
  ]);

  const handleSubmit = () => {
    const result = safeParseDepositIdentity({
      name,
      email,
      phone,
      addressLine1,
      addressLine2,
      city,
      region,
      postalCode,
      country,
    });
    if (result.success === false) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    onSubmit(toCustomerInfo(result.data));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reserve this motor</DialogTitle>
          <DialogDescription>
            Enter your details, then review the ${depositAmount} deposit in secure Stripe checkout.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="rounded-sm border border-repower-navy-900/10 bg-repower-cream p-3 text-sm leading-relaxed text-repower-navy-900/75">
            {depositAmount === 100
              ? 'Your $100 deposit is fully refundable until HBW confirms the exact motor, price, availability and ETA, and you approve the order in writing. After written approval, it becomes non-refundable and is credited to your final invoice.'
              : 'HBW confirms the exact motor and quote details with you before anything is ordered.'}
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="deposit-name">Full name <RequiredMark /></Label>
            <Input
              id="deposit-name"
              name="name"
              autoComplete="name"
              placeholder="Full legal name"
              value={name}
              onChange={e => setName(e.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'deposit-name-error' : undefined}
              autoFocus
            />
            {errors.name && <p id="deposit-name-error" className="text-xs text-destructive" role="alert">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="deposit-email">Email address <RequiredMark /></Label>
              <Input
                id="deposit-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'deposit-email-error' : undefined}
              />
              {errors.email && <p id="deposit-email-error" className="text-xs text-destructive" role="alert">{errors.email}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deposit-phone">Phone number <RequiredMark /></Label>
              <Input
                id="deposit-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="(905) 555-1234"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? 'deposit-phone-error' : undefined}
              />
              {errors.phone && <p id="deposit-phone-error" className="text-xs text-destructive" role="alert">{errors.phone}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deposit-address-line1">Address line 1 <RequiredMark /></Label>
            <Input
              id="deposit-address-line1"
              name="address-line1"
              autoComplete="address-line1"
              placeholder="Street address"
              value={addressLine1}
              onChange={e => setAddressLine1(e.target.value)}
              aria-invalid={Boolean(errors.addressLine1)}
              aria-describedby={errors.addressLine1 ? 'deposit-address-line1-error' : undefined}
            />
            {errors.addressLine1 && <p id="deposit-address-line1-error" className="text-xs text-destructive" role="alert">{errors.addressLine1}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deposit-address-line2">Address line 2</Label>
            <Input
              id="deposit-address-line2"
              name="address-line2"
              autoComplete="address-line2"
              placeholder="Apartment, suite, unit (optional)"
              value={addressLine2}
              onChange={e => setAddressLine2(e.target.value)}
              aria-invalid={Boolean(errors.addressLine2)}
              aria-describedby={errors.addressLine2 ? 'deposit-address-line2-error' : undefined}
            />
            {errors.addressLine2 && <p id="deposit-address-line2-error" className="text-xs text-destructive" role="alert">{errors.addressLine2}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="deposit-city">City <RequiredMark /></Label>
              <Input
                id="deposit-city"
                name="city"
                autoComplete="address-level2"
                placeholder="City"
                value={city}
                onChange={e => setCity(e.target.value)}
                aria-invalid={Boolean(errors.city)}
                aria-describedby={errors.city ? 'deposit-city-error' : undefined}
              />
              {errors.city && <p id="deposit-city-error" className="text-xs text-destructive" role="alert">{errors.city}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deposit-region">Province / state / region <RequiredMark /></Label>
              <Input
                id="deposit-region"
                name="state"
                autoComplete="address-level1"
                placeholder="Ontario"
                value={region}
                onChange={e => setRegion(e.target.value)}
                aria-invalid={Boolean(errors.region)}
                aria-describedby={errors.region ? 'deposit-region-error' : undefined}
              />
              {errors.region && <p id="deposit-region-error" className="text-xs text-destructive" role="alert">{errors.region}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="deposit-postal">Postal / ZIP code <RequiredMark /></Label>
              <Input
                id="deposit-postal"
                name="postal-code"
                autoComplete="postal-code"
                placeholder="K0K 2E0"
                value={postalCode}
                onChange={e => setPostalCode(e.target.value)}
                aria-invalid={Boolean(errors.postalCode)}
                aria-describedby={errors.postalCode ? 'deposit-postal-error' : undefined}
              />
              {errors.postalCode && <p id="deposit-postal-error" className="text-xs text-destructive" role="alert">{errors.postalCode}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="deposit-country">Country <RequiredMark /></Label>
              <Input
                id="deposit-country"
                name="country"
                autoComplete="country-name"
                value={country}
                onChange={e => setCountry(e.target.value)}
                aria-invalid={Boolean(errors.country)}
                aria-describedby={errors.country ? 'deposit-country-error' : undefined}
              />
              {errors.country && <p id="deposit-country-error" className="text-xs text-destructive" role="alert">{errors.country}</p>}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={handleSubmit}
            disabled={isProcessing}
            className="w-full"
            size="lg"
          >
            {isProcessing ? 'Preparing checkout…' : 'Review Secure Checkout'}
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
