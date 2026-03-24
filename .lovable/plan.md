
# Soft Lead Capture — Implemented ✅

## What Was Added

### 1. Silent Quote Snapshot (QuoteSummaryPage.tsx)
When any visitor reaches the summary page with a configured motor, a `saved_quotes` record is silently created with their `session_id` and `is_soft_lead = true`. No UI, no prompt. If they later sign in or save manually, the existing flows update the record with real info.

### 2. Lead Warmth Badges (AdminQuoteActivity.tsx)
Each session row now shows a warmth badge:
- 🔥 **Hot**: Submitted quote or deposit
- 🌡️ **Warm**: Reached summary or 6+ events
- **Cool**: Selected motor but didn't finish
- ❄️ **Cold**: Browsed without selecting a motor

Return visitors are flagged with 🔁.

### 3. View Quote Button (AdminQuoteActivity.tsx)
Sessions that reached the summary step show a "View Quote" button in the expanded row, linking to the soft-lead's saved quote.

### 4. Return Visit Tracking (useQuoteActivityTracker.ts)
A `return_visit` event fires when a visitor returns with an existing session ID that has prior events. This flags them as warmer leads.

### 5. Database Changes
- Added `session_id` (text) column to `saved_quotes`
- Added `is_soft_lead` (boolean, default false) column to `saved_quotes`
- Added index on `session_id` for fast lookups

## Files Modified
| File | Change |
|------|--------|
| `src/pages/quote/QuoteSummaryPage.tsx` | Auto-save silent soft-lead quote snapshot |
| `src/pages/AdminQuoteActivity.tsx` | Lead warmth badges, View Quote button, return visitor flag |
| `src/hooks/useQuoteActivityTracker.ts` | Exported `getOrCreateSessionId`, added `return_visit` event |
