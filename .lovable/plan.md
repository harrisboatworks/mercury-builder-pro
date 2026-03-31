

# Improve Condition Button Highlight + Verify Trade-In on PDF

## 1. Condition button selected state (TradeInValuation.tsx ~line 451-453)

Current selected style: `border-gray-900 bg-gray-50 shadow-lg` — too subtle, especially on mobile.

Change to a stronger visual: dark background with white text, plus a checkmark icon.

```
// Selected state
'border-gray-900 bg-gray-900 text-white shadow-lg ring-2 ring-gray-900 ring-offset-2'

// Unselected state (unchanged)
'border-gray-300 hover:border-gray-900 hover:shadow-md'
```

Also update the text inside the button: when selected, the label/description text should be white instead of gray.

## 2. PDF trade-in verification

The PDF already handles trade-in correctly (lines 699-735 in ProfessionalQuotePDF.tsx): it renders the trade-in value, description, and HST savings when `tradeInValue > 0` and `tradeInInfo` is present. After implementing the button fix, we should test the full flow end-to-end to confirm the value passes through.

## Files changed
| File | Change |
|------|--------|
| `src/components/quote-builder/TradeInValuation.tsx` | Stronger selected state: dark bg, white text, ring offset |

