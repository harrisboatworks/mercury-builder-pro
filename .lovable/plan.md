

# Upgrade Saved-Quote Email to Professional Branded Template

## Problem
The `send-saved-quote-email` edge function uses raw inline HTML — no branding, no logos, no trust badges. Meanwhile, a polished `createBrandedEmailTemplate()` already exists in `_shared/email-template.ts` with Harris Boat Works + Mercury logos, gradient header, trust badges, and responsive styling.

## Changes

### `supabase/functions/send-saved-quote-email/index.ts`
- Import `createBrandedEmailTemplate` and `createButtonHtml` from `_shared/email-template.ts`
- Replace the raw HTML with branded template wrapping professional content:
  - Personalized greeting with customer name
  - Quote summary box showing motor model, total price, and quote reference number
  - Prominent "View Your Saved Quote" CTA button
  - Account access section (when `includeAccountInfo` is true) — styled consistently
  - "Next Steps" section: brief bullets (review online, contact us, financing available)
  - Valid-for-30-days notice
- Fix the footer text from "financing application" to "quote configuration" (currently wrong copy)
- Use CAD formatting (`en-CA`, `CAD`) instead of USD since this is a Canadian business

No client-side changes needed — the caller already passes all required data.

## Files

| File | Change |
|------|--------|
| `supabase/functions/send-saved-quote-email/index.ts` | Use branded template, improve content, fix currency |

