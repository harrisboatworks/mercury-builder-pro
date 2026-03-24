

# Use Existing Customer Notes for Personal Touch — Minor Tweaks Only

## What Already Exists

- **Admin Notes** (internal only, not on PDF)
- **Customer Notes** (prints on PDF, labeled "Notes")

The "Customer Notes" field is already the right place for Jay's personal message. Only two small tweaks needed:

## Changes

### 1. `src/components/admin/AdminQuoteControls.tsx`
- Update the placeholder text from `"Notes that appear on the customer's PDF..."` to something that nudges the personal touch, e.g.: `"Personal note for the customer's quote — e.g. 'Jim, this Pro XS is going to transform your setup'"`
- Optionally add a small helper text below: `"Appears on the PDF — leave blank to skip"`

### 2. `src/components/quote-pdf/ProfessionalQuotePDF.tsx`
- Change the rendering style of `customerNotes` from a boxed "Notes" section to something warmer — italic text with no border, no "Notes" header label. Just the message in italics, subtly placed.
- Move it from its current position (near the bottom, line ~940) to just below the customer info section, so it reads like a personal greeting rather than fine print.
- Keep the conditional — when empty, zero layout impact.

### No other files change. No new state fields needed.

## Files

| File | Change |
|------|--------|
| `src/components/admin/AdminQuoteControls.tsx` | Better placeholder text |
| `src/components/quote-pdf/ProfessionalQuotePDF.tsx` | Restyle notes as italic greeting, reposition above motor section |

