
# Update AI Chat & Voice with Deposit/Payment Information

## Overview

Add deposit tier information and mobile payment method availability to all three AI systems:
1. **Text Chatbot** (`ai-chatbot/index.ts`) — OpenAI-powered chat
2. **Voice AI** (`realtime-session/index.ts`) — OpenAI Realtime voice
3. **ElevenLabs KB** (`format-kb-documents.ts`) — Static knowledge documents

---

## New Content to Add

### Reserving a Motor (Deposits)

```text
## RESERVING A MOTOR (DEPOSIT SYSTEM)

Customers can secure a motor with a refundable deposit based on HP:
- **$200** — Portable motors (0-25HP)
- **$500** — Mid-range motors (30-115HP)
- **$1,000** — High-power motors (150HP+)

### Payment Methods
Checkout supports fast mobile payment options:
- **Apple Pay** (Safari on iPhone/Mac)
- **Google Pay** (Chrome on Android/desktop)
- **Link** (Stripe's one-click checkout)
- Standard card payment always available

### Reservation Policies
- Deposit is fully refundable if customer changes their mind
- Deposit holds the motor and locks in current pricing
- Balance due at pickup
- All pickups still require in-person visit with photo ID
- Receipt sent immediately by email

### How to Reserve
1. Complete the quote builder
2. Click "Reserve This Motor" on the summary page
3. Pay the deposit via Apple Pay, Google Pay, or card
4. Receive confirmation email with next steps
5. Schedule pickup at your convenience
```

---

## File-by-File Changes

### 1. `supabase/functions/ai-chatbot/index.ts`

**Location:** After the financing section (~line 530), before website navigation

**Add new section:**
```typescript
## RESERVING A MOTOR (DEPOSIT SYSTEM):

Customers can secure their motor with a refundable deposit:
- $200 deposit for portable motors (0-25HP)
- $500 deposit for mid-range motors (30-115HP)
- $1,000 deposit for high-power motors (150HP+)

### Payment Options at Checkout:
- Apple Pay (iPhone/Mac users)
- Google Pay (Android/Chrome users)
- Link (Stripe one-click checkout)
- Standard credit/debit card

### Reservation Policies:
- Deposit is fully refundable
- Holds the motor and locks current pricing
- Balance due at in-person pickup
- Confirmation email sent immediately

When discussing reservations, say:
"Want to lock in this price? A $[amount] deposit holds the motor - and you can pay with Apple Pay or Google Pay for a quick checkout."
```

---

### 2. `supabase/functions/realtime-session/index.ts`

**Location:** Within the `instructions` string, before "You can discuss motors..."

**Add after "NO DELIVERY POLICY" section:**
```typescript
RESERVING A MOTOR:
Customers can reserve with a refundable deposit:
- $200 for small motors (under 25HP)
- $500 for mid-range (30-115HP)
- $1,000 for big motors (150HP+)

Checkout accepts Apple Pay, Google Pay, and Link for quick payment. Just say: "A quick deposit locks it in - you can even use Apple Pay."

Deposits are fully refundable. Balance due at pickup.
```

---

### 3. `supabase/functions/_shared/format-kb-documents.ts`

**Location:** Add a new export function and include in `KB_DOCUMENTS`

**New function (~after line 640):**
```typescript
// ========== RESERVING A MOTOR GUIDE ==========
export function formatReservationGuide(): string {
  const now = new Date().toISOString().split('T')[0];
  
  return `# Reserving a Motor - Deposit Guide
Updated: ${now}

## Deposit Tiers

Secure your motor with a refundable deposit based on horsepower:

| Motor Size | HP Range | Deposit Amount |
|------------|----------|----------------|
| Portable | 0-25 HP | $200 |
| Mid-Range | 30-115 HP | $500 |
| High-Power | 150+ HP | $1,000 |

## Payment Methods

Our checkout supports fast, secure payment options:

### Mobile Payments
- **Apple Pay** — Available on Safari (iPhone, iPad, Mac)
- **Google Pay** — Available on Chrome (Android, desktop)
- **Link** — Stripe's one-click saved payment

### Card Payments
- Visa, Mastercard, American Express
- Secure Stripe-powered checkout

## Reservation Policies

### Refund Policy
- Deposits are **fully refundable** if you change your mind
- No restocking fees or penalties
- Refund processed within 5-7 business days

### What Your Deposit Secures
- Holds the specific motor for you
- Locks in the current quoted price
- Priority in our installation schedule

### Next Steps After Deposit
1. Confirmation email sent immediately
2. Team contacts you within 1 business day
3. Finalize installation date
4. Balance due at pickup

## Pickup Requirements

All motor pickups require:
- In-person visit to Gores Landing
- Valid photo ID matching the buyer
- No third-party or delivery options

## Talking Points for Voice

When a customer asks about reserving:
- "A $[X] deposit locks it in, and it's fully refundable"
- "You can use Apple Pay for a quick checkout"
- "We'll reach out within a day to schedule everything"
- "The deposit just holds the price — balance at pickup"
`;
}
```

**Update KB_DOCUMENTS object:**
```typescript
export const KB_DOCUMENTS = {
  // ... existing entries ...
  
  'Reserving a Motor - Deposit Guide': {
    generator: formatReservationGuide,
    description: 'Deposit tiers, payment methods (Apple Pay, Google Pay, Link), and reservation policies'
  }
};
```

---

## Summary of Changes

| File | Change Type | Description |
|------|-------------|-------------|
| `ai-chatbot/index.ts` | Add section | Deposit tiers + payment methods in system prompt |
| `realtime-session/index.ts` | Add section | Concise deposit info for voice responses |
| `format-kb-documents.ts` | New function | `formatReservationGuide()` for ElevenLabs KB |
| `format-kb-documents.ts` | Update export | Add to `KB_DOCUMENTS` object |

---

## Post-Implementation

After deploying these changes:
1. **Trigger ElevenLabs KB Sync** — Use the admin panel button to sync the new document
2. **Test voice** — Ask "How do I reserve a motor?" and verify deposit info
3. **Test chat** — Ask about deposits and payment methods
