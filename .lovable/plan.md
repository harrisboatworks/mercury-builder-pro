
# Add Apple Pay & Google Pay Badges to Payment Buttons

## Why This Helps

Displaying payment method badges signals to customers that fast, secure mobile payments are available—reducing checkout friction and increasing conversions, especially on mobile devices.

---

## Visual Design

Add small, recognizable icons beneath or beside the main payment button text:

```text
┌─────────────────────────────────────┐
│   💳  Pay $4,143.86 with Card       │
│                                     │
│   🍎 Apple Pay  |  G Pay  |  Link   │
└─────────────────────────────────────┘
```

Or as inline badge icons next to the button:

```text
[Pay $500 Deposit]  🍎 G Pay
```

---

## Implementation

### Files to Update

| Component | Location | Purpose |
|-----------|----------|---------|
| `StripePaymentButton.tsx` | Quote builder full payment | Add badges below button |
| `DepositPayment.tsx` | Standalone deposit page | Add badges below button |
| `QuoteDisplay.tsx` | Quote summary deposit button | Add badges |
| `QuoteSummaryPage.tsx` | Reserve button on shared quotes | Add badges |

### Create Reusable Badge Component

**New File: `src/components/payments/PaymentMethodBadges.tsx`**

A simple component displaying Apple Pay, Google Pay, and optionally Link badges:

```tsx
import { Apple } from 'lucide-react';

export const PaymentMethodBadges = ({ className }: { className?: string }) => (
  <div className={`flex items-center justify-center gap-3 text-xs text-muted-foreground ${className}`}>
    <span className="flex items-center gap-1">
      <Apple className="w-3.5 h-3.5" /> Pay
    </span>
    <span className="text-border">|</span>
    <span className="flex items-center gap-1">
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">...</svg> Pay
    </span>
    <span className="text-border">|</span>
    <span>Link</span>
  </div>
);
```

### Update Each Payment Button

Add the `<PaymentMethodBadges />` component below the Button in each location:

```tsx
<Button onClick={handlePayment} ...>
  Pay $500 Deposit
</Button>
<PaymentMethodBadges className="mt-2" />
```

---

## Badge Assets

Use either:
1. **Lucide icons** (Apple icon available, Google requires custom SVG)
2. **Official Stripe badge assets** from their branding guidelines
3. **Simple text labels** with minimal icons for lightweight approach

---

## Expected Result

- All payment buttons display small badges showing Apple Pay, Google Pay, and Link
- Helps customers know they can use their preferred payment method
- Matches professional e-commerce checkout experiences
- Responsive design that works on mobile and desktop
