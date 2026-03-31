

# Trade-In Valuation — 6 Improvements

## Files changed

| File | Changes |
|------|---------|
| `src/lib/trade-valuation.ts` | Add `valuationReportUrl?: string` to `TradeInInfo` interface |
| `src/components/quote-builder/TradeInValuation.tsx` | All 6 UI changes below |

---

## 1. "Not sure?" helper on Engine Hours (line 513)
Add muted text below the label: `"Not sure? Leave blank — it's optional"`

## 2. Report link → subtle text link (lines 617-634)
Replace the full-width bordered button with a centered inline text link:
```
<a className="text-sm text-gray-500 hover:text-gray-900 underline ...">
  View detailed valuation report →
</a>
```

## 3. Save valuation URL to quote state (line 156)
After computing `finalValue`, build the report URL and include `valuationReportUrl` in the `onTradeInChange` call. Add the field to `TradeInInfo` in `trade-valuation.ts`.

## 4. Confidence badge (line 574)
Next to "Your Estimated Trade Value" heading, show a small badge: `High confidence` (green) / `Medium` (amber) / `Low` (gray).

## 5. Count-up animation on estimate value (line 578-579)
Import `AnimatedPrice` from `@/components/ui/AnimatedPrice` and replace the static `$X,XXX` with `<AnimatedPrice value={medianValue} />`.

## 6. Better private sale framing — corrected math (lines 597-601)
Replace "Est. private sale value: $X" with the user's corrected framing:

> "Private sale might get you $6,675 — but you'd owe $666 more in HST on your new motor. Trading in puts $5,125 + $666 in savings in your pocket."

Using actual values: `listingValue`, `hstSavings`, and `medianValue`.

