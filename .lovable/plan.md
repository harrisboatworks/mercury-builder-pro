

# Pre-Fill Trade-In Form from Boat Info

## The Problem

In the Boat Information step, the user enters their current motor details (brand, HP, year). When they get to the Trade-In page and click "Yes, I have a trade-in," the form is completely blank — forcing them to re-enter the same motor info. The props (`currentMotorBrand`, `currentHp`, `currentMotorYear`) are already passed through but never used to populate the fields.

Two issues:
1. **TradeInPage** (line 49) explicitly resets to blank state with the comment "no auto-loading from context"
2. **TradeInValuation** shows a "Pre-filled from your current motor details" banner when those props exist, but the form values still come from the empty `tradeInInfo` state

## The Fix

### File: `src/pages/quote/TradeInPage.tsx`
When initializing `tradeInInfo`, pre-fill `brand`, `year`, and `horsepower` from `state.boatInfo` if available:

```
setTradeInInfo({
  hasTradeIn: false,
  brand: state.boatInfo?.currentMotorBrand || '',
  year: state.boatInfo?.currentMotorYear || 0,
  horsepower: state.boatInfo?.currentHp || 0,
  model: '',
  serialNumber: '',
  condition: 'good',
  estimatedValue: 0,
  confidenceLevel: 'medium'
});
```

This means when the user clicks "Yes, I have a trade-in," the brand/year/HP are already filled in from what they told us earlier. They only need to add condition and serial number (if they want).

### File: `src/components/quote-builder/TradeInValuation.tsx`
No changes needed — it already displays the "Pre-filled from your current motor details" notice and the form fields bind to `tradeInInfo`, which will now have the correct values.

## One file, three lines changed.

| File | Change |
|------|--------|
| `src/pages/quote/TradeInPage.tsx` | Pre-fill brand/year/hp from `state.boatInfo` on init (~lines 51-55) |

