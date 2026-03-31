

# Fix Stale Quote Alert Triggering on Promo Expiry Day

## Problem
The promo end date is `2026-03-31`. The check `new Date(promoEndDate) < new Date()` treats this as midnight UTC on March 31, so the alert fires during the day on March 31 even though the promo is still valid until end of day.

## Fix
In `StaleQuoteAlert.tsx` line 79, adjust the comparison to treat the end date as end-of-day (23:59:59) so the alert only triggers starting the next day.

```typescript
// Before
if (promoEndDate && new Date(promoEndDate) < new Date() && ...)

// After  
const promoEnd = new Date(promoEndDate);
promoEnd.setHours(23, 59, 59, 999);
if (promoEndDate && promoEnd < new Date() && ...)
```

## Files changed
| File | Change |
|------|--------|
| `src/components/quote-builder/StaleQuoteAlert.tsx` | Set promo end date to end-of-day before comparing |

