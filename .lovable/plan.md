
# Fix Incorrect Contact Info on Payment Pages

## The Problem

The Payment Canceled and Payment Success pages display hardcoded placeholder contact information that doesn't exist, confusing customers who need support.

| Issue Location | Current Value | Correct Value |
|----------------|---------------|---------------|
| `PaymentCanceled.tsx` line 56 | `(123) 456-7890` | `(905) 342-2153` |
| `PaymentCanceled.tsx` line 57 | `support@harrisboatworks.com` | `info@harrisboatworks.ca` |
| `PaymentSuccess.tsx` line 231 | `(705) 887-6568` | `(905) 342-2153` |
| `PaymentSuccess.tsx` line 235 | `info@harrisboatworks.com` | `info@harrisboatworks.ca` |

---

## Solution

Import and use the existing `COMPANY_INFO` constant from `src/lib/companyInfo.ts` on both payment pages.

---

## Files to Modify

### 1. `src/pages/PaymentCanceled.tsx`

**Add import:**
```typescript
import { COMPANY_INFO } from '@/lib/companyInfo';
```

**Update contact section (lines 55-58):**
```tsx
<div className="text-center text-sm text-muted-foreground">
  <p>Need help? Contact us at{" "}
    <a href={`tel:${COMPANY_INFO.contact.phone.replace(/[^0-9]/g, '')}`} 
       className="text-primary hover:underline">
      {COMPANY_INFO.contact.phone}
    </a>
  </p>
  <p>or email{" "}
    <a href={`mailto:${COMPANY_INFO.contact.email}`} 
       className="text-primary hover:underline">
      {COMPANY_INFO.contact.email}
    </a>
  </p>
</div>
```

### 2. `src/pages/PaymentSuccess.tsx`

**Add import:**
```typescript
import { COMPANY_INFO } from '@/lib/companyInfo';
```

**Update contact section (lines 226-237):**
```tsx
<a href={`tel:${COMPANY_INFO.contact.phone.replace(/[^0-9]/g, '')}`} 
   className="flex items-center gap-1 text-primary hover:underline">
  <Phone className="h-4 w-4" />
  {COMPANY_INFO.contact.phone}
</a>
<a href={`mailto:${COMPANY_INFO.contact.email}`} 
   className="flex items-center gap-1 text-primary hover:underline">
  <Mail className="h-4 w-4" />
  {COMPANY_INFO.contact.email}
</a>
```

---

## Expected Result

- Both payment pages will display the correct phone number: **(905) 342-2153**
- Both payment pages will display the correct email: **info@harrisboatworks.ca**
- Future contact info updates only need to change `companyInfo.ts` once
