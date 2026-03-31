

# Treat All Promo End Dates as End-of-Day (Inclusive)

## Problem
When a promotion has an `end_date` of `2026-03-31`, `new Date("2026-03-31")` resolves to midnight **start** of that day. Multiple places in the codebase compare this against `new Date()`, causing the promo to appear expired during the final day. We fixed `StaleQuoteAlert` already — now we need to apply the same pattern everywhere.

## Approach
Create a shared utility function `promoEndOfDay(dateStr)` that returns a `Date` set to 23:59:59.999 of the given day. Use it in every file that compares a promo end date against "now".

## Files to change

| File | What changes |
|------|-------------|
| `src/lib/quote-utils.ts` | Add `promoEndOfDay(dateStr: string): Date` utility |
| `src/components/quote-builder/StaleQuoteAlert.tsx` | Use `promoEndOfDay` instead of inline `setHours` |
| `src/pages/AdminPromotions.tsx` | Two spots: `getPromoStatus` (line 248) and `activePromotionsForVoice` filter (line 423) — use `promoEndOfDay` |
| `src/components/quote-builder/MotorSelection.tsx` | `isPromotionActive` (line 542) — use `promoEndOfDay` for end_date check |
| `src/lib/quote-nudges.ts` | `getDaysUntilEnd` (line 188) — set end-of-day before calculating diff |
| `src/components/ui/countdown-timer.tsx` | `calculateTimeLeft` and initial `targetDate` — set end-of-day so countdown runs to 11:59 PM, not 12:00 AM |

## Utility function

```typescript
/** Treat a date-only string as valid through end of that day (23:59:59.999) */
export function promoEndOfDay(dateStr: string): Date {
  const d = new Date(dateStr);
  d.setHours(23, 59, 59, 999);
  return d;
}
```

## Key changes per file

**AdminPromotions.tsx line 248-249**: `new Date(promo.end_date)` → `promoEndOfDay(promo.end_date)`

**AdminPromotions.tsx line 423**: `new Date(promo.end_date) < now` → `promoEndOfDay(promo.end_date) < now`

**MotorSelection.tsx line 542**: `new Date(p.end_date) >= now` → `promoEndOfDay(p.end_date) >= now`

**quote-nudges.ts line 188**: set `endDate` to end-of-day before diff calculation

**countdown-timer.tsx line 43**: when `endDate` is a string, use `promoEndOfDay` so the timer counts down to 11:59:59 PM instead of midnight start-of-day

**StaleQuoteAlert.tsx**: replace inline `setHours` with `promoEndOfDay` import

